import type { PopupDoc, PopupElement } from "../spec";

type Props = {
  doc: PopupDoc;
  selectedId: string; // "container" OR element id
  onChange: (next: PopupDoc) => void;
};

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

function clampInt(v: string, min: number, max: number, fallback: number) {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function clampFloat(v: string, min: number, max: number, fallback: number) {
  const n = Number.parseFloat(v);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function Inspector({ doc, selectedId, onChange }: Props) {
  const selected = selectedId === "container" ? null : doc.elements.find((e) => e.id === selectedId) || null;

  function update(mutator: (draft: PopupDoc) => void) {
    const next = clone(doc);
    mutator(next);
    onChange(next);
  }

  if (selectedId === "container") {
    const c = doc.container;
    return (
      <div>
        <div className="groupTitle">Container</div>

        <div className="row">
          <div className="field">
            <label className="label">Mode</label>
            <select className="input" value={c.mode} onChange={(e) => update((d) => (d.container.mode = e.target.value as any))}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Aspect ratio (W/H)</label>
            <input
              className="input"
              value={c.aspectRatio}
              onChange={(e) => update((d) => (d.container.aspectRatio = clampFloat(e.target.value, 0.2, 4, d.container.aspectRatio)))}
            />
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label className="label">Max width</label>
            <input
              className="input"
              value={c.maxWidth}
              onChange={(e) => update((d) => (d.container.maxWidth = clampInt(e.target.value, 280, 860, d.container.maxWidth)))}
            />
          </div>
          <div className="field">
            <label className="label">Corner radius</label>
            <input
              className="input"
              value={c.cornerRadius}
              onChange={(e) => update((d) => (d.container.cornerRadius = clampInt(e.target.value, 0, 40, d.container.cornerRadius)))}
            />
          </div>
        </div>

        <label className="label">Background color</label>
        <input className="input" value={c.backgroundColor} onChange={(e) => update((d) => (d.container.backgroundColor = e.target.value))} />

        <div className="row">
          <label className="check">
            <input type="checkbox" checked={c.showCloseIcon} onChange={(e) => update((d) => (d.container.showCloseIcon = e.target.checked))} />
            <span>Close icon</span>
          </label>

          <label className="check">
            <input type="checkbox" checked={c.backdrop} onChange={(e) => update((d) => (d.container.backdrop = e.target.checked))} />
            <span>Backdrop</span>
          </label>

          <label className="check">
            <input type="checkbox" checked={c.dismissible} onChange={(e) => update((d) => (d.container.dismissible = e.target.checked))} />
            <span>Dismissible</span>
          </label>
        </div>

        <div className="groupTitle">Theme</div>

        <div className="row">
          <div className="field">
            <label className="label">Brand color</label>
            <input className="input" value={c.brandColor} onChange={(e) => update((d) => (d.container.brandColor = e.target.value))} />
          </div>
          <div className="field">
            <label className="label">Text color</label>
            <input className="input" value={c.textColor} onChange={(e) => update((d) => (d.container.textColor = e.target.value))} />
          </div>
        </div>

        <label className="label">Muted text color</label>
        <input className="input" value={c.mutedTextColor} onChange={(e) => update((d) => (d.container.mutedTextColor = e.target.value))} />
      </div>
    );
  }

  if (!selected) {
    return <div className="emptyProps">Select an element to edit properties.</div>;
  }

  // Element inspector
  return (
    <div>
      <div className="groupTitle">{selected.name}</div>

      <div className="row">
        <div className="field">
          <label className="label">Name</label>
          <input
            className="input"
            value={selected.name}
            onChange={(e) =>
              update((d) => {
                const el = d.elements.find((x) => x.id === selected.id);
                if (el) el.name = e.target.value;
              })
            }
          />
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={!selected.hidden}
            onChange={(e) =>
              update((d) => {
                const el = d.elements.find((x) => x.id === selected.id);
                if (el) el.hidden = !e.target.checked;
              })
            }
          />
          <span>Visible</span>
        </label>
      </div>

      {selected.kind === "text" && (
        <>
          <label className="label">Text</label>
          <textarea
            className="textarea"
            value={selected.text}
            onChange={(e) =>
              update((d) => {
                const el = d.elements.find((x) => x.id === selected.id) as any;
                if (el) el.text = e.target.value;
              })
            }
            style={{ minHeight: 110 }}
          />

          <div className="row">
            <div className="field">
              <label className="label">Font</label>
              <input
                className="input"
                value={selected.fontFamily}
                onChange={(e) =>
                  update((d) => {
                    const el = d.elements.find((x) => x.id === selected.id) as any;
                    if (el) el.fontFamily = e.target.value;
                  })
                }
              />
            </div>
            <div className="field">
              <label className="label">Font size</label>
              <input
                className="input"
                value={selected.fontSize}
                onChange={(e) =>
                  update((d) => {
                    const el = d.elements.find((x) => x.id === selected.id) as any;
                    if (el) el.fontSize = clampInt(e.target.value, 10, 72, el.fontSize);
                  })
                }
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label className="label">Weight</label>
              <input
                className="input"
                value={selected.fontWeight}
                onChange={(e) =>
                  update((d) => {
                    const el = d.elements.find((x) => x.id === selected.id) as any;
                    if (el) el.fontWeight = clampInt(e.target.value, 300, 900, el.fontWeight);
                  })
                }
              />
            </div>

            <div className="field">
              <label className="label">Align</label>
              <select
                className="input"
                value={selected.align}
                onChange={(e) =>
                  update((d) => {
                    const el = d.elements.find((x) => x.id === selected.id) as any;
                    if (el) el.align = e.target.value;
                  })
                }
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>

          <label className="label">Color</label>
          <input
            className="input"
            value={selected.color}
            onChange={(e) =>
              update((d) => {
                const el = d.elements.find((x) => x.id === selected.id) as any;
                if (el) el.color = e.target.value;
              })
            }
          />
        </>
      )}

      {selected.kind === "image" && (
        <>
          <label className="label">Image URL</label>
          <input
            className="input"
            value={selected.url}
            onChange={(e) =>
              update((d) => {
                const el = d.elements.find((x) => x.id === selected.id) as any;
                if (el) el.url = e.target.value;
              })
            }
          />

          <label className="label">Alt</label>
          <input
            className="input"
            value={selected.alt}
            onChange={(e) =>
              update((d) => {
                const el = d.elements.find((x) => x.id === selected.id) as any;
                if (el) el.alt = e.target.value;
              })
            }
          />

          <div className="row">
            <div className="field">
              <label className="label">Height</label>
              <input
                className="input"
                value={selected.height}
                onChange={(e) =>
                  update((d) => {
                    const el = d.elements.find((x) => x.id === selected.id) as any;
                    if (el) el.height = clampInt(e.target.value, 80, 420, el.height);
                  })
                }
              />
            </div>
            <div className="field">
              <label className="label">Fit</label>
              <select
                className="input"
                value={selected.fit}
                onChange={(e) =>
                  update((d) => {
                    const el = d.elements.find((x) => x.id === selected.id) as any;
                    if (el) el.fit = e.target.value;
                  })
                }
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
              </select>
            </div>
          </div>

          <label className="label">Corner radius</label>
          <input
            className="input"
            value={selected.cornerRadius}
            onChange={(e) =>
              update((d) => {
                const el = d.elements.find((x) => x.id === selected.id) as any;
                if (el) el.cornerRadius = clampInt(e.target.value, 0, 24, el.cornerRadius);
              })
            }
          />
        </>
      )}

      {selected.kind === "button" && (
        <>
          <label className="label">Button text</label>
          <input
            className="input"
            value={selected.label}
            onChange={(e) =>
              update((d) => {
                const el = d.elements.find((x) => x.id === selected.id) as any;
                if (el) el.label = e.target.value;
              })
            }
          />

          <div className="row">
            <div className="field">
              <label className="label">Font size</label>
              <input
                className="input"
                value={selected.fontSize}
                onChange={(e) =>
                  update((d) => {
                    const el = d.elements.find((x) => x.id === selected.id) as any;
                    if (el) el.fontSize = clampInt(e.target.value, 10, 28, el.fontSize);
                  })
                }
              />
            </div>
            <div className="field">
              <label className="label">Weight</label>
              <input
                className="input"
                value={selected.fontWeight}
                onChange={(e) =>
                  update((d) => {
                    const el = d.elements.find((x) => x.id === selected.id) as any;
                    if (el) el.fontWeight = clampInt(e.target.value, 400, 900, el.fontWeight);
                  })
                }
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label className="label">Corner radius</label>
              <input
                className="input"
                value={selected.cornerRadius}
                onChange={(e) =>
                  update((d) => {
                    const el = d.elements.find((x) => x.id === selected.id) as any;
                    if (el) el.cornerRadius = clampInt(e.target.value, 0, 24, el.cornerRadius);
                  })
                }
              />
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={selected.fullWidth}
                onChange={(e) =>
                  update((d) => {
                    const el = d.elements.find((x) => x.id === selected.id) as any;
                    if (el) el.fullWidth = e.target.checked;
                  })
                }
              />
              <span>Full width</span>
            </label>
          </div>

          <div className="row">
            <div className="field">
              <label className="label">Fill color</label>
              <input
                className="input"
                value={selected.fillColor}
                onChange={(e) =>
                  update((d) => {
                    const el = d.elements.find((x) => x.id === selected.id) as any;
                    if (el) el.fillColor = e.target.value;
                  })
                }
              />
            </div>
            <div className="field">
              <label className="label">Text color</label>
              <input
                className="input"
                value={selected.textColor}
                onChange={(e) =>
                  update((d) => {
                    const el = d.elements.find((x) => x.id === selected.id) as any;
                    if (el) el.textColor = e.target.value;
                  })
                }
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label className="label">On tap</label>
              <select
                className="input"
                value={selected.actionType}
                onChange={(e) =>
                  update((d) => {
                    const el = d.elements.find((x) => x.id === selected.id) as any;
                    if (!el) return;
                    el.actionType = e.target.value;
                    if (el.actionType === "dismiss") el.actionValue = "";
                    if (el.actionType === "url" && !el.actionValue) el.actionValue = "https://example.com";
                  })
                }
              >
                <option value="url">Open URL</option>
                <option value="dismiss">Dismiss</option>
              </select>
            </div>

            <div className="field">
              <label className="label">URL</label>
              <input
                className="input"
                value={selected.actionValue}
                disabled={selected.actionType !== "url"}
                onChange={(e) =>
                  update((d) => {
                    const el = d.elements.find((x) => x.id === selected.id) as any;
                    if (el) el.actionValue = e.target.value;
                  })
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
