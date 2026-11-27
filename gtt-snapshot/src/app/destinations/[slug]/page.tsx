import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingTable } from "@/components/destinations/pricing-table";
import { SeasonalityDisplay } from "@/components/destinations/seasonality-display";
import { ClientTypes } from "@/components/destinations/client-types";
import { KeyFactsDisplay } from "@/components/destinations/key-facts-display";
import { getDestinationBySlug, getAllTagDefinitions, getAllDestinations, getPricingVisible } from "@/lib/queries";
import { getFlagUrl } from "@/lib/country-flags";
import { getTravelDataForDestination } from "@/lib/travel-data-queries";
import { TravelInfo } from "@/components/destinations/travel-info";
import { TagBadges } from "@/components/destinations/tag-badges";
import DestinationMap from "@/components/destinations/destination-map";
import { getCoordinates } from "@/lib/country-coordinates";
import { requireAuth } from "@/lib/admin-auth";
import { MobilityAccessibility } from "@/components/destinations/mobility-accessibility";
import { TableOfContents } from "@/components/destinations/table-of-contents";
import { DestinationCard } from "@/components/destinations/destination-card";
import { FlightTimeWidget } from "@/components/destinations/flight-time-widget";


export const dynamic = 'force-dynamic';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="font-serif text-[22px] font-semibold tracking-tight">{children}</h2>
      <span className="h-px flex-1 bg-gradient-to-r from-[#c9a227]/50 via-border to-transparent" />
    </div>
  );
}

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
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#0e4d5c] font-medium underline decoration-[#0e4d5c]/30 underline-offset-2 hover:decoration-[#0e4d5c] transition-colors">$1</a>'
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
  const [destination, tagDefinitions, allDestinations, pricingVisible] = await Promise.all([
    getDestinationBySlug(slug),
    getAllTagDefinitions(),
    getAllDestinations(),
    getPricingVisible(),
  ]);

  if (!destination) notFound();

  const travelData = await getTravelDataForDestination(destination.name).catch(() => null);

  const pairWithItems = destination.pair_with
    ? destination.pair_with.split(/,|\//).map((s) => s.trim()).filter(Boolean)
    : [];

  // Hero quick facts: peak season range and a short nights label, when the data supports them
  let bestTime: string | null = null;
  if (destination.seasonality) {
    try {
      const seasons = (Array.isArray(destination.seasonality)
        ? destination.seasonality
        : JSON.parse(destination.seasonality)) as { level?: string; date_range?: string }[];
      const peak = seasons.find((s) => (s.level ?? "").toLowerCase() === "peak");
      bestTime = peak?.date_range ?? null;
    } catch { /* seasonality is free text for some destinations */ }
  }
  const nightNum = destination.night_min !== null && destination.night_min !== undefined && String(destination.night_min).trim() !== "" && !Number.isNaN(Number(destination.night_min))
    ? Number(destination.night_min)
    : null;
  const nightsLabel = nightNum !== null
    ? `${nightNum} night${nightNum === 1 ? "" : "s"} minimum`
    : destination.night_min && String(destination.night_min).trim().length <= 24
      ? String(destination.night_min).trim()
      : null;
  const destByName = new Map(allDestinations.map((d) => [d.name.toLowerCase(), d.slug]));

  const coords = getCoordinates(slug);

  // Build related destinations from pair_with names, fallback to same region
  let relatedDestinations = pairWithItems.length > 0
    ? allDestinations.filter((d) =>
        pairWithItems.some((name) => d.name.toLowerCase() === name.toLowerCase()) && d.slug !== slug
      ).slice(0, 3)
    : [];
  if (relatedDestinations.length === 0) {
    relatedDestinations = allDestinations
      .filter((d) => d.region_slug === destination.region_slug && d.slug !== slug)
      .slice(0, 3);
  }

  // Build TOC sections based on which content exists
  const tocSections: { id: string; label: string }[] = [];
  if (travelData) tocSections.push({ id: "travel-info", label: "Travel Info" });
  if (destination.talking_points) tocSections.push({ id: "talking-points", label: "Talking Points" });
  if (destination.key_facts) tocSections.push({ id: "key-facts", label: "Key Facts" });
  if (destination.pricing_tiers.length > 0) tocSections.push({ id: "pricing", label: "Pricing" });
  if (destination.seasonality) tocSections.push({ id: "seasonality", label: "Seasonality" });
  if (destination.client_types_good || destination.client_types_okay || destination.client_types_bad) tocSections.push({ id: "client-types", label: "Client Types" });
  if (destination.terrain_difficulty !== null || destination.wheelchair_friendliness !== null || destination.walking_required !== null || destination.altitude_concern !== null || destination.mobility_notes) tocSections.push({ id: "mobility", label: "Mobility" });
  if (destination.accommodations) tocSections.push({ id: "accommodations", label: "Accommodations" });
  if (destination.general_notes_1 || destination.general_notes_2) tocSections.push({ id: "general-notes", label: "Notes" });
  if (pairWithItems.length > 0) tocSections.push({ id: "pair-with", label: "Pair With" });
  if (relatedDestinations.length > 0) tocSections.push({ id: "related", label: "Related" });

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-4">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d4256] via-[#0e4d5c] to-[#07222b] px-8 py-7 shadow-[var(--shadow-md)]">
        <div className="absolute inset-0 bg-dots opacity-10" />
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
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
              {getFlagUrl(destination.name) && (
                <img
                  src={getFlagUrl(destination.name)}
                  alt=""
                  className="h-8 w-11 object-cover rounded shadow ring-1 ring-white/30 inline-block"
                />
              )}
              {destination.name}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-[#c9a227]/15 text-[#e8cf7a] border-[#c9a227]/30">{destination.region_name}</Badge>
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
            <p className="text-[13px] font-medium text-[#e8cf7a]/90 mt-2">
              Last updated{destination.date_updated ? ` on ${destination.date_updated}` : ""}
              {destination.updated_by ? ` by ${destination.updated_by}` : ""}
            </p>
          )}

          {(bestTime || nightsLabel) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {bestTime && (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                  Best time: {bestTime}
                </span>
              )}
              {nightsLabel && (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                  {nightsLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table of Contents */}
      {tocSections.length > 2 && <TableOfContents sections={tocSections} />}

      {/* Location Map */}
      {coords && (
        <DestinationMap
          lat={coords.lat}
          lng={coords.lng}
          zoom={coords.zoom}
          name={destination.name}
        />
      )}

      {/* Flight Time Estimator */}
      {coords && (
        <FlightTimeWidget destLat={coords.lat} destLng={coords.lng} destName={destination.name} />
      )}

      {/* Travel Information */}
      {travelData && <div id="travel-info" className="scroll-mt-20"><TravelInfo data={travelData} /></div>}

      {/* Talking Points */}
      {destination.talking_points && (
        <Card id="talking-points" className="border-l-4 border-l-[#c9a227] bg-white scroll-mt-20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0e4d5c] mt-0.5 shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <div>
                <h3 className="font-serif font-semibold text-[#0e4d5c] text-base">Talking Points</h3>
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
              <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Night Minimum</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line" dangerouslySetInnerHTML={{ __html: formatInline(destination.night_min) }} />
            </CardContent>
          </Card>
        )}
        {destination.solo_pricing && (
          <Card className={!pricingVisible ? "relative" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Solo Pricing</CardTitle>
            </CardHeader>
            <CardContent className={!pricingVisible ? "blur-sm select-none" : ""}>
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: formatInline(destination.solo_pricing) }} />
            </CardContent>
          </Card>
        )}
        {destination.pax_limit && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Pax Limit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: formatInline(destination.pax_limit) }} />
            </CardContent>
          </Card>
        )}
        {destination.how_to_feature && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">How to Feature</CardTitle>
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
          <div id="key-facts" className="scroll-mt-20">
            <SectionHeading>Key Facts</SectionHeading>
            <KeyFactsDisplay keyFacts={destination.key_facts} />
          </div>
        </>
      )}

      {/* Pricing */}
      {destination.pricing_tiers.length > 0 && (
        <>
          <div id="pricing" className="scroll-mt-20">
            <SectionHeading>Pricing</SectionHeading>
            <PricingTable tiers={destination.pricing_tiers} footnotes={destination.pricing_footnotes} obscured={!pricingVisible} />
          </div>
        </>
      )}

      {/* Seasonality */}
      {destination.seasonality && (
        <>
          <div id="seasonality" className="scroll-mt-20">
            <SectionHeading>Seasonality</SectionHeading>
            <SeasonalityDisplay seasonality={destination.seasonality} />
          </div>
        </>
      )}

      {/* Client Types */}
      {(destination.client_types_good || destination.client_types_okay || destination.client_types_bad) && (
        <>
          <div id="client-types" className="scroll-mt-20">
            <SectionHeading>Client Types</SectionHeading>
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
          <div id="mobility" className="scroll-mt-20">
            <SectionHeading>Mobility & Accessibility</SectionHeading>
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
          <div id="accommodations" className="scroll-mt-20">
            <SectionHeading>Accommodations</SectionHeading>
            <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed">
              {destination.accommodations.split("\n").filter((l: string) => l.trim()).map((line: string, i: number) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(line.trim()) }} />
              ))}
            </ul>
            <a
              href={destination.accommodation_url || `https://www.audleytravel.com/us/${slug}/accommodation`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 text-sm font-medium border border-[#0e4d5c]/30 text-[#0e4d5c] rounded-md hover:bg-[#0e4d5c]/5 transition-colors"
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
          <div id="general-notes" className="scroll-mt-20 space-y-4">
            <SectionHeading>General Notes</SectionHeading>
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
          <div id="pair-with" className="scroll-mt-20">
            <SectionHeading>Pair With</SectionHeading>
            <div className="flex flex-wrap gap-2">
              {pairWithItems.map((item) => {
                const matchSlug = destByName.get(item.toLowerCase());
                return matchSlug && matchSlug !== slug ? (
                  <Link
                    key={item}
                    href={`/destinations/${matchSlug}`}
                    className="rounded-full border border-[#0e4d5c]/25 bg-[#0e4d5c]/5 px-3 py-1 text-sm font-medium text-[#0e4d5c] transition-colors hover:bg-[#0e4d5c]/10"
                  >
                    {item}
                  </Link>
                ) : (
                  <Badge key={item} variant="outline" className="text-sm">
                    {item}
                  </Badge>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Related Destinations */}
      {relatedDestinations.length > 0 && (
        <>
          <div id="related" className="scroll-mt-20">
            <SectionHeading>Related Destinations</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedDestinations.map((dest) => (
                <DestinationCard key={dest.id} destination={dest} tagDefinitions={tagDefinitions} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
