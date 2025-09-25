import 'dotenv/config.js';
import express from 'express';
import axios from 'axios';
import { MongoClient } from 'mongodb';
import open from 'open';

const app = express();
const PORT = 3000;

// ============================= //
//  CONFIG                       //
// ============================= //
if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.MONGO_URI) {
  throw new Error('Missing CLIENT_ID, CLIENT_SECRET, or MONGO_URI in .env');
}

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'hubspot_oauth';

let SCOPES = 'crm.objects.contacts.read';
if (process.env.SCOPE) {
  SCOPES = process.env.SCOPE.split(/ |, ?|%20/).join(' ');
}

const REDIRECT_URI = `http://localhost:${PORT}/oauth-callback`;

// ============================= //
//  MONGO CONNECTION             //
// ============================= //
const client = new MongoClient(MONGO_URI);
let tokensCollection;

async function initMongo() {
  await client.connect();
  const db = client.db(DB_NAME);
  tokensCollection = db.collection('tokens');
  console.log('Connected to MongoDB');
}
await initMongo();

// ============================= //
//  OAUTH URL                    //
// ============================= //
const authUrl =
  'https://app.hubspot.com/oauth/authorize' +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

// ============================= //
//  INSTALL PAGE                 //
// ============================= //
app.get('/install', (req, res) => {
  console.log('=== Initiating OAuth 2.0 flow with HubSpot ===');
  res.redirect(authUrl);
});

// ============================= //
//  OAUTH CALLBACK               //
// ============================= //
app.get('/oauth-callback', async (req, res) => {
  if (req.query.code) {
    console.log('Received authorization code');

    const authCodeProof = {
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code: req.query.code,
    };

    const token = await exchangeForTokens(authCodeProof);
    if (token.message) {
      return res.redirect(`/error?msg=${token.message}`);
    }

    res.redirect(`/?portalId=${token.hub_id}`);
  }
});

// ============================= //
//  TOKEN HELPERS                //
// ============================= //
const exchangeForTokens = async (exchangeProof) => {
  try {
    const { data } = await axios.post(
      'https://api.hubapi.com/oauth/v1/token',
      new URLSearchParams(exchangeProof),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const portalId = data.hub_id; // identificador del tenant
    if (!portalId) {
      throw new Error('hub_id not found in token response');
    }

    // Guardar en Mongo
    await tokensCollection.updateOne(
      { portalId },
      {
        $set: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: Date.now() + data.expires_in * 1000,
        },
      },
      { upsert: true }
    );

    console.log(`Saved tokens in Mongo for portalId=${portalId}`);
    return data;
  } catch (e) {
    console.error(
      `Error exchanging ${exchangeProof.grant_type} for access token`
    );
    return e.response?.data || { message: 'Unknown error' };
  }
};

const refreshAccessToken = async (portalId) => {
  const userTokens = await tokensCollection.findOne({ portalId: Number(portalId) });
  if (!userTokens) return null;

  const refreshTokenProof = {
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    refresh_token: userTokens.refresh_token,
  };
  return await exchangeForTokens(refreshTokenProof);
};

const getAccessToken = async (portalId) => {
  const userTokens = await tokensCollection.findOne({ portalId: Number(portalId) });
  if (!userTokens) return null;

  if (Date.now() >= userTokens.expires_in) {
    console.log(`Refreshing expired access token for portalId=${portalId}`);
    await refreshAccessToken(portalId);
    const updated = await tokensCollection.findOne({ portalId: Number(portalId) });
    return updated.access_token;
  }
  return userTokens.access_token;
};

const isAuthorized = async (portalId) => {
  const token = await tokensCollection.findOne({ portalId: Number(portalId) });
  console.log(token)

  return !!token;
};

// ============================= //
//  HUBSPOT API CALL             //
// ============================= //
const getContact = async (accessToken) => {
  try {
    const { data } = await axios.get(
      'https://api.hubapi.com/crm/v3/objects/contacts?properties=firstname,lastname,email&limit=1',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return data.results?.[0] || null;
  } catch (e) {
    console.error('Unable to retrieve contact');
    return e.response?.data || { message: 'Error retrieving contact' };
  }
};

// ============================= //
//  ROUTES                       //
// ============================= //
const displayContactName = (res, contact) => {
  if (!contact || contact.status === 'error') {
    res.write(`<p>Unable to retrieve contact!</p>`);
    return;
  }
  const { firstname, lastname } = contact.properties;
  res.write(`<p>Contact name: ${firstname || ''} ${lastname || ''}</p>`);
};

app.get('/', async (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.write(`<h2>HubSpot OAuth 2.0 + Mongo Multi-Tenant</h2>`);

  const portalId = req.query.portalId;
  if (!portalId) {
    res.write(`<a href="/install"><h3>Install the app</h3></a>`);
    return res.end();
  }

  if (await isAuthorized(portalId)) {
    const accessToken = await getAccessToken(portalId);
    const contact = await getContact(accessToken);
    res.write(`<h4>PortalId: ${portalId}</h4>`);
    res.write(`<h4>Access token: ${accessToken}</h4>`);
    if (contact) displayContactName(res, contact);
  } else {
    res.write(`<a href="/install"><h3>Install the app</h3></a>`);
  }
  res.end();
});

app.get('/error', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.write(`<h4>Error: ${req.query.msg}</h4>`);
  res.end();
});

// ============================= //
// Endpoint to list contacts     //
// ============================= //
app.get("/contacts", async (req, res) => {
  try {
    const portalId = Number(req.query.portalId);
    if (!portalId) {
      return res.status(400).json({ error: "portalId is required" });
    }

    const accessToken = await getAccessToken(portalId);

    const { data } = await axios.get(
      "https://api.hubapi.com/crm/v3/objects/contacts?properties=firstname,lastname,email",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(data || []);
  } catch (err) {
    console.error("Error fetching contacts:", err.response?.data || err.message);
    res
      .status(500)
      .json({ error: "Failed to fetch contacts", details: err.response?.data });
  }
});


// ============================= //
//  START SERVER                 //
// ============================= //
app.listen(PORT, () =>
  console.log(`=== Starting your app on http://localhost:${PORT} ===`)
);
open(`http://localhost:${PORT}`);
