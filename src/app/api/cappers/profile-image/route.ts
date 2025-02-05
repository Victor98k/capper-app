import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("profileImage") as File;
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads");
    try {
      await writeFile(join(uploadDir, "test.txt"), "");
    } catch (error) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Create unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `profile-${userId}-${Date.now()}.${file.name
      .split(".")
      .pop()}`;
    const filepath = join(uploadDir, filename);

    // Write file to disk
    await writeFile(filepath, buffer);

    // Update user's profile image in database
    const publicPath = `/uploads/${filename}`;
    await prisma.capper.update({
      where: { userId },
      data: {
        profileImage: publicPath,
      },
    });

    return NextResponse.json({
      success: true,
      imageUrl: publicPath,
    });
  } catch (error) {
    console.error("Error in profile image upload:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
