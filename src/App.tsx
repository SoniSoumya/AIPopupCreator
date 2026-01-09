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
      if (!parsed.success) {
        setError("Refined spec failed validation. Try a more specific refinement prompt.");
        return;
      }

      const warnings = computeWarnings(parsed.data);
      setSpec({ ...parsed.data, warnings: [...parsed.data.warnings, ...warnings] });
    } catch (e: any) {
      setError(e?.message ?? "Failed to refine");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ndm-root">
      {/* Top header (matches screenshot style) */}
      <div className="ndm-topbar">
        <button className="ndm-iconBtn" title="Back" aria-label="Back">
          ←
        </button>

        <div className="ndm-title">Create Native Display Message</div>

        <div className="ndm-topbarRight">
          <button className="ndm-iconBtn" title="Undo" aria-label="Undo">
            ↶
          </button>
          <button className="ndm-iconBtn" title="Redo" aria-label="Redo">
            ↷
          </button>

          <button className="ndm-pillBtn">Template</button>
          <button className="ndm-pillBtn">Personalize</button>

          <button className="ndm-iconBtn" title="Save" aria-label="Save">
            💾
          </button>

          <button className="ndm-primaryBtn">Done</button>
        </div>
      </div>

      {/* Main work area */}
      <div className="ndm-main">
        {/* Left: AskAI panel */}
        <div className="ndm-card ndm-askai">
          <div className="ndm-askaiHeader">
            <div className="ndm-askaiBadge">✦</div>
            <div className="ndm-askaiTitle">AskAI</div>
          </div>

          <div className="ndm-askaiBody">
            <div className="ndm-askaiHeroIcon">✦</div>
            <div className="ndm-askaiHeroText">Build Native display content with AI</div>

            <div className="ndm-askaiSub">Example queries</div>

            <div className="ndm-exampleList">
              {ASK_AI_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  className="ndm-examplePill"
                  onClick={() => {
                    setPrompt(ex);
                    generateNew(ex);
                  }}
                  disabled={loading}
                >
                  {ex}
                </button>
              ))}
            </div>

            <div className="ndm-divider" />

            <div className="ndm-fieldLabel">Prompt</div>
            <textarea className="ndm-textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} />

            <div className="ndm-row">
              <div className="ndm-col">
                <div className="ndm-fieldLabel">Template</div>
                <select className="ndm-select" value={template} onChange={(e) => applyTemplateDefaults(e.target.value as PopupType)}>
                  <option value="modal">Modal</option>
                  <option value="banner">Banner</option>
                  <option value="slideup">Slide-up</option>
                </select>
              </div>
              <div className="ndm-col">
                <div className="ndm-fieldLabel">Mode</div>
                <select className="ndm-select" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>

            <div className="ndm-row">
              <div className="ndm-col">
                <div className="ndm-fieldLabel">Brand</div>
                <input className="ndm-input" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
              </div>
            </div>

            <div className="ndm-row ndm-rowCenter">
              <label className="ndm-check">
                <input type="checkbox" checked={useOpenAI} onChange={(e) => setUseOpenAI(e.target.checked)} />
                <span>Use OpenAI</span>
              </label>
            </div>

            {useOpenAI && (
              <div className="ndm-aiBox">
                <div className="ndm-fieldLabel">OpenAI API key</div>
                <input
                  className="ndm-input"
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                />

                <label className="ndm-check ndm-checkSmall">
                  <input type="checkbox" checked={persistKey} onChange={(e) => setPersistKey(e.target.checked)} />
                  <span>Remember key in this browser</span>
                </label>

                <div className="ndm-fieldLabel">Model</div>
                <input className="ndm-input" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
            )}

            <div className="ndm-actions">
              <button className="ndm-btn" onClick={() => generateNew()} disabled={loading || prompt.trim().length === 0}>
                {loading ? "Working..." : "Generate"}
              </button>
              <button
                className="ndm-btnGhost"
                onClick={() => {
                  setSpec(null);
                  setError(null);
                }}
                disabled={loading}
              >
                Clear
              </button>
            </div>

            <div className="ndm-divider" />

            <div className="ndm-fieldLabel">Refine</div>
            <textarea className="ndm-textarea" value={refinePrompt} onChange={(e) => setRefinePrompt(e.target.value)} />

            <button className="ndm-btn" onClick={refineExisting} disabled={loading || !spec || refinePrompt.trim().length === 0}>
              {loading ? "Working..." : "Refine existing"}
            </button>

            {error && <div className="ndm-error">Error: {error}</div>}
            {spec?.warnings?.length ? (
              <div className="ndm-warnBox">
                <div className="ndm-warnTitle">Warnings</div>
                <ul>
                  {spec.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        {/* Middle: Elements + Properties (Inspector) */}
        <div className="ndm-card ndm-builder">
          <div className="ndm-builderTop">
            <div className="ndm-builderTopLeft">
              <div className="ndm-builderTab">ELEMENTS</div>
              <button className="ndm-plusBtn" title="Add element" aria-label="Add element">
                +
              </button>
            </div>

            <div className="ndm-builderTopRight">
              <div className="ndm-builderTab">PROPERTIES OF</div>
              <div className="ndm-builderTabValue">{spec ? "Button 1" : "—"}</div>
              <button className="ndm-iconBtn ndm-mini" title="Code" aria-label="Code">
                {"</>"}
              </button>
            </div>
          </div>

          <div className="ndm-builderBody">
            <div className="ndm-elementsPane">
              <div className="ndm-elementsList">
                <div className="ndm-el">Container</div>
                <div className="ndm-el ndm-elSub">🖼️ Image 1</div>
                <div className="ndm-el ndm-elSub">T Text 1</div>
                <div className={"ndm-el ndm-elSub ndm-elSelected"}>▭ Button 1</div>
                <div className="ndm-el ndm-elSub">▭ Button 2</div>
              </div>
            </div>

            <div className="ndm-propertiesPane">
              {spec ? (
                <Inspector
                  spec={spec}
                  onChange={(next) => {
                    normalizeAndSet(next);
                  }}
                />
              ) : (
                <div className="ndm-emptyProps">Generate a popup to edit properties.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Preview Canvas */}
        <div className="ndm-card ndm-preview">
          <div className="ndm-canvasTop">
            <select className="ndm-zoomSelect" defaultValue="100">
              <option value="50">50%</option>
              <option value="75">75%</option>
              <option value="100">100%</option>
              <option value="125">125%</option>
            </select>
          </div>

          <div className="ndm-canvas">
            {spec ? <PopupPreview spec={spec} onClose={() => {}} /> : <div className="ndm-emptyPreview">Generate to preview.</div>}
          </div>

          {/* Optional: show JSON (kept for developer visibility) */}
          <details className="ndm-json">
            <summary>PopupSpec JSON</summary>
            <pre className="ndm-code">{prettyJSON || "{ }"}</pre>
          </details>
        </div>
      </div>
    </div>
  );
}
