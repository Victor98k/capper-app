import { redirect } from "next/navigation";

// Add this export to properly handle static generation
export const dynamic = "force-dynamic";

export default function Home() {
  // Using redirect from next/navigation to perform the redirect
  redirect("https://www.cappersports.co/");

  // The below return will never be reached due to the redirect
  return null;
}
