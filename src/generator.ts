import type { PopupSpec, PopupType, Mode, TextElement, ImageElement, CtaElement } from "./spec";

function uid(prefix = "el") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function defaultTheme(mode: Mode, brandColor: string) {
  return {
    mode,
    brandColor,
    backgroundColor: mode === "dark" ? "#0B1220" : "#FFFFFF",
    textColor: mode === "dark" ? "#E5E7EB" : "#0F172A",
    mutedTextColor: mode === "dark" ? "#9CA3AF" : "#475569",
  };
}

function defaultsForPopupType(type: PopupType) {
  if (type === "banner") return { maxWidth: 860, cornerRadius: 14, padding: 14 };
  if (type === "slideup") return { maxWidth: 520, cornerRadius: 16, padding: 16 };
  return { maxWidth: 420, cornerRadius: 16, padding: 16 }; // modal
}

function baseSpec(args: { prompt: string; brandColor: string; mode: Mode; type: PopupType }): PopupSpec {
  const { brandColor, mode, type } = args;
  const d = defaultsForPopupType(type);

  return {
    version: "2.0",
    popupType: type,
    theme: defaultTheme(mode, brandColor),
    container: {
      aspectRatio: "auto",
      backgroundColor: mode === "dark" ? "#0B1220" : "#FFFFFF",
      cornerRadius: d.cornerRadius,
      showCloseIcon: true,
      padding: d.padding,
      backdrop: type === "modal",
      dismissible: true,
      maxWidth: d.maxWidth,
    },
    elements: [],
    warnings: [],
  };
}

function makeText(name: string, order: number, text: string, overrides?: Partial<TextElement>): TextElement {
  return {
    id: uid("text"),
    type: "text",
    name,
    order,
    text,
    fontSize: 18,
    fontWeight: 600,
    align: "left",
    margin: { top: 0, right: 0, bottom: 10, left: 0 },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    ...overrides,
  };
}

function makeBody(name: string, order: number, text: string, overrides?: Partial<TextElement>): TextElement {
  return {
    id: uid("text"),
    type: "text",
    name,
    order,
    text,
    fontSize: 14,
    fontWeight: 500,
    align: "left",
    margin: { top: 0, right: 0, bottom: 14, left: 0 },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    ...overrides,
  };
}

function makeImage(name: string, order: number, url: string, overrides?: Partial<ImageElement>): ImageElement {
  return {
    id: uid("img"),
    type: "image",
    name,
    order,
    url,
    alt: "Preview image",
    height: 180,
    radius: 12,
    align: "center",
    margin: { top: 0, right: 0, bottom: 14, left: 0 },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    ...overrides,
  };
}

function makeCta(name: string, order: number, label: string, variant: "primary" | "secondary", overrides?: Partial<CtaElement>): CtaElement {
  return {
    id: uid("cta"),
    type: "cta",
    name,
    order,
    label,
    action: variant === "secondary" ? { type: "dismiss" } : { type: "url", value: "https://example.com" },
    variant,
    fullWidth: true,
    align: "center",
    margin: { top: 0, right: 0, bottom: 10, left: 0 },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    ...overrides,
  };
}

/** Deterministic baseline (always works) */
export function generateSpecDeterministic(
  prompt: string,
  brandColor: string,
  mode: Mode,
  type: PopupType
): PopupSpec {
  const lower = prompt.toLowerCase();
  const spec = baseSpec({ prompt, brandColor, mode, type });

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

  const els = [
    makeText("Headline", 10, headline, { fontSize: 20, fontWeight: 700, align: "left" }),
    ...(wantsImage ? [makeImage("Hero image", 20, "https://placehold.co/800x400/png")] : []),
    makeBody("Body", 30, body, { align: "left" }),
    makeCta("Primary CTA", 40, primaryLabel, "primary"),
    ...(hasSecondary ? [makeCta("Secondary CTA", 50, "Later", "secondary")] : []),
  ];

  spec.elements = els;
  return spec;
}

