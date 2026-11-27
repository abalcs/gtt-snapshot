import { LoginForm, type LoginSpot } from "./login-form";
import { getAllDestinations } from "@/lib/queries";
import { getPopulation } from "@/lib/destination-populations";
import { describeMonths, parseSeasonalityRaw, seasonMonths } from "@/lib/seasonality-months";

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  // Destination of the day: every destination with a header photo is a
  // candidate. The client picks one by day of year, so the photo changes
  // daily with no maintenance. If the data can't be read, the form falls
  // back to its video background.
  let spots: LoginSpot[] = [];
  try {
    const all = await getAllDestinations();
    spots = all
      .filter((d) => d.image_url)
      .map((d) => {
        const months = seasonMonths(parseSeasonalityRaw(d.seasonality));
        return {
          name: d.name,
          slug: d.slug,
          imageUrl: d.image_url as string,
          peakLabel: months.peak.size > 0 ? describeMonths(months.peak) : null,
          population: getPopulation(d.slug),
        };
      })
      .sort((a, b) => a.slug.localeCompare(b.slug));
  } catch {
    spots = [];
  }
  return <LoginForm spots={spots} />;
}
