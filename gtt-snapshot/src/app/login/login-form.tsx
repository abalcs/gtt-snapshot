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

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoUrl] = useState(() =>
    BACKGROUND_VIDEOS[Math.floor(Math.random() * BACKGROUND_VIDEOS.length)]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
        setError(data.error || "Invalid email or password");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong");
      setLoading(false);
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
          <div className="backdrop-blur-md bg-white/95 rounded-xl shadow-2xl border border-white/20 overflow-hidden">
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
                  autoFocus
                  required
                  className="w-full rounded-lg border border-gray-300 bg-gray-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4d5c]/30 focus:border-[#0e4d5c] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-gray-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4d5c]/30 focus:border-[#0e4d5c] transition-colors"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
              )}

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

              <div className="text-center">
                <Link href="/recover" className="text-sm text-[#0e4d5c] hover:underline">
                  Forgot password?
                </Link>
              </div>
            </form>
          </div>
          </div>
          <p className="text-center text-white/45 text-xs mt-6">Authorised Audley Travel staff only</p>
        </div>
      </div>
    </div>
  );
}
