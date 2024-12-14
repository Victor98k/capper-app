import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

type Context = {
  params: { username: string } | null;
};

export async function GET(request: NextRequest, { params }: Context) {
  if (!params?.username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const capper = await prisma.capper.findFirst({
    where: {
      user: { username: params.username },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          username: true,
        },
      },
    },
  });

  if (!capper) {
    return NextResponse.json({ error: "Capper not found" }, { status: 404 });
  }

  return NextResponse.json(capper);
}
