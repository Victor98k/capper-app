import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Schema for validating post data
const PostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  tags: z.array(z.string()),
  bets: z.array(z.string()),
  odds: z.array(z.string()),
});

// Add GET handler
export async function GET(req: Request) {
  try {
    // Authentication checks
    const cookies = req.headers.get("cookie");
    const cookiesArray =
      cookies?.split(";").map((cookie) => cookie.trim()) || [];
    const tokenCookie = cookiesArray.find((cookie) =>
      cookie.startsWith("token=")
    );
    const token = tokenCookie?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get all posts with capper information
    const posts = await prisma.capperPost.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        capper: {
          include: {
            user: true, // Include user information
          },
        },
      },
    });

    // Log the posts to verify the data
    console.log("Fetched posts:", posts);

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Improved authentication checks
    const cookies = req.headers.get("cookie");
    if (!cookies) {
      return NextResponse.json(
        { error: "No cookies present" },
        { status: 401 }
      );
    }

    const cookiesArray = cookies.split(";").map((cookie) => cookie.trim());
    const tokenCookie = cookiesArray.find((cookie) =>
      cookie.startsWith("token=")
    );

    if (!tokenCookie) {
      return NextResponse.json(
        { error: "No token cookie found" },
        { status: 401 }
      );
    }

    const token = tokenCookie.split("=")[1];
    if (!token) {
      return NextResponse.json({ error: "Token is empty" }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyJWT(token);
      if (!payload || !payload.userId) {
        return NextResponse.json(
          { error: "Invalid token payload" },
          { status: 401 }
        );
      }
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return NextResponse.json(
        { error: "Token verification failed" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    // Add image handling
    const image = formData.get("image");
    let imageUrl = null;

    if (image && image instanceof Blob) {
      try {
        // Convert image to base64
        const buffer = Buffer.from(await image.arrayBuffer());
        const base64Image = buffer.toString("base64");

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(
            `data:${image.type};base64,${base64Image}`,
            { folder: "capper_posts" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
        });

        imageUrl = (result as any).secure_url;
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        );
      }
    }

    // Validate that all required fields are present
    const title = formData.get("title");
    const content = formData.get("content");
    const tagsString = formData.get("tags");
    const betsString = formData.get("bets");
    const oddsString = formData.get("odds");

    if (!title || !content || !tagsString || !betsString || !oddsString) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Safe parsing of JSON strings
    let tags, bets, odds;
    try {
      tags = JSON.parse(tagsString as string);
      bets = JSON.parse(betsString as string);
      odds = JSON.parse(oddsString as string);
    } catch (parseError) {
      console.error("JSON Parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in form data" },
        { status: 400 }
      );
    }

    // Get the capper profile
    const capperProfile = await prisma.capper.findUnique({
      where: { userId: payload.userId },
    });

    if (!capperProfile) {
      return NextResponse.json(
        { error: "Capper profile not found" },
        { status: 404 }
      );
    }

    // Create the post
    const post = await prisma.capperPost.create({
      data: {
        title: title as string,
        content: content as string,
        tags,
        bets,
        odds,
        capperId: capperProfile.id,
        imageUrl: imageUrl,
      },
    });

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    console.error(
      "Server error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
