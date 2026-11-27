import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/pages";
import { PageEditor } from "@/components/admin/page-editor";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const page = await getPageBySlug(id, { includeDrafts: true });
  if (!page) notFound();
  return <PageEditor page={page} />;
}
