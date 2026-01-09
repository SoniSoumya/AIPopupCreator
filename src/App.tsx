import { useMemo, useState } from "react";
import { PopupSpec } from "./spec";
import {
  OFFLINE_DEMOS,
  generateSpecOfflineDemo,
  generateSpecWithOpenAI,
} from "./generator";
import Inspector from "./components/Inspector";
import PopupPreview from "./components/PopupPreview";
import "./app.css";

type EditorElement =
  | { id: "container"; kind: "container" }
  | { id: "image"; kind: "image" }
  | { id: "text"; kind: "text" }
  | { id: "cta-primary"; kind: "cta" }
  | { id: "cta-secondary"; kind: "cta" };

export default function App() {
  const [mode, setMode] = useState<"offline" | "ai">("offline");
  const [spec, setSpec] = useState<PopupSpec>(() =>
    generateSpecOfflineDemo()
  );
  const [selectedId, setSelectedId] = useState<string>("container");

  /**
   * IMPORTANT:
   * We derive editor elements from PopupSpec instead of assuming spec.elements
   */
  const elements: EditorElement[] = useMemo(() => {
    const els: EditorElement[] = [{ id: "container", kind: "container" }];

    if (spec.content.image?.kind === "url") {
      els.push({ id: "image", kind: "image" });
    }

    els.push({ id: "text", kind: "text" });

    spec.ctas.forEach((cta) => {
      els.push({
        id: `cta-${cta.id}`,
        kind: "cta",
      });
    });

    return els;
  }, [spec]);

  async function runAI(prompt: string, apiKey: string) {
    const next = await generateSpecWithOpenAI({
      apiKey,
      prompt,
      brandColor: spec.theme.brandColor,
      mode: spec.theme.mode,
      type: spec.type,
      currentSpec: spec,
    });
    setSpec(next);
  }

  return (
    <div className="app-root">
      {/* LEFT: Ask AI / Offline demos */}
      <aside className="panel left">
        <h3>Ask AI</h3>

        <div className="mode-toggle">
          <button
            className={mode === "offline" ? "active" : ""}
            onClick={() => {
              setMode("offline");
              setSpec(generateSpecOfflineDemo());
            }}
          >
            Offline demo
          </button>
          <button
            className={mode === "ai" ? "active" : ""}
            onClick={() => setMode("ai")}
          >
            Live AI
          </button>
        </div>

        {mode === "offline" && (
          <div className="demo-list">
            {OFFLINE_DEMOS.map((d) => (
              <button key={d.id} onClick={() => setSpec(d.spec)}>
                {d.title}
              </button>
            ))}
          </div>
        )}

        {mode === "ai" && (
          <div className="ai-hint">
            <p>Enter prompt + API key (demo only)</p>
          </div>
        )}
      </aside>

      {/* MIDDLE: Elements tree + properties */}
      <aside className="panel middle">
        <Inspector
          spec={spec}
          elements={elements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onChange={setSpec}
        />
      </aside>

      {/* RIGHT: Preview */}
      <main className="panel right">
        <PopupPreview spec={spec} selectedId={selectedId} />
      </main>
    </div>
  );
}
