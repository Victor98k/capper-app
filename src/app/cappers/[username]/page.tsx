import { notFound } from "next/navigation";

interface PageProps {
  params: {
    username: string;
  };
}

async function getCapperByUsername(username: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/cappers/${username}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching capper:", error);
    return null;
  }
}

export default async function CapperProfilePage({ params }: PageProps) {
  const capper = await getCapperByUsername(params.username);

  if (!capper) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Capper Profile: {capper.username}
      </h1>
      {/* Add your capper profile display components here */}
    </div>
  );
}
