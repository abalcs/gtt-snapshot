import type { MyActivity } from "./my-activity";

/**
 * Renders a shareable "My Snapshot story" card (1200 x 630 PNG) entirely in
 * the browser, ready to paste into Teams. Nothing is uploaded anywhere; the
 * image is drawn on a canvas from the stats already on screen.
 */

const W = 1200;
const H = 630;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDay(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso.length <= 10 ? iso + "T12:00:00" : iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    return img;
  } catch {
    return null;
  }
}

export async function buildStatsImageBlob(
  activity: MyActivity,
  userName: string,
  role: string
): Promise<Blob> {
  try {
    await document.fonts.ready;
  } catch {
    // fall back to whatever fonts are available
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  const SERIF = "'Fraunces', Georgia, 'Times New Roman', serif";
  const SANS = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
  const TEAL = "#0e4d5c";
  const DEEP = "#07222b";
  const GOLD = "#c9a227";
  const INK = "#292524";
  const MUTED = "#78716c";

  // Background + frame
  ctx.fillStyle = "#faf6ee";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, W - 36, H - 36);

  // Logo
  const logo = await loadImage("/audley-logo-green.png");
  if (logo) {
    const lh = 52;
    const lw = (logo.width / logo.height) * lh;
    ctx.drawImage(logo, 64, 52, lw, lh);
  } else {
    ctx.fillStyle = TEAL;
    ctx.font = `600 26px ${SANS}`;
    ctx.fillText("AUDLEY TRAVEL", 64, 88);
  }
  ctx.fillStyle = MUTED;
  ctx.font = `600 19px ${SANS}`;
  ctx.textAlign = "right";
  ctx.fillText("G T T   C O U N T R Y   S N A P S H O T", W - 64, 88);
  ctx.textAlign = "left";

  // Name + subline
  const since = formatDay(activity.firstDay);
  ctx.fillStyle = DEEP;
  ctx.font = `600 62px ${SERIF}`;
  ctx.fillText(userName, 64, 196);
  ctx.fillStyle = MUTED;
  ctx.font = `400 24px ${SANS}`;
  ctx.fillText(
    `${role === "admin" ? "Administrator" : "Advisor"}${since ? `  ·  exploring since ${since}` : ""}`,
    64,
    238
  );

  // Gold rule
  ctx.fillStyle = GOLD;
  ctx.fillRect(64, 268, 120, 4);

  // Stat row
  const stats: { value: number; label: string }[] = [
    { value: activity.totalPageViews, label: "PAGES VIEWED" },
    { value: activity.totalSearches, label: "SEARCHES MADE" },
    { value: activity.activeDaysCount, label: "ACTIVE DAYS" },
    { value: activity.destinationsExplored, label: "DESTINATIONS EXPLORED" },
  ];
  const colW = (W - 128) / 4;
  stats.forEach((s, i) => {
    const x = 64 + i * colW;
    ctx.fillStyle = TEAL;
    ctx.font = `600 58px ${SERIF}`;
    ctx.fillText(s.value.toLocaleString(), x, 356);
    ctx.fillStyle = MUTED;
    ctx.font = `600 17px ${SANS}`;
    ctx.fillText(s.label, x, 388);
  });

  // Highlight band
  const lines: string[] = [];
  if (activity.topDestinations.length > 0) {
    const top = activity.topDestinations[0];
    lines.push(
      `Most explored: ${top.name} (${top.views} view${top.views !== 1 ? "s" : ""})` +
        (activity.topRegion ? `  ·  Favourite region: ${activity.topRegion.name}` : "")
    );
  }
  if (activity.rank !== null && activity.teamSize > 1) {
    lines.push(
      `${ordinal(activity.rank)} most active of ${activity.teamSize} on the team` +
        (activity.moreActiveThanPct !== null ? `  ·  ahead of ${activity.moreActiveThanPct}% of the team` : "")
    );
  }
  if (activity.streakDays >= 2) {
    lines.push(`Currently on a ${activity.streakDays}-day active streak`);
  }
  if (lines.length > 0) {
    roundRect(ctx, 64, 424, W - 128, 34 + lines.length * 34, 14);
    ctx.fillStyle = "rgba(14, 77, 92, 0.06)";
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = `400 23px ${SANS}`;
    lines.forEach((line, i) => {
      ctx.fillText(line, 92, 462 + i * 34);
    });
  }

  // Footer
  ctx.fillStyle = MUTED;
  ctx.font = `400 19px ${SANS}`;
  ctx.fillText("My Snapshot story", 64, H - 48);
  ctx.textAlign = "right";
  ctx.fillText(
    new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    W - 64,
    H - 48
  );
  ctx.textAlign = "left";

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not render the image"));
    }, "image/png");
  });
}
