import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { createDriver } from "@/lib/actions/drivers";

export default async function DriversPage() {
  const supabase = createClient();
  const { data: drivers } = await supabase
    .from("drivers")
    .select("*, trucks:assigned_truck_id ( unit_number )")
    .order("created_at", { ascending: false });

  return (
    <div>
      <header className="bg-white border-b border-slate-100 px-7 py-4">
        <h1 className="font-display font-bold text-xl">Drivers</h1>
        <p className="text-sm text-slate-500">{drivers?.length ?? 0} drivers</p>
      </header>

      <div className="p-7 grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-card border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Truck</th>
                <th className="px-5 py-3 font-semibold">CDL expires</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {(drivers ?? []).map((d: any) => (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium">{d.full_name}</td>
                  <td className="px-5 py-3 text-slate-600 font-mono text-xs">{d.trucks?.unit_number ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{d.cdl_expires_on ?? "—"}</td>
                  <td className="px-5 py-3"><Badge variant={d.status === "active" ? "green" : "slate"}>{d.status.replace("_", " ")}</Badge></td>
                </tr>
              ))}
              {(!drivers || drivers.length === 0) && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No drivers yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <form action={createDriver as unknown as (formData: FormData) => void} className="bg-white rounded-card border border-slate-100 p-5 h-fit space-y-3">
          <h3 className="font-semibold text-sm mb-1">Add driver</h3>
          <input name="full_name" required placeholder="Full name" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <input name="phone" placeholder="Phone" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <input name="cdl_number" placeholder="CDL number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <input name="cdl_expires_on" type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <button className="w-full bg-navy-950 hover:bg-navy-800 text-white font-semibold rounded-lg py-2.5 text-sm">Add driver</button>
        </form>
      </div>
    </div>
  );
}
