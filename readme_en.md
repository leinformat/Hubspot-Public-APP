# Initial Report – HubSpot ↔ TitanX Public App

## 1. Context and Goals

TitanX requires the development of a **public HubSpot App** to be listed on the **HubSpot App Marketplace**.  

- The app should enable users to **access TitanX functionality directly from HubSpot**, avoiding context-switching between platforms.  
- It must be **multi-tenant**, so multiple HubSpot portals can install and use it independently.  
- The integration should allow **sending contacts/lists to TitanX for scoring or enrichment** and automatically updating HubSpot records with the results.  
- The experience should feel **native inside HubSpot**, while maintaining TitanX branding and best practices.  

---

## 2. HubSpot Accounts and Licensing Requirements

### For App Developers (to build & publish)
- A **HubSpot Developer Account (free)** is required to:
  - Register and configure the Public App.  
  - Define OAuth scopes.  
  - Test installation, authentication, and app UI.  
  - Submit the app for Marketplace review.  

- Additional requirements to publish:
  - **Public privacy policy URL** hosted on your own domain.  
  - **Backend with SSL and custom domain** (e.g. `https://api.titanx.com/callback`).  
  - Compliance with HubSpot’s Marketplace certification requirements.  

### For Testing During Development
- HubSpot provides **Developer Test Accounts** (sandbox).  
- These test accounts include **Pro/Enterprise features** at no cost.  
- They allow testing of OAuth, scopes, and embedded UI extensions.  

### For Clients Using the App
- The app can technically be installed on **any HubSpot portal** (Free, Starter, Pro, Enterprise).  
- However, functionality depends on the license level:  
  - **Free/Starter:** Only basic access to contacts and standard properties.  
  - **Professional:** Recommended minimum. Required for workflows, lists, and more advanced automation.  
  - **Enterprise:** Mandatory if the app integrates with:
    - **Custom Objects.**  
    - **Custom Behavioral Events.**  
    - Advanced reporting/dashboards.  

**Summary:**  
- 🔧 **Development/Publishing** → HubSpot Developer Account (free).  
- 🧪 **Testing** → Developer Test Accounts (sandbox, with Pro/Enterprise features).  
- 👥 **Client usage** → Minimum Professional license; Enterprise required for advanced features.  

---

## 3. User Interface & Experience

- HubSpot **UI Extensions** will be used to render pages inside:  
  - **Settings** (for configuration, mappings, and global controls).  
  - **Record pages** (contact/deal sidebars, custom cards).  

- **Limitations:** UI Extensions are suitable for embedded panels and forms but not for complex dashboards.  
  - If TitanX needs more advanced dashboards (reporting, bulk management, data-intensive UI), an **external React/Next.js webapp** will be required.  
  - This external UI would still integrate with HubSpot via the backend and OAuth.  

- **Expected UX (from client transcript):**  
  - Ability to **submit lists/contacts** for scoring/enrichment.  
  - Real-time progress/status tracking inside HubSpot.  
  - Results (scores, enrichment fields) written directly into HubSpot records.  
  - A **dashboard-style panel** with:  
    - Credits available.  
    - Jobs in progress.  
    - History of submissions.  
    - Mapping configuration (HubSpot fields ↔ TitanX fields).  
  - Interface visually aligned with TitanX’s Salesforce experience but styled to feel native to HubSpot.  

---

## 4. Required External Backend

The app **cannot rely solely on HubSpot functions**. A backend is required to:  

- Manage **multi-tenant OAuth 2.0 authentication**.  
- Store **access and refresh tokens per portal**.  
- Expose **API endpoints** to be consumed by HubSpot UI Extensions (via `hubspot.fetch`).  
- Orchestrate the **sync between HubSpot ↔ TitanX**.  

### Recommended Backend Setup
- **Infrastructure:** AWS (EC2, ECS). The team has more experience with AWS.
- **Database:** (multi-tenant token storage, jobs, and logs).  
- **Requirements:**  
  - **SSL (HTTPS)**.  
  - **Custom domain** (`api.titanx.com`).  
  - **High availability (99.9%)**.  
  - **Monitoring and logging** (CloudWatch, ELK, etc.).  

### Security Practices
- Encrypt tokens before storing them.  
- Rotate refresh tokens when possible.  
- Ensure **least-privilege OAuth scopes** (only request what’s needed).  
- Enforce HTTPS everywhere.  

---

## 5. Best Practices for HubSpot Marketplace Publication

- **Security & Compliance**  
  - Encrypt all tokens and sensitive data.  
  - Implement secure OAuth token refresh.  
  - Only process the minimum required fields from HubSpot.  
- **User Experience**  
  - Installation should be ≤ 3 steps (Install → Authorize → Configure).  
  - Provide clear reconnection options if OAuth expires.  
- **HubSpot Marketplace Requirements**  
  - Public privacy policy.  
  - Support page and documentation URL.  
  - Demo video of installation and usage.  
  - App will undergo HubSpot’s validation and approval process.  

---

## 6. Client Requirements from TitanX Transcript

