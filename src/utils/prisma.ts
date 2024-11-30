import { PrismaClient, User } from "@prisma/client";

export async function userExists(
  email: string,
  client: PrismaClient
): Promise<User | null> {
  const user = await client.user.findFirst({
    where: {
      email,
    },
  });

  return user;
}
