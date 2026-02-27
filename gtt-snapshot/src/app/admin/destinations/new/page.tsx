import { getAllRegions } from "@/lib/queries";
import { DestinationForm } from "@/components/admin/destination-form";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export default async function NewDestinationPage() {
  await requireAdmin();
  const regions = await getAllRegions();

  return <DestinationForm regions={regions} />;
}