/** Offline demo examples: 5 “AI prompts” mapped to curated production-grade specs */
export const OFFLINE_DEMOS: Array<{ title: string; prompt: string; build: (brandColor: string, mode: Mode, type: PopupType) => PopupSpec }> = [
  {
    title: "Welcome + quick tour",
    prompt: "Welcome new users, show a short onboarding message and a primary CTA to start the tour. Minimal.",
    build: (brandColor, mode, type) => {
      const spec = baseSpec({ prompt: "", brandColor, mode, type });
      spec.container.showCloseIcon = true;
      spec.elements = [
        makeText("Headline", 10, "Welcome to your workspace", { fontSize: 20, fontWeight: 700 }),
        makeBody("Body", 20, "Let’s set you up in under a minute. We’ll guide you through the essentials."),
        makeCta("Primary CTA", 30, "Start tour", "primary"),
        makeCta("Secondary CTA", 40, "Maybe later", "secondary"),
      ];
      return spec;
    },
  },
  {
    title: "Flash sale (image + CTA)",
    prompt: "Create a promo popup with an image, headline, short body, and Shop Now CTA. Make it feel premium.",
    build: (brandColor, mode, type) => {
      const spec = baseSpec({ prompt: "", brandColor, mode, type });
      spec.elements = [
        makeImage("Hero image", 10, "https://placehold.co/800x400/png", { height: 190, radius: 14 }),
        makeText("Headline", 20, "Flash sale: up to 50% off", { fontSize: 20, fontWeight: 700, align: "left" }),
        makeBody("Body", 30, "Limited-time pricing on top plans. Offer ends soon."),
        makeCta("Primary CTA", 40, "Shop Now", "primary"),
        makeCta("Secondary CTA", 50, "Not now", "secondary"),
      ];
      return spec;
    },
  },
  {
    title: "Feature announcement",
    prompt: "Announce a new feature release with concise copy and a Learn More CTA. No image.",
    build: (brandColor, mode, type) => {
      const spec = baseSpec({ prompt: "", brandColor, mode, type });
      spec.elements = [
        makeText("Headline", 10, "New: smarter audience segments", { fontSize: 20, fontWeight: 700 }),
        makeBody("Body", 20, "Build segments faster with recommended filters and real-time previews."),
        makeCta("Primary CTA", 30, "Learn More", "primary"),
      ];
      return spec;
    },
  },
  {
    title: "NPS / feedback request",
    prompt: "Ask for quick feedback with a friendly message and a primary CTA. Add a secondary dismiss CTA.",
    build: (brandColor, mode, type) => {
      const spec = baseSpec({ prompt: "", brandColor, mode, type });
      spec.elements = [
        makeText("Headline", 10, "How are we doing?", { fontSize: 20, fontWeight: 700 }),
        makeBody("Body", 20, "Your feedback helps us improve. It takes less than 30 seconds."),
        makeCta("Primary CTA", 30, "Give feedback", "primary"),
        makeCta("Secondary CTA", 40, "Skip", "secondary"),
      ];
      return spec;
    },
  },
  {
    title: "Lead capture",
    prompt: "A lead capture message: short pitch, image, and primary CTA to request a demo. Premium feel.",
    build: (brandColor, mode, type) => {
      const spec = baseSpec({ prompt: "", brandColor, mode, type });
      spec.elements = [
        makeImage("Hero image", 10, "https://placehold.co/800x400/png", { height: 180, radius: 14 }),
        makeText("Headline", 20, "See it in action", { fontSize: 20, fontWeight: 700 }),
        makeBody("Body", 30, "Book a quick demo to learn how teams personalize experiences at scale."),
        makeCta("Primary CTA", 40, "Request demo", "primary"),
        makeCta("Secondary CTA", 50, "Later", "secondary"),
      ];
      return spec;
    },
  },
];

export function generateSpecOfflineDemo(index: number, brandColor: string, mode: Mode, type: PopupType): PopupSpec {
  const demo = OFFLINE_DEMOS[Math.max(0, Math.min(OFFLINE_DEMOS.length - 1, index))];
  return demo.build(brandColor, mode, type);
}

/**
 * Live OpenAI generation (JSON mode, no strict schema to avoid “oneOf/required/type” errors).
 * We validate the JSON and fallback to deterministic if invalid.
 * Docs: Responses API + structured outputs/json formats :contentReference[oaicite:1]{index=1}
 */
