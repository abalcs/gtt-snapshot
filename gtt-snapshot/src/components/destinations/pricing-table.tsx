import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PricingTier, PricingFootnote } from "@/lib/types";

const SEASON_ORDER = ["Peak", "Shoulder", "Low"];

export function PricingTable({
  tiers,
  footnotes,
  obscured,
}: {
  tiers: PricingTier[];
  footnotes?: PricingFootnote[];
  obscured?: boolean;
}) {
  if (!tiers || tiers.length === 0) {
    return <p className="text-sm text-muted-foreground">No pricing data available.</p>;
  }

  // Check if this is a standardized seasonal layout
  const isSeasonalLayout = tiers.some((t) =>
    SEASON_ORDER.includes(t.tier_label)
  );

  const tableContent = !isSeasonalLayout ? (
    // Legacy/non-standard layout (e.g. Multi-Country Trips) — simple table
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tier</TableHead>
          <TableHead>Per Week (pp)</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tiers.map((tier, i) => (
          <TableRow key={i}>
            <TableCell className="font-medium">{tier.tier_label}</TableCell>
            <TableCell>{tier.price_per_week || "\u2014"}</TableCell>
            <TableCell className="text-muted-foreground">{tier.notes || ""}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ) : (
    // Standardized seasonal layout — always show Peak/Shoulder/Low rows
    (() => {
      const tierMap = new Map(tiers.map((t) => [t.tier_label, t]));
      return (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Season</TableHead>
                <TableHead>Per Week (pp)</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SEASON_ORDER.map((season) => {
                const tier = tierMap.get(season);
                return (
                  <TableRow key={season}>
                    <TableCell className="font-medium">{season}</TableCell>
                    <TableCell>{tier?.price_per_week || "\u2014"}</TableCell>
                    <TableCell className="text-muted-foreground">{tier?.notes || ""}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {footnotes && footnotes.length > 0 && (
            <div className="text-sm text-muted-foreground space-y-1 pl-1">
              {footnotes.map((fn, i) => (
                <p key={i}>
                  <span className="font-medium text-foreground">{fn.label}:</span>{" "}
                  from {fn.price} pp
                </p>
              ))}
            </div>
          )}
        </div>
      );
    })()
  );

  if (obscured) {
    return (
      <div className="relative">
        <div className="blur-sm select-none pointer-events-none">{tableContent}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm font-medium text-muted-foreground bg-background/80 px-4 py-2 rounded-md border">
            Pricing temporarily hidden by admin
          </p>
        </div>
      </div>
    );
  }

  return tableContent;
}
