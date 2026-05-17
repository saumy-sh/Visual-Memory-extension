import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../storage/store";
import { removeScreenshot } from "../storage/chromeStorage";

export function Dock() {
  const { screenshots, setCapturing, setExpandedId, removeScreenshot: removeFromStore } = useStore();

  const handleDelete = async (id: string) => {
    await removeScreenshot(id);
    removeFromStore(id);
  };

  return (
    <div style={{ position: "fixed", top: "50%", right: "16px", transform: "translateY(-50%)", zIndex: 2147483647, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", pointerEvents: "auto" }}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCapturing(true)}
        title="Capture region"
        style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(99,102,241,0.5)", color: "white", fontSize: "20px" }}
      >
        ✂️
      </motion.button>

      {screenshots.length > 0 && (
        <div style={{ width: "2px", height: "8px", background: "rgba(255,255,255,0.2)", borderRadius: "1px" }} />
      )}

      <AnimatePresence>
        {screenshots.map((screenshot) => (
          <motion.div
            key={screenshot.id}
            initial={{ opacity: 0, x: 40, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ position: "relative" }}
          >
            <motion.img
              src={screenshot.image}
              alt="Captured region"
              whileHover={{ scale: 1.08 }}
              onClick={() => setExpandedId(screenshot.id)}
              style={{ width: "64px", height: "48px", objectFit: "cover", borderRadius: "8px", cursor: "pointer", border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 2px 12px rgba(0,0,0,0.4)", display: "block" }}
            />
            <motion.button
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              onClick={() => handleDelete(screenshot.id)}
              style={{ position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", borderRadius: "50%", background: "#ef4444", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "white", opacity: 0 }}
            >
              ×
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}