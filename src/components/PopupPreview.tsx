import type { PopupDoc, PopupElement } from "../spec";

type Props = {
  doc: PopupDoc;
  selectedId: string;
  onSelect: (id: string) => void;
};

function elementKey(e: PopupElement) {
  return e.id;
}

export function PopupPreview({ doc, selectedId, onSelect }: Props) {
  const c = doc.container;

  const frameWidth = Math.min(c.maxWidth, 520); // keep preview reasonable
  const frameHeight = Math.round(frameWidth / c.aspectRatio);

  const chrome = c.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(2,6,23,0.10)";
  const backdrop = c.mode === "dark" ? "rgba(0,0,0,0.55)" : "rgba(2,6,23,0.35)";

  return (
    <div className="pv-wrap">
      {c.backdrop && <div className="pv-backdrop" style={{ background: backdrop }} />}

      <div
        className="pv-frame"
        style={{
          width: frameWidth,
          height: frameHeight,
          borderRadius: c.cornerRadius,
          background: c.backgroundColor,
          color: c.textColor,
          border: `1px solid ${chrome}`,
        }}
      >
        {c.showCloseIcon && (
          <button
            className="pv-close"
            style={{ borderColor: chrome, color: c.textColor }}
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        )}

        <div className="pv-stack">
          {doc.elements
            .filter((e) => !e.hidden)
            .map((e) => {
              const isSelected = selectedId === e.id;

              if (e.kind === "image") {
                return (
                  <div
                    key={elementKey(e)}
                    className={"pv-el " + (isSelected ? "pv-elSelected" : "")}
                    onClick={() => onSelect(e.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      style={{
                        borderRadius: e.cornerRadius,
                        overflow: "hidden",
                        height: e.height,
                        border: `1px solid ${chrome}`,
                      }}
                    >
                      <img
                        src={e.url}
                        alt={e.alt}
                        style={{ width: "100%", height: "100%", objectFit: e.fit, display: "block" }}
                      />
                    </div>
                  </div>
                );
              }

              if (e.kind === "text") {
                return (
                  <div
                    key={elementKey(e)}
                    className={"pv-el " + (isSelected ? "pv-elSelected" : "")}
                    onClick={() => onSelect(e.id)}
                    role="button"
                    tabIndex={0}
                    style={{
                      fontFamily: e.fontFamily,
                      fontSize: e.fontSize,
                      fontWeight: e.fontWeight as any,
                      textAlign: e.align as any,
                      color: e.color,
                      lineHeight: e.fontSize >= 20 ? 1.2 : 1.45,
                      letterSpacing: e.fontWeight >= 800 ? "-0.2px" : "0px",
                    }}
                  >
                    {e.text}
                  </div>
                );
              }

              // button
              return (
                <div
                  key={elementKey(e)}
                  className={"pv-el " + (isSelected ? "pv-elSelected" : "")}
                  onClick={() => onSelect(e.id)}
                  role="button"
                  tabIndex={0}
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <button
                    style={{
                      width: e.fullWidth ? "100%" : "auto",
                      minWidth: e.fullWidth ? "auto" : 140,
                      padding: "12px 14px",
                      borderRadius: e.cornerRadius,
                      border: "1px solid rgba(0,0,0,0)",
                      background: e.fillColor,
                      color: e.textColor,
                      fontWeight: e.fontWeight as any,
                      fontSize: e.fontSize,
                      cursor: "pointer",
                    }}
                  >
                    {e.label}
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
