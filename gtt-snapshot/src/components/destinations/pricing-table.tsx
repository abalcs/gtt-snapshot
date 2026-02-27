import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PricingTier } from "@/lib/types";

export function PricingTable({ tiers }: { tiers: PricingTier[] }) {
  if (!tiers || tiers.length === 0) {
    return <p className="text-sm text-muted-foreground">No pricing data available.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tier</TableHead>
          <TableHead>Per Week (pp)</TableHead>
          <TableHead>Per Day (pp)</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tiers.map((tier, i) => (
          <TableRow key={i}>
            <TableCell className="font-medium">{tier.tier_label}</TableCell>
            <TableCell>{tier.price_per_week || "—"}</TableCell>
            <TableCell>{tier.price_per_day || "—"}</TableCell>
            <TableCell className="text-muted-foreground">{tier.notes || ""}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
