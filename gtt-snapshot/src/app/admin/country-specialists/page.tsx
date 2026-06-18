import { requireAdmin } from "@/lib/admin-auth";
import { SpecialistAssignmentsAdmin } from "./specialist-assignments-admin";

export const dynamic = "force-dynamic";

export default async function AdminCountrySpecialistsPage() {
  await requireAdmin();
  return <SpecialistAssignmentsAdmin />;
}
