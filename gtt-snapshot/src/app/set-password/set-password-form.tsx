"use client";

import { useState } from "react";

export function SetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const hasLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const passwordsMatch = password === confirm && confirm.length > 0;
  const allValid = hasLength && hasLetter && hasNumber && hasSpecial && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.recovery_codes) {
          setRecoveryCodes(data.recovery_codes);
        } else {
          window.location.href = "/";
        }
      } else {
        setError(data.error || "Something went wrong");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  const handleCopyAll = async () => {
    if (!recoveryCodes) return;
    await navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Check = ({ ok }: { ok: boolean }) => (
    <span className={`inline-block w-4 h-4 rounded-full text-xs leading-4 text-center ${ok ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
      {ok ? "\u2713" : "\u2022"}
    </span>
  );

  if (recoveryCodes) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="bg-[#0e4d5c] px-6 py-4">
          <h1 className="text-white text-xl font-serif font-bold tracking-tight">
            GTT Country Snapshot
          </h1>
          <p className="text-white/70 text-sm">Audley Travel</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0e4d5c]/10 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0e4d5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Your recovery codes</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Save these codes somewhere safe. You can use them to reset your password if you forget it.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {recoveryCodes.map((code, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-center font-mono text-sm tracking-wider text-gray-800"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <button
                onClick={handleCopyAll}
                className="w-full rounded-md border border-gray-300 bg-white text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors mb-3"
              >
                {copied ? "Copied!" : "Copy all codes"}
              </button>

              <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
                <p className="text-xs text-amber-800">
                  These codes will not be shown again. Each code can only be used once.
                </p>
              </div>

              <button
                onClick={() => { window.location.href = "/"; }}
                className="w-full rounded-md bg-[#0e4d5c] text-white px-4 py-2 text-sm font-medium hover:bg-[#2a4a40] transition-colors"
              >
                I&apos;ve saved my codes — Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header bar */}
      <div className="bg-[#0e4d5c] px-6 py-4">
        <h1 className="text-white text-xl font-serif font-bold tracking-tight">
          GTT Country Snapshot
        </h1>
        <p className="text-white/70 text-sm">Audley Travel</p>
      </div>

      {/* Set password card */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0e4d5c]/10 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0e4d5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Set your password</h2>
              <p className="text-sm text-gray-500 mt-1">Choose a secure password for your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4d5c] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e4d5c] focus:border-transparent"
                />
              </div>

              {/* Validation indicators */}
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2"><Check ok={hasLength} /> <span className={hasLength ? "text-green-700" : "text-gray-500"}>At least 8 characters</span></div>
                <div className="flex items-center gap-2"><Check ok={hasLetter} /> <span className={hasLetter ? "text-green-700" : "text-gray-500"}>Contains a letter</span></div>
                <div className="flex items-center gap-2"><Check ok={hasNumber} /> <span className={hasNumber ? "text-green-700" : "text-gray-500"}>Contains a number</span></div>
                <div className="flex items-center gap-2"><Check ok={hasSpecial} /> <span className={hasSpecial ? "text-green-700" : "text-gray-500"}>Contains a special character</span></div>
                <div className="flex items-center gap-2"><Check ok={passwordsMatch} /> <span className={passwordsMatch ? "text-green-700" : "text-gray-500"}>Passwords match</span></div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={!allValid || loading}
                className="w-full rounded-md bg-[#0e4d5c] text-white px-4 py-2 text-sm font-medium hover:bg-[#2a4a40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Setting password..." : "Set password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
