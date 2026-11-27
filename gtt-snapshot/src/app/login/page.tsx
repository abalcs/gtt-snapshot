import { LoginForm, type LoginSpot } from "./login-form";
import { getAllDestinations } from "@/lib/queries";
import { getPopulation } from "@/lib/destination-populations";
import { describeMonths, parseSeasonalityRaw, seasonMonths } from "@/lib/seasonality-months";

export const dynamic = 'force-dynamic';

// The split-screen login carries one hero photograph: a safari destination
// when one is available, otherwise the first destination with a photo.
const HERO_PREFERENCE = ["tanzania", "botswana", "kenya", "south-africa"];

export default async function LoginPage() {
  let hero: LoginSpot | null = null;
  try {
    const all = await getAllDestinations();
    const withPhotos = all.filter((d) => d.image_url);
    const chosen =
      HERO_PREFERENCE.map((slug) => withPhotos.find((d) => d.slug === slug)).find(Boolean) ??
      withPhotos.sort((a, b) => a.slug.localeCompare(b.slug))[0];
    if (chosen) {
      const months = seasonMonths(parseSeasonalityRaw(chosen.seasonality));
      hero = {
        name: chosen.name,
        slug: chosen.slug,
        imageUrl: chosen.image_url as string,
        peakLabel: months.peak.size > 0 ? describeMonths(months.peak) : null,
        population: getPopulation(chosen.slug),
      };
    }
  } catch {
    hero = null;
  }
  return <LoginForm hero={hero} />;
}
