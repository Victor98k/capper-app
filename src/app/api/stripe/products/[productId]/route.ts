// import { NextResponse } from "next/server";
// import { stripe } from "@/lib/stripe";
// import { verifyJWT } from "@/utils/jwt";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// export async function GET(
//   request: Request,
//   context: { params: { productId: string } }
// ) {
//   try {
//     const { productId } = context.params;
//     console.log("Fetching product:", productId);

//     const token = request.headers.get("authorization")?.split(" ")[1];
//     if (!token) {
//       return NextResponse.json({ error: "No token provided" }, { status: 401 });
//     }

//     const payload = await verifyJWT(token);
//     if (!payload || !payload.userId) {
//       return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//     }

//     // Get the user's Stripe Connect ID
//     const user = await prisma.user.findUnique({
//       where: { id: payload.userId },
//       select: { stripeConnectId: true },
//     });

//     if (!user?.stripeConnectId) {
//       return NextResponse.json(
//         { error: "No Stripe account found" },
//         { status: 404 }
//       );
//     }

//     try {
//       // Specify the Stripe account when retrieving the product
//       const product = await stripe.products.retrieve(productId, {
//         stripeAccount: user.stripeConnectId,
//       });
//       console.log("Found product:", product.id);

//       // Also specify the account for price retrieval
//       const price = await stripe.prices.retrieve(
//         product.default_price as string,
//         {
//           stripeAccount: user.stripeConnectId,
//         }
//       );
//       console.log("Found price:", price.id);

//       if (!price.unit_amount || !price.currency) {
//         return NextResponse.json(
//           { error: "Invalid price data" },
//           { status: 400 }
//         );
//       }

//       return NextResponse.json({
//         id: product.id,
//         name: product.name,
//         description: product.description,
//         default_price: price.id,
//         unit_amount: price.unit_amount,
//         currency: price.currency,
//       });
//     } catch (stripeError: any) {
//       console.error("Stripe error details:", {
//         code: stripeError.code,
//         message: stripeError.message,
//         requestId: stripeError.requestId,
//       });
//       if (stripeError.code === "resource_missing") {
//         return NextResponse.json(
//           { error: "Product not found" },
//           { status: 404 }
//         );
//       }
//       throw stripeError;
//     }
//   } catch (error) {
//     console.error("Failed to fetch product:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch product" },
//       { status: 500 }
//     );
//   }
// }
