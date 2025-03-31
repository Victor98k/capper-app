import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  try {
    const headersList = headers();
    const userId = (await headersList).get("userId");

    // Fetch subscriptions and posts in parallel
    const [subscriptionsRes, postsRes] = await Promise.all([
      fetch(`${process.env.API_URL}/api/subscriptions/user`, {
        headers: { userId: userId || "" },
      }),
      fetch(`${process.env.API_URL}/api/posts`),
    ]);

    const [{ subscriptions }, posts] = await Promise.all([
      subscriptionsRes.json(),
      postsRes.json(),
    ]);

    const subscribedCapperIds = subscriptions.map((sub: any) => sub.capperId);
    const filteredPosts = posts.filter((post: any) =>
      subscribedCapperIds.includes(post.capperId)
    );

    return NextResponse.json({
      posts: filteredPosts,
      subscriptions,
    });
  } catch (error) {
    console.error("Error in feed route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
