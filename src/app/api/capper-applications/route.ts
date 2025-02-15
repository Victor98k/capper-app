import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";
import { Resend } from "resend";
import { CapperApplicationEmail } from "@/emails/CapperApplicationEmail";
import { signJWT } from "@/utils/jwt";

console.log("Resend API Key configured:", !!process.env.RESEND_API_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// Test email sending
try {
  await resend.emails.send({
    from: "Cappers Platform <onboarding@resend.dev>",
    to: "your-test-email@example.com",
    subject: "Test Email",
    text: "This is a test email",
  });
  console.log("Test email sent successfully");
} catch (error) {
  console.error("Error sending test email:", error);
}

export async function GET(request: Request) {
  try {
    // Get token from cookies
    const cookies = request.headers.get("cookie");
    const token = cookies
      ?.split(";")
      .find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is a super user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isSuperUser: true },
    });

    if (!user?.isSuperUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.capperApplication.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          },
        },
      },
    });

    const formattedApplications = applications.map((app) => ({
      id: app.id,
      name: `${app.user.firstName} ${app.user.lastName}`,
      username: app.user.username,
      email: app.user.email,
      sport: app.sport,
      experience: app.experience,
      monthlyBetAmount: app.monthlyBetAmount,
      yearlyROI: app.yearlyROI,
      status: app.status,
    }));

    return NextResponse.json(formattedApplications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Error fetching applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Basic validation
    if (!data.email || !data.firstName || !data.lastName || !data.username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create user if they don't exist
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          password: "", // They'll set this later if approved
          isCapper: false,
        },
      });
    }

    // Create the application
    const application = await prisma.capperApplication.create({
      data: {
        userId: user.id,
        sport: data.sport,
        experience: data.experience,
        monthlyBetAmount: data.monthlyBetAmount,
        yearlyROI: data.yearlyROI,
        status: "PENDING",
      },
    });

    // Send confirmation email
    await resend.emails.send({
      from: "Cappers Platform <notifications@cappersports.co>",
      to: user.email,
      subject: "Application Received - Cappers Platform",
      react: CapperApplicationEmail({
        userFirstName: user.firstName,
        status: "PENDING",
      }),
    });

    return NextResponse.json({ success: true, applicationId: application.id });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Error creating application" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log("PUT request received"); // Debug log

    const cookies = request.headers.get("cookie");
    console.log("Cookies:", cookies); // Debug log

    const token = cookies
      ?.split(";")
      .find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];

    console.log("Token:", token?.substring(0, 20) + "..."); // Debug log

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    console.log("Payload:", payload); // Debug log

    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is a super user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isSuperUser: true },
    });

    if (!user?.isSuperUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId, status } = await request.json();
    console.log("Application update:", { applicationId, status }); // Debug log

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: "Application ID and status are required" },
        { status: 400 }
      );
    }

    const application = await prisma.capperApplication.update({
      where: { id: applicationId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            email: true,
          },
        },
      },
    });

    // If application is approved, update user to be a capper
    if (status === "APPROVED") {
      try {
        console.log("Generating signup token..."); // Debug log
        const signupToken = await signJWT({
          userId: application.userId,
        });
        console.log("Token generated successfully"); // Debug log

        const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/capper-signup?token=${signupToken}`;
        console.log("Signup URL:", signupUrl); // Debug log

        await prisma.user.update({
          where: { id: application.userId },
          data: {
            isCapper: false,
          },
        });
        console.log("User updated successfully"); // Debug log

        console.log("Sending approval email to:", application.user.email); // Debug log
        const emailResponse = await resend.emails.send({
          from: "Cappers Platform <onboarding@resend.dev>",
          to: application.user.email,
          subject: "Your Capper Application has been Approved!",
          react: CapperApplicationEmail({
            userFirstName: application.user.firstName,
            status: "APPROVED",
            setupUrl: signupUrl,
          }),
        });
        console.log("Email response:", emailResponse); // Debug log
      } catch (emailError) {
        console.error("Error in approval process:", emailError);
        // Continue with the response even if email fails
      }
    } else if (status === "REJECTED") {
      // Update rejection email as well
      await resend.emails.send({
        from: "Cappers Platform <onboarding@resend.dev>",
        to: application.user.email,
        subject: "Update on Your Capper Application",
        react: CapperApplicationEmail({
          userFirstName: application.user.firstName,
          status: "REJECTED",
        }),
      });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Error updating application" },
      { status: 500 }
    );
  }
}
