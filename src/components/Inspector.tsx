import React, { useMemo } from "react";
import type { PopupSpec, Spacing, Align } from "../spec";

type Props = {
  spec: PopupSpec;
  selectedId: string; // "container" or element.id
  onChangeSpec: (next: PopupSpec) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function numberInput(value: number, onChange: (v: number) => void, min?: number, max?: number) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (Number.isFinite(v)) onChange(max != null ? clamp(v, min ?? -Infinity, max) : v);
      }}
      className="inp"
    />
  );
}

function spacingEditor(label: string, v: Spacing, onChange: (next: Spacing) => void) {
  const set = (k: keyof Spacing, n: number) => onChange({ ...v, [k]: n });
  return (
    <div className="field">
      <div className="fieldLabel">{label}</div>
      <div className="grid4">
        <div className="mini">
          <div className="miniLabel">Top</div>
          {numberInput(v.top, (n) => set("top", clamp(n, 0, 80)), 0, 80)}
        </div>
        <div className="mini">
          <div className="miniLabel">Right</div>
          {numberInput(v.right, (n) => set("right", clamp(n, 0, 80)), 0, 80)}
        </div>
        <div className="mini">
          <div className="miniLabel">Bottom</div>
          {numberInput(v.bottom, (n) => set("bottom", clamp(n, 0, 80)), 0, 80)}
        </div>
        <div className="mini">
          <div className="miniLabel">Left</div>
          {numberInput(v.left, (n) => set("left", clamp(n, 0, 80)), 0, 80)}
        </div>
      </div>
    </div>
  );
}

