import { Resend } from "resend";
import { CappersWelcomeEmail } from "@/emails/WelcomeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { username, email, type } = await request.json();

    let emailResponse;

    switch (type) {
      case "welcome":
        emailResponse = await resend.emails.send({
          from: "Cappers Platform <onboarding@resend.dev>",
          to: email,
          subject: "Welcome to Cappers Platform!",
          react: CappersWelcomeEmail({ userFirstname: username }),
        });
        break;
      // Add more email types here as needed
      default:
        return Response.json({ error: "Invalid email type" }, { status: 400 });
    }

    return Response.json({ success: true, data: emailResponse });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
