import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { UserRegistrationData } from "@/types/user";
import { userRegistrationValidator } from "@/utils/validators/userValidator";
import { hashPassword } from "@/utils/bcrypt";
import { signJWT } from "@/utils/jwt";
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Using the UserRegistrationData type here to aviod errors.
    const body: UserRegistrationData = await request.json();
    //
    const [hasErrors, errors] = userRegistrationValidator(body);
    // Validating the data using the userRegistrationValidator function.
    if (hasErrors) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const hashedPassword = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        password: hashedPassword,
        isAdmin: body.isAdmin,
      },
    });

    const token = await signJWT({
      userId: user.id,
    });

    return NextResponse.json(
      {
        token,
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin,
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
