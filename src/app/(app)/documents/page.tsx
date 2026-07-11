import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { DocumentUploadForm } from "@/components/documents/upload-form";

export default async function DocumentsPage() {
  const supabase = createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("*, loads ( load_number )")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <header className="bg-white border-b border-slate-100 px-7 py-4">
        <h1 className="font-display font-bold text-xl">Document Center</h1>
        <p className="text-sm text-slate-500">{documents?.length ?? 0} documents</p>
      </header>

      <div className="p-7 grid grid-cols-3 gap-5">
        <div className="col-span-2 grid grid-cols-2 gap-3 content-start">
          {(documents ?? []).map((doc: any) => (
            <div key={doc.id} className="bg-white rounded-card border border-slate-100 p-4">
              <div className="flex justify-between items-start mb-6">
                <div className="text-xs font-semibold text-slate-500 uppercase">{doc.doc_type.replace(/_/g, " ")}</div>
                <Badge variant={doc.status === "filed" ? "green" : doc.status === "needs_review" ? "amber" : doc.status === "missing" ? "red" : "blue"}>
                  {doc.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="font-semibold text-sm">{doc.file_name ?? "Untitled document"}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">{doc.loads?.load_number ?? "Unlinked"}</div>
              {doc.ai_confidence != null && (
                <div className="text-xs text-slate-400 mt-2">AI confidence: {Math.round(doc.ai_confidence * 100)}%</div>
              )}
            </div>
          ))}
          {(!documents || documents.length === 0) && (
            <div className="col-span-2 text-center text-slate-400 py-10 bg-white rounded-card border border-slate-100">
              No documents yet.
            </div>
          )}
        </div>

        <DocumentUploadForm />
      </div>
    </div>
  );
}
