import { getAllRegions } from "@/lib/queries";
import { DestinationForm } from "@/components/admin/destination-form";

export const dynamic = 'force-dynamic';

export default async function NewDestinationPage() {
  const regions = await getAllRegions();

  return <DestinationForm regions={regions} />;
}
