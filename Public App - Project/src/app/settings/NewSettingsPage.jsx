import React, { useEffect, useState } from "react";
import { 
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Flex,
  Heading,
  Text,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
} from "@hubspot/ui-extensions";*
import { hubspot } from "@hubspot/ui-extensions";

hubspot.extend(({ context,actions }) => {
  return <ContactsTable context={context} actions={actions} />;
});

const ContactsTable = ({ context, actions }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hubspot.fetch("https://example.com/contacts?portalId=21839168")
      .then(async (res) => {
        if (!res.ok) throw new Error("Error fetching HubSpot contacts");
        const data = await res.json();
        console.log(data)
        setContacts(data.results || []);
        
      })
      .catch((err) => console.error("Fetch error:", err))
      .finally(() => setLoading(false)); 
  }, []);
  console.log(contacts)
  return (
    <Flex direction="column" gap="small">
      <Heading>HubSpot Contacts</Heading>
      {loading && <Text>Loading...</Text>}

      {!loading && (
        <Table bordered={true} paginated={true} pageCount="5">
          <TableHead>
            <TableRow>
              <TableHeader>Firstname</TableHeader>
              <TableHeader>Lastname</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.properties?.firstname || "-"}</TableCell>
                <TableCell>{c.properties?.lastname || "-"}</TableCell>
                <TableCell>{c.properties?.email || "-"}</TableCell>
                <TableCell>
                  <Button
                  size="sm" 
                  variant="secondary"
                  overlay={
                    <Modal id="default-modal" title="Example modal" width="md">
                      <ModalBody>
                        <Text>Welcome to my modal. Thanks for stopping by!</Text>
                        <Text>
                          {c.properties?.firstname || "-"} {c.properties?.lastname || "-"} {c.properties?.email || "-"}
                        </Text>
                      </ModalBody>
                      <ModalFooter>
                        <Button onClick={() => actions.closeOverlay('default-modal')}>
                          Close modal
                        </Button>
                      </ModalFooter>
                    </Modal>
                  }
                  >
                  View
                </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Flex>
  );
};