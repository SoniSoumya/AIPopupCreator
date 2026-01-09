import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./app.css";

function FatalErrorScreen({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
  const stack = error instanceof Error ? error.stack : "";

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial", padding: 16 }}>
      <div
        style={{
          maxWidth: 980,
          margin: "24px auto",
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 12,
          padding: 16,
          background: "white",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 8 }}>App failed to render</h2>
        <p style={{ marginTop: 0, color: "#475569" }}>
          This page is blank because a runtime error occurred during boot. Details below:
        </p>
        <div style={{ padding: 12, background: "#0b1220", color: "#e5e7eb", borderRadius: 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{message}</div>
          {stack ? (
            <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 12, opacity: 0.9 }}>{stack}</pre>
          ) : null}
        </div>

        <p style={{ marginTop: 12, color: "#475569" }}>
          Open DevTools → Console to see the same error. Fix the failing import or runtime logic and redeploy.
        </p>
      </div>
    </div>
  );
}

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: unknown | null }> {
  state = { error: null as unknown | null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    // Keep a console trail even if UI is blank otherwise
    console.error("RootErrorBoundary caught:", error);
  }

  render() {
    if (this.state.error) return <FatalErrorScreen error={this.state.error} />;
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  // If this happens, you have an index.html root mismatch.
  document.body.innerHTML =
    `<div style="font-family:system-ui;padding:16px;max-width:980px;margin:24px auto;border:1px solid rgba(0,0,0,.12);border-radius:12px;padding:16px;background:#fff">
      <h2 style="margin:0 0 8px 0">Missing #root element</h2>
      <p style="margin:0;color:#475569">index.html must include: <code>&lt;div id="root"&gt;&lt;/div&gt;</code></p>
    </div>`;
  throw new Error("Missing #root element in index.html");
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
