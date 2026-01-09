import type { PopupSpec, PopupType } from "./spec";

export function defaultsForType(type: PopupType) {
  if (type === "banner") return { maxWidth: 860, cornerRadius: 14, padding: 14 };
  if (type === "slideup") return { maxWidth: 520, cornerRadius: 16, padding: 16 };
  return { maxWidth: 420, cornerRadius: 16, padding: 16 }; // modal
}

export function generateSpecDeterministic(
  prompt: string,
  brandColor: string,
  mode: "light" | "dark",
  type: PopupType
): PopupSpec {
  const lower = prompt.toLowerCase();

  const wantsImage = /image|banner|visual|product|logo/.test(lower);
  const hasSecondary = /secondary|later|not now|dismiss/.test(lower);

  const headline =
    /welcome|onboard|new user/.test(lower) ? "Welcome!" :
    /discount|offer|sale|%|coupon/.test(lower) ? "Limited-time offer" :
    /update|announce|new feature/.test(lower) ? "What’s new" :
    "Quick update";

  let body =
    /discount|offer|sale|%|coupon/.test(lower)
      ? "Unlock your deal now. Limited time only."
      : /welcome|onboard|new user/.test(lower)
        ? "Here’s a quick tour to help you get started."
        : "Take a moment to review this message.";

  if (/more urgent|urgent|hurry/.test(lower)) body = body.replace(/Limited time only\.?/i, "Ends soon.");
  if (/minimal|minimalist|shorter|shorten/.test(lower)) body = body.slice(0, 70).replace(/\s+\S*$/, "") + ".";

  const primaryLabel =
    /shop/.test(lower) ? "Shop Now" :
    /learn/.test(lower) ? "Learn More" :
    /start/.test(lower) ? "Get Started" :
    "Continue";

  const dflt = defaultsForType(type);

  return {
    type,
    version: "1.0",
    layout: {
      structure: wantsImage ? "image_top" : "no_image",
      padding: dflt.padding,
      cornerRadius: dflt.cornerRadius,
      maxWidth: dflt.maxWidth,
    },
    theme: {
      mode,
      brandColor,
      backgroundColor: mode === "dark" ? "#0B1220" : "#FFFFFF",
      textColor: mode === "dark" ? "#E5E7EB" : "#0F172A",
      mutedTextColor: mode === "dark" ? "#9CA3AF" : "#475569",
    },
    content: {
      headline,
      body,
      image: wantsImage
        ? { kind: "url", url: "https://placehold.co/800x400/png", alt: "Placeholder image" }
        : { kind: "none" },
    },
    ctas: [
      { id: "primary", label: primaryLabel, action: { type: "url", value: "https://example.com" }, style: "primary" },
      ...(hasSecondary ? [{ id: "secondary", label: "Later", action: { type: "dismiss" }, style: "secondary" }] : []),
    ],
    behavior: {
      dismissible: true,
      backdrop: true,
    },
    warnings: [],
  };
}

/**
 * Live AI mode (client-side) using OpenAI Responses API.
 * Note: Because this runs in the browser, user-provided API keys are exposed to the browser runtime.
 * This is fine for a demo, but not recommended for production without a server proxy.
 */
export async function generateSpecWithOpenAI(args: {
  apiKey: string;
  prompt: string;
  brandColor: string;
  mode: "light" | "dark";
  type: PopupType;
  model?: string;
  currentSpec?: PopupSpec | null;
}): Promise<PopupSpec> {
  const { apiKey, prompt, brandColor, mode, type, model, currentSpec } = args;

  // IMPORTANT: The word "json" must appear in the input messages when using text.format=json_object.
  // Use lowercase "json" explicitly to satisfy the validator.
  const userContent =
    `You must respond with a valid json object only (no markdown, no extra text).\n\n` +
    `Constraints:\n` +
    `- type: ${type}\n` +
    `- mode: ${mode}\n` +
    `- brandColor: ${brandColor}\n` +
    `- version: 1.0\n\n` +
    `Output shape (must match):\n` +
    `{\n` +
    `  "type": "modal|banner|slideup",\n` +
    `  "version": "1.0",\n` +
    `  "layout": { "structure": "image_top|no_image", "padding": number, "cornerRadius": number, "maxWidth": number },\n` +
    `  "theme": { "mode": "light|dark", "brandColor": string, "backgroundColor": string, "textColor": string, "mutedTextColor": string },\n` +
    `  "content": { "headline": string, "body": string, "image": { "kind": "none" } OR { "kind": "url", "url": string, "alt": string } },\n` +
    `  "ctas": [\n` +
    `    { "id": "primary", "label": string, "action": { "type": "url", "value": string }, "style": "primary" },\n` +
    `    optional second: { "id": "secondary", "label": string, "action": { "type": "dismiss" }, "style": "secondary" }\n` +
    `  ],\n` +
    `  "behavior": { "dismissible": boolean, "backdrop": boolean },\n` +
    `  "warnings": string[]\n` +
    `}\n\n` +
    (currentSpec
      ? `Current PopupSpec (modify this according to the instruction):\n${JSON.stringify(currentSpec)}\n\n`
      : "") +
    `Instruction:\n${prompt}\n\n` +
    `Rules:\n` +
    `- If an image is needed, use "url": "https://placehold.co/800x400/png"\n` +
    `- Keep headline <= 80 chars, body <= 240 chars\n` +
    `- Return ONLY json\n`;

  const body = {
    model: model || "gpt-4o-mini",
    input: [
      {
        role: "user",
        content: userContent,
      },
    ],
    text: {
      format: {
        type: "json_object",
      },
    },
  };

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = (data && (data.error?.message || data.error || data.message)) || "OpenAI request failed";
    throw new Error(msg);
  }

  // Responses API usually provides output_text for text outputs
  const textOut =
    data.output_text ||
    (Array.isArray(data.output)
      ? data.output
          .flatMap((o: any) => (Array.isArray(o.content) ? o.content : []))
          .map((c: any) => c.text)
          .filter(Boolean)
          .join("\n")
      : "");

  if (!textOut) throw new Error("No text output found in response.");

  // For json_object format, output_text should already be JSON.
  const parsed = JSON.parse(textOut.trim());

  return parsed as PopupSpec;
}
