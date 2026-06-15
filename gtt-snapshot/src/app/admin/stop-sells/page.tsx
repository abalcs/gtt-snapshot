import { requireAdmin } from "@/lib/admin-auth";
import { StopSellManagement } from "./stop-sell-management";

export const dynamic = "force-dynamic";

export default async function StopSellsPage() {
  await requireAdmin();
  return <StopSellManagement />;
}
