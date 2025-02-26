import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";
import { Resend } from "resend";
import { CapperApplicationEmail } from "@/emails/CapperApplicationEmail";
import { signJWT } from "@/utils/jwt";

console.log("Resend API Key configured:", !!process.env.RESEND_API_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail = process.env.RESEND_FROM_EMAIL;
const testEmail = process.env.RESEND_TEST_EMAIL;

// Define test email - this ensures we have a fallback
const TEST_EMAIL = "victorgustav98@gmail.com";

export async function GET() {
  try {
    const applications = await prisma.capperApplication.findMany({
      where: {
        user: {
          id: {
            not: undefined,
          },
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform and filter out any applications with missing users
    const formattedApplications = applications
      .filter((app) => app.user)
      .map((app) => ({
        id: app.id,
        firstName: app.user.firstName,
        lastName: app.user.lastName,
        email: app.user.email,
        username: app.user.username,
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
      { error: "Failed to fetch applications" },
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
      from: "Cappers Platform <onboarding@resend.dev>",
      to: TEST_EMAIL, // Always send to test email
      subject: "Application Received - Cappers Platform",
      react: CapperApplicationEmail({
        userFirstName: user.firstName,
        status: "PENDING",
        baseUrl: process.env.NEXT_PUBLIC_APP_URL || "",
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
          to: TEST_EMAIL, // Always send to test email
          subject: "Your Capper Application has been Approved!",
          react: CapperApplicationEmail({
            userFirstName: application.user.firstName,
            status: "APPROVED",
            setupUrl: signupUrl,
            baseUrl: process.env.NEXT_PUBLIC_APP_URL || "",
          }),
        });
        console.log("Email response:", emailResponse); // Debug log

        // Add debug logging
        console.log("Email sending environment:", process.env.NODE_ENV);
        console.log(
          "Email recipient:",
          process.env.NODE_ENV === "development"
            ? "victorgustav98@gmail.com"
            : application.user.email
        );
      } catch (emailError) {
        console.error("Error in approval process:", emailError);
        // Continue with the response even if email fails
      }
    } else if (status === "REJECTED") {
      // Update rejection email as well
      await resend.emails.send({
        from: "Cappers Platform <onboarding@resend.dev>",
        to: TEST_EMAIL, // Always send to test email
        subject: "Update on Your Capper Application",
        react: CapperApplicationEmail({
          userFirstName: application.user.firstName,
          status: "REJECTED",
          baseUrl: process.env.NEXT_PUBLIC_APP_URL || "",
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
