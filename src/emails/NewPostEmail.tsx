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

interface NewPostEmailProps {
  subscriberName: string;
  capperName: string;
  postTitle: string;
  postPreview: string;
  postId: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "";

export const NewPostEmail = ({
  subscriberName,
  capperName,
  postTitle,
  postPreview,
  postId,
}: NewPostEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>
        New post from {capperName}: {postTitle}
      </Preview>
      <Container style={container}>
        <Img
          src="https://res.cloudinary.com/dnsemsbxr/image/upload/v1749677874/Favicon_utgw7a.png"
          width="100"
          height="100"
          alt="Cappers"
          style={logo}
        />
        <Text style={paragraph}>Hi {subscriberName},</Text>
        <Text style={paragraph}>
          {capperName} just posted new content on Cappers!
        </Text>
        <Text style={paragraph}>
          <strong>{postTitle}</strong>
          <br />
          {postPreview}
        </Text>
        <Section style={btnContainer}>
          <Button
            style={button}
            href={`https://cappersports.co/posts/${postId}`}
          >
            Read Full Post
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Cappers Platform
          <br />
          <small>
            You received this email because you're subscribed to {capperName}.
            <br />
            <a
              href="https://cappersports.co/my-profile"
              style={unsubscribeLink}
            >
              Manage your notification settings
            </a>
          </small>
        </Text>
      </Container>
    </Body>
  </Html>
);

NewPostEmail.PreviewProps = {
  subscriberName: "John",
  capperName: "Alex",
  postTitle: "Match Analysis: Lakers vs Warriors",
  postPreview: "Check out my detailed analysis of tonight's game...",
  postId: "123",
} as NewPostEmailProps;

export default NewPostEmail;

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
  maxWidth: "600px",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
  maxWidth: "100px",
  display: "inline-block",
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

const unsubscribeLink = {
  color: "#666666",
  textDecoration: "underline",
};
