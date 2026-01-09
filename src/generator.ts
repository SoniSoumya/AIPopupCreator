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

  // refine hints
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

export async function generateSpecWithOpenAI(args: {
  apiKey: string;
  prompt: string;
  brandColor: string;
  mode: "light" | "dark";
  type: PopupType;
  model?: string;
  currentSpec?: PopupSpec | null;
}): Promise<unknown> {
  const { apiKey, prompt, brandColor, mode, type, model, currentSpec } = args;

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      type: { enum: ["modal", "banner", "slideup"] },
      version: { const: "1.0" },
      layout: {
        type: "object",
        additionalProperties: false,
        properties: {
          structure: { enum: ["image_top", "no_image"] },
          padding: { type: "integer", minimum: 0, maximum: 48 },
          cornerRadius: { type: "integer", minimum: 0, maximum: 40 },
          maxWidth: { type: "integer", minimum: 280, maximum: 860 },
        },
        required: ["structure", "padding", "cornerRadius", "maxWidth"],
      },
      theme: {
        type: "object",
        additionalProperties: false,
        properties: {
          mode: { enum: ["light", "dark"] },
          brandColor: { type: "string" },
          backgroundColor: { type: "string" },
          textColor: { type: "string" },
          mutedTextColor: { type: "string" },
        },
        required: ["mode", "brandColor", "backgroundColor", "textColor", "mutedTextColor"],
      },
      content: {
        type: "object",
        additionalProperties: false,
        properties: {
          headline: { type: "string", minLength: 1, maxLength: 80 },
          body: { type: "string", minLength: 1, maxLength: 240 },
          image: {
            oneOf: [
              { type: "object", additionalProperties: false, properties: { kind: { const: "none" } }, required: ["kind"] },
              {
                type: "object",
                additionalProperties: false,
                properties: { kind: { const: "url" }, url: { type: "string" }, alt: { type: "string", minLength: 1, maxLength: 120 } },
                required: ["kind", "url", "alt"],
              },
            ],
          },
        },
        required: ["headline", "body", "image"],
      },
      ctas: {
        type: "array",
        minItems: 1,
        maxItems: 2,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { enum: ["primary", "secondary"] },
            label: { type: "string", minLength: 1, maxLength: 30 },
            action: {
              oneOf: [
                { type: "object", additionalProperties: false, properties: { type: { const: "dismiss" } }, required: ["type"] },
                { type: "object", additionalProperties: false, properties: { type: { const: "url" }, value: { type: "string" } }, required: ["type", "value"] },
              ],
            },
            style: { enum: ["primary", "secondary"] },
          },
          required: ["id", "label", "action", "style"],
        },
      },
      behavior: {
        type: "object",
        additionalProperties: false,
        properties: { dismissible: { type: "boolean" }, backdrop: { type: "boolean" } },
        required: ["dismissible", "backdrop"],
      },
      warnings: { type: "array", items: { type: "string" } },
    },
    required: ["type", "version", "layout", "theme", "content", "ctas", "behavior", "warnings"],
  };

  const instructions =
    "Return ONLY a JSON object that matches the JSON schema strictly. " +
    "Do not include any additional keys. Keep copy concise. " +
    "When an image is needed, use url: https://placehold.co/800x400/png. " +
    "Always set theme.mode, theme.brandColor, and type based on the provided constraints.";

  const userContent =
    `Constraints:\n` +
    `- type: ${type}\n` +
    `- mode: ${mode}\n` +
    `- brandColor: ${brandColor}\n\n` +
    (currentSpec ? `Current PopupSpec (modify this according to the instruction):\n${JSON.stringify(currentSpec)}\n\n` : "") +
    `Instruction:\n${prompt}\n`;

  const body = {
    model: model || "gpt-4o-mini-2024-07-18",
    instructions,
    input: [{ role: "user", content: userContent }],
    text: {
      format: { type: "json_schema", strict: true, schema },
    },
  };

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = (data && (data.error?.message || data.error || data.message)) || "OpenAI request failed";
    throw new Error(msg);
  }

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

  return JSON.parse(textOut.trim());
}
