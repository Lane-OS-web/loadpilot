"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // 1. Create the auth user.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !signUpData.user) {
      setError(signUpError?.message ?? "Could not create account.");
      setLoading(false);
      return;
    }

    // 2. Bootstrap the tenant. This runs as a SECURITY DEFINER RPC so the
    // new user can create exactly one company + owner profile for themself,
    // never an arbitrary company_id via a client-side insert.
    const { error: rpcError } = await supabase.rpc("create_company_and_owner", {
      company_name: companyName,
      owner_full_name: fullName,
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <span className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-green to-brand-greenDark" />
          <span className="font-display font-bold text-white text-lg">LoadPilot</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-card p-7 shadow-xl">
          <h1 className="font-display font-bold text-xl mb-1">Set up your carrier</h1>
          <p className="text-sm text-slate-500 mb-6">Takes under 10 minutes to start booking.</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm px-3 py-2">
              {error}
            </div>
          )}

          {[
            { label: "Your name", value: fullName, set: setFullName, type: "text", placeholder: "Maria Perez" },
            { label: "Company name", value: companyName, set: setCompanyName, type: "text", placeholder: "Perez Logistics LLC" },
            { label: "Email", value: email, set: setEmail, type: "email", placeholder: "you@yourcarrier.com" },
            { label: "Password", value: password, set: setPassword, type: "password", placeholder: "••••••••" },
          ].map((f) => (
            <div key={f.label} className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 mb-1">{f.label}</label>
              <input
                type={f.type}
                required
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-lg py-2.5 text-sm transition disabled:opacity-60 mt-2"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already on LoadPilot?{" "}
            <Link href="/login" className="text-brand-green font-semibold">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
