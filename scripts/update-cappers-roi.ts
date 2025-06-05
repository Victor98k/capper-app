const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

type Capper = {
  id: string;
  roi: number | null;
};

async function updateCappersRoi() {
  try {
    // First, let's check all cappers and their current ROI values
    const allCappers = await prisma.capper.findMany();

    console.log("Current cappers and their ROI values:");
    for (const capper of allCappers) {
      console.log(`Capper ID ${capper.id}: ROI = ${capper.roi}`);
    }

    // Update all cappers that don't have an ROI set
    const result = await prisma.capper.updateMany({
      where: {
        roi: null,
      },
      data: {
        roi: 0,
      },
    });

    console.log(`\nUpdated ${result.count} cappers with default ROI`);

    // Verify the updates
    const updatedCappers = await prisma.capper.findMany();
    console.log("\nVerifying updated ROI values:");
    for (const capper of updatedCappers) {
      console.log(`Capper ID ${capper.id}: ROI = ${capper.roi}`);
    }

    // If some cappers still have null ROI, try updating them individually
    const stillNullCappers = updatedCappers.filter(
      (capper: Capper) => capper.roi === null
    );
    if (stillNullCappers.length > 0) {
      console.log("\nAttempting to update remaining null ROIs individually...");
      for (const capper of stillNullCappers) {
        await prisma.capper.update({
          where: { id: capper.id },
          data: { roi: 0 },
        });
      }

      // Final verification
      const finalCappers = await prisma.capper.findMany();
      console.log("\nFinal ROI values:");
      for (const capper of finalCappers) {
        console.log(`Capper ID ${capper.id}: ROI = ${capper.roi}`);
      }
    }
  } catch (error) {
    console.error("Error updating cappers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCappersRoi()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
