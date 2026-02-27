import { getAdminLogs } from "@/lib/queries";
import { AdminLogList } from "./log-list";

export const dynamic = 'force-dynamic';

export default async function AdminLogPage() {
  const logs = await getAdminLogs(100);
  return <AdminLogList logs={logs} />;
}
