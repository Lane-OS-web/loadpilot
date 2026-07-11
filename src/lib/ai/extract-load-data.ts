/**
 * Shared extraction routine used by both the rate-confirmation parser
 * (documents) and the inbound-email parser (email_parse_log). Both feed
 * Claude the same schema so a load booked by email and a load booked by
 * uploaded PDF land in the same shape downstream.
 */

const EXTRACTION_SYSTEM_PROMPT = `You are a freight document parser for a trucking dispatch platform.
Extract structured data from rate confirmations, load tenders, and broker emails.
Return ONLY valid JSON matching this exact shape, no prose, no markdown fences:

{
  "load_number": string | null,
  "broker_name": string | null,
  "rate": number | null,
  "origin_city": string | null,
  "origin_state": string | null,
  "pickup_datetime": string | null,
  "destination_city": string | null,
  "destination_state": string | null,
  "delivery_datetime": string | null,
  "equipment_type": "reefer" | "dry_van" | "flatbed" | null,
  "weight_lbs": number | null,
  "miles": number | null,
  "detention_free_hours": number | null,
  "detention_rate_per_hour": number | null,
  "confidence": number
}

"confidence" is your own 0–1 estimate of extraction accuracy — lower it whenever
a field was ambiguous, handwritten, or you had to infer rather than read it directly.
If a field isn't present in the source, use null rather than guessing.`;

export interface ExtractedLoadData {
  load_number: string | null;
  broker_name: string | null;
  rate: number | null;
  origin_city: string | null;
  origin_state: string | null;
  pickup_datetime: string | null;
  destination_city: string | null;
  destination_state: string | null;
  delivery_datetime: string | null;
  equipment_type: "reefer" | "dry_van" | "flatbed" | null;
  weight_lbs: number | null;
  miles: number | null;
  detention_free_hours: number | null;
  detention_rate_per_hour: number | null;
  confidence: number;
}

/**
 * Extracts structured load data from either raw email text or a base64
 * document (PDF/image). Uses Claude's vision input for documents so scanned
 * or photographed rate cons parse the same way as clean PDFs.
 */
export async function extractLoadData(input: {
  text?: string;
  documentBase64?: string;
  documentMediaType?: string;
}): Promise<ExtractedLoadData> {
  const content: any[] = [];

  if (input.documentBase64) {
    content.push({
      type: input.documentMediaType === "application/pdf" ? "document" : "image",
      source: {
        type: "base64",
        media_type: input.documentMediaType ?? "application/pdf",
        data: input.documentBase64,
      },
    });
  }
  if (input.text) {
    content.push({ type: "text", text: input.text });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI extraction failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const textBlock = data.content.find((b: any) => b.type === "text");
  if (!textBlock) throw new Error("AI extraction returned no text block");

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as ExtractedLoadData;
}