export async function generateSpecWithOpenAI(args: {
  apiKey: string;
  prompt: string;
  brandColor: string;
  mode: Mode;
  type: PopupType;
  model?: string;
  currentSpec?: PopupSpec | null;
}): Promise<PopupSpec> {
  const { apiKey, prompt, brandColor, mode, type, model, currentSpec } = args;

  const instructions =
    `You generate UI popup specs for an in-app message builder.\n` +
    `Return ONLY valid JSON (no markdown, no commentary).\n` +
    `The JSON must match this TypeScript shape:\n` +
    `{\n` +
    `  version: "2.0",\n` +
    `  popupType: "modal"|"banner"|"slideup",\n` +
    `  theme: { mode:"light"|"dark", brandColor:string, backgroundColor:string, textColor:string, mutedTextColor:string },\n` +
    `  container: { aspectRatio:"auto"|"1:1"|"4:3"|"16:9", backgroundColor:string, cornerRadius:number, showCloseIcon:boolean, padding:number, backdrop:boolean, dismissible:boolean, maxWidth:number },\n` +
    `  elements: Array<\n` +
    `    { id:string, type:"text", name:string, order:number, text:string, fontSize:number, fontWeight:400|500|600|700, align:"left"|"center"|"right", margin:{top:number,right:number,bottom:number,left:number}, padding:{top:number,right:number,bottom:number,left:number}, color?:string }\n` +
    `  | { id:string, type:"image", name:string, order:number, url:string, alt:string, height:number, radius:number, align:"left"|"center"|"right", margin:{top:number,right:number,bottom:number,left:number}, padding:{top:number,right:number,bottom:number,left:number} }\n` +
    `  | { id:string, type:"cta", name:string, order:number, label:string, action:{type:"url"|"dismiss", value?:string}, variant:"primary"|"secondary", fullWidth:boolean, align:"left"|"center"|"right", margin:{top:number,right:number,bottom:number,left:number}, padding:{top:number,right:number,bottom:number,left:number} }\n` +
    `  >,\n` +
    `  warnings: string[]\n` +
    `}\n\n` +
    `Rules:\n` +
    `- Set popupType=${type}, theme.mode=${mode}, theme.brandColor=${brandColor}\n` +
    `- Use image url exactly: "https://placehold.co/800x400/png" when needed\n` +
    `- Keep copy concise and production-grade\n` +
    `- Ensure elements order is ascending integers (10,20,30...)\n` +
    `- Always include at least: Headline(text), Body(text), Primary CTA(cta)\n`;

  const userContent =
    `Constraints:\n` +
    `- popupType: ${type}\n` +
    `- mode: ${mode}\n` +
    `- brandColor: ${brandColor}\n\n` +
    (currentSpec ? `Current spec to modify (preserve structure where possible):\n${JSON.stringify(currentSpec)}\n\n` : "") +
    `User prompt:\n${prompt}\n`;

  const body: any = {
    model: model || "gpt-4o-mini",
    instructions,
    input: [{ role: "user", content: userContent }],
    // JSON mode (no strict schema)
    text: { format: { type: "json_object" } },
  };

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
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

  let parsed: any;
  try {
    parsed = JSON.parse(textOut.trim());
  } catch {
    // fallback
    return generateSpecDeterministic(prompt, brandColor, mode, type);
  }

  // light validation + normalization (avoid app crashes)
  try {
    const normalized = normalizeSpec(parsed, { brandColor, mode, type });
    return normalized;
  } catch {
    return generateSpecDeterministic(prompt, brandColor, mode, type);
  }
}

function isNum(n: any) {
  return typeof n === "number" && Number.isFinite(n);
}

function normalizeSpacing(s: any) {
  const safe = (v: any) => (isNum(v) ? v : 0);
  return { top: safe(s?.top), right: safe(s?.right), bottom: safe(s?.bottom), left: safe(s?.left) };
}

