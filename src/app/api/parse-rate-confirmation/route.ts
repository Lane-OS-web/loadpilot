import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { extractLoadData } from "@/lib/ai/extract-load-data";

/**
 * POST { documentId } — called right after a document uploads.
 * Uses the service-role client (bypasses RLS) because this runs outside a
 * user request context, but every query below is explicitly scoped by the
 * document's own company_id, so it can never touch another tenant's data.
 */
export async function POST(req: Request) {
  const { documentId } = await req.json();
  if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });

  const supabase = createServiceClient();

  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();
  if (docError || !document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("documents")
    .download(document.storage_path);
  if (downloadError || !fileBlob) {
    return NextResponse.json({ error: "Could not download document" }, { status: 500 });
  }

  const buffer = Buffer.from(await fileBlob.arrayBuffer());
  const base64 = buffer.toString("base64");

  let extracted;
  try {
    extracted = await extractLoadData({
      documentBase64: base64,
      documentMediaType: document.mime_type ?? "application/pdf",
    });
  } catch (err: any) {
    await supabase.from("documents").update({ status: "needs_review" }).eq("id", documentId);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  // Try to match this document to an existing load by load_number.
  let loadId: string | null = null;
  if (extracted.load_number) {
    const { data: match } = await supabase
      .from("loads")
      .select("id")
      .eq("company_id", document.company_id)
      .eq("load_number", extracted.load_number)
      .maybeSingle();
    loadId = match?.id ?? null;
  }

  const needsReview = extracted.confidence < 0.85 || !extracted.rate || !extracted.load_number;

  await supabase
    .from("documents")
    .update({
      doc_type: "rate_confirmation",
      status: needsReview ? "needs_review" : "filed",
      load_id: loadId,
      ai_extracted_fields: extracted as any,
      ai_confidence: extracted.confidence,
      ai_model: "claude-sonnet-4-6",
    })
    .eq("id", documentId);

  return NextResponse.json({ extracted, matchedLoadId: loadId, needsReview });
}
