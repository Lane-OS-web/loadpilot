import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();

  const [{ count: inTransitCount }, { data: recovery }, { data: detention }] = await Promise.all([
    supabase.from("loads").select("*", { count: "exact", head: true }).eq("status", "in_transit"),
    supabase.from("revenue_recovery_items").select("variance").eq("status", "recovered"),
    supabase.from("detention_events").select("billable_minutes, rate_per_hour").is("check_out_at", null),
  ]);

  const recoveredThisMonth = (recovery ?? []).reduce((sum, r: any) => sum + Number(r.variance ?? 0), 0);
  const activeDetentionDollars = (detention ?? []).reduce(
    (sum, d: any) => sum + (Number(d.billable_minutes ?? 0) / 60) * Number(d.rate_per_hour ?? 0),
    0
  );

  const kpis = [
    { label: "Loads in transit", value: inTransitCount ?? 0 },
    { label: "Revenue recovered (MTD)", value: `$${recoveredThisMonth.toLocaleString()}`, tone: "green" },
    { label: "Active detention", value: `$${activeDetentionDollars.toFixed(0)}`, tone: "amber" },
  ];

  return (
    <div>
      <header className="bg-white border-b border-slate-100 px-7 py-4">
        <h1 className="font-display font-bold text-xl">Dashboard</h1>
      </header>
      <div className="p-7 grid grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-card border border-slate-100 p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{k.label}</div>
            <div
              className={
                "font-mono font-semibold text-2xl " +
                (k.tone === "green" ? "text-emerald-600" : k.tone === "amber" ? "text-amber-600" : "")
              }
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
