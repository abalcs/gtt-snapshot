import { requireAdmin } from "@/lib/admin-auth";
import { TceManagement } from "./tce-management";

export const dynamic = "force-dynamic";

export default async function TceArticlesAdminPage() {
  await requireAdmin();
  return <TceManagement />;
}
