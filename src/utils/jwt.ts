import * as Jose from "jose";
//Jose is a package for handelning JWT tokens.

// Why is the type any?
export type JWTUserPayload = {
  userId: string;
  [key: string]: any; // index signature, allows the object to have any additional properties with string keys.
  // Använts
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
    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid JWT payload");
    }

    // Ensure payload is a plain object
    const sanitizedPayload = {
      ...payload,
      userId: payload.userId.toString(), // Ensure userId is a string
    };

    console.log("Signing JWT with payload:", sanitizedPayload); // Debug line

    return await new Jose.SignJWT(sanitizedPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
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
  try {
    console.log("Verifying token:", token);

    if (!token) {
      console.error("No token provided");
      return null;
    }

    const { payload } = await Jose.jwtVerify(token, encodedSecret);

    // Add validation for the payload
    if (!payload || typeof payload.userId !== "string") {
      console.error("Invalid payload structure:", payload);
      return null;
    }

    return {
      userId: payload.userId,
      ...payload,
    } as JWTUserPayload;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}
