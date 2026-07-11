"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(searchParams.get("redirectTo") ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <span className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-green to-brand-greenDark" />
          <span className="font-display font-bold text-white text-lg">LoadPilot</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-card p-7 shadow-xl">
          <h1 className="font-display font-bold text-xl mb-1">Sign in</h1>
          <p className="text-sm text-slate-500 mb-6">Run your loads, not your paperwork.</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-green"
            placeholder="you@yourcarrier.com"
          />

          <label className="block text-xs font-semibold text-slate-500 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-brand-green"
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-lg py-2.5 text-sm transition disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-center text-sm text-slate-500 mt-5">
            New carrier?{" "}
            <Link href="/signup" className="text-brand-green font-semibold">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
