import { useMemo, useState } from "react";
import { PopupPreview } from "./components/PopupPreview";
import { Inspector } from "./components/Inspector";
import { PopupSpecSchema, type PopupSpec, type PopupType } from "./spec";
import { defaultsForType, generateSpecDeterministic, generateSpecWithOpenAI } from "./generator";
import "./app.css";

type Mode = "light" | "dark";
const LS_KEY = "aipopupcreator_openai_key";

function computeWarnings(s: PopupSpec): string[] {
  const warnings: string[] = [];

  if (s.content.headline.length > 45) warnings.push("Headline is long; consider shortening.");
  if (s.content.body.length > 140) warnings.push("Body is long; consider shortening.");

  const primary = s.ctas.find((c) => c.id === "primary");
  if (primary && primary.label.length > 20) warnings.push("CTA label is long; consider shortening.");

  if (!s.content.image.enabled && s.layout.structure === "image_top")
    warnings.push("Layout requests image but image.enabled is false.");

  if (s.content.image.enabled && s.layout.structure === "no_image")
    warnings.push("Image is enabled but layout structure is no_image.");

  if (s.content.image.enabled && (!s.content.image.url || !s.content.image.alt))
    warnings.push("Image is enabled but url/alt is missing.");

  for (const c of s.ctas) {
    if (c.action.type === "url" && !c.action.value) warnings.push(`CTA '${c.id}' action is url but value is missing.`);
  }

  return warnings;
}

const ASK_AI_EXAMPLES = [
  "Sale announcement for the christmas",
  "Upcoming Black friday sale with upto 50% off",
  "Lead generation popup with email ID field",
  "Survey template with 5 star for user rating",
];

export default function App() {
  const [template, setTemplate] = useState<PopupType>("modal");

  const [prompt, setPrompt] = useState(
    "Create a welcome popup for new users with a 20% off coupon, include image, primary CTA 'Shop Now', secondary 'Later'."
  );
  const [refinePrompt, setRefinePrompt] = useState("Make it more minimal and shorten the body copy.");

  const [brandColor, setBrandColor] = useState("#2563EB");
  const [mode, setMode] = useState<Mode>("light");

  const [useOpenAI, setUseOpenAI] = useState(false);
  const [openaiKey, setOpenaiKey] = useState<string>(() => localStorage.getItem(LS_KEY) || "");
  const [model, setModel] = useState("gpt-4o-mini-2024-07-18");
  const [persistKey, setPersistKey] = useState(true);

  const [spec, setSpec] = useState<PopupSpec | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prettyJSON = useMemo(() => (spec ? JSON.stringify(spec, null, 2) : ""), [spec]);

  function applyTemplateDefaults(type: PopupType) {
    setTemplate(type);
    const d = defaultsForType(type);
    if (spec) {
      const next: PopupSpec = { ...spec, type, layout: { ...spec.layout, ...d } } as any;
      setSpec(next);
    }
  }

  function normalizeAndSet(next: PopupSpec) {
    const parsed = PopupSpecSchema.safeParse(next);
    if (!parsed.success) {
      setError("Inspector changes produced invalid spec. Revert the last change.");
      return;
    }
    const warnings = computeWarnings(parsed.data);
    setSpec({ ...parsed.data, warnings: [...parsed.data.warnings.filter(Boolean), ...warnings] });
  }

  async function generateNew(fromExample?: string) {
    setLoading(true);
    setError(null);

    try {
      const effectivePrompt = fromExample ?? prompt;

      let data: unknown;

      if (useOpenAI) {
        if (!openaiKey.trim()) throw new Error("OpenAI API key is required when 'Use OpenAI' is enabled.");
        if (persistKey) localStorage.setItem(LS_KEY, openaiKey.trim());
        else localStorage.removeItem(LS_KEY);

        data = await generateSpecWithOpenAI({
          apiKey: openaiKey.trim(),
          prompt: effectivePrompt,
          brandColor,
          mode,
          type: template,
          model,
          currentSpec: null,
        });
      } else {
        data = generateSpecDeterministic(effectivePrompt, brandColor, mode, template);
      }

      const parsed = PopupSpecSchema.safeParse(data);
      if (!parsed.success) {
        setError("Generated spec failed validation. Try refining the prompt or switching generator mode.");
        return;
      }

      const warnings = computeWarnings(parsed.data);
      setSpec({ ...parsed.data, warnings: [...parsed.data.warnings, ...warnings] });
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  async function refineExisting() {
    if (!spec) {
      setError("Generate a popup first, then refine it.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let data: unknown;

      if (useOpenAI) {
        if (!openaiKey.trim()) throw new Error("OpenAI API key is required when 'Use OpenAI' is enabled.");
        if (persistKey) localStorage.setItem(LS_KEY, openaiKey.trim());
        else localStorage.removeItem(LS_KEY);

        data = await generateSpecWithOpenAI({
          apiKey: openaiKey.trim(),
          prompt: refinePrompt,
          brandColor,
          mode,
          type: template,
          model,
          currentSpec: spec,
        });
      } else {
        const regenerated = generateSpecDeterministic(refinePrompt, brandColor, mode, template);

        // preserve existing primary URL if present
        const oldPrimary = spec.ctas.find((c) => c.id === "primary");
        const newPrimary = regenerated.ctas.find((c) => c.id === "primary");
        if (oldPrimary?.action.type === "url" && newPrimary?.action.type === "url") {
          newPrimary.action.value = oldPrimary.action.value;
        }

        // preserve image if enabled
        if (spec.content.image.enabled && !regenerated.content.image.enabled) {
          regenerated.content.image = { ...spec.content.image };
          regenerated.layout.structure = "image_top";
        }

        data = regenerated;
      }

      const parsed = PopupSpecSchema.safeParse(data);
