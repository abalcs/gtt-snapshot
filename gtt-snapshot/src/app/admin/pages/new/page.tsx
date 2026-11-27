import { PageEditor } from "@/components/admin/page-editor";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function NewPagePage() {
  await requireAdmin();
  return <PageEditor />;
}