function normalizeSpec(raw: any, enforced: { brandColor: string; mode: Mode; type: PopupType }): PopupSpec {
  // minimal shape checks
  if (!raw || typeof raw !== "object") throw new Error("bad spec");
  if (raw.version !== "2.0") raw.version = "2.0";

  raw.popupType = enforced.type;
  raw.theme = raw.theme || {};
  raw.theme.mode = enforced.mode;
  raw.theme.brandColor = enforced.brandColor;

  // theme fallbacks
  const t = defaultTheme(enforced.mode, enforced.brandColor);
  raw.theme.backgroundColor = typeof raw.theme.backgroundColor === "string" ? raw.theme.backgroundColor : t.backgroundColor;
  raw.theme.textColor = typeof raw.theme.textColor === "string" ? raw.theme.textColor : t.textColor;
  raw.theme.mutedTextColor = typeof raw.theme.mutedTextColor === "string" ? raw.theme.mutedTextColor : t.mutedTextColor;

  raw.container = raw.container || {};
  const d = defaultsForPopupType(enforced.type);
  raw.container.aspectRatio = ["auto", "1:1", "4:3", "16:9"].includes(raw.container.aspectRatio) ? raw.container.aspectRatio : "auto";
  raw.container.backgroundColor = typeof raw.container.backgroundColor === "string" ? raw.container.backgroundColor : t.backgroundColor;
  raw.container.cornerRadius = isNum(raw.container.cornerRadius) ? raw.container.cornerRadius : d.cornerRadius;
  raw.container.showCloseIcon = typeof raw.container.showCloseIcon === "boolean" ? raw.container.showCloseIcon : true;
  raw.container.padding = isNum(raw.container.padding) ? raw.container.padding : d.padding;
  raw.container.backdrop = typeof raw.container.backdrop === "boolean" ? raw.container.backdrop : enforced.type === "modal";
  raw.container.dismissible = typeof raw.container.dismissible === "boolean" ? raw.container.dismissible : true;
  raw.container.maxWidth = isNum(raw.container.maxWidth) ? raw.container.maxWidth : d.maxWidth;

  if (!Array.isArray(raw.elements)) raw.elements = [];

  // normalize elements
  raw.elements = raw.elements
    .filter((e: any) => e && typeof e === "object" && typeof e.type === "string")
    .map((e: any, idx: number) => {
      const base = {
        id: typeof e.id === "string" ? e.id : uid("el"),
        type: e.type,
        name: typeof e.name === "string" ? e.name : `${e.type} ${idx + 1}`,
        order: isNum(e.order) ? e.order : (idx + 1) * 10,
        margin: normalizeSpacing(e.margin),
        padding: normalizeSpacing(e.padding),
        align: ["left", "center", "right"].includes(e.align) ? e.align : "left",
      };

      if (e.type === "text") {
        return {
          ...base,
          type: "text",
          text: typeof e.text === "string" ? e.text : "",
          fontSize: isNum(e.fontSize) ? e.fontSize : 16,
          fontWeight: [400, 500, 600, 700].includes(e.fontWeight) ? e.fontWeight : 600,
          color: typeof e.color === "string" ? e.color : undefined,
        };
      }
      if (e.type === "image") {
        return {
          ...base,
          type: "image",
          url: typeof e.url === "string" ? e.url : "https://placehold.co/800x400/png",
          alt: typeof e.alt === "string" ? e.alt : "Image",
          height: isNum(e.height) ? e.height : 180,
          radius: isNum(e.radius) ? e.radius : 12,
        };
      }
      if (e.type === "cta") {
        return {
          ...base,
          type: "cta",
          label: typeof e.label === "string" ? e.label : "Continue",
          action:
            e.action && typeof e.action === "object" && (e.action.type === "dismiss" || e.action.type === "url")
              ? { type: e.action.type, value: typeof e.action.value === "string" ? e.action.value : undefined }
              : { type: "url", value: "https://example.com" },
          variant: e.variant === "secondary" ? "secondary" : "primary",
          fullWidth: typeof e.fullWidth === "boolean" ? e.fullWidth : true,
        };
      }
      return null;
    })
    .filter(Boolean);

  raw.elements.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  raw.warnings = Array.isArray(raw.warnings) ? raw.warnings.filter((x: any) => typeof x === "string") : [];

  return raw as PopupSpec;
}
