"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createDriver(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
  if (!profile) return { error: "No company found" };

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) return { error: "Name is required" };

  const { error } = await supabase.from("drivers").insert({
    company_id: profile.company_id,
    full_name,
    phone: String(formData.get("phone") ?? "") || null,
    cdl_number: String(formData.get("cdl_number") ?? "") || null,
    cdl_expires_on: String(formData.get("cdl_expires_on") ?? "") || null,
    status: "active",
  });

  if (error) return { error: error.message };
  revalidatePath("/drivers");
}
