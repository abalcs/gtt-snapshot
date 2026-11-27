"use client";

import { useState } from "react";
import Link from "next/link";

export interface LoginSpot {
  name: string;
  slug: string;
  imageUrl: string;
  peakLabel: string | null;
  population: string | null;
}

export function LoginForm({ hero = null }: { hero?: LoginSpot | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [remember, setRemember] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [entering, setEntering] = useState(false);

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
          // A short branded pause between sign-in and the app, purely for feel.
          setEntering(true);
          const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          window.setTimeout(() => {
            window.location.href = "/";
          }, reduced ? 250 : 1800);
        }
        return;
      } else {
        fail(data.error || "Invalid email or password");
      }
    } catch {
      fail("Something went wrong. Check your connection and try again.");
    }
  };

  if (entering) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf6ee] px-6">
        <div className="animate-fade-up text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/audley-logo-green.png"
            alt="Audley Travel"
            className="mx-auto h-12 w-auto"
          />
          <p className="mt-6 font-serif text-2xl font-semibold tracking-tight text-[#0e4d5c]">
            GTT Country Snapshot
          </p>
          <div className="mx-auto mt-6 h-[3px] w-52 overflow-hidden rounded-full bg-[#0e4d5c]/10">
            <div className="animate-loadbar h-full w-full rounded-full bg-gradient-to-r from-[#c9a227] via-[#e7cb6b] to-[#c9a227]" />
          </div>
          <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.3em] text-gray-400">
            Preparing your snapshot
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Photo panel */}
      {hero && (
        <div className="relative h-60 shrink-0 overflow-hidden sm:h-72 lg:h-auto lg:w-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07222b]/85 via-transparent to-[#07222b]/35" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/audley-logo-white.png"
            alt="Audley Travel"
            className="absolute left-6 top-6 h-7 w-auto lg:left-10 lg:top-10"
          />
          <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10">
            <p className="font-serif text-3xl font-semibold text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.55)] lg:text-5xl">
              {hero.name}
            </p>
            {hero.peakLabel && (
              <p className="mt-2 text-sm text-white/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
                Peak season: {hero.peakLabel}
              </p>
            )}
            {hero.population && (
              <p className="mt-0.5 text-sm text-white/65 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
                Population: {hero.population}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-[#faf6ee] px-6 py-10">
        <div className={`w-full max-w-sm animate-fade-up ${shaking ? "animate-shake" : ""}`}>
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/audley-logo-green.png"
              alt="Audley Travel"
              className="mx-auto h-10 w-auto"
            />
            <h1 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-[#0e4d5c]">
              Welcome back
            </h1>
            <div className="mx-auto mt-3 h-px w-16 bg-[#c9a227]/80" />
            <p className="mt-3 text-sm text-gray-500">
              Sign in to the GTT Country Snapshot
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4d5c]/30 focus:border-[#0e4d5c] transition-colors"
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4d5c]/30 focus:border-[#0e4d5c] transition-colors"
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

          <p className="mt-8 text-center text-xs text-gray-400">
            Authorised Audley Travel staff only
          </p>
        </div>
      </div>
    </div>
  );
}
