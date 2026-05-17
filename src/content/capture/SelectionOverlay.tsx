import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { captureAndCrop } from "./captureEngine";
import { useStore } from "../storage/store";
import { persistScreenshot } from "../storage/chromeStorage";
import { generateId } from "../../shared/utils";
import type { ScreenshotItem } from "../../shared/types";

interface DragState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
}

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getSelectionRect(drag: DragState): SelectionRect {
  return {
    x: Math.min(drag.startX, drag.currentX),
    y: Math.min(drag.startY, drag.currentY),
    width: Math.abs(drag.currentX - drag.startX),
    height: Math.abs(drag.currentY - drag.startY),
  };
}

const MIN_SELECTION = 20;

export function SelectionOverlay() {
  const { setCapturing, addScreenshot } = useStore();
  const [drag, setDrag] = useState<DragState>({
    startX: 0, startY: 0, currentX: 0, currentY: 0, isDragging: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCapturing(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCapturing]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isProcessing) return;
    e.preventDefault();
    e.stopPropagation();
    setDrag({ startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY, isDragging: true });
  }, [isProcessing]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag.isDragging || isProcessing) return;
    e.preventDefault();
    setDrag((d) => ({ ...d, currentX: e.clientX, currentY: e.clientY }));
  }, [drag.isDragging, isProcessing]);

  const handleMouseUp = useCallback(async (e: React.MouseEvent) => {
    if (!drag.isDragging || isProcessing) return;
    e.preventDefault();

    const rect = getSelectionRect({ ...drag, currentX: e.clientX, currentY: e.clientY });
    if (rect.width < MIN_SELECTION || rect.height < MIN_SELECTION) {
      setDrag((d) => ({ ...d, isDragging: false }));
      return;
    }

    setIsProcessing(true);
    setDrag((d) => ({ ...d, isDragging: false }));

    try {
      const image = await captureAndCrop(rect);
      const screenshot: ScreenshotItem = {
        id: generateId(),
        image,
        pageUrl: window.location.href,
        createdAt: Date.now(),
        capturePosition: { scrollX: window.scrollX, scrollY: window.scrollY },
        selectionRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        devicePixelRatio: window.devicePixelRatio || 1,
      };
      addScreenshot(screenshot);
      await persistScreenshot(screenshot);
    } catch (err) {
      console.error("[VisualMemory] Capture failed:", err);
    } finally {
      setIsProcessing(false);
      setCapturing(false);
    }
  }, [drag, isProcessing, addScreenshot, setCapturing]);

  const sel = drag.isDragging ? getSelectionRect(drag) : null;

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ position: "fixed", inset: 0, zIndex: 2147483645, cursor: isProcessing ? "wait" : "crosshair", userSelect: "none", pointerEvents: "auto" }}
    >
      {sel ? <CutoutOverlay sel={sel} /> : <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />}
      {sel && sel.width > 2 && sel.height > 2 && <SelectionBox sel={sel} />}

      <AnimatePresence>
        {!drag.isDragging && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ position: "absolute", top: "20px", left: "50%", transform: "translateX(-50%)", background: "rgba(15,15,20,0.9)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", padding: "8px 18px", color: "rgba(255,255,255,0.85)", fontSize: "13px", fontFamily: "system-ui, sans-serif", pointerEvents: "none", whiteSpace: "nowrap", backdropFilter: "blur(8px)" }}
          >
            Drag to select a region &nbsp;·&nbsp;
            <span style={{ color: "rgba(255,255,255,0.4)" }}>Esc to cancel</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(15,15,20,0.95)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "12px", padding: "16px 24px", color: "white", fontSize: "14px", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <Spinner />
            Capturing…
          </motion.div>
        )}
      </AnimatePresence>

      {sel && drag.isDragging && sel.width > 40 && sel.height > 20 && (
        <div style={{ position: "absolute", left: sel.x + sel.width / 2, top: sel.y + sel.height + 8, transform: "translateX(-50%)", background: "rgba(15,15,20,0.85)", color: "rgba(255,255,255,0.6)", fontSize: "11px", fontFamily: "monospace", padding: "2px 8px", borderRadius: "4px", pointerEvents: "none", whiteSpace: "nowrap" }}>
          {Math.round(sel.width)} × {Math.round(sel.height)}
        </div>
      )}
    </motion.div>
  );
}

function CutoutOverlay({ sel }: { sel: SelectionRect }) {
  const { x, y, width, height } = sel;
  const alpha = "rgba(0,0,0,0.5)";
  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: y, background: alpha }} />
      <div style={{ position: "absolute", top: y + height, left: 0, right: 0, bottom: 0, background: alpha }} />
      <div style={{ position: "absolute", top: y, left: 0, width: x, height, background: alpha }} />
      <div style={{ position: "absolute", top: y, left: x + width, right: 0, height, background: alpha }} />
    </>
  );
}

function SelectionBox({ sel }: { sel: SelectionRect }) {
  const { x, y, width, height } = sel;
  const handle: React.CSSProperties = { position: "absolute", width: "8px", height: "8px", background: "white", borderRadius: "2px", boxShadow: "0 0 0 1px rgba(99,102,241,0.8)" };
  return (
    <div style={{ position: "absolute", left: x, top: y, width, height, border: "2px solid rgba(99,102,241,0.9)", borderRadius: "2px", pointerEvents: "none", boxSizing: "border-box" }}>
      <div style={{ ...handle, top: -4, left: -4 }} />
      <div style={{ ...handle, top: -4, right: -4 }} />
      <div style={{ ...handle, bottom: -4, left: -4 }} />
      <div style={{ ...handle, bottom: -4, right: -4 }} />
      <div style={{ ...handle, top: -4, left: "50%", transform: "translateX(-50%)" }} />
      <div style={{ ...handle, bottom: -4, left: "50%", transform: "translateX(-50%)" }} />
      <div style={{ ...handle, left: -4, top: "50%", transform: "translateY(-50%)" }} />
      <div style={{ ...handle, right: -4, top: "50%", transform: "translateY(-50%)" }} />
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.15)", borderTop: "2px solid #6366f1", borderRadius: "50%", animation: "vm-spin 0.7s linear infinite" }} />
  );
}