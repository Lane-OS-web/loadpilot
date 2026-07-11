import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { updateRecoveryStatus } from "@/lib/actions/revenue-recovery";

export default async function RevenueRecoveryPage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("revenue_recovery_items")
    .select("*, loads ( load_number )")
    .order("created_at", { ascending: false });

  const totalFlagged = (items ?? [])
    .filter((i) => i.status === "flagged")
    .reduce((sum, i) => sum + Number(i.variance), 0);
  const totalRecovered = (items ?? [])
    .filter((i) => i.status === "recovered")
    .reduce((sum, i) => sum + Number(i.variance), 0);

  return (
    <div>
      <header className="bg-white border-b border-slate-100 px-7 py-4">
        <h1 className="font-display font-bold text-xl">Revenue Recovery</h1>
        <p className="text-sm text-slate-500">Short pays and unbilled detention, caught automatically</p>
      </header>

      <div className="p-7">
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-white rounded-card border border-slate-100 p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Flagged — needs action</div>
            <div className="font-mono font-semibold text-2xl text-amber-600">${totalFlagged.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-card border border-slate-100 p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Recovered to date</div>
            <div className="font-mono font-semibold text-2xl text-emerald-600">${totalRecovered.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white rounded-card border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Load</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Expected</th>
                <th className="px-5 py-3 font-semibold">Actual</th>
                <th className="px-5 py-3 font-semibold">Variance</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((item: any) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-mono text-xs">{item.loads?.load_number ?? "—"}</td>
                  <td className="px-5 py-3">{item.type.replace(/_/g, " ")}</td>
                  <td className="px-5 py-3 font-mono">${Number(item.expected_amount).toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono">${Number(item.actual_amount).toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono font-semibold text-amber-600">${Number(item.variance).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <Badge variant={item.status === "recovered" ? "green" : item.status === "disputed" ? "blue" : item.status === "written_off" ? "slate" : "amber"}>
                      {item.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    {item.status === "flagged" && (
                      <form action={updateRecoveryStatus.bind(null, item.id, "disputed")}>
                        <button className="text-xs font-semibold text-blue-600">File dispute</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {(!items || items.length === 0) && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Nothing flagged — the recovery engine scans hourly as loads are paid.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
