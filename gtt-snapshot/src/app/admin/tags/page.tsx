import { getAllTagDefinitions } from "@/lib/queries";
import { TagManager } from "./tag-manager";

export const dynamic = 'force-dynamic';

export default async function AdminTagsPage() {
  const tags = await getAllTagDefinitions();

  return <TagManager initialTags={tags} />;
}
