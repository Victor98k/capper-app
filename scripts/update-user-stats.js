const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updateUserStats() {
  try {
    const userId = "68444727172516c8dded1d61";

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        roi: 195.21,
        winrate: 66.7,
      },
    });

    console.log("User updated successfully:", {
      id: updatedUser.id,
      username: updatedUser.username,
      roi: updatedUser.roi,
      winrate: updatedUser.winrate,
    });
  } catch (error) {
    console.error("Error updating user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserStats();
