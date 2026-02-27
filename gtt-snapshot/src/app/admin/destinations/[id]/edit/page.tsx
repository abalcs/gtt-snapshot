import { notFound } from "next/navigation";
import { getDestinationById, getAllRegions } from "@/lib/queries";
import { DestinationForm } from "@/components/admin/destination-form";

export const dynamic = 'force-dynamic';

export default async function EditDestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [destination, regions] = await Promise.all([
    getDestinationById(id),
    getAllRegions(),
  ]);

  if (!destination) notFound();

  return <DestinationForm destination={destination} regions={regions} />;
}