### Integration Goals
- Users should use TitanX **directly within HubSpot**.  
- Avoid switching platforms.  
- Enable **scoring and enrichment of contacts/lists**.  
- Results flow back to HubSpot **automatically**.  

### Type of Integration
- **Public Marketplace App** (not private).  
- Must pass HubSpot’s certification for listing.  

### API & Technical Readiness
- TitanX API already works with Salesforce (stateless, webhook support).  
- TitanX API supports **up to 10,000 records per call**.  
- Open question: does HubSpot integration also allow stateless use, or will some configuration/data need to be persisted?  

### UX/UI Expectations
- Similar to Salesforce experience:  
  - Dashboard with submissions, progress, credits, and history.  
  - Mapping UI for HubSpot ↔ TitanX fields.  
  - Panels/cards embedded in HubSpot.  
- Native HubSpot look-and-feel but aligned with TitanX branding.  

### Partner Expectations (On The Fuze)
- Guide on **solution design and best practices**.  
- Define HubSpot **UX/UI flows**.  
- Provide expertise on **object and user management** in HubSpot.  
- Collaborate directly with TitanX devs and decision-makers.  

### Internal Management
- All code/configuration to remain in TitanX repos.  
- TitanX will designate one internal manager for integrations.  
- They do not plan to develop deep HubSpot expertise internally.  

### Desired Features & Capabilities
1. **Direct CRM Operations**  
   - Submit contacts/lists to TitanX for scoring/enrichment.  
   - Automatic updates back into HubSpot.  
2. **Embedded UI**  
   - Cards/panels for credits, progress, history, mapping.  
3. **Workflow Efficiency**  
   - One-click actions.  
   - Dashboards and reports in HubSpot.  
4. **Performance**  
   - Bulk operations: up to 10,000 records per API call.  
   - Scheduled or manual syncs.  
5. **Security/Compliance**  
   - Minimal fields only.  
   - Field-level documentation.  
   - Data stays under TitanX control.  
6. **Documentation & Enablement**  
   - Field-level compliance docs.  
   - End-user enablement handled internally.  

---

## 7. Open Definitions / Pending Scoping

The API is ready, but the **functional flow** must be defined:  
- Which HubSpot objects (contacts, deals, tickets, custom objects)?  
- Direction of data flow (read, write, bidirectional)?  
- Frequency of sync (real-time, scheduled, manual)?  
- Conflict resolution policies.  
- Exact field mappings (HubSpot ↔ TitanX).  

---

## 8. Critical Questions for Discovery

| Question                                                                                                  | Why it’s critical / what it affects                                   | Expected information                                             |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Which endpoints will be used for scoring / enrichment / sync (methods, routes, payloads, return)?**     | Needed to build backend and map data.                                  | Example JSON requests/responses, errors, rate limits.            |
| **Which fields will be synced between TitanX ↔ HubSpot?**                                                 | Required to define HubSpot properties, mappings, and OAuth scopes.     | List of fields, types, required/optional, length.               |
| **What events trigger webhooks?**                                                                         | To know when to receive push instead of polling.                       | Webhook URLs, available events, payloads.                       |
| **What API limits apply?**                                                                                | To design throttling/backoff/queueing.                                 | Rate limits per minute/hour, quota headers, reset intervals.    |
| **Are sandbox/test/production environments separate?**                                                    | To avoid breaking production.                                          | Domains, dummy credentials, keys.                              |
| **What business rules exist for scoring/enrichment?**                                                     | To define how data is exposed in UI and backend.                       | Formulas, re-evaluation triggers, invalidation rules.           |
| **What identifier links HubSpot and TitanX entities (email, uuid, external_id)?**                         | Needed to match HubSpot and TitanX records.                            | “titanx_id” field or matching rules.                           |
| **What sync frequency is expected/allowed?**                                                              | To size batch/realtime processes.                                      | Every 5 min, event-based, nightly batches, etc.                 |
| **What happens in case of data failures/inconsistencies?**                                                | To design error tolerance.                                             | Retry rules, dead letter queues, logging, alerts.               |

---

## 9. Development Timeline (Estimate)

The project is expected to take **5–6 months**:

1. **Months 1–2**  
   - Functional flow design with TitanX team.  
   - Backend setup in AWS with an database(MongoDB,postgres,mysql).
   - Multi-tenant OAuth implementation.  

2. **Months 3–4**  
   - Backend endpoints for HubSpot ↔ TitanX sync.  
   - HubSpot UI Extensions in Settings and record pages.  
   - First integration tests with TitanX API.  

3. **Months 5–6**  
   - QA, performance/security testing.  
   - Documentation (field-level + compliance).  
   - Demo video and Marketplace submission.  

---

## 10. Next Steps

1. Define **functional flow** with TitanX (objects, sync direction, mapping).  
2. Confirm **minimum HubSpot license required** for clients.  
3. Deploy **backend skeleton on AWS** (SSL + domain + Database).  
4. Build MVP with **OAuth + token storage**.  
5. Begin **iterative sprints** with TitanX devs.  

---