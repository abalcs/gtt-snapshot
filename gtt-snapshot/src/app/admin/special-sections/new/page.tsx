import { getAllRegions } from "@/lib/queries";
import { SpecialSectionForm } from "@/components/admin/special-section-form";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export default async function NewSpecialSectionPage() {
  await requireAdmin();
  const regions = await getAllRegions();

  return <SpecialSectionForm regions={regions} />;
}
