import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";

// Helper to extract postId from the URL
function getPostIdFromUrl(req: Request): string | null {
  const url = new URL(req.url);
  // /api/posts/[postId]/comments
  const parts = url.pathname.split("/");
  // Find the index of 'posts' and get the next part as postId
  const postsIdx = parts.findIndex((p) => p === "posts");
  if (postsIdx !== -1 && parts.length > postsIdx + 1) {
    return parts[postsIdx + 1];
  }
  return null;
}

// GET: Fetch all comments for a post
export async function GET(req: Request) {
  try {
    const postId = getPostIdFromUrl(req);
    if (!postId)
      return NextResponse.json({ error: "No postId" }, { status: 400 });
    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST: Add a comment to a post
export async function POST(req: Request) {
  try {
    const postId = getPostIdFromUrl(req);
    if (!postId)
      return NextResponse.json({ error: "No postId" }, { status: 400 });
    const cookies = req.headers.get("cookie");
    const cookiesArray =
      cookies?.split(";").map((cookie) => cookie.trim()) || [];
    const tokenCookie = cookiesArray.find((cookie) =>
      cookie.startsWith("token=")
    );
    const token = tokenCookie?.split("=")[1];
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyJWT(token);
    if (!payload?.userId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    const { content } = await req.json();
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId: payload.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a comment (by commentId in body, only by owner or admin)
export async function DELETE(req: Request) {
  try {
    const postId = getPostIdFromUrl(req);
    if (!postId)
      return NextResponse.json({ error: "No postId" }, { status: 400 });
    const cookies = req.headers.get("cookie");
    const cookiesArray =
      cookies?.split(";").map((cookie) => cookie.trim()) || [];
    const tokenCookie = cookiesArray.find((cookie) =>
      cookie.startsWith("token=")
    );
    const token = tokenCookie?.split("=")[1];
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyJWT(token);
    if (!payload?.userId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    const { commentId } = await req.json();
    if (!commentId)
      return NextResponse.json(
        { error: "Comment ID required" },
        { status: 400 }
      );
    // Fetch comment to check ownership
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment)
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    // Only allow owner or superuser
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (comment.userId !== payload.userId && !user?.isSuperUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
