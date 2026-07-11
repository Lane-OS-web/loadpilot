import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, loadStatusBadge } from "@/components/ui/badge";

export default async function LoadDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: load } = await supabase
    .from("loads")
    .select(`
      *, drivers ( full_name ), brokers ( name, credit_rating ),
      origin:origin_facility_id ( name, city, state ),
      destination:destination_facility_id ( name, city, state )
    `)
    .eq("id", params.id)
    .single();

  if (!load) notFound();

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("load_id", params.id);

  const { data: detentionEvents } = await supabase
    .from("detention_events")
    .select("*")
    .eq("load_id", params.id);

  const badge = loadStatusBadge((load as any).status);

  return (
    <div>
      <header className="bg-white border-b border-slate-100 px-7 py-4">
        <Link href="/loads" className="text-sm text-slate-500">← Load board</Link>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="font-display font-bold text-xl font-mono">{(load as any).load_number}</h1>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </header>

      <div className="p-7 grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-card border border-slate-100 p-5">
            <h3 className="font-semibold text-sm mb-4">Lane</h3>
            <div className="flex items-center gap-6">
              <div>
                <div className="font-semibold">{(load as any).origin?.city}, {(load as any).origin?.state}</div>
                <div className="text-xs text-slate-400">Pickup</div>
              </div>
              <div className="flex-1 border-t border-dashed border-slate-200" />
              <div className="text-right">
                <div className="font-semibold">{(load as any).destination?.city}, {(load as any).destination?.state}</div>
                <div className="text-xs text-slate-400">Delivery</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100 text-sm">
              <div><div className="text-xs text-slate-400 mb-0.5">Driver</div>{(load as any).drivers?.full_name ?? "Unassigned"}</div>
              <div><div className="text-xs text-slate-400 mb-0.5">Broker</div>{(load as any).brokers?.name ?? "—"}</div>
              <div><div className="text-xs text-slate-400 mb-0.5">Rate</div><span className="font-mono font-semibold">${Number((load as any).rate_confirmed ?? 0).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-card border border-slate-100 p-5">
            <h3 className="font-semibold text-sm mb-4">Documents</h3>
            {(documents ?? []).length === 0 && (
              <p className="text-sm text-slate-400">No documents filed yet for this load.</p>
            )}
            <div className="space-y-2">
              {(documents ?? []).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
                  <div className="text-sm font-medium">{doc.file_name ?? doc.doc_type}</div>
                  <Badge variant={doc.status === "filed" ? "green" : doc.status === "needs_review" ? "amber" : "red"}>
                    {doc.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-card border border-slate-100 p-5">
            <h3 className="font-semibold text-sm mb-3">Detention</h3>
            {(detentionEvents ?? []).length === 0 && (
              <p className="text-sm text-slate-400">No detention recorded on this load.</p>
            )}
            {(detentionEvents ?? []).map((ev) => (
              <div key={ev.id} className="text-sm mb-2">
                <div className="font-mono font-semibold">{ev.billable_minutes} min billable</div>
                <div className="text-xs text-slate-400">{ev.claim_status.replace("_", " ")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
