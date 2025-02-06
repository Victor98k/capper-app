import { NextResponse } from "next/server";
import { UserRegistrationData } from "@/types/user";
import { userRegistrationValidator } from "@/utils/validators/userValidator";
import { hashPassword } from "@/utils/bcrypt";
import { JWTUserPayload, signJWT } from "@/utils/jwt";
import { prisma } from "@/utils/prisma";

function validatePassword(password: string): [boolean, string[]] {
  const errors: string[] = [];

  if (password.length < 7) {
    errors.push("Password must be at least 7 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  return [errors.length > 0, errors];
}

export async function POST(request: Request) {
  try {
    const body: UserRegistrationData = await request.json();
    const [hasErrors, errors] = userRegistrationValidator(body);

    // Add password validation
    const [hasPasswordErrors, passwordErrors] = validatePassword(body.password);

    if (hasErrors || hasPasswordErrors) {
      return NextResponse.json(
        {
          errors: {
            ...(hasErrors ? errors : {}),
            password: passwordErrors,
          },
        },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        username: body.username,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        password: hashedPassword,
        isCapper: body.isCapper || false,
      },
    });

    if (body.isCapper) {
      await prisma.capper.create({
        data: {
          userId: user.id,
          tags: [],
          subscriberIds: [],
        },
      });
    }

    const token = await signJWT({
      userId: user.id,
    });

    const response = new NextResponse(
      JSON.stringify({
        userId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    response.cookies.set("token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day in seconds
      path: "/",
    });

    console.log("Setting token cookie for new registration:", {
      token: token.substring(0, 20) + "...",
      cookieString: response.headers.get("set-cookie"),
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
