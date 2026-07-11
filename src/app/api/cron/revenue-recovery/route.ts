import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { scanForRevenueRecovery } from "@/lib/engine/revenue-recovery";

/**
 * Configure as a Vercel Cron job (vercel.json) hitting this route hourly:
 *   { "crons": [{ "path": "/api/cron/revenue-recovery", "schedule": "0 * * * *" }] }
 * Protected by a bearer token so it can't be triggered by anyone else.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: companies } = await supabase.from("companies").select("id");

  let totalCreated = 0;
  for (const company of companies ?? []) {
    const { itemsCreated } = await scanForRevenueRecovery(company.id);
    totalCreated += itemsCreated;
  }

  return NextResponse.json({ ok: true, companiesScanned: companies?.length ?? 0, itemsCreated: totalCreated });
}
