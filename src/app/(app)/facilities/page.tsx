import { createClient } from "@/lib/supabase/server";

export default async function FacilitiesPage() {
  const supabase = createClient();
  const { data: facilities } = await supabase
    .from("facilities")
    .select("*")
    .order("avg_detention_minutes", { ascending: false, nullsFirst: false });

  return (
    <div>
      <header className="bg-white border-b border-slate-100 px-7 py-4">
        <h1 className="font-display font-bold text-xl">Facilities</h1>
        <p className="text-sm text-slate-500">
          {facilities?.length ?? 0} shippers &amp; receivers — detention history builds automatically as loads run
        </p>
      </header>

      <div className="p-7">
        <div className="bg-white rounded-card border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Facility</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Avg. detention</th>
                <th className="px-5 py-3 font-semibold">Detention rate</th>
                <th className="px-5 py-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {(facilities ?? []).map((f) => (
                <tr key={f.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium">{f.name}</td>
                  <td className="px-5 py-3 text-slate-600">{f.city}, {f.state}</td>
                  <td className="px-5 py-3 font-mono text-xs">
                    {f.avg_detention_minutes ? `${Math.round(f.avg_detention_minutes)} min` : "No history yet"}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">
                    {f.detention_incident_rate ? `${Math.round(f.detention_incident_rate * 100)}%` : "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{f.dock_notes ?? "—"}</td>
                </tr>
              ))}
              {(!facilities || facilities.length === 0) && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No facilities yet — created automatically when you book your first load.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Averages recompute nightly from detention_events — a load headed to a facility with a high incident rate can prompt the dispatcher to negotiate detention terms up front.
        </p>
      </div>
    </div>
  );
}
