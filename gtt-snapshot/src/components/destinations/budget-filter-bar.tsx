"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BUDGET_TIERS } from "@/lib/tags";

interface BudgetFilterBarProps {
  currentBudget: string[];
}

export function BudgetFilterBar({ currentBudget }: BudgetFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleBudget = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const next = currentBudget.includes(slug)
      ? currentBudget.filter(b => b !== slug)
      : [...currentBudget, slug];
    if (next.length > 0) {
      params.set("budget", next.join(","));
    } else {
      params.delete("budget");
    }
    router.push(`/destinations?${params.toString()}`);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Budget tier</h3>
      <div className="flex flex-wrap gap-1.5">
        {BUDGET_TIERS.map(tier => {
          const isActive = currentBudget.includes(tier.slug);
          return (
            <button
              key={tier.slug}
              onClick={() => toggleBudget(tier.slug)}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer"
              style={
                isActive
                  ? { backgroundColor: tier.color, color: 'white', borderColor: tier.color }
                  : { backgroundColor: `${tier.color}10`, color: tier.color, borderColor: `${tier.color}40` }
              }
            >
              {tier.label}
              <span className={`text-[10px] ${isActive ? 'opacity-80' : 'opacity-60'}`}>{tier.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
