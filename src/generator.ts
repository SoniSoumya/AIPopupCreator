import type { PopupDoc, PopupElement, ElementKind, Mode } from "./spec";
import { PopupDocSchema } from "./spec";
import { DEMO_PRESETS } from "./demoPresets";

export function getDemoPresets() {
  return DEMO_PRESETS;
}

export function defaultsContainer(mode: Mode, brandColor: string) {
  return {
    id: "container" as const,
    name: "Container",
    mode,
    aspectRatio: 0.72,
    maxWidth: 420,
    cornerRadius: 18,
    backgroundColor: mode === "dark" ? "#0B1220" : "#FFFFFF",
    showCloseIcon: true,
    backdrop: true,
    dismissible: true,
    brandColor,
    textColor: mode === "dark" ? "#E5E7EB" : "#0F172A",
    mutedTextColor: mode === "dark" ? "#9CA3AF" : "#475569",
  };
}

export function newTextElement(id: string): PopupElement {
  return {
    id,
    kind: "text",
    name: "Text",
    hidden: false,
    text: "New text",
    fontFamily: "Inter, system-ui, Arial",
    fontSize: 16,
    fontWeight: 700,
    align: "left",
    color: "#0F172A",
  };
}

export function newImageElement(id: string): PopupElement {
  return {
    id,
    kind: "image",
    name: "Image",
    hidden: false,
    url: "https://placehold.co/1200x600/png",
    alt: "Placeholder image",
    height: 200,
    fit: "cover",
    cornerRadius: 16,
  };
}

export function newButtonElement(id: string, brandColor = "#2563EB"): PopupElement {
  return {
    id,
    kind: "button",
    name: "Button",
    hidden: false,
    label: "Click Here",
    fontSize: 14,
    fontWeight: 800,
    cornerRadius: 12,
    fillColor: brandColor,
    textColor: "#FFFFFF",
    actionType: "url",
    actionValue: "https://example.com",
    fullWidth: true,
  };
}

export function addElement(doc: PopupDoc, kind: ElementKind): PopupDoc {
  const next: PopupDoc = JSON.parse(JSON.stringify(doc));
  const id = `${kind}_${Math.random().toString(16).slice(2, 8)}`;

  let el: PopupElement;
  if (kind === "text") el = newTextElement(id);
  else if (kind === "image") el = newImageElement(id);
  else el = newButtonElement(id, next.container.brandColor);

  el.name = kind === "text" ? `Text ${countKind(next, "text") + 1}` : kind === "image" ? `Image ${countKind(next, "image") + 1}` : `Button ${countKind(next, "button") + 1}`;

  next.elements.push(el);
  return next;
}

function countKind(doc: PopupDoc, kind: ElementKind) {
  return doc.elements.filter((e) => e.kind === kind).length;
}

export function generateDocDeterministic(prompt: string, brandColor: string, mode: Mode): PopupDoc {
  const lower = prompt.toLowerCase();

  const wantsImage = /image|banner|visual|product|logo|photo/.test(lower);
  const wantsTwoButtons = /two cta|2 cta|secondary|later|not now|dismiss/.test(lower);
  const isBanner = /banner/.test(lower);

  const headline =
    /welcome|onboard|new user/.test(lower) ? "Welcome!" :
    /discount|offer|sale|%|coupon|black friday/.test(lower) ? "Limited-time offer" :
    /update|announce|new feature/.test(lower) ? "What’s new" :
    "Quick update";

  const body =
    /discount|offer|sale|%|coupon|black friday/.test(lower)
      ? "Unlock your deal now. Limited time only."
      : /welcome|onboard|new user/.test(lower)
        ? "Here’s a quick tour to help you get started."
        : "Take a moment to review this message.";

  const container = defaultsContainer(mode, brandColor);
  if (isBanner) {
    container.aspectRatio = 2.6;
    container.maxWidth = 860;
    container.backdrop = false;
    container.cornerRadius = 14;
  }

  const elements: PopupElement[] = [];

  if (wantsImage) {
    elements.push({
      id: "img1",
      kind: "image",
      name: "Image 1",
      hidden: false,
      url: "https://placehold.co/1200x600/png",
      alt: "Placeholder image",
      height: isBanner ? 140 : 220,
      fit: "cover",
      cornerRadius: 16,
    });
  }

  elements.push({
    id: "t1",
    kind: "text",
    name: "Text 1",
    hidden: false,
    text: headline,
    fontFamily: "Inter, system-ui, Arial",
    fontSize: isBanner ? 18 : 22,
    fontWeight: 850,
    align: "left",
    color: container.textColor,
  });

  elements.push({
    id: "t2",
    kind: "text",
    name: "Text 2",
    hidden: false,
    text: body,
    fontFamily: "Inter, system-ui, Arial",
    fontSize: 14,
    fontWeight: 550,
    align: "left",
    color: container.mutedTextColor,
  });

  elements.push({
    id: "b1",
    kind: "button",
    name: "Button 1",
    hidden: false,
    label: /shop/.test(lower) ? "Shop Now" : /start/.test(lower) ? "Get Started" : "Continue",
    fontSize: 14,
    fontWeight: 800,
    cornerRadius: 12,
    fillColor: brandColor,
    textColor: "#FFFFFF",
    actionType: "url",
    actionValue: "https://example.com",
    fullWidth: !isBanner,
  });

  if (wantsTwoButtons) {
    elements.push({
      id: "b2",
      kind: "button",
      name: "Button 2",
      hidden: false,
      label: "Later",
      fontSize: 14,
      fontWeight: 750,
      cornerRadius: 12,
      fillColor: mode === "dark" ? "rgba(255,255,255,0.10)" : "#EEF2FF",
      textColor: mode === "dark" ? "#E5E7EB" : "#1E3A8A",
      actionType: "dismiss",
      actionValue: "",
      fullWidth: !isBanner,
    });
  }

  const doc: PopupDoc = { version: "2.0", container, elements };

  const parsed = PopupDocSchema.safeParse(doc);
  if (!parsed.success) throw new Error("Deterministic generator produced invalid PopupDoc.");
  return parsed.data;
}
