import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared header for admin sub-pages: breadcrumb back to the dashboard,
 * a serif title, an optional description, and optional actions on the right.
 */
export function AdminPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/admin" className="transition-colors hover:text-[#0e4d5c] hover:underline">
          Admin
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground/70">{title}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-[28px] font-semibold leading-tight tracking-tight">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
