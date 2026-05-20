import { getAnalytics } from "@/lib/data/cache";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialData = await getAnalytics();
  return <Dashboard initialData={initialData} />;
}
