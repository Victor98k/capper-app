import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

if (!process.env.RESEND_API_KEY) {
  console.error("RESEND_API_KEY is not set in environment variables");
}
if (!process.env.NEXT_PUBLIC_APP_URL) {
  console.error("NEXT_PUBLIC_APP_URL is not set in environment variables");
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    console.log("Processing password reset for email:", email);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("No user found with email:", email);
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, you will receive a password reset link",
      });
    }

    // Generate reset token and expiry
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Hash the token before saving to database
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    console.log("Generated reset token for user:", user.id);

    // Save the reset token and expiry to the user record
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry,
      },
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    console.log("Reset URL generated:", resetUrl);

    try {
      // Send email
      const emailResponse = await resend.emails.send({
        from: "Cappers Platform <onboarding@resend.dev>",
        to: user.email,
        subject: "Reset Your Password",
        html: `
          <p>You requested a password reset.</p>
          <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `,
      });
      console.log("Email sent successfully:", emailResponse);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      throw emailError;
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, you will receive a password reset link",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
