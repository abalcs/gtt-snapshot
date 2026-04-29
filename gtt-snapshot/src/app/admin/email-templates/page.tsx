import { requireAdmin } from "@/lib/admin-auth";
import { EmailTemplatesManagement } from "./email-templates-management";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesAdminPage() {
  await requireAdmin();
  return <EmailTemplatesManagement />;
}
