"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { SideNav } from "@/components/SideNav";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Currency = "USD" | "EUR" | "SEK" | "NOK";

interface Bet {
  id: string;
  game: string;
  amount: number;
  currency: Currency;
  odds: number;
  date: string;
  status: "PENDING" | "WON" | "LOST";
  createdAt: string;
  updatedAt: string;
}

export default function MyBets() {
  const { user } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const betsPerPage = 5;
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("USD");
  const [newBet, setNewBet] = useState({
    game: "",
    amount: "",
    currency: "USD" as Currency,
    odds: "",
    date: "",
  });

  useEffect(() => {
    fetchBets();
  }, []);

  const fetchBets = async () => {
    try {
      const response = await axios.get("/api/bets");
      setBets(response.data);
    } catch (error) {
      console.error("Failed to fetch bets:", error);
      toast.error("Failed to load bets");
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (currency: Currency) => {
    switch (currency) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "SEK":
        return "kr";
      case "NOK":
        return "kr";
      default:
        return "$";
    }
  };

  const addBet = async () => {
    try {
      const response = await axios.post("/api/bets", {
        game: newBet.game,
        amount: parseFloat(newBet.amount),
        currency: newBet.currency,
        odds: parseFloat(newBet.odds),
        date: newBet.date,
      });

      setBets([response.data, ...bets]);
      setNewBet({ game: "", amount: "", currency: "USD", odds: "", date: "" });
      toast.success("Bet added successfully");
    } catch (error) {
      console.error("Failed to add bet:", error);
      toast.error("Failed to add bet");
    }
  };

  const updateBetStatus = async (id: string, status: "WON" | "LOST") => {
    try {
      const response = await axios.patch(`/api/bets/${id}`, { status });
      setBets(bets.map((bet) => (bet.id === id ? response.data : bet)));
      toast.success("Bet status updated");
    } catch (error) {
      console.error("Failed to update bet:", error);
      toast.error("Failed to update bet status");
    }
  };

  // Calculate statistics for the win/loss chart
  const wonBets = bets.filter((bet) => bet.status === "WON").length;
  const lostBets = bets.filter((bet) => bet.status === "LOST").length;
  const winLossData = [
    { name: "Won", value: wonBets },
    { name: "Lost", value: lostBets },
  ];

  // Calculate financial statistics
  const financialStats = bets.reduce(
    (acc, bet) => {
      const potentialProfit = bet.amount * bet.odds - bet.amount;

      if (bet.status === "WON") {
        acc.profit += potentialProfit;
      } else if (bet.status === "LOST") {
        acc.losses += bet.amount;
      }
      return acc;
    },
    { profit: 0, losses: 0 }
  );

  const profitLossData = [
    { name: "Profit", value: Math.max(0, financialStats.profit) },
    { name: "Losses", value: Math.abs(financialStats.losses) },
  ];

  const WIN_LOSS_COLORS = ["#4e43ff", "#ef4444"];
  const PROFIT_LOSS_COLORS = ["#22c55e", "#ef4444"];

  // Calculate pagination
  const indexOfLastBet = currentPage * betsPerPage;
  const indexOfFirstBet = indexOfLastBet - betsPerPage;
  const currentBets = bets.slice(indexOfFirstBet, indexOfLastBet);
  const totalPages = Math.ceil(bets.length / betsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Add this new function to prepare data for line chart
  const prepareLineChartData = () => {
    const sortedBets = [...bets]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .filter((bet) => bet.status !== "PENDING");

    let runningBalance = 0;
    return sortedBets.map((bet) => {
      if (bet.status === "WON") {
        runningBalance += bet.amount * bet.odds - bet.amount;
      } else {
        runningBalance -= bet.amount;
      }
      return {
        date: new Date(bet.date).toLocaleDateString(),
        balance: runningBalance,
      };
    });
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* SideNav */}
      <SideNav />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-12 px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">My Bets</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white">
                  Add New Bet
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-gray-100 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">
                    Add New Bet
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="game" className="text-gray-200">
                      Game
                    </Label>
                    <Input
                      id="game"
                      value={newBet.game}
                      onChange={(e) =>
                        setNewBet({ ...newBet, game: e.target.value })
                      }
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount" className="text-gray-200">
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newBet.amount}
                      onChange={(e) =>
                        setNewBet({ ...newBet, amount: e.target.value })
                      }
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="currency" className="text-gray-200">
                      Currency
                    </Label>
                    <select
                      id="currency"
                      value={newBet.currency}
                      onChange={(e) =>
                        setNewBet({
                          ...newBet,
                          currency: e.target.value as Currency,
                        })
                      }
                      className="bg-gray-800 border-gray-700 text-white rounded-md p-2"
                    >
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="SEK">SEK (kr) - Swedish Krona</option>
                      <option value="NOK">NOK (kr) - Norwegian Krone</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="odds" className="text-gray-200">
                      Odds
                    </Label>
                    <Input
                      id="odds"
                      type="number"
                      step="0.01"
                      value={newBet.odds}
                      onChange={(e) =>
                        setNewBet({ ...newBet, odds: e.target.value })
                      }
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date" className="text-gray-200">
                      Game Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={newBet.date}
                      onChange={(e) =>
                        setNewBet({ ...newBet, date: e.target.value })
                      }
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <Button
                    onClick={addBet}
                    className="bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white"
                  >
                    Add Bet
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-white">
                Active Bets
              </h2>
              <div className="space-y-4">
                {currentBets.map((bet) => (
                  <Card
                    key={bet.id}
                    className="bg-gray-800/30 border-gray-700 p-4 backdrop-blur-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">{bet.game}</h3>
                        <p className="text-sm text-gray-400">
                          Amount: {getCurrencySymbol(bet.currency)}
                          {bet.amount} | Odds: {bet.odds} |{" "}
                          {new Date(bet.date).toLocaleDateString()}
                        </p>
                      </div>
                      {bet.status === "PENDING" && (
                        <div className="space-x-2">
                          <Button
                            size="sm"
                            className="bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white"
                            onClick={() => updateBetStatus(bet.id, "WON")}
                          >
                            Won
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500/80 hover:bg-red-600 text-white"
                            onClick={() => updateBetStatus(bet.id, "LOST")}
                          >
                            Lost
                          </Button>
                        </div>
                      )}
                      {bet.status !== "PENDING" && (
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            bet.status === "WON"
                              ? "bg-[#4e43ff]/20 text-[#4e43ff]"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {bet.status.charAt(0).toUpperCase() +
                            bet.status.slice(1)}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}

                {/* Pagination Controls */}
                {bets.length > betsPerPage && (
                  <div className="flex justify-center items-center mt-6 space-x-4">
                    <Button
                      variant="outline"
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="bg-gray-800/30 border-gray-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-white">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="bg-gray-800/30 border-gray-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4 text-white">
                Statistics
              </h2>
              <div className="grid gap-4">
                {/* Line Chart Card */}
                <Card className="bg-gray-800/30 border-gray-700 p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-medium text-white mb-4">
                    Performance Over Time
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart
                      data={prepareLineChartData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        style={{ fontSize: "12px" }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        style={{ fontSize: "12px" }}
                        label={{
                          value: `Balance (${getCurrencySymbol(selectedCurrency)})`,
                          angle: -90,
                          position: "insideLeft",
                          style: { fill: "#9CA3AF" },
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "6px",
                        }}
                        labelStyle={{ color: "#9CA3AF" }}
                        itemStyle={{ color: "#4e43ff" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="balance"
                        stroke="#4e43ff"
                        strokeWidth={2}
                        dot={{ fill: "#4e43ff", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                {/* Grid for Pie Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Win/Loss Ratio Card */}
                  <Card className="bg-gray-800/30 border-gray-700 p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-medium text-white mb-4">
                      Win/Loss Ratio
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={winLossData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {winLossData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                WIN_LOSS_COLORS[index % WIN_LOSS_COLORS.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Profit/Loss Overview Card */}
                  <Card className="bg-gray-800/30 border-gray-700 p-6 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-white">
                        Profit/Loss Overview
                      </h3>
                      <div className="text-sm text-gray-400">
                        Net:
                        <span
                          className={
                            financialStats.profit - financialStats.losses > 0
                              ? "text-green-500 ml-2"
                              : "text-red-500 ml-2"
                          }
                        >
                          {getCurrencySymbol(selectedCurrency)}
                          {(
                            financialStats.profit - financialStats.losses
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={profitLossData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) =>
                            `${name}: ${getCurrencySymbol(selectedCurrency)}${value.toFixed(2)}`
                          }
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {profitLossData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                PROFIT_LOSS_COLORS[
                                  index % PROFIT_LOSS_COLORS.length
                                ]
                              }
                            />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
