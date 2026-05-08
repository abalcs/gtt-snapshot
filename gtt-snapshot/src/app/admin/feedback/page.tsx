import { requireAdmin } from "@/lib/admin-auth";
import { FeedbackManagement } from "./feedback-management";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  await requireAdmin();

  return <FeedbackManagement />;
}
