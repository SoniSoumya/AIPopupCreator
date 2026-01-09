import React, { useMemo, useState } from "react";
import "./app.css";
import type { PopupSpec, PopupType, Mode } from "./spec";
import Inspector from "./components/Inspector";
import PopupPreview from "./components/PopupPreview";
import { generateSpecDeterministic, generateSpecOfflineDemo, OFFLINE_DEMOS, generateSpecWithOpenAI } from "./generator";

type BuilderMode = "offline" | "live";

function sortReindex(spec: PopupSpec): PopupSpec {
  const next = [...spec.elements].sort((a, b) => a.order - b.order).map((e, i) => ({ ...e, order: (i + 1) * 10 }));
  return { ...spec, elements: next };
}

export default function App() {
  const [builderMode, setBuilderMode] = useState<BuilderMode>("offline");
  const [apiKey, setApiKey] = useState<string>("");

  const [popupType, setPopupType] = useState<PopupType>("modal");
  const [mode, setMode] = useState<Mode>("light");
  const [brandColor, setBrandColor] = useState<string>("#2563EB");

  const [prompt, setPrompt] = useState<string>(OFFLINE_DEMOS[0].prompt);
  const [offlineIndex, setOfflineIndex] = useState<number>(0);

  const [spec, setSpec] = useState<PopupSpec>(() => generateSpecOfflineDemo(0, "#2563EB", "light", "modal"));
  const [selectedId, setSelectedId] = useState<string>("container");
  const [status, setStatus] = useState<string>("");

  const elementsSorted = useMemo(() => [...spec.elements].sort((a, b) => a.order - b.order), [spec.elements]);

  const applyOffline = (idx: number) => {
    const next = generateSpecOfflineDemo(idx, brandColor, mode, popupType);
    setSpec(next);
    setSelectedId("container");
    setStatus("Loaded offline demo.");
  };

  const generate = async () => {
    setStatus("");
    if (builderMode === "offline") {
      const next = generateSpecOfflineDemo(offlineIndex, brandColor, mode, popupType);
      setSpec(next);
      setSelectedId("container");
      setStatus("Generated using offline demo JSON.");
      return;
    }

    if (!apiKey.trim()) {
      setStatus("Add an OpenAI API key to use Live mode.");
      return;
    }

    try {
      setStatus("Generating…");
      const next = await generateSpecWithOpenAI({
        apiKey,
        prompt,
        brandColor,
        mode,
        type: popupType,
        model: "gpt-4o-mini",
        currentSpec: spec,
      });
      setSpec(sortReindex(next));
      setSelectedId("container");
      setStatus("Generated using OpenAI (validated).");
    } catch (e: any) {
      setStatus(e?.message || "Generation failed.");
      // fallback (always usable)
      const fallback = generateSpecDeterministic(prompt, brandColor, mode, popupType);
      setSpec(sortReindex(fallback));
      setSelectedId("container");
    }
  };

  const addElement = (kind: "text" | "image" | "cta") => {
    const order = (elementsSorted.length + 1) * 10;
    const id = `${kind}_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;

    const base: any = {
      id,
      name: kind === "cta" ? "CTA" : kind === "image" ? "Image" : "Text",
      type: kind,
      order,
      align: kind === "cta" ? "center" : "left",
      margin: { top: 0, right: 0, bottom: 12, left: 0 },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    };

    const el =
      kind === "text"
        ? { ...base, text: "New text", fontSize: 16, fontWeight: 600 }
        : kind === "image"
          ? { ...base, url: "https://placehold.co/800x400/png", alt: "Image", height: 160, radius: 12, align: "center" }
          : { ...base, label: "Click here", action: { type: "url", value: "https://example.com" }, variant: "primary", fullWidth: true };

    const next = sortReindex({ ...spec, elements: [...spec.elements, el] });
    setSpec(next);
    setSelectedId(id);
  };

  const reorderByDrag = (dragId: string, dropId: string) => {
    if (dragId === dropId) return;
    const list = [...elementsSorted];
    const from = list.findIndex((e) => e.id === dragId);
    const to = list.findIndex((e) => e.id === dropId);
    if (from < 0 || to < 0) return;

    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);

    const re = list.map((e, i) => ({ ...e, order: (i + 1) * 10 }));
    setSpec({ ...spec, elements: re });
  };

  return (
    <div className="appRoot">
      <div className="topBar">
        <div className="topLeft">
          <div className="title">Create Native Display Message</div>
        </div>

        <div className="topRight">
          <div className="modeToggle">
            <button className={builderMode === "offline" ? "modeBtn active" : "modeBtn"} onClick={() => setBuilderMode("offline")}>
              Offline demo
            </button>
            <button className={builderMode === "live" ? "modeBtn active" : "modeBtn"} onClick={() => setBuilderMode("live")}>
              Live (OpenAI)
            </button>
          </div>

          <button className="primaryBtn" onClick={generate}>
            Generate
          </button>
        </div>
      </div>

      <div className="controlsRow">
        <div className="ctlGroup">
          <label className="ctlLabel">Type</label>
          <select className="sel" value={popupType} onChange={(e) => setPopupType(e.target.value as PopupType)}>
            <option value="modal">modal</option>
            <option value="banner">banner</option>
            <option value="slideup">slideup</option>
          </select>
        </div>

        <div className="ctlGroup">
          <label className="ctlLabel">Mode</label>
          <select className="sel" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </div>

        <div className="ctlGroup">
          <label className="ctlLabel">Brand</label>
          <input className="inp" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} placeholder="#2563EB" />
        </div>

        {builderMode === "live" && (
          <div className="ctlGroup grow">
            <label className="ctlLabel">OpenAI API Key</label>
            <input className="inp" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
          </div>
        )}
      </div>

      <div className="builderViewport">
        <div className="cols">
          {/* Left: Tree */}
          <div className="col colTree">
            <div className="colHeader">
              <div className="colTitle">ELEMENTS</div>
              <div className="colHeaderRight">
                <PlusMenu onAdd={addElement} />
              </div>
            </div>

            <div className="colBody">
              <div
                className={selectedId === "container" ? "treeItem active" : "treeItem"}
                onClick={() => setSelectedId("container")}
              >
                Container
              </div>

              <div className="treeList">
                {elementsSorted.map((e) => (
                  <TreeRow
                    key={e.id}
                    id={e.id}
                    name={e.name}
                    active={selectedId === e.id}
                    onClick={() => setSelectedId(e.id)}
                    onReorder={reorderByDrag}
                  />
                ))}
              </div>

              <div className="divider" />

              {builderMode === "offline" ? (
                <>
                  <div className="sectionTitleLite">AskAI</div>
                  <div className="demoBox">
                    <div className="demoHint">Build native display content with AI</div>
                    <div className="chips">
                      {OFFLINE_DEMOS.map((d, i) => (
                        <button
                          key={d.title}
                          className={offlineIndex === i ? "chip active" : "chip"}
                          onClick={() => {
                            setOfflineIndex(i);
                            setPrompt(d.prompt);
                            applyOffline(i);
                          }}
                        >
                          {d.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="sectionTitleLite">Prompt</div>
                  <textarea className="promptArea" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                </>
              )}
            </div>
          </div>

          {/* Middle: Properties */}
          <div className="col colProps">
            <Inspector spec={spec} selectedId={selectedId} onChangeSpec={setSpec} />
          </div>

          {/* Right: Preview */}
          <div className="col colPreview">
            <div className="colHeader">
              <div className="colTitle">PREVIEW</div>
              <div className="status">{status}</div>
            </div>

            <div className="colBody">
              <PopupPreview spec={spec} selectedId={selectedId} onSelect={setSelectedId} onChangeSpec={setSpec} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlusMenu({ onAdd }: { onAdd: (k: "text" | "image" | "cta") => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="plusWrap">
      <button className="iconBtn" onClick={() => setOpen((s) => !s)} title="Add element">
        +
      </button>
      {open && (
        <div className="menu">
          <button className="menuItem" onClick={() => (onAdd("text"), setOpen(false))}>
            Add Text
          </button>
          <button className="menuItem" onClick={() => (onAdd("image"), setOpen(false))}>
            Add Image
          </button>
          <button className="menuItem" onClick={() => (onAdd("cta"), setOpen(false))}>
            Add CTA
          </button>
        </div>
      )}
    </div>
  );
}

function TreeRow({
  id,
  name,
  active,
  onClick,
  onReorder,
}: {
  id: string;
  name: string;
  active: boolean;
  onClick: () => void;
  onReorder: (dragId: string, dropId: string) => void;
}) {
  return (
    <div
      className={active ? "treeItem active" : "treeItem"}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const dragId = e.dataTransfer.getData("text/plain");
        if (dragId) onReorder(dragId, id);
      }}
      onClick={onClick}
    >
      {name}
    </div>
  );
}
