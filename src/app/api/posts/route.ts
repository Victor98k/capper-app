import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import Stripe from "stripe";
import { BetStatus } from "@prisma/client";

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
  bookmaker: z.string().min(1, "Bookmaker is required"),
  productId: z.string().optional(),
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
      select: {
        id: true,
        title: true,
        content: true,
        previewText: true,
        imageUrl: true,
        odds: true,
        bets: true,
        tags: true,
        bookmaker: true,
        capperId: true,
        productId: true, // Keep this to see actual values
        template: true, // Include template
        createdAt: true,
        updatedAt: true,
        likes: true,
        comments: true,
        capper: {
          select: {
            profileImage: true,
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
      posts.map(async (post: any) => {
        let productName = "";
        // Only try to fetch product info if productId exists and template isn't text-only
        if (post.productId) {
          try {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
              apiVersion: "2025-02-24.acacia",
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
          previewText: post.previewText,
          imageUrl: post.imageUrl || "",
          odds: post.odds,
          bets: post.bets,
          tags: post.tags || [],
          bookmaker: post.bookmaker,
          capperId: post.capperId,
          productId: post.productId || "", // Use actual productId if exists
          productName,
          template: post.template || "default",
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
    const {
      title,
      content,
      previewText,
      tags,
      bets,
      odds,
      units,
      bookmaker,
      username,
      productId,
      template,
      imageUrl,
      productName,
      betDate,
      oddsScreenshot,
    } = await req.json();

    // First, find the capper by username
    const capperProfile = await prisma.capper.findFirst({
      where: {
        user: {
          username: username,
        },
      },
    });

    if (!capperProfile) {
      return NextResponse.json(
        { error: "Capper profile not found" },
        { status: 404 }
      );
    }

    // Create the post with the capper connection
    const post = await prisma.capperPost.create({
      data: {
        title,
        content,
        previewText: previewText || null,
        imageUrl: imageUrl || null,
        tags,
        bets,
        odds,
        bookmaker,
        template: template || "standard",
        productId,
        units: parseFloat(units) || 0,
        capper: {
          connect: {
            id: capperProfile.id,
          },
        },
        productName,
      },
      include: {
        capper: {
          include: {
            user: true,
          },
        },
      },
    });

    // Add bet creation if odds are provided
    if (odds.length > 0) {
      // Create a bet record linked to the post
      await prisma.bet.create({
        data: {
          game: title,
          odds: parseFloat(odds[0]), // Using first odd as main odd
          date: betDate ? new Date(betDate) : new Date(),
          status: "PENDING" as BetStatus,
          units: parseFloat(units) || 1,
          user: {
            connect: {
              username: username,
            },
          },
          post: {
            connect: {
              id: post.id,
            },
          },
          oddsScreenshot: oddsScreenshot || null,
          oddsDate: betDate ? new Date(betDate) : new Date(),
        },
      });
    }

    // Transform the response to match your expected format
    const transformedPost = {
      _id: post.id,
      title: post.title,
      content: post.content,
      previewText: post.previewText,
      imageUrl: post.imageUrl || "",
      odds: post.odds,
      bets: post.bets,
      tags: post.tags,
      bookmaker: post.bookmaker,
      capperId: post.capper.id,
      productId: post.productId,
      template: post.template,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      capperInfo: {
        firstName: post.capper.user.firstName,
        lastName: post.capper.user.lastName,
        username: post.capper.user.username,
        profileImage: post.capper.profileImage,
      },
    };

    return NextResponse.json(transformedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post and bet" },
      { status: 500 }
    );
  }
}
