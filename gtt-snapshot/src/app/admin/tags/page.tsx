import { getAllTagDefinitions } from "@/lib/queries";
import { TagManager } from "./tag-manager";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export default async function AdminTagsPage() {
  await requireAdmin();
  const tags = await getAllTagDefinitions();

  return <TagManager initialTags={tags} />;
}
