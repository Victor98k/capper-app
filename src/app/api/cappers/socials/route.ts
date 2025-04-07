import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

interface SocialLink {
  username: string;
  url: string;
}

interface SocialLinks {
  instagram?: SocialLink | null;
  x?: SocialLink | null;
  discord?: SocialLink | null;
  whatsapp?: SocialLink | null;
  youtube?: SocialLink | null;
}

export async function PUT(request: Request) {
  try {
    const { userId, socials } = (await request.json()) as {
      userId: string;
      socials: SocialLinks;
    };
    console.log("Received update request:", { userId, socials }); // Debug log

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get existing capper data first
    const existingCapper = (await prisma.capper.findUnique({
      where: { userId },
      select: { socialLinks: true as const },
    })) as { socialLinks: SocialLinks | null };

    // Merge existing social links with new ones
    const updatedSocials = {
      instagram:
        socials.instagram || existingCapper?.socialLinks?.instagram || null,
      x: socials.x || existingCapper?.socialLinks?.x || null,
      discord: socials.discord || existingCapper?.socialLinks?.discord || null,
      whatsapp:
        socials.whatsapp || existingCapper?.socialLinks?.whatsapp || null,
      youtube: socials.youtube || existingCapper?.socialLinks?.youtube || null,
    };

    console.log("Updating with merged socials:", updatedSocials); // Debug log

    const updatedCapper = await prisma.capper.update({
      where: { userId },
      data: {
        socialLinks: updatedSocials as Prisma.JsonValue,
      },
      include: {
        user: true,
      },
    });

    console.log("Updated capper:", updatedCapper); // Debug log

    return NextResponse.json(updatedCapper);
  } catch (error) {
    console.error("Error updating social links:", error);
    return NextResponse.json(
      { error: "Failed to update social links" },
      { status: 500 }
    );
  }
}
