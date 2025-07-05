import { NextResponse } from "next/server";
import { Resend } from "resend";
import { NewPostEmail } from "@/emails/NewPostEmail";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("Received notification request:", data);

    const { capperId, postId, postTitle, postPreview } = data;

    // First, get the capper with user data
    const capperWithUser = await prisma.capper.findUnique({
      where: { id: capperId },
      include: { user: true },
    });

    if (!capperWithUser || !capperWithUser.user) {
      return NextResponse.json(
        { error: "Capper or user not found" },
        { status: 404 }
      );
    }

    // First get the subscription IDs and user IDs
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        capperId: capperId,
        status: "active",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        userId: true,
      },
    });

    // Then get the users
    const subscribers = await prisma.user.findMany({
      where: {
        id: {
          in: activeSubscriptions.map((sub) => sub.userId),
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    console.log("Found subscribers:", JSON.stringify(subscribers, null, 2));

    // Send email to each subscriber
    const emailPromises = subscribers.map(async (subscriber) => {
      // Use different base URLs for development and production
      const baseUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : "https://app.cappersports.co";

      const profileUrl = `${baseUrl}/cappers/${capperWithUser.user.username}`;

      await resend.emails.send({
        from: "Cappers <hello@cappersports.co>",
        to: subscriber.email,
        subject: `New post from @${capperWithUser.user.username}: ${postTitle}`,
        react: NewPostEmail({
          subscriberName: `${subscriber.firstName} ${subscriber.lastName}`,
          capperName: `@${capperWithUser.user.username}`,
          postTitle,
          postPreview,
          postId: profileUrl,
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

// Test endpoint
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Test endpoint only available in development" },
      { status: 403 }
    );
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        username: "kallekanel",
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        capperProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    console.log("Found user:", JSON.stringify(user, null, 2));

    if (!user?.capperProfile?.id) {
      return NextResponse.json(
        { error: "Test user or capper profile not found" },
        { status: 404 }
      );
    }

    // Now get the active subscriptions for this capper
    const subscriptions = await prisma.subscription.findMany({
      where: {
        capperId: user.capperProfile.id,
      }, // Remove status filter temporarily
      select: {
        id: true,
        status: true,
        userId: true, // Add this to see the userIds
      },
    });

    console.log("All subscriptions:", JSON.stringify(subscriptions, null, 2));

    // If we find subscriptions, then try to get user details separately
    if (subscriptions.length > 0) {
      const userIds = subscriptions.map((sub) => sub.userId);
      const subscribers = await prisma.user.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      console.log("Found subscribers:", JSON.stringify(subscribers, null, 2));

      const testData = {
        postId: "682e2e07927df25d2e8d5a9b",
        postTitle: "Hammarby vs Aik Allsvenskan omgång 4",
        postPreview:
          "Bajen vs Gnaget! Härlig derby helg med fina BETS som ska inkasseras.",
      };

      // Send test email to each subscriber
      const emailPromises = subscribers.map(async (subscriber) => {
        await resend.emails.send({
          from: "Cappers <hello@cappersports.co>",
          to: subscriber.email,
          subject: `New post from @${user.username}: ${testData.postTitle}`,
          react: NewPostEmail({
            subscriberName: `${subscriber.firstName} ${subscriber.lastName}`,
            capperName: `@${user.username}`,
            postTitle: testData.postTitle,
            postPreview: testData.postPreview,
            postId: testData.postId,
          }),
        });
      });

      await Promise.all(emailPromises);

      return NextResponse.json(
        {
          message: "Test notification emails sent successfully",
          sentTo: subscribers.map((sub) => sub.email),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "No subscriptions found" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending test notification emails:", error);
    return NextResponse.json(
      { error: "Error sending test notification emails" },
      { status: 500 }
    );
  }
}
