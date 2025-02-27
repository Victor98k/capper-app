export type Pick = {
  id: string;
  sport: string;
  prediction: string;
  result: "win" | "loss" | "pending";
  date: string;
  odds: number;
};
