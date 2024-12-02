import { NextResponse } from "next/server";
import { UserRegistrationData } from "@/types/user";
import { userRegistrationValidator } from "@/utils/validators/userValidator";
import { hashPassword } from "@/utils/bcrypt";
import { signJWT } from "@/utils/jwt";
import { prisma } from "@/utils/prisma";

export async function POST(request: Request) {
  try {
    const body: UserRegistrationData = await request.json();

    const [hasErrors, errors] = userRegistrationValidator(body);

    if (hasErrors) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        password: hashedPassword,
        isCapper: body.isCapper,
      },
    });

    const token = await signJWT({
      userId: user.id,
    });

    return NextResponse.json(
      {
        token,
        userId: user.id,
        isCapper: user.isCapper,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
