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
  const [formErrors, setFormErrors] = useState({
    game: "",
    amount: "",
    odds: "",
    date: "",
  });
  const [addingBet, setAddingBet] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchBets();
  }, []);

  const fetchBets = async () => {
    try {
      const response = await axios.get("/api/normalUserBets");
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

  const validateForm = () => {
    const errors: any = {};
    if (!newBet.game) errors.game = "Game is required.";
    if (
      !newBet.amount ||
      isNaN(Number(newBet.amount)) ||
      Number(newBet.amount) <= 0
    )
      errors.amount = "Enter a valid amount.";
    if (!newBet.odds || isNaN(Number(newBet.odds)) || Number(newBet.odds) <= 1)
      errors.odds = "Odds must be greater than 1.";
    if (!newBet.date) errors.date = "Date is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addBet = async () => {
    if (!validateForm()) return;
    setAddingBet(true);
    try {
      const response = await axios.post("/api/normalUserBets", {
        game: newBet.game,
        amount: newBet.amount,
        currency: newBet.currency,
        odds: newBet.odds,
        date: newBet.date,
      });
      setBets([response.data, ...bets]);
      setNewBet({ game: "", amount: "", currency: "USD", odds: "", date: "" });
      setFormErrors({ game: "", amount: "", odds: "", date: "" });
      toast.success("Bet added successfully", {
        description: `Game: ${response.data.game}`,
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to add bet:", error);
      toast.error("Failed to add bet");
    } finally {
      setAddingBet(false);
    }
  };

  const updateBetStatus = async (id: string, status: "WON" | "LOST") => {
    try {
      const response = await axios.patch(`/api/normalUserBets/${id}`, {
        status,
      });
      setBets(bets.map((bet) => (bet.id === id ? response.data : bet)));
      toast.success(`Bet marked as ${status === "WON" ? "Won" : "Lost"}`);
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

  // Calculate pagination for corrected bets
  const correctedBets = bets.filter((bet) => bet.status !== "PENDING");
  const correctedBetsPerPage = 7;
  const [correctedCurrentPage, setCorrectedCurrentPage] = useState(1);
  const correctedIndexOfLastBet = correctedCurrentPage * correctedBetsPerPage;
  const correctedIndexOfFirstBet =
    correctedIndexOfLastBet - correctedBetsPerPage;
  const currentCorrectedBets = correctedBets.slice(
    correctedIndexOfFirstBet,
    correctedIndexOfLastBet
  );
  const correctedTotalPages = Math.ceil(
    correctedBets.length / correctedBetsPerPage
  );

  const nextCorrectedPage = () => {
    if (correctedCurrentPage < correctedTotalPages) {
      setCorrectedCurrentPage(correctedCurrentPage + 1);
    }
  };

  const prevCorrectedPage = () => {
    if (correctedCurrentPage > 1) {
      setCorrectedCurrentPage(correctedCurrentPage - 1);
    }
  };

  // Only show pending bets in Active Bets
  const activeBets = currentBets.filter((bet) => bet.status === "PENDING");

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100 flex flex-col">
      {/* Mobile Top Nav */}
      <div className="lg:hidden sticky top-0 z-50 w-full bg-[#020817] p-4 flex items-center">
        <div className="absolute left-4">
          <SideNav />
        </div>
        <div className="flex-1 text-right pr-4">
          <h2 className="text-xl font-semibold">My Bets</h2>
        </div>
      </div>
      <div className="flex flex-1 h-full">
        {/* Desktop SideNav */}
        <div className="hidden lg:block">
          <SideNav />
        </div>
        {/* Main Content: full width on mobile */}
        <main className="flex-1 w-full overflow-y-auto flex justify-center">
          <div className="container mx-auto py-12 px-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold text-white">My Bets</h1>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    Add New Bet
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 text-gray-100 border-gray-800 rounded-2xl shadow-2xl p-8 max-w-lg mx-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-extrabold tracking-tight text-white mb-2">
                      Add New Bet
                    </DialogTitle>
                    <div className="border-b border-gray-700 mb-4" />
                  </DialogHeader>
                  <form
                    className="mt-2 md:grid md:grid-cols-2 md:gap-6 bg-gray-800/60 rounded-xl p-6 shadow-lg"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await addBet();
                    }}
                  >
                    <div className="flex flex-col gap-2 mb-6">
                      <Label
                        htmlFor="game"
                        className="font-bold text-base text-white mb-1"
                      >
                        Game
                      </Label>
                      <Input
                        id="game"
                        className="bg-gray-900 border-gray-700 focus:ring-2 focus:ring-[#4e43ff] focus:border-[#4e43ff] text-white placeholder-gray-500 rounded-lg px-3 py-2 transition-all"
                        value={newBet.game}
                        onChange={(e) =>
                          setNewBet({ ...newBet, game: e.target.value })
                        }
                        required
                        aria-invalid={!!formErrors.game}
                        placeholder="e.g. Lakers vs Celtics"
                      />
                      <span className="text-xs text-red-400 min-h-[18px] mt-1">
                        {formErrors.game}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 mb-6">
                      <Label
                        htmlFor="amount"
                        className="font-bold text-base text-white mb-1"
                      >
                        Amount
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        className="bg-gray-900 border-gray-700 focus:ring-2 focus:ring-[#4e43ff] focus:border-[#4e43ff] text-white placeholder-gray-500 rounded-lg px-3 py-2 transition-all"
                        value={newBet.amount}
                        onChange={(e) =>
                          setNewBet({ ...newBet, amount: e.target.value })
                        }
                        required
                        aria-invalid={!!formErrors.amount}
                        placeholder="Enter amount"
                      />
                      <span className="text-xs text-gray-400 mt-1">
                        Enter the stake amount.
                      </span>
                      <span className="text-xs text-red-400 min-h-[18px]">
                        {formErrors.amount}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 mb-6">
                      <Label
                        htmlFor="currency"
                        className="font-bold text-base text-white mb-1"
                      >
                        Currency
                      </Label>
                      <select
                        id="currency"
                        className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4e43ff] focus:border-[#4e43ff] transition-all"
                        value={newBet.currency}
                        onChange={(e) =>
                          setNewBet({
                            ...newBet,
                            currency: e.target.value as Currency,
                          })
                        }
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="SEK">SEK</option>
                        <option value="NOK">NOK</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2 mb-6">
                      <Label
                        htmlFor="odds"
                        className="font-bold text-base text-white mb-1"
                      >
                        Odds
                      </Label>
                      <Input
                        id="odds"
                        type="number"
                        step="0.01"
                        className="bg-gray-900 border-gray-700 focus:ring-2 focus:ring-[#4e43ff] focus:border-[#4e43ff] text-white placeholder-gray-500 rounded-lg px-3 py-2 transition-all"
                        value={newBet.odds}
                        onChange={(e) =>
                          setNewBet({ ...newBet, odds: e.target.value })
                        }
                        required
                        aria-invalid={!!formErrors.odds}
                        placeholder="e.g. 2.5"
                      />
                      <span className="text-xs text-gray-400 mt-1">
                        e.g. 2.5
                      </span>
                      <span className="text-xs text-red-400 min-h-[18px]">
                        {formErrors.odds}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 col-span-2 mb-6">
                      <Label
                        htmlFor="date"
                        className="font-bold text-base text-white mb-1"
                      >
                        Date
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        className="bg-gray-900 border-gray-700 focus:ring-2 focus:ring-[#4e43ff] focus:border-[#4e43ff] text-white rounded-lg px-3 py-2 transition-all"
                        value={newBet.date}
                        onChange={(e) =>
                          setNewBet({ ...newBet, date: e.target.value })
                        }
                        required
                        aria-invalid={!!formErrors.date}
                      />
                      <span className="text-xs text-gray-400 mt-1">
                        Date of the event.
                      </span>
                      <span className="text-xs text-red-400 min-h-[18px]">
                        {formErrors.date}
                      </span>
                    </div>
                    <Button
                      type="submit"
                      className="w-full col-span-2 bg-[#4e43ff] hover:bg-[#4e43ff]/90 text-white mt-4 py-3 text-lg font-bold rounded-xl shadow-lg transition-all focus:ring-2 focus:ring-[#4e43ff] focus:outline-none"
                      disabled={addingBet}
                    >
                      {addingBet ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin h-4 w-4 mr-2 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            ></path>
                          </svg>
                          Adding...
                        </span>
                      ) : (
                        "Add Bet"
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-white">
                  Active Bets
                </h2>
                <div className="space-y-4">
                  {activeBets.length === 0 && (
                    <div className="text-gray-400">No active bets.</div>
                  )}
                  {activeBets.map((bet) => (
                    <Card
                      key={bet.id}
                      className="bg-gray-800/30 border-gray-700 p-4 backdrop-blur-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-white mb-2">
                            {bet.game}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#4e43ff]/20 text-[#4e43ff] font-bold text-sm">
                              💰 {getCurrencySymbol(bet.currency)}
                              {bet.amount}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-400 font-bold text-sm">
                              🎲 Odds: {bet.odds}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-700/40 text-gray-200 font-medium text-sm">
                              📅 {new Date(bet.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col xs:flex-row gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
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
                      </div>
                    </Card>
                  ))}
                  {/* Pagination Controls for Active Bets */}
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
                {/* Corrected Bets Section */}
                <div className="mt-10">
                  <h2 className="text-2xl font-semibold mb-4 text-white">
                    Corrected Bets
                  </h2>
                  <div className="space-y-4">
                    {currentCorrectedBets.length === 0 && (
                      <div className="text-gray-400">No corrected bets.</div>
                    )}
                    {currentCorrectedBets.map((bet) => (
                      <Card
                        key={bet.id}
                        className="bg-gray-800/50 border border-gray-700 p-4 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 backdrop-blur-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg text-white mb-2">
                              {bet.game}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-1">
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#4e43ff]/20 text-[#4e43ff] font-bold text-sm">
                                💰 {getCurrencySymbol(bet.currency)}
                                {bet.amount}
                              </span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-400 font-bold text-sm">
                                🎲 Odds: {bet.odds}
                              </span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-700/40 text-gray-200 font-medium text-sm">
                                📅 {new Date(bet.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              bet.status === "WON"
                                ? "bg-green-600/20 text-green-500"
                                : "bg-red-500/20 text-red-500"
                            }`}
                          >
                            {bet.status.charAt(0).toUpperCase() +
                              bet.status.slice(1)}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                  {/* Pagination Controls for Corrected Bets */}
                  {correctedBets.length > correctedBetsPerPage && (
                    <div className="flex justify-center items-center mt-6 space-x-4">
                      <Button
                        variant="outline"
                        onClick={prevCorrectedPage}
                        disabled={correctedCurrentPage === 1}
                        className="bg-gray-800/30 border-gray-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-white">
                        Page {correctedCurrentPage} of {correctedTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={nextCorrectedPage}
                        disabled={correctedCurrentPage === correctedTotalPages}
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
                                  WIN_LOSS_COLORS[
                                    index % WIN_LOSS_COLORS.length
                                  ]
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
    </div>
  );
}
