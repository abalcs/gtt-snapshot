import { getAdminLogs } from "@/lib/queries";
import { AdminLogList } from "./log-list";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export default async function AdminLogPage() {
  await requireAdmin();
  const logs = await getAdminLogs(100);
  return <AdminLogList logs={logs} />;
}
