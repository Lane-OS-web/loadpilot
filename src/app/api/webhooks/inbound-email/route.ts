import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { extractLoadData } from "@/lib/ai/extract-load-data";

/**
 * Each carrier gets a dedicated inbound address, e.g.
 * loads+{company_id}@parse.loadpilot.com, which they set up as a forwarding
 * rule or CC on broker correspondence. Configure this URL as the inbound
 * parse webhook in SendGrid/Postmark and set INBOUND_EMAIL_WEBHOOK_SECRET
 * to match the value they sign requests with.
 */
export async function POST(req: Request) {
  const signature = req.headers.get("x-webhook-secret");
  if (signature !== process.env.INBOUND_EMAIL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = await req.json();
  const { to, from, subject, text } = payload as { to: string; from: string; subject: string; text: string };

  // "loads+<company_id>@parse.loadpilot.com" → pull the company id out of the plus-address.
  const companyId = to.match(/\+([a-f0-9-]{36})@/)?.[1];
  if (!companyId) {
    return NextResponse.json({ error: "Could not resolve company from inbound address" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: logRow } = await supabase
    .from("email_parse_log")
    .insert({ company_id: companyId, from_address: from, subject, raw_body: text, status: "received" })
    .select("id")
    .single();

  let extracted;
  try {
    extracted = await extractLoadData({ text: `Subject: ${subject}\n\n${text}` });
  } catch {
    await supabase.from("email_parse_log").update({ status: "needs_review" }).eq("id", logRow!.id);
    return NextResponse.json({ ok: true, status: "needs_review" });
  }

  await supabase
    .from("email_parse_log")
    .update({ ai_extracted: extracted as any, ai_confidence: extracted.confidence, status: "parsed" })
    .eq("id", logRow!.id);

  // Auto-book only when the model is confident AND the essentials are present.
  // Anything softer lands in email_parse_log as "needs_review" for a dispatcher
  // to confirm — the automation should never silently invent a rate or lane.
  const canAutoBook =
    extracted.confidence >= 0.9 &&
    extracted.rate &&
    extracted.origin_city &&
    extracted.destination_city &&
    extracted.load_number;

  if (!canAutoBook) {
    return NextResponse.json({ ok: true, status: "needs_review", extracted });
  }

  async function upsertFacility(city: string, state: string | null) {
    const { data: existing } = await supabase
      .from("facilities")
      .select("id")
      .eq("company_id", companyId)
      .eq("city", city)
      .eq("state", state ?? "")
      .maybeSingle();
    if (existing) return existing.id;
    const { data: created } = await supabase
      .from("facilities")
      .insert({ company_id: companyId, name: `${city} facility`, city, state, facility_type: "both" })
      .select("id")
      .single();
    return created!.id;
  }

  const originId = await upsertFacility(extracted.origin_city!, extracted.origin_state);
  const destinationId = await upsertFacility(extracted.destination_city!, extracted.destination_state);

  let brokerId: string | null = null;
  if (extracted.broker_name) {
    const { data: existingBroker } = await supabase
      .from("brokers")
      .select("id")
      .eq("company_id", companyId)
      .eq("name", extracted.broker_name)
      .maybeSingle();
    brokerId = existingBroker?.id ?? null;
    if (!brokerId) {
      const { data: newBroker } = await supabase
        .from("brokers")
        .insert({ company_id: companyId, name: extracted.broker_name })
        .select("id")
        .single();
      brokerId = newBroker!.id;
    }
  }

  const { data: load } = await supabase
    .from("loads")
    .insert({
      company_id: companyId,
      load_number: extracted.load_number!,
      broker_id: brokerId,
      origin_facility_id: originId,
      destination_facility_id: destinationId,
      equipment_type: extracted.equipment_type,
      weight_lbs: extracted.weight_lbs,
      miles: extracted.miles,
      rate_confirmed: extracted.rate,
      detention_free_minutes: (extracted.detention_free_hours ?? 2) * 60,
      detention_rate_per_hour: extracted.detention_rate_per_hour,
      status: "booked",
      booked_via: "email_parsed",
      source_board: "direct",
    })
    .select("id")
    .single();

  await supabase.from("email_parse_log").update({ status: "linked", linked_load_id: load!.id }).eq("id", logRow!.id);

  return NextResponse.json({ ok: true, status: "booked", loadId: load!.id });
}
