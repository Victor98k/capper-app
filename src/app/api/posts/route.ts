import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import Stripe from "stripe";

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
  productId: z.string().min(1, "Product ID is required"),
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

    // Get capperId from query parameters
    const url = new URL(req.url);
    const capperId = url.searchParams.get("capperId");

    // Build the query based on whether capperId is provided
    const query = capperId
      ? {
          capperId,
          // Only get posts where the capper and user still exist
          capper: {
            user: {
              id: { not: null },
            },
          },
        }
      : {
          capper: {
            user: {
              id: { not: null },
            },
          },
        };

    // Get posts with capper information
    const posts = await prisma.capperPost.findMany({
      where: {
        AND: [
          capperId ? { capperId } : {},
          {
            capper: {
              user: {
                id: { not: undefined },
              },
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        capper: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                username: true,
                imageUrl: true,
                stripeConnectId: true,
              },
            },
          },
        },
      },
    });

    // Transform the posts to match the expected format
    const transformedPosts = await Promise.all(
      posts.map(async (post) => {
        let productName = "";
        if (post.productId) {
          try {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
              apiVersion: "2024-12-18.acacia",
            });
            const product = await stripe.products.retrieve(post.productId, {
              stripeAccount: post.capper.user.stripeConnectId || undefined,
            } as Stripe.RequestOptions);

            productName = product.name;
          } catch (error) {
            console.error("Error fetching product name:", error);
          }
        }

        return {
          _id: post.id,
          title: post.title,
          content: post.content,
          imageUrl: post.imageUrl || "",
          odds: post.odds,
          bets: post.bets,
          tags: post.tags,
          capperId: post.capperId,
          productId: post.productId || "",
          productName,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          likes: post.likes,
          comments: post.comments,
          capperInfo: {
            firstName: post.capper.user.firstName,
            lastName: post.capper.user.lastName,
            username: post.capper.user.username,
            imageUrl: post.capper.user.imageUrl,
            profileImage: post.capper.profileImage,
          },
        };
      })
    );

    return NextResponse.json(transformedPosts);
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

    // Get all form data
    const title = formData.get("title");
    const content = formData.get("content");
    const tagsString = formData.get("tags");
    const betsString = formData.get("bets");
    const oddsString = formData.get("odds");
    const username = formData.get("username");
    const productId = formData.get("productId");

    if (
      !title ||
      !content ||
      !tagsString ||
      !betsString ||
      !oddsString ||
      !username ||
      !productId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Log received formData
    // console.log("Received FormData entries:");
    // for (let pair of formData.entries()) {
    //   console.log(pair[0], pair[1]);
    // }

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

    // Parse JSON strings
    const tags = JSON.parse(tagsString as string);
    const bets = JSON.parse(betsString as string);
    const odds = JSON.parse(oddsString as string);

    // Change const to let since we need to reassign it later
    let capperProfile = await prisma.capper.findFirst({
      where: {
        user: {
          username: username as string,
        },
      },
      include: {
        user: true,
      },
    });

    // Add debug logging
    console.log("Looking for capper with username:", username);
    console.log("Found capper profile:", capperProfile);

    if (!capperProfile) {
      // Try to find the user first to debug the issue
      const user = await prisma.user.findFirst({
        where: {
          username: username as string,
        },
      });

      // console.log("Found user:", user);

      // If user exists but no capper profile, create one
      if (user) {
        const newCapperProfile = await prisma.capper.create({
          data: {
            userId: user.id,
            tags: [],
            subscriberIds: [],
          },
          include: {
            user: true,
          },
        });

        // console.log("Created new capper profile:", newCapperProfile);
        capperProfile = newCapperProfile;
      } else {
        return NextResponse.json(
          { error: "Capper profile not found and user does not exist" },
          { status: 404 }
        );
      }
    }

    // Verify the product belongs to this capper
    if (capperProfile) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
          apiVersion: "2024-12-18.acacia",
        });

        // Use the capper's Stripe Connect account ID
        const product = await stripe.products.retrieve(
          productId as string,
          {
            stripeAccount: capperProfile.user.stripeConnectId || undefined,
          } as Stripe.RequestOptions
        );

        if (!product) {
          return NextResponse.json(
            { error: "Invalid product ID or product not found" },
            { status: 400 }
          );
        }

        // Create the post with productId
        const post = await prisma.capperPost.create({
          data: {
            title: title as string,
            content: content as string,
            imageUrl: imageUrl,
            tags,
            bets,
            odds,
            capperId: capperProfile.id,
            productId: productId as string,
            likes: 0,
            comments: 0,
          },
          include: {
            capper: {
              include: {
                user: true,
              },
            },
          },
        });

        // Transform the post to match the expected format
        const transformedPost = {
          _id: post.id,
          title: post.title,
          content: post.content,
          imageUrl: post.imageUrl || "",
          odds: post.odds,
          bets: post.bets,
          tags: post.tags,
          capperId: post.capperId,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          likes: post.likes,
          comments: post.comments,
          capperInfo: {
            firstName: post.capper.user.firstName,
            lastName: post.capper.user.lastName,
            username: post.capper.user.username,
            imageUrl: post.capper.user.imageUrl,
          },
        };

        return NextResponse.json(
          { success: true, post: transformedPost },
          { status: 201 }
        );
      } catch (error) {
        console.error("Stripe product verification error:", error);
        return NextResponse.json(
          { error: "Failed to verify product ownership" },
          { status: 400 }
        );
      }
    }
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
