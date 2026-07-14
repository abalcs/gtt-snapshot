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
import { getTravelDataForDestination } from "@/lib/travel-data-queries";
import { TravelInfo } from "@/components/destinations/travel-info";
import { TagBadges } from "@/components/destinations/tag-badges";
import DestinationMap from "@/components/destinations/destination-map";
import { getCoordinates } from "@/lib/country-coordinates";
import { requireAuth } from "@/lib/admin-auth";
import { invalidateCache } from "@/lib/data-cache";
import { MobilityAccessibility } from "@/components/destinations/mobility-accessibility";


export const dynamic = 'force-dynamic';

function formatInline(text: unknown): string {
  if (!text) return "";
  const str = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return str
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#3a5f54] font-medium underline decoration-[#3a5f54]/30 underline-offset-2 hover:decoration-[#3a5f54] transition-colors">$1</a>'
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAuth();
  const { slug } = await params;
  const [destination, tagDefinitions] = await Promise.all([
    getDestinationBySlug(slug),
    getAllTagDefinitions(),
  ]);

  if (!destination) notFound();

  const travelData = await getTravelDataForDestination(destination.name).catch(() => null);

  const pairWithItems = destination.pair_with
    ? destination.pair_with.split(/,|\//).map((s) => s.trim()).filter(Boolean)
    : [];

  const coords = getCoordinates(slug);

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#3a5f54] via-[#2a4a40] to-[#1e3830] px-8 py-6">
        <div className="absolute inset-0 bg-dots opacity-[0.06]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-3">
            <Link href="/" className="hover:text-white/90 transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/regions/${destination.region_slug}`} className="hover:text-white/90 transition-colors">
              {destination.region_name}
            </Link>
            <span>/</span>
            <span className="text-white/80">{destination.name}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
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
              <Badge variant="secondary" className="bg-white/20 text-white border-white/20">{destination.region_name}</Badge>
              {destination.status !== "active" && (
                <Badge variant="destructive">
                  {destination.status === "stop_sell" ? "Stop Sell" : "Not Selling"}
                </Badge>
              )}
            </div>
          </div>
          {destination.tags && destination.tags.length > 0 && (
            <div className="mt-3">
              <TagBadges tags={destination.tags} tagDefinitions={tagDefinitions} />
            </div>
          )}
          {(destination.date_updated || destination.updated_by) && (
            <p className="text-sm font-medium text-amber-300 mt-2">
              Last updated{destination.date_updated ? ` on ${destination.date_updated}` : ""}
              {destination.updated_by ? ` by ${destination.updated_by}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Location Map */}
      {coords && (
        <DestinationMap
          lat={coords.lat}
          lng={coords.lng}
          zoom={coords.zoom}
          name={destination.name}
        />
      )}

      {/* Travel Information */}
      {travelData && <TravelInfo data={travelData} />}

      {/* Talking Points */}
      {destination.talking_points && (
        <Card className="border-l-4 border-l-[#3a5f54] bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3a5f54] mt-0.5 shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <div>
                <h3 className="font-semibold text-[#3a5f54] text-sm">Talking Points</h3>
                <p className="text-sm text-foreground/80 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: formatInline(destination.talking_points) }} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Urgency Banner */}
      {destination.urgency && (
        <Card className="border-l-4 border-l-amber-500 bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mt-0.5 shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <div>
                <h3 className="font-semibold text-amber-800 text-sm">Urgency</h3>
                <p className="text-sm text-amber-700 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: formatInline(destination.urgency) }} />
                {destination.stop_sell_expires && (
                  <p className="text-xs text-amber-600 mt-1">
                    Stop sell expires: {destination.stop_sell_expires}
                    {destination.stop_sell_note && ` — ${destination.stop_sell_note}`}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Standalone Stop Sell card (when stop_sell_expires is set but no urgency text) */}
      {!destination.urgency && destination.stop_sell_expires && (
        <Card className="border-l-4 border-l-red-500 bg-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
              <div>
                <h3 className="font-semibold text-red-800 text-sm">Stop Sell</h3>
                <p className="text-sm text-red-700">
                  Expires: {destination.stop_sell_expires}
                  {destination.stop_sell_note && ` — ${destination.stop_sell_note}`}
                </p>
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
              <p className="text-sm whitespace-pre-line" dangerouslySetInnerHTML={{ __html: formatInline(destination.night_min) }} />
            </CardContent>
          </Card>
        )}
        {destination.solo_pricing && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Solo Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: formatInline(destination.solo_pricing) }} />
            </CardContent>
          </Card>
        )}
        {destination.pax_limit && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pax Limit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: formatInline(destination.pax_limit) }} />
            </CardContent>
          </Card>
        )}
        {destination.how_to_feature && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">How to Feature</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: formatInline(destination.how_to_feature) }} />
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
            <PricingTable tiers={destination.pricing_tiers} footnotes={destination.pricing_footnotes} />
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

      {/* Mobility & Accessibility */}
      {(destination.terrain_difficulty !== null || destination.wheelchair_friendliness !== null || destination.walking_required !== null || destination.altitude_concern !== null || destination.mobility_notes) && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold mb-3">Mobility & Accessibility</h2>
            <MobilityAccessibility
              terrainDifficulty={destination.terrain_difficulty}
              wheelchairFriendliness={destination.wheelchair_friendliness}
              walkingRequired={destination.walking_required}
              altitudeConcern={destination.altitude_concern}
              mobilityNotes={destination.mobility_notes}
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
            <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed">
              {destination.accommodations.split("\n").filter((l: string) => l.trim()).map((line: string, i: number) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(line.trim()) }} />
              ))}
            </ul>
            <a
              href={destination.accommodation_url || `https://www.audleytravel.com/us/${slug}/accommodation`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-muted transition-colors"
            >
              View Accommodations on Audley
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
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
              <p className="text-sm whitespace-pre-line leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(destination.general_notes_1) }} />
            )}
            {destination.general_notes_2 && (
              <p className="text-sm whitespace-pre-line leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(destination.general_notes_2) }} />
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
