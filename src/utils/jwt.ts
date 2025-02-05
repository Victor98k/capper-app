import * as Jose from "jose";
//Jose is a package for handelning JWT tokens.

// Why is the type any?
export type JWTUserPayload = {
  userId: string;
  iat?: number;
  exp?: number;
  // Add specific allowed fields instead of [key: string]: any
};

// Ifall inte JWT Secret finns så kastar vi ett error.
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error("JWT_SECRET environment variable is not set");
}

// using the Encoded nodelibary to encode the secret before passing it on to the .SIGN
const encodedSecret = new TextEncoder().encode(secret);

// SIGN function that uses the JWTUserPayload and promises a return of the string thats the payload..
// Then we return the new payload thats signed thorigh JOSE.
export async function signJWT(payload: JWTUserPayload): Promise<string> {
  try {
    if (!payload?.userId) {
      throw new Error("Invalid payload: userId is required");
    }

    return await new Jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .setNotBefore(0) // Add not-before claim
      .setIssuer("your-app-name") // Add issuer
      .sign(encodedSecret);
  } catch (error) {
    console.error("Error signing JWT:", error);
    throw error;
  }
}

// Function to verify the JWT. The function takes in tolen: string as a parameter.
// Then the function promise to return a JWTUserPayload or null.
//
export async function verifyJWT(token: string): Promise<JWTUserPayload | null> {
  if (!token) {
    console.warn("No token provided to verifyJWT");
    return null;
  }

  try {
    const { payload } = await Jose.jwtVerify(token, encodedSecret);

    if (!payload || typeof payload !== "object") {
      console.warn("Invalid JWT payload structure");
      return null;
    }

    // Ensure the payload has the required structure
    if (!("userId" in payload)) {
      console.warn("JWT payload missing userId");
      return null;
    }

    return {
      userId: String(payload.userId),
      ...payload,
    } as JWTUserPayload;
  } catch (error) {
    // Safe error logging
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("JWT verification error:", errorMessage);
    return null;
  }
}
