import { notFound } from "next/navigation";
import { getSpecialSectionBySlug, getAllRegions } from "@/lib/queries";
import { SpecialSectionForm } from "@/components/admin/special-section-form";

export const dynamic = 'force-dynamic';

export default async function EditSpecialSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [section, regions] = await Promise.all([
    getSpecialSectionBySlug(slug),
    getAllRegions(),
  ]);

  if (!section) notFound();

  return <SpecialSectionForm section={section} regions={regions} />;
}
