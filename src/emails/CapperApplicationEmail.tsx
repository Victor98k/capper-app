import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { LOGO_BASE64 } from "./assets/base64Images";

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
  const fullSetupUrl = setupUrl
    ? `${baseUrl}/capper-signup?token=${setupUrl}`
    : "#";

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>
          {isApproved
            ? "Your Capper application has been approved!"
            : "Update on your Capper application"}
        </Preview>
        <Container style={container}>
          <Img
            src={LOGO_BASE64}
            width="100"
            height="100"
            alt="Cappers"
            style={logo}
          />
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
              <Section style={btnContainer}>
                <Button style={button} href={fullSetupUrl}>
                  Complete Your Profile
                </Button>
              </Section>
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
  backgroundColor: "#1a1a1a",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  color: "#ffffff",
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  background: "#1a1a1a",
};

const logo = {
  margin: "0 auto",
};

const text = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#e5e5e5",
  margin: "0 0 20px",
  padding: "0 48px",
};

const btnContainer = {
  textAlign: "center" as const,
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
