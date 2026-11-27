import { getAllPages } from "@/lib/pages";
import { PageManager } from "@/components/admin/page-manager";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  await requireAdmin();
  const pages = await getAllPages();
  return <PageManager initialPages={pages} />;
}
