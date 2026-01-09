import type { PopupSpec } from "../spec";

type Props = {
  spec: PopupSpec;
  onChange: (next: PopupSpec) => void;
};

function clampInt(v: string, min: number, max: number, fallback: number) {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function Inspector({ spec, onChange }: Props) {
  const primary = spec.ctas.find((c) => c.id === "primary");
  const secondary = spec.ctas.find((c) => c.id === "secondary");

  function update(mutator: (draft: PopupSpec) => void) {
    const next: PopupSpec = JSON.parse(JSON.stringify(spec));
    mutator(next);
    onChange(next);
  }

  return (
    <div>
      <div className="groupTitle">Content</div>

      <label className="label">Headline</label>
      <input className="input" value={spec.content.headline} onChange={(e) => update((d) => { d.content.headline = e.target.value; })} />

      <label className="label">Body</label>
      <textarea className="textarea" style={{ minHeight: 90 }} value={spec.content.body} onChange={(e) => update((d) => { d.content.body = e.target.value; })} />

      <div className="row">
        <div className="field">
          <label className="label">Image</label>
          <select
            className="input"
            value={spec.content.image.enabled ? "on" : "off"}
            onChange={(e) =>
              update((d) => {
                const on = e.target.value === "on";
                if (on) {
                  d.content.image.enabled = true;
                  d.content.image.url = d.content.image.url || "https://placehold.co/800x400/png";
                  d.content.image.alt = d.content.image.alt || "Placeholder image";
                  d.layout.structure = "image_top";
                } else {
                  d.content.image.enabled = false;
                  d.content.image.url = "";
                  d.content.image.alt = "";
                  d.layout.structure = "no_image";
                }
              })
            }
          >
            <option value="off">Off</option>
            <option value="on">On</option>
          </select>
        </div>

        {spec.content.image.enabled && (
          <>
            <div className="field">
              <label className="label">Image URL</label>
              <input className="input" value={spec.content.image.url || ""} onChange={(e) => update((d) => { d.content.image.url = e.target.value; })} />
            </div>
            <div className="field">
              <label className="label">Alt text</label>
              <input className="input" value={spec.content.image.alt || ""} onChange={(e) => update((d) => { d.content.image.alt = e.target.value; })} />
            </div>
          </>
        )}
      </div>

      <div className="groupTitle">CTA</div>

      <label className="label">Primary label</label>
      <input
        className="input"
        value={primary?.label || ""}
        onChange={(e) =>
          update((d) => {
            const p = d.ctas.find((c) => c.id === "primary");
            if (p) p.label = e.target.value;
          })
        }
      />

      <label className="label">Primary action</label>
      <select
        className="input"
        value={primary?.action.type || "url"}
        onChange={(e) =>
          update((d) => {
            const p = d.ctas.find((c) => c.id === "primary");
            if (!p) return;
            const t = e.target.value as "dismiss" | "url";
            p.action.type = t;
            if (t === "dismiss") p.action.value = "";
            if (t === "url") p.action.value = p.action.value || "https://example.com";
          })
        }
      >
        <option value="url">Open URL</option>
        <option value="dismiss">Dismiss</option>
      </select>

      {primary?.action.type === "url" && (
        <>
          <label className="label">Primary URL</label>
          <input
            className="input"
            value={primary.action.value || ""}
            onChange={(e) =>
              update((d) => {
                const p = d.ctas.find((c) => c.id === "primary");
                if (p) p.action.value = e.target.value;
              })
            }
          />
        </>
      )}

      <div className="row">
        <div className="field">
          <label className="label">Secondary CTA</label>
          <select
            className="input"
            value={secondary ? "on" : "off"}
            onChange={(e) =>
              update((d) => {
                const on = e.target.value === "on";
                const has = d.ctas.some((c) => c.id === "secondary");
                if (on && !has) {
                  d.ctas.push({
                    id: "secondary",
                    label: "Later",
                    action: { type: "dismiss", value: "" },
                    style: "secondary",
                  } as any);
                }
                if (!on && has) d.ctas = d.ctas.filter((c) => c.id !== "secondary");
              })
            }
          >
            <option value="off">Off</option>
            <option value="on">On</option>
          </select>
        </div>

        {secondary && (
          <div className="field">
            <label className="label">Secondary label</label>
            <input
              className="input"
              value={secondary.label}
              onChange={(e) =>
                update((d) => {
                  const s = d.ctas.find((c) => c.id === "secondary");
                  if (s) s.label = e.target.value;
                })
              }
            />
          </div>
        )}
      </div>

      {secondary && (
        <>
          <label className="label">Secondary action</label>
          <select
            className="input"
            value={secondary.action.type}
            onChange={(e) =>
              update((d) => {
                const s = d.ctas.find((c) => c.id === "secondary");
                if (!s) return;
                const t = e.target.value as "dismiss" | "url";
                s.action.type = t;
                if (t === "dismiss") s.action.value = "";
                if (t === "url") s.action.value = s.action.value || "https://example.com";
              })
            }
          >
            <option value="dismiss">Dismiss</option>
            <option value="url">Open URL</option>
          </select>

          {secondary.action.type === "url" && (
            <>
              <label className="label">Secondary URL</label>
              <input
                className="input"
                value={secondary.action.value || ""}
                onChange={(e) =>
                  update((d) => {
                    const s = d.ctas.find((c) => c.id === "secondary");
                    if (s) s.action.value = e.target.value;
                  })
                }
              />
            </>
          )}
        </>
      )}

      <div className="groupTitle">Layout</div>

      <div className="row">
        <div className="field">
          <label className="label">Structure</label>
          <select className="input" value={spec.layout.structure} onChange={(e) => update((d) => { d.layout.structure = e.target.value as any; })}>
            <option value="image_top">Image top</option>
            <option value="no_image">No image</option>
          </select>
        </div>
        <div className="field">
          <label className="label">Padding</label>
          <input className="input" value={spec.layout.padding} onChange={(e) => update((d) => { d.layout.padding = clampInt(e.target.value, 0, 48, d.layout.padding); })} />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label className="label">Corner radius</label>
          <input className="input" value={spec.layout.cornerRadius} onChange={(e) => update((d) => { d.layout.cornerRadius = clampInt(e.target.value, 0, 40, d.layout.cornerRadius); })} />
        </div>
        <div className="field">
          <label className="label">Max width</label>
          <input className="input" value={spec.layout.maxWidth} onChange={(e) => update((d) => { d.layout.maxWidth = clampInt(e.target.value, 280, 860, d.layout.maxWidth); })} />
        </div>
      </div>

      <div className="groupTitle">Theme</div>

      <div className="row">
        <div className="field">
          <label className="label">Brand color</label>
          <input className="input" value={spec.theme.brandColor} onChange={(e) => update((d) => { d.theme.brandColor = e.target.value; })} />
        </div>
        <div className="field">
          <label className="label">Background</label>
          <input className="input" value={spec.theme.backgroundColor} onChange={(e) => update((d) => { d.theme.backgroundColor = e.target.value; })} />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label className="label">Text</label>
          <input className="input" value={spec.theme.textColor} onChange={(e) => update((d) => { d.theme.textColor = e.target.value; })} />
        </div>
        <div className="field">
          <label className="label">Muted text</label>
          <input className="input" value={spec.theme.mutedTextColor} onChange={(e) => update((d) => { d.theme.mutedTextColor = e.target.value; })} />
        </div>
      </div>
    </div>
  );
}
