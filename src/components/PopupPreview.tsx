import React, { useMemo } from "react";
import type { PopupSpec } from "../spec";

type Props = {
  spec: PopupSpec;
  selectedId: string;
  onSelect: (id: string) => void;
  onChangeSpec: (next: PopupSpec) => void;
};

function spacingToCss(s: { top: number; right: number; bottom: number; left: number }) {
  return `${s.top}px ${s.right}px ${s.bottom}px ${s.left}px`;
}

function alignToCss(a: string) {
  if (a === "center") return "center";
  if (a === "right") return "flex-end";
  return "flex-start";
}

export default function PopupPreview({ spec, selectedId, onSelect, onChangeSpec }: Props) {
  const elements = useMemo(() => [...spec.elements].sort((a, b) => a.order - b.order), [spec.elements]);

  const selectedIndex = useMemo(() => elements.findIndex((e) => e.id === selectedId), [elements, selectedId]);

  const moveSelected = (dir: -1 | 1) => {
    if (selectedIndex < 0) return;
    const next = [...elements];
    const idx = selectedIndex;
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= next.length) return;

    // swap order values to keep stable
    const a = next[idx];
    const b = next[swapWith];
    const ao = a.order;
    a.order = b.order;
    b.order = ao;

    onChangeSpec({ ...spec, elements: next });
  };

  const duplicateSelected = () => {
    const el = elements.find((e) => e.id === selectedId);
    if (!el) return;
    const copy: any = JSON.parse(JSON.stringify(el));
    copy.id = `${el.id}_copy_${Date.now().toString(16)}`;
    copy.name = `${el.name} (copy)`;
    copy.order = el.order + 1;
    const next = [...spec.elements, copy].sort((a, b) => a.order - b.order).map((e, i) => ({ ...e, order: (i + 1) * 10 }));
    onChangeSpec({ ...spec, elements: next });
    onSelect(copy.id);
  };

  const deleteSelected = () => {
    if (selectedId === "container") return;
    const next = spec.elements.filter((e) => e.id !== selectedId).sort((a, b) => a.order - b.order).map((e, i) => ({ ...e, order: (i + 1) * 10 }));
    onChangeSpec({ ...spec, elements: next });
    onSelect("container");
  };

  const ratioPadding = (() => {
    const ar = spec.container.aspectRatio;
    if (ar === "1:1") return "100%";
    if (ar === "4:3") return "75%";
    if (ar === "16:9") return "56.25%";
    return null;
  })();

  return (
    <div className="previewWrap">
      <div className="previewStage">
        {spec.container.backdrop && <div className="backdrop" />}

        <div className="popupShell" style={{ maxWidth: spec.container.maxWidth }}>
          <div
            className={selectedId === "container" ? "popupCard selected" : "popupCard"}
            style={{
              borderRadius: spec.container.cornerRadius,
              background: spec.container.backgroundColor || spec.theme.backgroundColor,
              color: spec.theme.textColor,
              padding: spec.container.padding,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect("container");
            }}
          >
            {spec.container.showCloseIcon && (
              <button
                className="closeBtn"
                onClick={(e) => {
                  e.stopPropagation();
                  // demo only
                }}
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            )}

            {/* ratio frame */}
            {ratioPadding ? (
              <div className="ratioBox">
                <div className="ratioSizer" style={{ paddingBottom: ratioPadding }} />
                <div className="ratioContent">
                  <ElementsList spec={spec} elements={elements} selectedId={selectedId} onSelect={onSelect} />
                </div>
              </div>
            ) : (
              <ElementsList spec={spec} elements={elements} selectedId={selectedId} onSelect={onSelect} />
            )}

            {selectedId !== "container" && selectedIndex >= 0 && (
              <div className="overlayToolbar">
                <button className="tbBtn" onClick={(e) => (e.stopPropagation(), moveSelected(-1))} disabled={selectedIndex === 0}>
                  Up
                </button>
                <button className="tbBtn" onClick={(e) => (e.stopPropagation(), moveSelected(1))} disabled={selectedIndex === elements.length - 1}>
                  Down
                </button>
                <button className="tbBtn" onClick={(e) => (e.stopPropagation(), duplicateSelected())}>
                  Duplicate
                </button>
                <button className="tbBtn danger" onClick={(e) => (e.stopPropagation(), deleteSelected())}>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ElementsList({
  spec,
  elements,
  selectedId,
  onSelect,
}: {
  spec: PopupSpec;
  elements: any[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="elementsCol">
      {elements.map((el) => {
        const isSelected = el.id === selectedId;
        const commonStyle: React.CSSProperties = {
          margin: spacingToCss(el.margin),
          padding: spacingToCss(el.padding),
          alignSelf: alignToCss(el.align),
          position: "relative",
        };

        if (el.type === "text") {
          return (
            <div
              key={el.id}
              className={isSelected ? "elBox selected" : "elBox"}
              style={commonStyle}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(el.id);
              }}
            >
              <div
                style={{
                  fontSize: el.fontSize,
                  fontWeight: el.fontWeight,
                  color: el.color || spec.theme.textColor,
                  lineHeight: 1.25,
                  whiteSpace: "pre-wrap",
                }}
              >
                {el.text}
              </div>
            </div>
          );
        }

        if (el.type === "image") {
          return (
            <div
              key={el.id}
              className={isSelected ? "elBox selected" : "elBox"}
              style={commonStyle}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(el.id);
              }}
            >
              <img
                src={el.url}
                alt={el.alt}
                style={{
                  width: "100%",
                  height: el.height,
                  objectFit: "cover",
                  borderRadius: el.radius,
                  display: "block",
                }}
              />
            </div>
          );
        }

        // cta
        const bg = el.variant === "primary" ? spec.theme.brandColor : "transparent";
        const border = el.variant === "primary" ? "transparent" : "rgba(148,163,184,0.7)";
        const color = el.variant === "primary" ? "#FFFFFF" : spec.theme.textColor;

        return (
          <div
            key={el.id}
            className={isSelected ? "elBox selected" : "elBox"}
            style={{ ...commonStyle, width: el.fullWidth ? "100%" : "auto" }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(el.id);
            }}
          >
            <button
              className="ctaBtn"
              style={{
                background: bg,
                border: `1px solid ${border}`,
                color,
                width: el.fullWidth ? "100%" : "auto",
              }}
              onClick={(e) => e.preventDefault()}
            >
              {el.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
