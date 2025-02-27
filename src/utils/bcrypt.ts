// bcrypt is a password hashing library that helps securely hash passwords
// It uses the Blowfish cipher and includes a salt to protect against rainbow table attacks
import bcrypt from "bcrypt";

// hashPassword: Takes a plain text password and returns a hashed version
// The '10' parameter is the salt rounds - higher numbers mean more secure but slower hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// comparePassword: Safely compares a plain text password with a hashed password
// Returns true if they match, false otherwise
// This function is timing-attack safe
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
