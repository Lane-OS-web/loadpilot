import Link from "next/link";
import { createLoad } from "@/lib/actions/loads";

export default function NewLoadPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <Link href="/loads" className="text-sm text-slate-500 mb-4 inline-block">← Back to load board</Link>
      <h1 className="font-display font-bold text-xl mb-6">Book a load</h1>

      <form action={createLoad} className="bg-white rounded-card border border-slate-100 p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Load number</label>
          <input name="load_number" required placeholder="LP-48213" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Equipment type</label>
          <select name="equipment_type" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="reefer">Reefer</option>
            <option value="dry_van">Dry van</option>
            <option value="flatbed">Flatbed</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Origin city</label>
            <input name="origin_city" required placeholder="Dallas" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">State</label>
            <input name="origin_state" required maxLength={2} placeholder="TX" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm uppercase" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Destination city</label>
            <input name="destination_city" required placeholder="Atlanta" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">State</label>
            <input name="destination_state" required maxLength={2} placeholder="GA" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm uppercase" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Rate ($)</label>
            <input name="rate_confirmed" type="number" step="0.01" required placeholder="2450" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Miles (optional)</label>
            <input name="miles" type="number" placeholder="318" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
        </div>

        <button type="submit" className="w-full bg-brand-green hover:bg-brand-greenDark text-white font-semibold rounded-lg py-2.5 text-sm">
          Book load
        </button>
        <p className="text-xs text-slate-400 text-center">
          Prefer not to type this in? Forward the rate confirmation email instead — the AI parser in Phase 3 fills this form for you.
        </p>
      </form>
    </div>
  );
}
