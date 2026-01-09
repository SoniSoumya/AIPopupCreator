import { useMemo } from "react";
import type { PopupSpec } from "../spec";

type EditorElement =
  | { id: "container"; kind: "container" }
  | { id: "image"; kind: "image" }
  | { id: "text"; kind: "text" }
  | { id: "cta-primary"; kind: "cta" }
  | { id: "cta-secondary"; kind: "cta" };

export default function Inspector(props: {
  spec: PopupSpec;
  elements: EditorElement[];
  selectedId: string;
  onSelect: (id: string) => void;
  onChange: (next: PopupSpec) => void;
}) {
  const { spec, elements, selectedId, onSelect, onChange } = props;

  const selected = useMemo(
    () => elements.find((e) => e.id === selectedId) || elements[0],
    [elements, selectedId]
  );

  const title = useMemo(() => {
    if (!selected) return "Properties";
    if (selected.kind === "container") return "Properties";
    if (selected.kind === "image") return "Properties of Image";
    if (selected.kind === "text") return "Properties of Text";
    if (selected.kind === "cta") return `Properties of ${selected.id === "cta-primary" ? "Primary CTA" : "Secondary CTA"}`;
    return "Properties";
  }, [selected]);

  function setTheme(patch: Partial<PopupSpec["theme"]>) {
    onChange({ ...spec, theme: { ...spec.theme, ...patch } });
  }

  function setLayout(patch: Partial<PopupSpec["layout"]>) {
    onChange({ ...spec, layout: { ...spec.layout, ...patch } });
  }

  function setBehavior(patch: Partial<PopupSpec["behavior"]>) {
    onChange({ ...spec, behavior: { ...spec.behavior, ...patch } });
  }

  function setContent(patch: Partial<PopupSpec["content"]>) {
    onChange({ ...spec, content: { ...spec.content, ...patch } });
  }

  function updateCTA(id: "primary" | "secondary", patch: Partial<PopupSpec["ctas"][number]>) {
    const next = {
      ...spec,
      ctas: spec.ctas.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    };
    onChange(next);
  }

  const showSecondaryCTA = spec.ctas.some((c) => c.id === "secondary");

  function ensureSecondaryCTA(enabled: boolean) {
    if (enabled) {
      if (showSecondaryCTA) return;
      onChange({
        ...spec,
        ctas: [
          ...spec.ctas,
          { id: "secondary", label: "Later", action: { type: "dismiss" }, style: "secondary" },
        ],
      });
    } else {
      onChange({
        ...spec,
        ctas: spec.ctas.filter((c) => c.id !== "secondary"),
      });
      if (selectedId === "cta-secondary") onSelect("container");
    }
  }

  return (
    <div className="inspector">
      {/* Elements tree */}
      <div className="inspector-section">
        <div className="inspector-header">
          <div className="inspector-title">ELEMENTS</div>
          <button
            className="icon-btn"
            title="Add element"
            onClick={() => {
              // placeholder: menu work will come next iteration
              // for now, toggle secondary CTA as a quick proof
              ensureSecondaryCTA(!showSecondaryCTA);
            }}
          >
            +
          </button>
        </div>

        <div className="tree">
          {elements.map((el) => {
            const name =
              el.id === "container"
                ? "Container"
                : el.id === "image"
                  ? "Image"
                  : el.id === "text"
                    ? "Text"
                    : el.id === "cta-primary"
                      ? "Button 1"
                      : "Button 2";

            const isActive = el.id === selectedId;
            return (
              <button
                key={el.id}
                className={`tree-item ${isActive ? "active" : ""}`}
                onClick={() => onSelect(el.id)}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Properties */}
      <div className="inspector-section grow">
        <div className="inspector-header">
          <div className="inspector-title">{title}</div>
        </div>

        <div className="props">
          {selected?.kind === "container" && (
            <>
              <div className="field">
                <label>Type</label>
                <select
                  value={spec.type}
                  onChange={(e) => onChange({ ...spec, type: e.target.value as PopupSpec["type"] })}
                >
                  <option value="modal">Modal</option>
                  <option value="slideup">Slideup</option>
                  <option value="banner">Banner</option>
                </select>
              </div>

              <div className="field">
                <label>Mode</label>
                <select
                  value={spec.theme.mode}
                  onChange={(e) => setTheme({ mode: e.target.value as "light" | "dark" })}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className="field">
                <label>Brand color</label>
                <input value={spec.theme.brandColor} onChange={(e) => setTheme({ brandColor: e.target.value })} />
              </div>

              <div className="field">
                <label>Max width</label>
                <input
                  type="number"
                  value={spec.layout.maxWidth}
                  onChange={(e) => setLayout({ maxWidth: Number(e.target.value || 0) })}
                />
              </div>

              <div className="field">
                <label>Padding</label>
                <input
                  type="number"
                  value={spec.layout.padding}
                  onChange={(e) => setLayout({ padding: Number(e.target.value || 0) })}
                />
              </div>

              <div className="field">
                <label>Corner radius</label>
                <input
                  type="number"
                  value={spec.layout.cornerRadius}
                  onChange={(e) => setLayout({ cornerRadius: Number(e.target.value || 0) })}
                />
              </div>

              <div className="field">
                <label>Dismissible</label>
                <select
                  value={String(spec.behavior.dismissible)}
                  onChange={(e) => setBehavior({ dismissible: e.target.value === "true" })}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="field">
                <label>Backdrop</label>
                <select
                  value={String(spec.behavior.backdrop)}
                  onChange={(e) => setBehavior({ backdrop: e.target.value === "true" })}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="field">
                <label>Secondary button</label>
                <select
                  value={String(showSecondaryCTA)}
                  onChange={(e) => ensureSecondaryCTA(e.target.value === "true")}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </>
          )}

          {selected?.kind === "text" && (
            <>
              <div className="field">
                <label>Headline</label>
                <input value={spec.content.headline} onChange={(e) => setContent({ headline: e.target.value })} />
              </div>

              <div className="field">
                <label>Body</label>
                <textarea value={spec.content.body} onChange={(e) => setContent({ body: e.target.value })} />
              </div>
            </>
          )}

          {selected?.kind === "image" && (
            <>
              <div className="field">
                <label>Show image</label>
                <select
                  value={spec.content.image.kind}
                  onChange={(e) => {
                    const kind = e.target.value as "none" | "url";
                    if (kind === "none") setContent({ image: { kind: "none" } as any });
                    else
                      setContent({
                        image: {
                          kind: "url",
                          url: "https://placehold.co/800x400/png",
                          alt: "Image",
                        } as any,
                      });
                  }}
                >
                  <option value="url">Yes</option>
                  <option value="none">No</option>
                </select>
              </div>

              {spec.content.image.kind === "url" && (
                <>
                  <div className="field">
                    <label>Image URL</label>
                    <input
                      value={(spec.content.image as any).url || ""}
                      onChange={(e) =>
                        setContent({ image: { ...(spec.content.image as any), url: e.target.value } as any })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Alt text</label>
                    <input
                      value={(spec.content.image as any).alt || ""}
                      onChange={(e) =>
                        setContent({ image: { ...(spec.content.image as any), alt: e.target.value } as any })
                      }
                    />
                  </div>
                </>
              )}
            </>
          )}

          {selected?.kind === "cta" && (
            <>
              {selectedId === "cta-primary" && (
                <>
                  <div className="field">
                    <label>Button text</label>
                    <input
                      value={spec.ctas.find((c) => c.id === "primary")?.label || ""}
                      onChange={(e) => updateCTA("primary", { label: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>URL</label>
                    <input
                      value={(spec.ctas.find((c) => c.id === "primary")?.action as any)?.value || ""}
                      onChange={(e) =>
                        updateCTA("primary", { action: { type: "url", value: e.target.value } as any })
                      }
                    />
                  </div>
                </>
              )}

              {selectedId === "cta-secondary" && (
                <>
                  <div className="field">
                    <label>Enabled</label>
                    <select value={String(showSecondaryCTA)} onChange={(e) => ensureSecondaryCTA(e.target.value === "true")}>
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>

                  {showSecondaryCTA && (
                    <div className="field">
                      <label>Button text</label>
                      <input
                        value={spec.ctas.find((c) => c.id === "secondary")?.label || ""}
                        onChange={(e) => updateCTA("secondary", { label: e.target.value })}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
