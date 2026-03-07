import { requireAdmin } from "@/lib/admin-auth";
import { ConsultantManagement } from "./consultant-management";

export const dynamic = "force-dynamic";

export default async function ConsultantsAdminPage() {
  await requireAdmin();
  return <ConsultantManagement />;
}
