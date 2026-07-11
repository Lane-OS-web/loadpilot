"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const LoadSchema = z.object({
  load_number: z.string().min(1, "Load number is required"),
  equipment_type: z.enum(["reefer", "dry_van", "flatbed"]),
  origin_city: z.string().min(1),
  origin_state: z.string().length(2),
  destination_city: z.string().min(1),
  destination_state: z.string().length(2),
  rate_confirmed: z.coerce.number().positive("Rate must be greater than 0"),
  miles: z.coerce.number().positive().optional(),
});

export async function createLoad(formData: FormData) {
  const parsed = LoadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "No company found for this user" };

  const d = parsed.data;

  // Facilities are looked up-or-created by name+city+state so the same
  // shipper/receiver accumulates detention history across loads instead
  // of forking into duplicate rows every time it's typed differently.
  async function upsertFacility(name: string, city: string, state: string) {
    const { data: existing } = await supabase
      .from("facilities")
      .select("id")
      .eq("company_id", profile!.company_id)
      .eq("name", name)
      .eq("city", city)
      .eq("state", state)
      .maybeSingle();
    if (existing) return existing.id;

    const { data: created, error } = await supabase
      .from("facilities")
      .insert({ company_id: profile!.company_id, name, city, state, facility_type: "both" })
      .select("id")
      .single();
    if (error) throw error;
    return created.id;
  }

  const originId = await upsertFacility(`${d.origin_city} shipper`, d.origin_city, d.origin_state);
  const destinationId = await upsertFacility(`${d.destination_city} receiver`, d.destination_city, d.destination_state);

  const { data: load, error } = await supabase
    .from("loads")
    .insert({
      company_id: profile.company_id,
      load_number: d.load_number,
      equipment_type: d.equipment_type,
      origin_facility_id: originId,
      destination_facility_id: destinationId,
      rate_confirmed: d.rate_confirmed,
      miles: d.miles ?? null,
      status: "booked",
      booked_via: "manual",
      detention_free_minutes: 120,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/loads");
  redirect(`/loads/${load.id}`);
}
