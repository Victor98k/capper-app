import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "./jwt";
// Define the methods thats not safe to us.
const UNSAFE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
// Define the routes thats not safe to us.
const UNSAFE_REQUESTS = ["/api/users/me"];

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);

  // console.log("middleware called", url.pathname);

  if (
    // Built in custom code from JS, request.method and url.pathname. SIDENOTE: I thought is was e built in NEXT method.
    UNSAFE_METHODS.includes(request.method) ||
    UNSAFE_REQUESTS.includes(url.pathname)
  ) {
    try {
      console.log("Unsafe");
      // If theese unsafe part are true we check for the auth header.
      const Authorization = request.headers.get("Authorization");

      if (!Authorization) {
        // If there is no auth header we throw an error.
        throw new Error("No authrization header");
      }
      // We split the auth header to get the token.
      // Split the token to acess the Bearer correctly.
      const token = Authorization.split(" ")?.[1] || null;
      if (!token) {
        throw new Error("No token");
      }
      // console.log("Authorization -> token", token);
      // We verify the token.
      const decryptedToken = await verifyJWT(token);
      if (!decryptedToken) {
        throw new Error("No token payload");
      }
      console.log("Authorization -> decrypted", decryptedToken);

      const headers = new Headers(request.headers);
      headers.set("userId", decryptedToken.userId);
      return NextResponse.next({
        headers,
      });
    } catch (error: any) {
      console.log("Error validating token: ", error.message);
      return NextResponse.json(
        {
          message: "Unauthenticated",
        },
        { status: 401 }
      );
    }
  }
  console.log("Safe");
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/authors/", "/api/authors/:id*", "/api/users/me"],
};
