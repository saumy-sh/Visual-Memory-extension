import { motion } from "framer-motion";
import { useStore } from "../storage/store";

export function ExpandedPreview() {
  const { screenshots, expandedId, setExpandedId } = useStore();
  const screenshot = screenshots.find((s) => s.id === expandedId);
  if (!screenshot) return null;

  const handleNavigate = () => {
    setExpandedId(null);
    // Small delay to let the modal close first
    setTimeout(() => {
      window.scrollTo({
        top: screenshot.capturePosition.scrollY + screenshot.selectionRect.y,
        left: screenshot.capturePosition.scrollX + screenshot.selectionRect.x,
        behavior: "smooth",
      });
    }, 150);
  };

  const btnStyle = (bg: string): React.CSSProperties => ({
    padding: "4px 10px", borderRadius: "6px", background: bg, border: "none", color: "white", fontSize: "12px", cursor: "pointer", fontFamily: "system-ui, sans-serif",
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setExpandedId(null)}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2147483646, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", pointerEvents: "auto" }}
    >
      <motion.div
        drag
        dragMomentum={false}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "rgba(15,15,20,0.92)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", overflow: "hidden", maxWidth: "80vw", maxHeight: "80vh", cursor: "grab", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", gap: "12px" }}>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px" }}>
            {screenshot.pageUrl}
          </span>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button onClick={handleNavigate} style={btnStyle("#6366f1")}>↩ Source</button>
            <button onClick={() => setExpandedId(null)} style={btnStyle("#374151")}>✕</button>
          </div>
        </div>
        <img src={screenshot.image} alt="Screenshot" style={{ display: "block", maxWidth: "75vw", maxHeight: "calc(80vh - 48px)", objectFit: "contain" }} />
      </motion.div>
    </motion.div>
  );
}