export default function Inspector({ spec, selectedId, onChangeSpec }: Props) {
  const selected = useMemo(() => {
    if (selectedId === "container") return null;
    return spec.elements.find((e) => e.id === selectedId) || null;
  }, [spec.elements, selectedId]);

  const title = selectedId === "container" ? "Container properties" : selected?.name || "Properties";

  const setContainer = (patch: Partial<PopupSpec["container"]>) => {
    onChangeSpec({ ...spec, container: { ...spec.container, ...patch } });
  };

  const setTheme = (patch: Partial<PopupSpec["theme"]>) => {
    onChangeSpec({ ...spec, theme: { ...spec.theme, ...patch } });
  };

  const setElement = (patch: any) => {
    if (!selected) return;
    onChangeSpec({
      ...spec,
      elements: spec.elements.map((e) => (e.id === selected.id ? { ...e, ...patch } : e)),
    });
  };

  const setAlign = (align: Align) => setElement({ align });

  return (
    <div className="panel">
      <div className="panelHeader">
        <div className="panelTitle">{title}</div>
      </div>

      <div className="panelBody">
        {selectedId === "container" ? (
          <>
            <div className="sectionTitle">Popup</div>

            <div className="field">
              <div className="fieldLabel">Popup type</div>
              <div className="pill">{spec.popupType}</div>
            </div>

            <div className="field">
              <div className="fieldLabel">Aspect ratio</div>
              <select
                className="sel"
                value={spec.container.aspectRatio}
                onChange={(e) => setContainer({ aspectRatio: e.target.value as any })}
              >
                <option value="auto">auto</option>
                <option value="1:1">1:1</option>
                <option value="4:3">4:3</option>
                <option value="16:9">16:9</option>
              </select>
            </div>

            <div className="field">
              <div className="fieldLabel">Max width</div>
              {numberInput(spec.container.maxWidth, (v) => setContainer({ maxWidth: clamp(v, 280, 860) }), 280, 860)}
            </div>

            <div className="field">
              <div className="fieldLabel">Corner radius</div>
              {numberInput(spec.container.cornerRadius, (v) => setContainer({ cornerRadius: clamp(v, 0, 40) }), 0, 40)}
            </div>

            <div className="field">
              <div className="fieldLabel">Padding</div>
              {numberInput(spec.container.padding, (v) => setContainer({ padding: clamp(v, 0, 48) }), 0, 48)}
            </div>

            <div className="fieldRow">
              <label className="chkRow">
                <input
                  type="checkbox"
                  checked={spec.container.showCloseIcon}
                  onChange={(e) => setContainer({ showCloseIcon: e.target.checked })}
                />
                Show close icon
              </label>

              <label className="chkRow">
                <input
                  type="checkbox"
                  checked={spec.container.backdrop}
                  onChange={(e) => setContainer({ backdrop: e.target.checked })}
                />
                Backdrop
              </label>

              <label className="chkRow">
                <input
                  type="checkbox"
                  checked={spec.container.dismissible}
                  onChange={(e) => setContainer({ dismissible: e.target.checked })}
                />
                Dismissible
              </label>
            </div>

            <div className="sectionTitle">Theme</div>

            <div className="field">
              <div className="fieldLabel">Brand color</div>
              <input
                className="inp"
                value={spec.theme.brandColor}
                onChange={(e) => setTheme({ brandColor: e.target.value })}
                placeholder="#3B82F6"
              />
            </div>

            <div className="field">
              <div className="fieldLabel">Background color</div>
              <input
                className="inp"
                value={spec.container.backgroundColor}
                onChange={(e) => setContainer({ backgroundColor: e.target.value })}
                placeholder="#FFFFFF"
              />
            </div>
          </>
        ) : selected ? (
          <>
            <div className="sectionTitle">Element</div>

            <div className="field">
              <div className="fieldLabel">Name</div>
              <input className="inp" value={selected.name} onChange={(e) => setElement({ name: e.target.value })} />
            </div>

            <div className="field">
              <div className="fieldLabel">Alignment</div>
              <div className="seg">
                <button className={selected.align === "left" ? "segBtn active" : "segBtn"} onClick={() => setAlign("left")}>
                  Left
                </button>
                <button className={selected.align === "center" ? "segBtn active" : "segBtn"} onClick={() => setAlign("center")}>
                  Center
                </button>
                <button className={selected.align === "right" ? "segBtn active" : "segBtn"} onClick={() => setAlign("right")}>
                  Right
                </button>
              </div>
            </div>

            {spacingEditor("Margin", selected.margin, (next) => setElement({ margin: next }))}
            {spacingEditor("Padding", selected.padding, (next) => setElement({ padding: next }))}

            {selected.type === "text" && (
              <>
                <div className="sectionTitle">Text</div>

                <div className="field">
                  <div className="fieldLabel">Text</div>
                  <textarea className="txt" value={selected.text} onChange={(e) => setElement({ text: e.target.value })} />
                </div>

                <div className="field">
                  <div className="fieldLabel">Font size</div>
                  {numberInput(selected.fontSize, (v) => setElement({ fontSize: clamp(v, 10, 40) }), 10, 40)}
                </div>

                <div className="field">
                  <div className="fieldLabel">Font weight</div>
                  <select className="sel" value={selected.fontWeight} onChange={(e) => setElement({ fontWeight: Number(e.target.value) })}>
                    <option value={400}>400</option>
                    <option value={500}>500</option>
                    <option value={600}>600</option>
                    <option value={700}>700</option>
                  </select>
                </div>

                <div className="field">
                  <div className="fieldLabel">Color (optional)</div>
                  <input className="inp" value={selected.color || ""} onChange={(e) => setElement({ color: e.target.value || undefined })} placeholder="inherit" />
                </div>
              </>
            )}

            {selected.type === "image" && (
              <>
                <div className="sectionTitle">Image</div>

                <div className="field">
                  <div className="fieldLabel">Image URL</div>
                  <input className="inp" value={selected.url} onChange={(e) => setElement({ url: e.target.value })} />
                </div>

                <div className="field">
                  <div className="fieldLabel">Alt text</div>
                  <input className="inp" value={selected.alt} onChange={(e) => setElement({ alt: e.target.value })} />
                </div>

                <div className="field">
                  <div className="fieldLabel">Height</div>
                  {numberInput(selected.height, (v) => setElement({ height: clamp(v, 80, 320) }), 80, 320)}
                </div>

                <div className="field">
                  <div className="fieldLabel">Radius</div>
                  {numberInput(selected.radius, (v) => setElement({ radius: clamp(v, 0, 28) }), 0, 28)}
                </div>
              </>
            )}

            {selected.type === "cta" && (
              <>
                <div className="sectionTitle">CTA</div>

                <div className="field">
                  <div className="fieldLabel">Label</div>
                  <input className="inp" value={selected.label} onChange={(e) => setElement({ label: e.target.value })} />
                </div>

                <div className="field">
                  <div className="fieldLabel">Variant</div>
                  <select className="sel" value={selected.variant} onChange={(e) => setElement({ variant: e.target.value })}>
                    <option value="primary">primary</option>
                    <option value="secondary">secondary</option>
                  </select>
                </div>

                <div className="field">
                  <div className="fieldLabel">Action</div>
                  <select
                    className="sel"
                    value={selected.action.type}
                    onChange={(e) => {
                      const t = e.target.value as "url" | "dismiss";
                      setElement({ action: t === "dismiss" ? { type: "dismiss" } : { type: "url", value: selected.action.value || "https://example.com" } });
                    }}
                  >
                    <option value="url">Open URL</option>
                    <option value="dismiss">Dismiss</option>
                  </select>
                </div>

                {selected.action.type === "url" && (
                  <div className="field">
                    <div className="fieldLabel">URL</div>
                    <input
                      className="inp"
                      value={selected.action.value || ""}
                      onChange={(e) => setElement({ action: { type: "url", value: e.target.value } })}
                    />
                  </div>
                )}

                <label className="chkRow">
                  <input type="checkbox" checked={selected.fullWidth} onChange={(e) => setElement({ fullWidth: e.target.checked })} />
                  Full width
                </label>
              </>
            )}
          </>
        ) : (
          <div className="emptyState">Select an element to edit its properties.</div>
        )}
      </div>
    </div>
  );
}
