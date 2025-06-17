import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";

export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const betId = url.pathname.split("/").pop(); // or use regex to extract [betId]
    const { status } = await req.json();

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user?.isSuperUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedBet = await prisma.bet.update({
      where: { id: betId },
      data: { status },
    });

    // Fetch all bets for the user
    const userBets = await prisma.bet.findMany({
      where: { userId: updatedBet.userId },
    });

    // Calculate total bets and won bets
    const totalBets = userBets.length;
    const wonBets = userBets.filter((bet) => bet.status === "WON").length;

    // Calculate winrate
    const winrate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;

    // Calculate total units bet and won
    const totalUnitsBet = userBets.reduce(
      (sum, bet) => sum + (bet.units || 0),
      0
    );
    const totalUnitsWon = userBets
      .filter((bet) => bet.status === "WON")
      .reduce((sum, bet) => sum + (bet.units || 0), 0);

    // Calculate roi
    const roi = totalUnitsBet > 0 ? (totalUnitsWon / totalUnitsBet) * 100 : 0;

    // Update user and capper with new winrate and roi
    await prisma.user.update({
      where: { id: updatedBet.userId },
      data: { winrate, roi },
    });

    // Fetch all bets for the capper
    const capperBets = await prisma.bet.findMany({
      where: { userId: updatedBet.userId },
    });

    // Calculate total bets and won bets for the capper
    const totalCapperBets = capperBets.length;
    const wonCapperBets = capperBets.filter(
      (bet) => bet.status === "WON"
    ).length;

    // Calculate winrate for the capper
    const capperWinrate =
      totalCapperBets > 0 ? (wonCapperBets / totalCapperBets) * 100 : 0;

    // Calculate total units bet and won for the capper
    const totalCapperUnitsBet = capperBets.reduce(
      (sum, bet) => sum + (bet.units || 0),
      0
    );
    const totalCapperUnitsWon = capperBets
      .filter((bet) => bet.status === "WON")
      .reduce((sum, bet) => sum + (bet.units || 0), 0);

    // Calculate roi for the capper
    const capperRoi =
      totalCapperUnitsBet > 0
        ? (totalCapperUnitsWon / totalCapperUnitsBet) * 100
        : 0;

    // Update capper with new winrate and roi
    await prisma.capper.update({
      where: { userId: updatedBet.userId },
      data: { winrate: capperWinrate, roi: capperRoi },
    });

    return NextResponse.json(updatedBet);
  } catch (error) {
    console.error("Error updating bet:", error);
    return NextResponse.json(
      { error: "Failed to update bet" },
      { status: 500 }
    );
  }
}
