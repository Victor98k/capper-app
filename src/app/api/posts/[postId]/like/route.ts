import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Authentication checks
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
    const payload = await verifyJWT(token);

    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get the current like count
    const post = await prisma.capperPost.findUnique({
      where: { id: (await params).postId },
      include: {
        likedBy: {
          where: {
            userId: payload.userId,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user already liked the post
    if (post.likedBy.length > 0) {
      return NextResponse.json({ error: "Already liked" }, { status: 400 });
    }

    // Create PostLike record and update like count
    const [postLike, updatedPost] = await prisma.$transaction([
      prisma.postLike.create({
        data: {
          userId: payload.userId,
          postId: params.postId,
        },
      }),
      prisma.capperPost.update({
        where: { id: params.postId },
        data: {
          likes: post.likes + 1,
        },
      }),
    ]);

    return NextResponse.json({
      likes: updatedPost.likes,
      isLiked: true,
    });
  } catch (error) {
    console.error("Error handling like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { postId: string } }
) {
  try {
    // Authentication checks (same as POST)
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
    const payload = await verifyJWT(token);

    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get the current like count
    const post = await prisma.capperPost.findUnique({
      where: { id: params.postId },
      include: {
        likedBy: {
          where: {
            userId: payload.userId,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user has liked the post
    if (post.likedBy.length === 0) {
      return NextResponse.json({ error: "Not liked yet" }, { status: 400 });
    }

    // Remove PostLike record and update like count
    const [deletedLike, updatedPost] = await prisma.$transaction([
      prisma.postLike.deleteMany({
        where: {
          userId: payload.userId,
          postId: params.postId,
        },
      }),
      prisma.capperPost.update({
        where: { id: params.postId },
        data: {
          likes: Math.max(0, post.likes - 1),
        },
      }),
    ]);

    return NextResponse.json({
      likes: updatedPost.likes,
      isLiked: false,
    });
  } catch (error) {
    console.error("Error handling unlike:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add a new GET endpoint to check if user has liked the post
export async function GET(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // ... authentication checks ...
    const cookies = req.headers.get("cookie");
    if (!cookies) {
      return NextResponse.json({ isLiked: false });
    }

    const cookiesArray = cookies.split(";").map((cookie) => cookie.trim());
    const tokenCookie = cookiesArray.find((cookie) =>
      cookie.startsWith("token=")
    );

    if (!tokenCookie) {
      return NextResponse.json({ isLiked: false });
    }

    const token = tokenCookie.split("=")[1];
    const payload = await verifyJWT(token);

    if (!payload?.userId) {
      return NextResponse.json({ isLiked: false });
    }

    // Get both the post and like status
    const post = await prisma.capperPost.findUnique({
      where: { id: (await params).postId },
      include: {
        likedBy: {
          where: {
            userId: payload.userId,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      isLiked: post.likedBy.length > 0,
      likes: post.likes,
    });
  } catch (error) {
    console.error("Error checking like status:", error);
    return NextResponse.json({ isLiked: false });
  }
}
