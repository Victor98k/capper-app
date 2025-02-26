import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";

interface CapperApplicationEmailProps {
  userFirstName: string;
  status: "APPROVED" | "REJECTED" | "PENDING";
  setupUrl?: string;
  baseUrl: string;
}

export const CapperApplicationEmail = ({
  userFirstName,
  status,
  setupUrl,
  baseUrl,
}: CapperApplicationEmailProps) => {
  const isApproved = status === "APPROVED";
  const fullSetupUrl = setupUrl ? `${baseUrl}${setupUrl}` : undefined;

  return (
    <Html>
      <Head />
      <Preview>
        {isApproved
          ? "Your Capper application has been approved!"
          : "Update on your Capper application"}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isApproved ? "Application Approved!" : "Application Update"}
          </Heading>
          <Text style={text}>Hi {userFirstName},</Text>
          {status === "PENDING" ? (
            <Text style={text}>
              We've received your application to become a Capper. Our team will
              review your application and get back to you soon.
            </Text>
          ) : status === "APPROVED" ? (
            <>
              <Text style={text}>
                We're excited to inform you that your application to become a
                Capper has been approved! You can now start setting up your
                Capper profile and begin sharing your insights with the
                community.
              </Text>
              <Text style={text}>
                Click the button below to complete your Capper profile setup:
              </Text>
              <Link href={fullSetupUrl} style={button}>
                Complete Your Profile
              </Link>
            </>
          ) : (
            <Text style={text}>
              We've reviewed your application to become a Capper and
              unfortunately, we cannot approve it at this time. We encourage you
              to apply again in the future with more experience and track
              record.
            </Text>
          )}
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  margin: "0 0 20px",
  padding: "0 48px",
};

const button = {
  backgroundColor: "#4e43ff",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "230px",
  padding: "14px 7px",
  margin: "0 auto",
};
