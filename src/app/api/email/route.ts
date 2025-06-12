import { Resend } from "resend";
import { CappersWelcomeEmail } from "@/emails/WelcomeEmail";
import { NewPostEmail } from "@/emails/NewPostEmail";
import { CapperApplicationEmail } from "@/emails/CapperApplicationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { username, email, type, postDetails, status, baseUrl } =
      await request.json();

    let emailResponse;

    switch (type) {
      case "welcome":
        emailResponse = await resend.emails.send({
          from: "Cappers <hello@cappersports.co>",
          to: email,
          subject: "Welcome to Cappers Platform!",
          react: CappersWelcomeEmail({ userFirstname: username }),
        });
        break;
      case "new-post":
        if (!postDetails) {
          return Response.json(
            { error: "Post details required" },
            { status: 400 }
          );
        }
        emailResponse = await resend.emails.send({
          from: "Cappers <hello@cappersports.co>",
          to: email,
          subject: `New Post: ${postDetails.postTitle}`,
          react: NewPostEmail({
            subscriberName: username,
            capperName: postDetails.capperName,
            postTitle: postDetails.postTitle,
            postPreview: postDetails.postPreview,
            postId: postDetails.postId,
          }),
        });
        break;
      case "application-status":
        if (!status || !baseUrl) {
          return Response.json(
            { error: "Status and baseUrl required" },
            { status: 400 }
          );
        }
        emailResponse = await resend.emails.send({
          from: "Cappers <hello@cappersports.co>",
          to: email,
          subject:
            status === "APPROVED"
              ? "Your Capper Application has been Approved!"
              : "Update on your Capper Application",
          react: CapperApplicationEmail({
            userFirstName: username,
            status,
            baseUrl,
            setupUrl: status === "APPROVED" ? "your-setup-token" : undefined,
          }),
        });
        break;
      default:
        return Response.json({ error: "Invalid email type" }, { status: 400 });
    }

    return Response.json({ success: true, data: emailResponse });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
