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
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid JWT payload");
  }

  // Ensure payload is a plain object (MongoDB ObjectId needs to be converted to string)
  const sanitizedPayload = {
    ...payload,
    userId: payload.userId.toString(), // Ensure userId is a string
  };

  return await new Jose.SignJWT(sanitizedPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(encodedSecret);
}

// Function to verify the JWT. The function takes in tolen: string as a parameter.
// Then the function promise to return a JWTUserPayload or null.
//
export async function verifyJWT(token: string): Promise<JWTUserPayload | null> {
  try {
    // We define the payload as an object.
    // We try to verify the token with jose. So the function expects token to be a string, we use the encodedSecret thats the token.

    const { payload } = await Jose.jwtVerify(token, encodedSecret);

    // We return the payload as a JWTUserPayload.
    return payload as JWTUserPayload;
  } catch (e) {
    console.error("JWT verification failed");
    return null;
  }
}
