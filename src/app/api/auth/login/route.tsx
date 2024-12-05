import { UserLoginData } from "@/types/user";
import { comparePassword } from "@/utils/bcrypt";
import { signJWT } from "@/utils/jwt";
import { userLoginValidator } from "@/utils/validators/userValidator";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body: UserLoginData = await request.json();
    const [hasErrors, errors] = userLoginValidator(body);
    if (hasErrors) {
      return NextResponse.json(
        {
          errors,
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "user matching credentials not found",
        },
        { status: 400 }
      );
    }
    const passwordIsSame = await comparePassword(body.password, user.password);
    if (!passwordIsSame) {
      throw new Error("Password missmatch");
    }
    const token = await signJWT({
      userId: user.id,
    });

    const response = NextResponse.json({
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isCapper: user.isCapper,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    };

    response.cookies.set("token", token, cookieOptions);

    return response;
  } catch (error: any) {
    console.log("Error: failed to login", error.message);
    return NextResponse.json(
      {
        message: "user matching credentials not found",
      },
      { status: 400 }
    );
  }
}
