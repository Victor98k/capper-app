import * as Jose from "jose";
//Jose is a package for handelning JWT tokens.

// Type definition for JWT payload containing user information
export type JWTUserPayload = {
  userId: string;
  iat?: number; // Issued at timestamp
  exp?: number; // Expiration timestamp
  // Add specific allowed fields instead of [key: string]: any
};

// Verify JWT secret exists in environment variables
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error("JWT_SECRET environment variable is not set");
}

// Convert JWT secret to proper format for Jose library
const encodedSecret = new TextEncoder().encode(secret);

// Sign JWT: Creates a new JWT token with user payload
// Includes security features like expiration time, issuer, and not-before claims
export async function signJWT(payload: JWTUserPayload): Promise<string> {
  try {
    if (!payload?.userId) {
      throw new Error("Invalid payload: userId is required");
    }

    return await new Jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" }) // Use HMAC-SHA256 algorithm
      .setIssuedAt() // Set current timestamp
      .setExpirationTime("1d") // Token expires in 1 day
      .setNotBefore(0) // Token valid immediately
      .setIssuer("Cappersports.co") // Application identifier
      .sign(encodedSecret);
  } catch (error) {
    console.error("Error signing JWT:", error);
    throw error;
  }
}

// Verify JWT: Validates and decodes a JWT token
// Returns the payload if valid, null if invalid or expired
export async function verifyJWT(token: string): Promise<JWTUserPayload | null> {
  if (!token) {
    console.warn("No token provided to verifyJWT");
    return null;
  }

  try {
    // Verify token signature and decode payload
    const { payload } = await Jose.jwtVerify(token, encodedSecret);

    if (!payload || typeof payload !== "object") {
      console.warn("Invalid JWT payload structure");
      return null;
    }

    // Ensure payload contains required userId field
    if (!("userId" in payload)) {
      console.warn("JWT payload missing userId");
      return null;
    }

    return {
      userId: String(payload.userId),
      ...payload,
    } as JWTUserPayload;
  } catch (error) {
    // Safe error logging without exposing sensitive details
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("JWT verification error:", errorMessage);
    return null;
  }
}
