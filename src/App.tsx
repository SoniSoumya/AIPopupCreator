import { useMemo, useRef, useState } from "react";
import "./app.css";

import type { PopupDoc, ElementKind } from "./spec";
import { PopupDocSchema } from "./spec";

import { addElement, defaultsContainer, generateDocDeterministic, getDemoPresets } from "./generator";
import { Inspector } from "./components/Inspector";
import { PopupPreview } from "./components/PopupPreview";

const PRESETS = getDemoPresets();

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

export default function App() {
  // Start with first preset for instant demo
  const [doc, setDoc] = useState<PopupDoc>(() => clone(PRESETS[0].doc));
  const [selectedId, setSelectedId] = useState<string>("container");

  const [prompt, setPrompt] = useState(PRESETS[0].prompt);
  const [brandColor, setBrandColor] = useState(doc.container.brandColor);
  const [mode, setMode] = useState(doc.container.mode);

  const [plusOpen, setPlusOpen] = useState(false);
  const plusRef = useRef<HTMLButtonElement | null>(null);

  const json = useMemo(() => JSON.stringify(doc, null, 2), [doc]);

  function safeSetDoc(next: PopupDoc) {
    const parsed = PopupDocSchema.safeParse(next);
    if (!parsed.success) {
      // keep current doc if invalid
      console.error(parsed.error);
      return;
    }
    setDoc(parsed.data);
  }

  function loadPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPrompt(p.prompt);
    safeSetDoc(clone(p.doc));
    setSelectedId("container");
    setBrandColor(p.doc.container.brandColor);
    setMode(p.doc.container.mode);
  }

  function runOfflineGenerate() {
    // Deterministic (no API). Useful when you type your own prompt.
    const next = generateDocDeterministic(prompt, brandColor, mode);
    safeSetDoc(next);
    setSelectedId("container");
  }

  function onAdd(kind: ElementKind) {
    const next = addElement(doc, kind);
    safeSetDoc(next);
    const added = next.elements[next.elements.length - 1];
    setSelectedId(added.id);
    setPlusOpen(false);
  }

  return (
    <div className="ndm-root">
      {/* Top header */}
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

      {/* Horizontal scroll area */}
      <div className="ndm-scrollX">
        <div className="ndm-columns">
          {/* LEFT: AskAI */}
          <div className="ndm-card ndm-askai">
            <div className="ndm-askaiHeader">
              <div className="ndm-askaiBadge">✦</div>
              <div className="ndm-askaiTitle">AskAI</div>
            </div>

            <div className="ndm-askaiBody">
              <div className="ndm-askaiHeroIcon">✦</div>
              <div className="ndm-askaiHeroText">Build Native display content with AI</div>

              <div className="ndm-askaiSub">Example queries (offline demo)</div>

              <div className="ndm-exampleList">
                {PRESETS.map((p) => (
                  <button key={p.id} className="ndm-examplePill" onClick={() => loadPreset(p.id)}>
                    {p.prompt}
                  </button>
                ))}
              </div>

              <div className="ndm-divider" />

              <div className="ndm-fieldLabel">Prompt</div>
              <textarea className="ndm-textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} />

              <div className="ndm-row">
                <div className="ndm-col">
                  <div className="ndm-fieldLabel">Mode</div>
                  <select className="ndm-select" value={mode} onChange={(e) => setMode(e.target.value as any)}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                <div className="ndm-col">
                  <div className="ndm-fieldLabel">Brand</div>
                  <input className="ndm-input" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
                </div>
              </div>

              <div className="ndm-actions">
                <button className="ndm-btn" onClick={runOfflineGenerate} disabled={!prompt.trim()}>
                  Generate (offline)
                </button>
              </div>
            </div>
          </div>

          {/* MIDDLE: Builder */}
          <div className="ndm-card ndm-builder">
            <div className="ndm-builderTop">
              <div className="ndm-builderTopLeft">
                <div className="ndm-builderTab">ELEMENTS</div>

                <button
                  ref={plusRef}
                  className="ndm-plusBtn"
                  title="Add element"
                  aria-label="Add element"
                  onClick={() => setPlusOpen((v) => !v)}
                >
                  +
                </button>

                {plusOpen && (
                  <div className="ndm-plusMenu" role="menu">
                    <button className="ndm-plusItem" onClick={() => onAdd("text")}>
                      Add Text
                    </button>
                    <button className="ndm-plusItem" onClick={() => onAdd("image")}>
                      Add Image
                    </button>
                    <button className="ndm-plusItem" onClick={() => onAdd("button")}>
                      Add CTA
                    </button>
                  </div>
                )}
              </div>

              <div className="ndm-builderTopRight">
                <div className="ndm-builderTab">PROPERTIES OF</div>
                <div className="ndm-builderTabValue">
                  {selectedId === "container" ? "Container" : doc.elements.find((e) => e.id === selectedId)?.name || "—"}
                </div>
                <button className="ndm-iconBtn ndm-mini" title="Code" aria-label="Code">
                  {"</>"}
                </button>
              </div>
            </div>

            <div className="ndm-builderBody">
              <div className="ndm-elementsPane">
                {/* Tree */}
                <div className="ndm-elementsList">
                  <div
                    className={"ndm-el " + (selectedId === "container" ? "ndm-elSelected" : "")}
                    onClick={() => setSelectedId("container")}
                    role="button"
                    tabIndex={0}
                  >
                    Container
                  </div>

                  {doc.elements.map((e) => (
                    <div
                      key={e.id}
                      className={"ndm-el ndm-elSub " + (selectedId === e.id ? "ndm-elSelected" : "")}
                      onClick={() => setSelectedId(e.id)}
                      role="button"
                      tabIndex={0}
                    >
                      {e.kind === "image" ? "🖼️" : e.kind === "text" ? "T" : "▭"} {e.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="ndm-propertiesPane">
                <Inspector
                  doc={doc}
                  selectedId={selectedId}
                  onChange={(next) => {
                    // Keep container theme in sync with left panel inputs if user edits inside inspector
                    safeSetDoc(next);
                  }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Preview */}
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
              <PopupPreview doc={doc} selectedId={selectedId} onSelect={(id) => setSelectedId(id)} />
            </div>

            <details className="ndm-json">
              <summary>Popup JSON (offline demo)</summary>
              <pre className="ndm-code">{json}</pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
