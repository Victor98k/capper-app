import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";
import { Resend } from "resend";
import { CapperApplicationEmail } from "@/emails/CapperApplicationEmail";
import { signJWT } from "@/utils/jwt";

// console.log("Resend API Key configured:", !!process.env.RESEND_API_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

// Add this interface
interface CapperApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  sport: string;
  experience: string;
  monthlyBetAmount: string;
  yearlyROI: string;
  status: string;
  roiVerificationImages?: string[]; // Add this field
}

const BASE_URL = "https://app.cappersports.co"; // Hardcode the production URL

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
        roiVerificationImages: app.roiVerificationImages || [], // Add this field
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
    const formData = await request.formData();
    const imageUrls: string[] = [];

    // Extract basic form data
    const data = {
      email: formData.get("email") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      username: formData.get("username") as string,
      sport: formData.get("sport") as string,
      experience: formData.get("experience") as string,
      monthlyBetAmount: formData.get("monthlyBetAmount") as string,
      yearlyROI: formData.get("yearlyROI") as string,
    };

    // Basic validation
    if (!data.email || !data.firstName || !data.lastName || !data.username) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Handle image uploads
    const imageFiles: Blob[] = [];
    formData.forEach((value, key) => {
      if (key.startsWith("image") && value instanceof Blob) {
        imageFiles.push(value);
      }
    });

    // Convert images to base64 strings
    for (const file of imageFiles) {
      if (file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64String = buffer.toString("base64");
        const dataUrl = `data:${file.type};base64,${base64String}`;
        imageUrls.push(dataUrl);
      }
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
          password: "",
          isCapper: false,
        },
      });
    }

    // Create the application with base64 image strings
    const application = await prisma.capperApplication.create({
      data: {
        userId: user.id,
        sport: data.sport,
        experience: data.experience,
        monthlyBetAmount: data.monthlyBetAmount,
        yearlyROI: data.yearlyROI,
        status: "PENDING",
        roiVerificationImages: imageUrls, // Store base64 strings
      },
    });

    // Send confirmation email
    await resend.emails.send({
      from: "Cappers <hello@cappersports.co>",
      to: user.email,
      subject: "Application Received - Cappers Platform",
      react: CapperApplicationEmail({
        userFirstName: user.firstName,
        status: "PENDING",
        baseUrl: BASE_URL,
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
    // console.log("PUT request received"); // Debug log

    const cookies = request.headers.get("cookie");
    // console.log("Cookies:", cookies); // Debug log

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

        await prisma.user.update({
          where: { id: application.userId },
          data: {
            isCapper: false,
          },
        });

        console.log("Sending approval email to:", application.user.email); // Debug log
        const emailResponse = await resend.emails.send({
          from: "Cappers <hello@cappersports.co>",
          to: application.user.email,
          subject: "Your Capper Application has been Approved!",
          react: CapperApplicationEmail({
            userFirstName: application.user.firstName,
            status: "APPROVED",
            setupUrl: signupToken,
            baseUrl: BASE_URL,
          }),
        });

        // Add debug logging
        console.log("Email sending environment:", process.env.NODE_ENV);
        console.log(
          "Email recipient:",
          process.env.NODE_ENV === "development"
            ? "victorgustav98@gmail.com"
            : application.user.email
        );

        console.log("Sending email with:", {
          baseUrl: BASE_URL,
          signupToken,
          fullUrl: `${BASE_URL}/capper-signup?token=${signupToken}`,
        });
      } catch (emailError) {
        console.error("Error in approval process:", emailError);
        // Continue with the response even if email fails
      }
    } else if (status === "REJECTED") {
      // Update rejection email as well
      await resend.emails.send({
        from: "Cappers <hello@cappersports.co>",
        to: application.user.email,
        subject: "Update on Your Capper Application",
        react: CapperApplicationEmail({
          userFirstName: application.user.firstName,
          status: "REJECTED",
          baseUrl: BASE_URL,
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
