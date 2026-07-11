import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, loadStatusBadge } from "@/components/ui/badge";

export const revalidate = 0; // always fresh — dispatch is live operational data

export default async function LoadsPage() {
  const supabase = createClient();

  const { data: loads } = await supabase
    .from("loads")
    .select(`
      id, load_number, status, rate_confirmed, equipment_type,
      pickup_appointment, delivery_appointment,
      drivers ( full_name ),
      brokers ( name ),
      origin:origin_facility_id ( name, city, state ),
      destination:destination_facility_id ( name, city, state )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <header className="bg-white border-b border-slate-100 px-7 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-display font-bold text-xl">Load Board</h1>
          <p className="text-sm text-slate-500">{loads?.length ?? 0} loads</p>
        </div>
        <Link
          href="/loads/new"
          className="bg-brand-green hover:bg-brand-greenDark text-white text-sm font-semibold rounded-lg px-4 py-2.5"
        >
          + New load
        </Link>
      </header>

      <div className="p-7">
        <div className="bg-white rounded-card border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Load</th>
                <th className="px-5 py-3 font-semibold">Lane</th>
                <th className="px-5 py-3 font-semibold">Driver</th>
                <th className="px-5 py-3 font-semibold">Broker</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Rate</th>
              </tr>
            </thead>
            <tbody>
              {(loads ?? []).map((load: any) => {
                const badge = loadStatusBadge(load.status);
                return (
                  <tr key={load.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/loads/${load.id}`} className="font-mono text-xs text-blue-600 font-semibold">
                        {load.load_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-medium">
                      {load.origin?.city ?? "—"}, {load.origin?.state ?? ""}
                      <span className="text-slate-400 mx-1.5">→</span>
                      {load.destination?.city ?? "—"}, {load.destination?.state ?? ""}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{load.drivers?.full_name ?? "Unassigned"}</td>
                    <td className="px-5 py-3 text-slate-600">{load.brokers?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-5 py-3 font-mono font-semibold">
                      {load.rate_confirmed ? `$${Number(load.rate_confirmed).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                );
              })}
              {(!loads || loads.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                    No loads yet. <Link href="/loads/new" className="text-brand-green font-semibold">Book your first load</Link>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
