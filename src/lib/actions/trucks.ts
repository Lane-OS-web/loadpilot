"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTruck(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
  if (!profile) return { error: "No company found" };

  const unit_number = String(formData.get("unit_number") ?? "").trim();
  if (!unit_number) return { error: "Unit number is required" };

  const { error } = await supabase.from("trucks").insert({
    company_id: profile.company_id,
    unit_number,
    make: String(formData.get("make") ?? "") || null,
    model: String(formData.get("model") ?? "") || null,
    vin: String(formData.get("vin") ?? "") || null,
    status: "active",
  });

  if (error) return { error: error.message };
  revalidatePath("/trucks");
}
