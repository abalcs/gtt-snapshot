import { notFound } from "next/navigation";
import Link from "next/link";
import { getPageBySlug } from "@/lib/pages";
import { requireAuth } from "@/lib/admin-auth";
import { BlockRenderer } from "@/components/pages/block-renderer";

export const dynamic = "force-dynamic";

export default async function PageView({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireAuth();
  const { slug } = await params;
  const page = await getPageBySlug(slug, {
    includeDrafts: user.role === "admin",
  });

  if (!page) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <span>{page.section}</span>
        <span>/</span>
        <span>{page.title}</span>
      </div>

      <div className="border-b-2 border-[#c9a227]/60 pb-4">
        <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
        {page.summary && (
          <p className="mt-2 text-base text-muted-foreground leading-relaxed">{page.summary}</p>
        )}
        {page.status === "draft" && (
          <span className="mt-3 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
            Draft — only admins can see this page
          </span>
        )}
      </div>

      <BlockRenderer blocks={page.blocks} />

      {page.updated_at && (
        <p className="text-xs text-muted-foreground pt-2">
          Last updated {new Date(page.updated_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
