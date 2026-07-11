import { createServiceClient } from "@/lib/supabase/server";

/**
 * Revenue recovery engine — the "faster payments" half of the mission.
 * Runs on a schedule (see /api/cron/revenue-recovery) and on each load-status
 * change to invoiced/paid. Detects the gap between what a load's rate
 * confirmation promised and what actually got paid, and between what
 * detention accrued and what got billed — then files a recovery item a
 * dispatcher can dispute with the broker in one click.
 *
 * Deliberately conservative: it only flags variance backed by a stored
 * rate_confirmed value (from a parsed rate con) or a closed detention_event
 * with billable_minutes > 0. It never estimates or invents an expected
 * amount.
 */
export async function scanForRevenueRecovery(companyId: string) {
  const supabase = createServiceClient();
  const created: string[] = [];

  // --- Short pays: rate_paid came in below what the rate con promised ---
  const { data: shortPayCandidates } = await supabase
    .from("loads")
    .select("id, rate_confirmed, rate_paid")
    .eq("company_id", companyId)
    .not("rate_paid", "is", null)
    .not("rate_confirmed", "is", null);

  for (const load of shortPayCandidates ?? []) {
    const expected = Number(load.rate_confirmed);
    const actual = Number(load.rate_paid);
    if (actual >= expected) continue;

    const { data: existing } = await supabase
      .from("revenue_recovery_items")
      .select("id")
      .eq("load_id", load.id)
      .eq("type", "short_pay")
      .maybeSingle();
    if (existing) continue;

    const { data: item } = await supabase
      .from("revenue_recovery_items")
      .insert({
        company_id: companyId,
        load_id: load.id,
        type: "short_pay",
        expected_amount: expected,
        actual_amount: actual,
        status: "flagged",
        detected_by: "system",
      })
      .select("id")
      .single();
    if (item) created.push(item.id);
  }

  // --- Unbilled detention: closed events with billable time, not yet on an invoice ---
  const { data: detentionCandidates } = await supabase
    .from("detention_events")
    .select("id, load_id, billable_minutes, rate_per_hour, claim_status")
    .eq("company_id", companyId)
    .not("check_out_at", "is", null)
    .gt("billable_minutes", 0)
    .eq("claim_status", "ready_to_bill");

  for (const event of detentionCandidates ?? []) {
    const amount = (Number(event.billable_minutes) / 60) * Number(event.rate_per_hour ?? 0);
    if (amount <= 0) continue;

    const { data: existing } = await supabase
      .from("revenue_recovery_items")
      .select("id")
      .eq("load_id", event.load_id)
      .eq("type", "unbilled_detention")
      .maybeSingle();
    if (existing) continue;

    const { data: item } = await supabase
      .from("revenue_recovery_items")
      .insert({
        company_id: companyId,
        load_id: event.load_id,
        type: "unbilled_detention",
        expected_amount: amount,
        actual_amount: 0,
        status: "flagged",
        detected_by: "system",
      })
      .select("id")
      .single();
    if (item) created.push(item.id);

    await supabase.from("detention_events").update({ claim_status: "submitted" }).eq("id", event.id);
  }

  return { itemsCreated: created.length };
}
