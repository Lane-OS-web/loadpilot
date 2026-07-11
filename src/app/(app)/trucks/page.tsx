import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { createTruck } from "@/lib/actions/trucks";

export default async function TrucksPage() {
  const supabase = createClient();
  const { data: trucks } = await supabase.from("trucks").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <header className="bg-white border-b border-slate-100 px-7 py-4">
        <h1 className="font-display font-bold text-xl">Trucks</h1>
        <p className="text-sm text-slate-500">{trucks?.length ?? 0} trucks</p>
      </header>

      <div className="p-7 grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-card border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Unit #</th>
                <th className="px-5 py-3 font-semibold">Make / Model</th>
                <th className="px-5 py-3 font-semibold">ELD linked</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {(trucks ?? []).map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-mono font-semibold">{t.unit_number}</td>
                  <td className="px-5 py-3 text-slate-600">{[t.make, t.model].filter(Boolean).join(" ") || "—"}</td>
                  <td className="px-5 py-3">{t.eld_device_id ? <Badge variant="green">Connected</Badge> : <Badge variant="slate">Not linked</Badge>}</td>
                  <td className="px-5 py-3"><Badge variant={t.status === "active" ? "green" : "slate"}>{t.status}</Badge></td>
                </tr>
              ))}
              {(!trucks || trucks.length === 0) && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No trucks yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <form action={createTruck} className="bg-white rounded-card border border-slate-100 p-5 h-fit space-y-3">
          <h3 className="font-semibold text-sm mb-1">Add truck</h3>
          <input name="unit_number" required placeholder="Unit number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <input name="make" placeholder="Make" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <input name="model" placeholder="Model" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <input name="vin" placeholder="VIN" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <button className="w-full bg-navy-950 hover:bg-navy-800 text-white font-semibold rounded-lg py-2.5 text-sm">Add truck</button>
        </form>
      </div>
    </div>
  );
}
