import type { PopupSpec } from "../spec";

type Props = {
  spec: PopupSpec;
  onClose?: () => void;
};

export function PopupPreview({ spec, onClose }: Props) {
  const { theme, layout, content, ctas, behavior, type } = spec;

  const primary = ctas.find((c) => c.id === "primary");
  const secondary = ctas.find((c) => c.id === "secondary");

  const chrome = theme.mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(2,6,23,0.10)";
  const backdrop = theme.mode === "dark" ? "rgba(0,0,0,0.55)" : "rgba(2,6,23,0.35)";

  const card = (
    <div
      style={{
        position: "relative",
        width: type === "banner" ? "min(92%, 860px)" : "min(92%, " + layout.maxWidth + "px)",
        background: theme.backgroundColor,
        color: theme.textColor,
        borderRadius: type === "banner" ? 14 : layout.cornerRadius,
        boxShadow: type === "banner" ? "0 10px 26px rgba(2,6,23,0.18)" : "0 18px 50px rgba(2,6,23,0.22)",
        border: "1px solid " + chrome,
        overflow: "hidden",
      }}
    >
      {behavior.dismissible && (
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 34,
            height: 34,
            borderRadius: 10,
            border: "1px solid " + chrome,
            background: "transparent",
            color: theme.textColor,
            cursor: "pointer",
          }}
          aria-label="Close"
          title="Close"
        >
          ×
        </button>
      )}

      {layout.structure === "image_top" && content.image.kind === "url" && (
        <div style={{ width: "100%", aspectRatio: type === "banner" ? "3 / 1" : "2 / 1", overflow: "hidden" }}>
          <img
            src={content.image.url}
            alt={content.image.alt}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      )}

      <div style={{ padding: layout.padding }}>
        <div style={{ fontSize: type === "banner" ? 16 : 20, fontWeight: 750, lineHeight: 1.2, marginBottom: 8 }}>
          {content.headline}
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.45, color: theme.mutedTextColor, marginBottom: 16 }}>
          {content.body}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {secondary && (
            <button
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid " + (theme.mode === "dark" ? "rgba(255,255,255,0.14)" : "rgba(2,6,23,0.14)"),
                background: "transparent",
                color: theme.textColor,
                cursor: "pointer",
              }}
            >
              {secondary.label}
            </button>
          )}

          {primary && (
            <button
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0)",
                background: theme.brandColor,
                color: "white",
                cursor: "pointer",
              }}
            >
              {primary.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Preview canvas
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: 520,
        display: "grid",
        placeItems: type === "slideup" ? "end center" : "center",
        background: "linear-gradient(180deg, rgba(2,6,23,0.06), rgba(2,6,23,0.02))",
        borderRadius: 16,
        border: "1px solid rgba(2,6,23,0.08)",
        overflow: "hidden",
        padding: 18,
      }}
    >
      {behavior.backdrop && type === "modal" && (
        <div style={{ position: "absolute", inset: 0, background: backdrop }} />
      )}

      <div style={{ position: "relative", width: "100%", display: "grid", placeItems: type === "slideup" ? "end center" : "center" }}>
        {card}
      </div>
    </div>
  );
}
