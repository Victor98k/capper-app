import { NextResponse } from "next/server";
import { Resend } from "resend";
import { NewPostEmail } from "@/emails/NewPostEmail";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { capperId, postId, postTitle, postPreview } = await req.json();

    // Get the capper's information
    const capper = await prisma.capper.findUnique({
      where: { id: capperId },
      select: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        subscriptions: {
          where: {
            status: "active",
          },
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!capper) {
      return NextResponse.json({ error: "Capper not found" }, { status: 404 });
    }

    // Send email to each subscriber
    const emailPromises = capper.subscriptions.map(async ({ user }) => {
      await resend.emails.send({
        from: "Cappers <notifications@cappersports.co>",
        to: user.email,
        subject: `New post from ${capper.user.firstName} ${capper.user.lastName}: ${postTitle}`,
        react: NewPostEmail({
          subscriberName: `${user.firstName} ${user.lastName}`,
          capperName: `${capper.user.firstName} ${capper.user.lastName}`,
          postTitle,
          postPreview,
          postId,
        }),
      });
    });

    await Promise.all(emailPromises);

    return NextResponse.json(
      { message: "Notification emails sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending notification emails:", error);
    return NextResponse.json(
      { error: "Error sending notification emails" },
      { status: 500 }
    );
  }
}
