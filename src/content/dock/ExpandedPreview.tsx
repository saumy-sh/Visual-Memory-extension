import { motion } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import { useStore } from "../storage/store";

const MIN_W = 200;
const MIN_H = 160;

export function ExpandedPreview() {
  const { screenshots, expandedId, setExpandedId } = useStore();
  const screenshot = screenshots.find((s) => s.id === expandedId);

  const [size, setSize] = useState({ width: 480, height: 360 });
  const resizing = useRef<{ edge: string; startX: number; startY: number; startW: number; startH: number } | null>(null);

  const handleNavigate = () => {
    setExpandedId(null);
    setTimeout(() => {
      const viewportH = window.innerHeight;
      const capturedTop = screenshot!.capturePosition.scrollY + screenshot!.selectionRect.y;
      const capturedMid = capturedTop + screenshot!.selectionRect.height / 2;
      window.scrollTo({
        top: Math.max(0, capturedMid - viewportH / 2),
        left: screenshot!.capturePosition.scrollX,
        behavior: "smooth",
      });
    }, 180);
  };

  const startResize = useCallback((e: React.MouseEvent, edge: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = {
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height,
    };

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const { edge, startX, startY, startW, startH } = resizing.current;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let newW = startW;
      let newH = startH;

      if (edge.includes("e")) newW = Math.max(MIN_W, startW + dx);
      if (edge.includes("w")) newW = Math.max(MIN_W, startW - dx);
      if (edge.includes("s")) newH = Math.max(MIN_H, startH + dy);
      if (edge.includes("n")) newH = Math.max(MIN_H, startH - dy);

      setSize({ width: newW, height: newH });
    };

    const onMouseUp = () => {
      resizing.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [size]);

  if (!screenshot) return null;

  const btnStyle = (bg: string): React.CSSProperties => ({
    padding: "5px 12px",
    borderRadius: "6px",
    background: bg,
    border: "none",
    color: "white",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  });

  // Resize handle style helper
  const handle = (edge: string, style: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    zIndex: 10,
    ...style,
    cursor: edge === "e" || edge === "w" ? "ew-resize"
      : edge === "n" || edge === "s" ? "ns-resize"
      : edge === "se" || edge === "nw" ? "nwse-resize"
      : "nesw-resize",
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setExpandedId(null)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483646,
        pointerEvents: "auto",
        background: "transparent",
      }}
    >
      <motion.div
        drag
        dragMomentum={false}
        dragListener={!resizing.current}
        initial={{ scale: 0.88, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          x: "-50%",
          y: "-50%",
          width: size.width,
          height: size.height,
          background: "rgba(15,15,20,0.96)",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
          overflow: "hidden",
          cursor: "grab",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          gap: "12px",
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.35)",
            fontFamily: "monospace",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {screenshot.pageUrl}
          </span>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button onClick={handleNavigate} style={btnStyle("#6366f1")}>↩ Source</button>
            <button onClick={() => setExpandedId(null)} style={btnStyle("#374151")}>✕</button>
          </div>
        </div>

        {/* Image */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src={screenshot.image}
            alt="Screenshot"
            draggable={false}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>

        {/* Resize handles */}
        {/* Edges */}
        <div onMouseDown={(e) => startResize(e, "e")} style={handle("e", { right: 0, top: 8, bottom: 8, width: 6 })} />
        <div onMouseDown={(e) => startResize(e, "w")} style={handle("w", { left: 0, top: 8, bottom: 8, width: 6 })} />
        <div onMouseDown={(e) => startResize(e, "s")} style={handle("s", { bottom: 0, left: 8, right: 8, height: 6 })} />
        <div onMouseDown={(e) => startResize(e, "n")} style={handle("n", { top: 0, left: 8, right: 8, height: 6 })} />
        {/* Corners */}
        <div onMouseDown={(e) => startResize(e, "se")} style={handle("se", { right: 0, bottom: 0, width: 12, height: 12 })} />
        <div onMouseDown={(e) => startResize(e, "sw")} style={handle("sw", { left: 0, bottom: 0, width: 12, height: 12 })} />
        <div onMouseDown={(e) => startResize(e, "ne")} style={handle("ne", { right: 0, top: 0, width: 12, height: 12 })} />
        <div onMouseDown={(e) => startResize(e, "nw")} style={handle("nw", { left: 0, top: 0, width: 12, height: 12 })} />

        {/* Resize grip indicator — bottom right */}
        <div style={{
          position: "absolute",
          bottom: 4,
          right: 4,
          width: 10,
          height: 10,
          pointerEvents: "none",
          opacity: 0.3,
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "3px 3px",
          borderRadius: "2px",
        }} />
      </motion.div>
    </motion.div>
  );
}