import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function BrokersPage() {
  const supabase = createClient();
  const { data: brokers } = await supabase
    .from("brokers")
    .select("*")
    .order("total_revenue", { ascending: false });

  return (
    <div>
      <header className="bg-white border-b border-slate-100 px-7 py-4">
        <h1 className="font-display font-bold text-xl">Brokers</h1>
        <p className="text-sm text-slate-500">{brokers?.length ?? 0} brokers on file — auto-populated as loads are booked</p>
      </header>

      <div className="p-7">
        <div className="bg-white rounded-card border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Broker</th>
                <th className="px-5 py-3 font-semibold">Credit rating</th>
                <th className="px-5 py-3 font-semibold">Avg. days to pay</th>
                <th className="px-5 py-3 font-semibold">Loads booked</th>
                <th className="px-5 py-3 font-semibold">Total revenue</th>
              </tr>
            </thead>
            <tbody>
              {(brokers ?? []).map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium">{b.name}</td>
                  <td className="px-5 py-3">
                    {b.credit_rating ? (
                      <Badge variant={b.credit_rating === "A" ? "green" : b.credit_rating === "B" ? "blue" : "amber"}>
                        {b.credit_rating}
                      </Badge>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{b.avg_days_to_pay ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs">{b.loads_booked_count}</td>
                  <td className="px-5 py-3 font-mono font-semibold">${Number(b.total_revenue).toLocaleString()}</td>
                </tr>
              ))}
              {(!brokers || brokers.length === 0) && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No brokers yet — they're created automatically the first time you book a load with them.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Credit rating and days-to-pay populate from a credit API integration in Phase 4 — for now they're editable manually.
        </p>
      </div>
    </div>
  );
}
