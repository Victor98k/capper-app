import { CustomerHomepageComponent } from "@/components/customerHomePage";

// Add this export to properly handle static generation
export const dynamic = "force-dynamic";

export default function Home() {
  return <CustomerHomepageComponent />;
}
