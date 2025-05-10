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

interface CappersWelcomeEmailProps {
  userFirstname: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "";

export const CappersWelcomeEmail = ({
  userFirstname,
}: CappersWelcomeEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>Welcome to CapperSportsContent</Preview>
      <Container style={container}>
        {/* <Img
          src="https://res.cloudinary.com/dnsemsbxr/image/upload/v1746916303/Favicon_thstsk.png"
          width="170"
          height="50"
          alt="Cappers"
          style={logo}
        /> */}
        <Text style={paragraph}>Hi {userFirstname},</Text>
        <Text style={paragraph}>
          Welcome to CapperSportsContent, your platform to follow and learn from
          professional sports bettors. Get exclusive access to expert picks and
          content to help improve your sports betting success.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href="https://cappersports.co">
            Get started
          </Button>
        </Section>
        <Text style={paragraph}>
          Best,
          <br />
          The CapperSportsContent team
        </Text>
        <Hr style={hr} />
        <Text style={footer}>CapperSportsContent</Text>
      </Container>
    </Body>
  </Html>
);

CappersWelcomeEmail.PreviewProps = {
  userFirstname: "Alan",
} as CappersWelcomeEmailProps;

export default CappersWelcomeEmail;

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

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#e5e5e5",
};

const btnContainer = {
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#4e43ff",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
  margin: "24px 0",
};

const hr = {
  borderColor: "#333333",
  margin: "20px 0",
};

const footer = {
  color: "#666666",
  fontSize: "12px",
};
