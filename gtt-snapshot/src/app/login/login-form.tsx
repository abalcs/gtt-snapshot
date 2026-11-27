"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BACKGROUND_VIDEOS = [
  "https://assets.mixkit.co/videos/5363/5363-720.mp4",   // Coastal with motorboats and pier
  "https://assets.mixkit.co/videos/2178/2178-720.mp4",   // White sand paradise beach
  "https://assets.mixkit.co/videos/4999/4999-720.mp4",   // Sunset on a bay from above
  "https://assets.mixkit.co/videos/5008/5008-720.mp4",   // Turquoise blue water bay
  "https://assets.mixkit.co/videos/41537/41537-720.mp4", // Curvy road on a tree-covered hill
  "https://assets.mixkit.co/videos/49334/49334-720.mp4", // Drone flight above a jungle river
  "https://assets.mixkit.co/videos/2875/2875-720.mp4",   // Wooden pier on a paradise beach
  "https://assets.mixkit.co/videos/17746/17746-720.mp4", // Autumn forest and mountains
  "https://assets.mixkit.co/videos/45271/45271-720.mp4", // Slow pan through autumn forest with rotunda
  "https://assets.mixkit.co/videos/34856/34856-720.mp4", // Fog covering an autumnal forest time-lapse
  "https://assets.mixkit.co/videos/30606/30606-720.mp4", // Tunnel of yellow autumn leaves
  "https://assets.mixkit.co/videos/9940/9940-720.mp4",   // Blue lake and forest in autumn
  "https://assets.mixkit.co/videos/45258/45258-720.mp4", // Autumn trees along a highway
];

// Seasonal rotation: Christmas travel scenes. Every clip is Mixkit Free
// License (cleared for commercial use) — the prettier Europe window-shopping
// clip was Restricted License (personal use only), so it is deliberately out.
// The seasonal set plays from 26 November to New Year's Eve; from
// 1 January the regular set takes over again automatically.
const SEASONAL_VIDEOS = [
  "https://assets.mixkit.co/videos/2618/2618-720.mp4",   // Walking through a snowy town
  "https://assets.mixkit.co/videos/40637/40637-720.mp4", // City street at sunset, trees decorated with Christmas lights
  "https://assets.mixkit.co/videos/4033/4033-720.mp4",   // Aurora borealis timelapse over mountains
  "https://assets.mixkit.co/videos/4040/4040-720.mp4",   // Northern Lights at dawn, lake between mountains
  "https://assets.mixkit.co/videos/4036/4036-720.mp4",   // Yellow northern lights in Norway
];
const SEASON_START = new Date(2026, 10, 26); // 26 November 2026
const SEASON_END = new Date(2027, 0, 1); // 1 January 2027 (exclusive)

function activeVideoPool(now: Date): string[] {
  return now >= SEASON_START && now < SEASON_END ? SEASONAL_VIDEOS : BACKGROUND_VIDEOS;
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [remember, setRemember] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [videoUrl] = useState(() => {
    const pool = activeVideoPool(new Date());
    return pool[Math.floor(Math.random() * pool.length)];
  });

  const fail = (message: string) => {
    setError(message);
    setLoading(false);
    setShaking(true);
    window.setTimeout(() => setShaking(false), 550);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.must_change_password) {
          window.location.href = "/set-password";
        } else {
          window.location.href = "/";
        }
        return;
      } else {
        fail(data.error || "Invalid email or password");
      }
    } catch {
      fail("Something went wrong. Check your connection and try again.");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Layer 1: Sage gradient fallback (visible while video loads) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d4256] via-[#0e4d5c] to-[#07222b]" />

      {/* Layer 2: Slow-motion video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="login-video absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Layer 3: Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#07222b]/70 via-black/35 to-[#07222b]/75" />

      {/* Layer 4: Login content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen animate-fade-up">
        <div className="w-full max-w-sm mx-4">
          {/* Branding */}
          <div className="text-center mb-8">
            <p className="text-[#c9a227] text-[11px] font-semibold uppercase tracking-[0.35em]">Audley Travel</p>
            <h1 className="text-white text-4xl font-serif font-semibold tracking-tight mt-2">
              GTT Country Snapshot
            </h1>
            <div className="mx-auto mt-4 h-px w-16 bg-[#c9a227]/80" />
            <p className="text-white/60 text-sm mt-3">The Global Travel Team destination reference</p>
          </div>

          {/* Login card */}
          <div className={`backdrop-blur-md bg-white/95 rounded-2xl shadow-2xl ring-1 ring-black/5 border border-white/20 overflow-hidden ${shaking ? "animate-shake" : ""}`}>
          <div className="h-1 bg-gradient-to-r from-[#c9a227] via-[#e7cb6b] to-[#c9a227]" />
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0e4d5c]/10 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0e4d5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Sign in</h2>
              <p className="text-sm text-gray-500 mt-1">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@audleytravel.com"
                  name="email"
                  autoComplete="email"
                  spellCheck={false}
                  disabled={loading}
                  autoFocus
                  required
                  className="w-full rounded-lg border border-gray-300 bg-gray-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4d5c]/30 focus:border-[#0e4d5c] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
                    onKeyUp={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
                    placeholder="Enter your password"
                    name="password"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-gray-50/50 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4d5c]/30 focus:border-[#0e4d5c] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition-colors hover:text-[#0e4d5c]"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {capsLock && (
                  <p className="mt-1.5 text-xs font-medium text-amber-600">Caps Lock is on</p>
                )}
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
              )}

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#0e4d5c]"
                  />
                  Keep me signed in
                </label>
                <Link href="/recover" className="text-sm text-[#0e4d5c] hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-b from-[#0e5a6e] to-[#0d4256] text-white px-4 py-2.5 text-sm font-medium hover:from-[#0d4256] hover:to-[#07222b] transition-all shadow-[var(--shadow-md)] active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? "Signing in..." : "Sign in"}
              </button>


            </form>
          </div>
          </div>
          <p className="text-center text-white/45 text-xs mt-6">Authorised Audley Travel staff only</p>
        </div>
      </div>
    </div>
  );
}
