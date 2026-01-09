import type { PopupSpec, PopupType } from "./spec";

/**
 * Offline demos (5 example prompts + production-grade specs)
 * Used for demo mode without hitting OpenAI.
 */
export const OFFLINE_DEMOS: Array<{
  id: string;
  title: string;
  prompt: string;
  spec: PopupSpec;
}> = [
  {
    id: "demo-sale",
    title: "Upcoming Black Friday sale (50% off)",
    prompt: "Upcoming Black Friday sale with up to 50% off. Include image and Shop Now CTA. Keep copy concise.",
    spec: {
      type: "modal",
      version: "1.0",
      layout: { structure: "image_top", padding: 16, cornerRadius: 16, maxWidth: 420 },
      theme: {
        mode: "light",
        brandColor: "#2563EB",
        backgroundColor: "#FFFFFF",
        textColor: "#0F172A",
        mutedTextColor: "#475569",
      },
      content: {
        headline: "Black Friday is here",
        body: "Save up to 50% on bestsellers. Offer ends soon.",
        image: { kind: "url", url: "https://placehold.co/800x400/png", alt: "Black Friday sale banner" },
      },
      ctas: [
        { id: "primary", label: "Shop Now", action: { type: "url", value: "https://example.com" }, style: "primary" },
        { id: "secondary", label: "Later", action: { type: "dismiss" }, style: "secondary" },
      ],
      behavior: { dismissible: true, backdrop: true },
      warnings: [],
    },
  },
  {
    id: "demo-welcome",
    title: "Welcome onboarding (no image)",
    prompt: "Welcome new users. No image. One CTA to start onboarding. Friendly tone.",
    spec: {
      type: "slideup",
      version: "1.0",
      layout: { structure: "no_image", padding: 16, cornerRadius: 16, maxWidth: 520 },
      theme: {
        mode: "light",
        brandColor: "#16A34A",
        backgroundColor: "#FFFFFF",
        textColor: "#0F172A",
        mutedTextColor: "#475569",
      },
      content: {
        headline: "Welcome!",
        body: "Take a 60-second tour to get set up faster.",
        image: { kind: "none" },
      },
      ctas: [
        { id: "primary", label: "Get Started", action: { type: "url", value: "https://example.com" }, style: "primary" },
      ],
      behavior: { dismissible: true, backdrop: false },
      warnings: [],
    },
  },
  {
    id: "demo-feature",
    title: "New feature announcement",
    prompt: "Announce a new feature with an image and Learn More CTA. Modern, crisp copy.",
    spec: {
      type: "banner",
      version: "1.0",
      layout: { structure: "image_top", padding: 14, cornerRadius: 14, maxWidth: 860 },
      theme: {
        mode: "light",
        brandColor: "#7C3AED",
        backgroundColor: "#FFFFFF",
        textColor: "#0F172A",
        mutedTextColor: "#475569",
      },
      content: {
        headline: "New: Smart Segments",
        body: "Build high-intent segments in minutes with AI suggestions.",
        image: { kind: "url", url: "https://placehold.co/800x400/png", alt: "Feature preview image" },
      },
      ctas: [
        { id: "primary", label: "Learn More", action: { type: "url", value: "https://example.com" }, style: "primary" },
      ],
      behavior: { dismissible: true, backdrop: false },
      warnings: [],
    },
  },
  {
    id: "demo-lead",
    title: "Lead capture (dark, premium)",
    prompt: "Lead generation popup. Include image. Primary CTA 'Get the guide'. Secondary 'No thanks'. Dark theme.",
    spec: {
      type: "modal",
      version: "1.0",
      layout: { structure: "image_top", padding: 16, cornerRadius: 16, maxWidth: 420 },
      theme: {
        mode: "dark",
        brandColor: "#F59E0B",
        backgroundColor: "#0B1220",
        textColor: "#E5E7EB",
        mutedTextColor: "#9CA3AF",
      },
      content: {
        headline: "Get the free guide",
        body: "7 proven tactics to boost conversions this quarter.",
        image: { kind: "url", url: "https://placehold.co/800x400/png", alt: "Guide cover preview" },
      },
      ctas: [
        { id: "primary", label: "Get the guide", action: { type: "url", value: "https://example.com" }, style: "primary" },
        { id: "secondary", label: "No thanks", action: { type: "dismiss" }, style: "secondary" },
      ],
      behavior: { dismissible: true, backdrop: true },
      warnings: [],
    },
  },
  {
    id: "demo-survey",
    title: "Quick survey prompt",
    prompt: "Ask for a quick survey. No image. Single CTA. Simple and neutral.",
    spec: {
      type: "slideup",
      version: "1.0",
      layout: { structure: "no_image", padding: 16, cornerRadius: 16, maxWidth: 520 },
      theme: {
        mode: "light",
        brandColor: "#0EA5E9",
        backgroundColor: "#FFFFFF",
        textColor: "#0F172A",
        mutedTextColor: "#475569",
      },
      content: {
        headline: "One quick question",
        body: "How satisfied are you with your experience today?",
        image: { kind: "none" },
      },
      ctas: [
        { id: "primary", label: "Start Survey", action: { type: "url", value: "https://example.com" }, style: "primary" },
      ],
      behavior: { dismissible: true, backdrop: false },
      warnings: [],
    },
  },
];

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
  const hasSecondary = /secondary|later|not now|dismiss|no thanks/.test(lower);

  const headline =
    /welcome|onboard|new user/.test(lower)
      ? "Welcome!"
      : /discount|offer|sale|%|coupon|black friday/.test(lower)
        ? "Limited-time offer"
        : /update|announce|new feature/.test(lower)
          ? "What’s new"
          : "Quick update";

  let body =
    /discount|offer|sale|%|coupon|black friday/.test(lower)
      ? "Unlock your deal now. Limited time only."
      : /welcome|onboard|new user/.test(lower)
        ? "Here’s a quick tour to help you get started."
        : "Take a moment to review this message.";

  if (/more urgent|urgent|hurry|ends soon/.test(lower)) body = body.replace(/Limited time only\.?/i, "Ends soon.");
  if (/minimal|minimalist|shorter|shorten/.test(lower)) body = body.slice(0, 70).replace(/\s+\S*$/, "") + ".";

  const primaryLabel =
    /shop/.test(lower)
      ? "Shop Now"
      : /learn/.test(lower)
        ? "Learn More"
        : /start/.test(lower)
          ? "Get Started"
          : /survey/.test(lower)
            ? "Start Survey"
            : "Continue";

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
 * Live AI mode (browser-side) using OpenAI Responses API.
 * Note: This is demo-only: the API key is used in the browser runtime.
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

  // IMPORTANT: the word "json" must appear in the input when using json_object format.
  // Keep it lowercase to satisfy validation.
  const userContent =
    `Return ONLY a valid json object (no markdown, no extra text).\n\n` +
    `Constraints:\n` +
    `- type: ${type}\n` +
    `- mode: ${mode}\n` +
    `- brandColor: ${brandColor}\n` +
    `- version: 1.0\n\n` +
    `Output must match this exact shape:\n` +
    `{\n` +
    `  "type": "modal" | "banner" | "slideup",\n` +
    `  "version": "1.0",\n` +
    `  "layout": { "structure": "image_top" | "no_image", "padding": number, "cornerRadius": number, "maxWidth": number },\n` +
    `  "theme": { "mode": "light" | "dark", "brandColor": string, "backgroundColor": string, "textColor": string, "mutedTextColor": string },\n` +
    `  "content": {\n` +
    `    "headline": string,\n` +
    `    "body": string,\n` +
    `    "image": { "kind": "none" } | { "kind": "url", "url": string, "alt": string }\n` +
    `  },\n` +
    `  "ctas": [\n` +
    `    { "id": "primary", "label": string, "action": { "type": "url", "value": string }, "style": "primary" },\n` +
    `    optional second: { "id": "secondary", "label": string, "action": { "type": "dismiss" }, "style": "secondary" }\n` +
    `  ],\n` +
    `  "behavior": { "dismissible": boolean, "backdrop": boolean },\n` +
    `  "warnings": string[]\n` +
    `}\n\n` +
    (currentSpec ? `Current spec (edit it based on instruction):\n${JSON.stringify(currentSpec)}\n\n` : "") +
    `Instruction:\n${prompt}\n\n` +
    `Rules:\n` +
    `- If an image is needed, use url: "https://placehold.co/800x400/png"\n` +
    `- Headline <= 80 chars; body <= 240 chars\n` +
    `- Keep copy production-grade and concise\n` +
    `- Return ONLY json\n`;

  const body = {
    model: model || "gpt-4o-mini",
    input: [{ role: "user", content: userContent }],
    text: { format: { type: "json_object" } },
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

  const parsed = JSON.parse(textOut.trim());
  return parsed as PopupSpec;
}
