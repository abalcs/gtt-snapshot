import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PricingTable } from "@/components/destinations/pricing-table";
import { SeasonalityDisplay } from "@/components/destinations/seasonality-display";
import { ClientTypes } from "@/components/destinations/client-types";
import { KeyFactsDisplay } from "@/components/destinations/key-facts-display";
import { getDestinationBySlug, getAllTagDefinitions } from "@/lib/queries";
import { getFlagUrl } from "@/lib/country-flags";
import { TagBadges } from "@/components/destinations/tag-badges";

export const dynamic = 'force-dynamic';

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [destination, tagDefinitions] = await Promise.all([
    getDestinationBySlug(slug),
    getAllTagDefinitions(),
  ]);

  if (!destination) notFound();

  const pairWithItems = destination.pair_with
    ? destination.pair_with.split(/,|\//).map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <Link href={`/regions/${destination.region_slug}`} className="hover:underline">
            {destination.region_name}
          </Link>
          <span>/</span>
          <span>{destination.name}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            {getFlagUrl(destination.name) && (
              <img
                src={getFlagUrl(destination.name)}
                alt=""
                className="h-6 w-8 object-cover rounded-sm inline-block"
              />
            )}
            {destination.name}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{destination.region_name}</Badge>
            {destination.status !== "active" && (
              <Badge variant="destructive">
                {destination.status === "stop_sell" ? "Stop Sell" : "Not Selling"}
              </Badge>
            )}
          </div>
        </div>
        {destination.tags && destination.tags.length > 0 && (
          <TagBadges tags={destination.tags} tagDefinitions={tagDefinitions} />
        )}
        {(destination.date_updated || destination.updated_by) && (
          <p className="text-sm font-medium text-red-600">
            Last updated{destination.date_updated ? ` on ${destination.date_updated}` : ""}
            {destination.updated_by ? ` by ${destination.updated_by}` : ""}
          </p>
        )}
      </div>

      {/* Urgency Banner */}
      {destination.urgency && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mt-0.5 shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <div>
                <h3 className="font-semibold text-amber-800 text-sm">Urgency</h3>
                <p className="text-sm text-amber-700 whitespace-pre-line">{destination.urgency}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {destination.night_min && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Night Minimum</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line">{destination.night_min}</p>
            </CardContent>
          </Card>
        )}
        {destination.solo_pricing && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Solo Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{destination.solo_pricing}</p>
            </CardContent>
          </Card>
        )}
        {destination.pax_limit && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pax Limit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{destination.pax_limit}</p>
            </CardContent>
          </Card>
        )}
        {destination.how_to_feature && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">How to Feature</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{destination.how_to_feature}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Key Facts */}
      {destination.key_facts && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold mb-3">Key Facts</h2>
            <KeyFactsDisplay keyFacts={destination.key_facts} />
          </div>
        </>
      )}

      {/* Pricing */}
      {destination.pricing_tiers.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold mb-3">Pricing</h2>
            <PricingTable tiers={destination.pricing_tiers} />
          </div>
        </>
      )}

      {/* Seasonality */}
      {destination.seasonality && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold mb-3">Seasonality</h2>
            <SeasonalityDisplay seasonality={destination.seasonality} />
          </div>
        </>
      )}

      {/* Client Types */}
      {(destination.client_types_good || destination.client_types_okay || destination.client_types_bad) && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold mb-3">Client Types</h2>
            <ClientTypes
              good={destination.client_types_good}
              okay={destination.client_types_okay}
              bad={destination.client_types_bad}
            />
          </div>
        </>
      )}

      {/* Accommodations */}
      {destination.accommodations && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold mb-3">Accommodations</h2>
            <p className="text-sm whitespace-pre-line leading-relaxed">{destination.accommodations}</p>
          </div>
        </>
      )}

      {/* General Notes */}
      {(destination.general_notes_1 || destination.general_notes_2) && (
        <>
          <Separator />
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">General Notes</h2>
            {destination.general_notes_1 && (
              <p className="text-sm whitespace-pre-line leading-relaxed">{destination.general_notes_1}</p>
            )}
            {destination.general_notes_2 && (
              <p className="text-sm whitespace-pre-line leading-relaxed">{destination.general_notes_2}</p>
            )}
          </div>
        </>
      )}

      {/* Pair With */}
      {pairWithItems.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold mb-3">Pair With</h2>
            <div className="flex flex-wrap gap-2">
              {pairWithItems.map((item) => (
                <Badge key={item} variant="outline" className="text-sm">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
