"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateRecoveryStatus(
  itemId: string,
  status: "disputed" | "recovered" | "written_off"
) {
  const supabase = createClient();
  await supabase
    .from("revenue_recovery_items")
    .update({ status, resolved_at: status === "recovered" ? new Date().toISOString() : null })
    .eq("id", itemId);

  revalidatePath("/revenue-recovery");
}
