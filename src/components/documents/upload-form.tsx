"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DocumentUploadForm() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile) return;

    const path = `${profile.company_id}/unfiled/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: doc, error: insertError } = await supabase
      .from("documents")
      .insert({
        company_id: profile.company_id,
        uploaded_by: user.id,
        doc_type: "other",
        status: "processing",
        storage_path: path,
        file_name: file.name,
        mime_type: file.type,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setUploading(false);
      return;
    }

    // Hand off to the AI parser (Phase 3) — it reads the file from Storage,
    // extracts fields, matches it to a load, and updates this row's status.
    await fetch("/api/parse-rate-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: doc.id }),
    });

    setUploading(false);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-card border border-dashed border-slate-200 p-6 h-fit text-center">
      <h3 className="font-semibold text-sm mb-1">Upload a document</h3>
      <p className="text-xs text-slate-500 mb-4">Rate cons, BOLs, PODs, lumper receipts — LoadPilot reads and files them automatically.</p>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <label className="inline-block bg-navy-950 hover:bg-navy-800 text-white text-sm font-semibold rounded-lg px-4 py-2.5 cursor-pointer">
        {uploading ? "Uploading…" : "Choose file"}
        <input type="file" onChange={handleFile} className="hidden" accept="application/pdf,image/*" />
      </label>
    </div>
  );
}
