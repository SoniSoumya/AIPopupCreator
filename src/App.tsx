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
  if (s.content.image.kind === "none" && s.layout.structure === "image_top") warnings.push("Layout requests image but image.kind is none.");
  if (s.content.image.kind === "url" && s.layout.structure === "no_image") warnings.push("Image is set but layout structure is no_image.");
  return warnings;
}

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
  const [copied, setCopied] = useState(false);

  const prettyJSON = useMemo(() => (spec ? JSON.stringify(spec, null, 2) : ""), [spec]);

  function applyTemplateDefaults(type: PopupType) {
    setTemplate(type);
    const d = defaultsForType(type);
    if (spec) {
      // keep content/ctas, adjust layout defaults
      const next: PopupSpec = { ...spec, type, layout: { ...spec.layout, ...d } } as any;
      setSpec(next);
    }
  }

  async function generateNew() {
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      let data: unknown;

      if (useOpenAI) {
        if (!openaiKey.trim()) throw new Error("OpenAI API key is required when 'Use OpenAI' is enabled.");
        if (persistKey) localStorage.setItem(LS_KEY, openaiKey.trim());
        else localStorage.removeItem(LS_KEY);

        data = await generateSpecWithOpenAI({
          apiKey: openaiKey.trim(),
          prompt,
          brandColor,
          mode,
          type: template,
          model,
          currentSpec: null,
        });
      } else {
        data = generateSpecDeterministic(prompt, brandColor, mode, template);
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
    setCopied(false);

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
        // deterministic: just regenerate from combined instruction (MVP)
        data = generateSpecDeterministic(refinePrompt, brandColor, mode, template);
        // keep original CTA URL if present
        const parsedOld = spec;
        if (PopupSpecSchema.safeParse(data).success) {
          const d = data as PopupSpec;
          const oldPrimary = parsedOld.ctas.find(c => c.id === "primary");
          const newPrimary = d.ctas.find(c => c.id === "primary");
          if (oldPrimary?.action.type === "url" && newPrimary?.action.type === "url") newPrimary.action.value = oldPrimary.action.value;
          data = d;
        }
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

  async function onCopyJSON() {
    if (!spec) return;
    await navigator.clipboard.writeText(prettyJSON);
    setCopied(true);
    setTimeout(() => setCopied(false), 900);
  }

  return (
    <div className="page">
      <header className="header">
        <div className="title">AI-native In-App Popup Builder (Web MVP)</div>
        <div className="subtitle">Template switch + Inspector + Prompt refine loop (GitHub Pages ready)</div>
      </header>

      <div className="grid">
        <section className="card">
          <div className="cardTitle">Generate</div>

          <label className="label">Template</label>
          <select className="input" value={template} onChange={(e) => applyTemplateDefaults(e.target.value as PopupType)}>
            <option value="modal">Modal</option>
            <option value="banner">Banner</option>
            <option value="slideup">Slide-up</option>
          </select>

          <label className="label">Prompt</label>
          <textarea className="textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} />

          <div className="row">
            <div className="field">
              <label className="label">Brand color</label>
              <input className="input" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Mode</label>
              <select className="input" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          <div className="checkboxRow">
            <input id="useOpenAI" type="checkbox" checked={useOpenAI} onChange={(e) => setUseOpenAI(e.target.checked)} />
            <label htmlFor="useOpenAI" className="label" style={{ margin: 0 }}>
              Use OpenAI (client-side)
            </label>
          </div>

          {useOpenAI && (
            <>
              <div className="notice">
                This is a client-side OpenAI call. Your API key can be exposed in a static site. Use only for private
                demos/testing. For production, move this behind a serverless proxy.
              </div>

              <label className="label">OpenAI API key</label>
              <input className="input" type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} placeholder="sk-..." />

              <div className="checkboxRow">
                <input id="persistKey" type="checkbox" checked={persistKey} onChange={(e) => setPersistKey(e.target.checked)} />
                <label htmlFor="persistKey" className="small">Remember key in this browser (localStorage)</label>
              </div>

              <label className="label">Model</label>
              <input className="input" value={model} onChange={(e) => setModel(e.target.value)} />
              <div className="small">Model must support structured JSON outputs with JSON schema.</div>
            </>
          )}

          <div className="dualButtons">
            <button className="button" onClick={generateNew} disabled={loading || prompt.trim().length === 0}>
              {loading ? "Working..." : "Generate new"}
            </button>
            <button className="buttonSecondary" onClick={() => { setSpec(null); setError(null); }} disabled={loading}>
              Clear
            </button>
          </div>

          <div className="groupTitle">Refine</div>
          <label className="label">Refinement instruction (uses current spec)</label>
          <textarea className="textarea" style={{ minHeight: 90 }} value={refinePrompt} onChange={(e) => setRefinePrompt(e.target.value)} />

          <button className="button" onClick={refineExisting} disabled={loading || !spec || refinePrompt.trim().length === 0}>
            {loading ? "Working..." : "Refine existing"}
          </button>

          {error && <div className="error">Error: {error}</div>}
          {spec?.warnings?.length ? (
            <div className="warnings">
              <div className="warningsTitle">Warnings</div>
              <ul>
                {spec.warnings.map((w, i) => (<li key={i}>{w}</li>))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="card">
          <div className="cardTitle">Preview</div>
          {spec ? <PopupPreview spec={spec} onClose={() => {}} /> : <div className="empty">Generate a popup to preview.</div>}
          <div className="groupTitle">PopupSpec JSON</div>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div className="hint">This is what you will save/publish and render in-app.</div>
            <button className="buttonSecondary" onClick={onCopyJSON} disabled={!spec}>
              {copied ? "Copied" : "Copy JSON"}
            </button>
          </div>
          <pre className="code">{prettyJSON || "{ }"}</pre>
        </section>

        <section className="card">
          <div className="cardTitle">Inspector</div>
          {spec ? (
            <Inspector
              spec={spec}
              onChange={(next) => {
                const parsed = PopupSpecSchema.safeParse(next);
                if (!parsed.success) {
                  setError("Inspector changes produced invalid spec. Revert the last change.");
                  return;
                }
                const warnings = computeWarnings(parsed.data);
                setSpec({ ...parsed.data, warnings: [...parsed.data.warnings.filter(Boolean), ...warnings] });
              }}
            />
          ) : (
            <div className="empty">Generate a popup to edit properties.</div>
          )}
        </section>
      </div>
    </div>
  );
}
