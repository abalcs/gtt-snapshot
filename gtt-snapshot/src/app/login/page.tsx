import { LoginForm, type LoginSpot } from "./login-form";
import { getAllDestinations } from "@/lib/queries";
import { getPopulation } from "@/lib/destination-populations";
import { describeMonths, parseSeasonalityRaw, seasonMonths } from "@/lib/seasonality-months";

export const dynamic = 'force-dynamic';

// The split-screen login carries one hero photograph. The photo ships with
// the app (public/login-hero.jpg, the Serengeti) so the panel renders even
// when the destination data has no header photos yet; when the preferred
// destination does carry its own photo, that is used instead.
const HERO_PREFERENCE = ["tanzania", "botswana", "kenya", "south-africa"];
const FALLBACK_IMAGE = "/login-hero.jpg";

function staticHero(): LoginSpot {
  return {
    name: "Tanzania",
    slug: "tanzania",
    imageUrl: FALLBACK_IMAGE,
    peakLabel: null,
    population: getPopulation("tanzania"),
  };
}

export default async function LoginPage() {
  let hero: LoginSpot | null = null;
  try {
    const all = await getAllDestinations();
    const preferred = HERO_PREFERENCE
      .map((slug) => all.find((d) => d.slug === slug))
      .find(Boolean);
    const chosen =
      preferred ??
      all.filter((d) => d.image_url).sort((a, b) => a.slug.localeCompare(b.slug))[0];
    if (chosen) {
      const months = seasonMonths(parseSeasonalityRaw(chosen.seasonality));
      hero = {
        name: chosen.name,
        slug: chosen.slug,
        imageUrl: chosen.image_url || FALLBACK_IMAGE,
        peakLabel: months.peak.size > 0 ? describeMonths(months.peak) : null,
        population: getPopulation(chosen.slug),
      };
      // The bundled photo is the Serengeti: only caption it as a safari
      // destination it could actually be.
      if (!chosen.image_url && !HERO_PREFERENCE.includes(chosen.slug)) {
        hero = staticHero();
      }
    }
  } catch {
    hero = null;
  }
  return <LoginForm hero={hero ?? staticHero()} />;
}
