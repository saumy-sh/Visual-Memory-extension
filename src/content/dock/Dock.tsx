import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../storage/store";
import { removeScreenshot } from "../storage/chromeStorage";

const STORAGE_KEY = "vm_dock_position";

function loadPosition(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function savePosition(pos: { x: number; y: number }) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch {}
}

const CARD_W = 80;
const CARD_H = 56;
const GAP = 12;
const MAX_VISIBLE = 4;

function getCardTransform(index: number, total: number) {
  const mid = (total - 1) / 2;
  const offset = index - mid;
  const normalised = total > 1 ? offset / mid : 0;
  const translateY = offset * (CARD_H + GAP);
  const bowX = -(1 - normalised * normalised) * 32;
  const rotate = normalised * -10;
  return { translateY, bowX, rotate };
}

export function Dock() {
  const { screenshots, setCapturing, setExpandedId, removeScreenshot: removeFromStore } = useStore();
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const saved = loadPosition();
    if (saved) return saved;
    return { x: window.innerWidth - 80, y: window.innerHeight / 2 - 40 };
  });

  // Clamp scrollOffset when screenshots change
  useEffect(() => {
    const maxOffset = Math.max(0, screenshots.length - MAX_VISIBLE);
    setScrollOffset(s => Math.min(s, maxOffset));
  }, [screenshots.length]);

  useEffect(() => {
    const onResize = () => {
      setPosition(p => ({
        x: Math.min(p.x, window.innerWidth - 64),
        y: Math.min(p.y, window.innerHeight - 64),
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Native wheel listener on carousel — prevents page scroll
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (screenshots.length <= MAX_VISIBLE) return;
      const maxOffset = Math.max(0, screenshots.length - MAX_VISIBLE);
      setScrollOffset(s => Math.min(maxOffset, Math.max(0, s + (e.deltaY > 0 ? 1 : -1))));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [isCarouselOpen, screenshots.length]);

  // Close carousel on outside click
  useEffect(() => {
    if (!isCarouselOpen) return;
    const handler = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setIsCarouselOpen(false);
        setHoveredId(null);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [isCarouselOpen]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    hasDragged.current = false;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      hasDragged.current = true;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 64, ev.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 64, ev.clientY - dragOffset.current.y)),
      });
    };

    const onMouseUp = () => {
      dragging.current = false;
      setPosition(p => { savePosition(p); return p; });
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [position]);

  const openCarousel = useCallback(() => {
    setIsCarouselOpen(true);
  }, []);

  const toggleCarousel = useCallback(() => {
    if (hasDragged.current) return;
    if (isCarouselOpen) {
      setIsCarouselOpen(false);
      setHoveredId(null);
    } else {
      openCarousel();
    }
  }, [isCarouselOpen, openCarousel]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    await removeScreenshot(id);
    removeFromStore(id);
  };

  const handleCardClick = useCallback((id: string) => {
    if (!hasDragged.current) setExpandedId(id);
  }, [setExpandedId]);

  // Visible slice — always MAX_VISIBLE or fewer
  const visibleScreenshots = screenshots.slice(scrollOffset, scrollOffset + MAX_VISIBLE);
  const visibleCount = visibleScreenshots.length;
  const carouselHeight = visibleCount * (CARD_H + GAP) - GAP;
  const canScrollUp = scrollOffset > 0;
  const canScrollDown = scrollOffset < screenshots.length - MAX_VISIBLE;

  return (
    <div
      ref={dockRef}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 2147483647,
        pointerEvents: "auto",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        flexDirection: "row-reverse",
      }}
    >
      {/* Dock body */}
      <div
        onMouseDown={handleMouseDown}
        onClick={toggleCarousel}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          cursor: "pointer",
          padding: "6px",
          borderRadius: "16px",
          background: "rgba(15,15,20,0.65)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
          flexShrink: 0,
        }}
      >
        {/* Scissor button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (!hasDragged.current) setCapturing(true);
          }}
          title="Capture region"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(99,102,241,0.5)",
            fontSize: "18px",
            flexShrink: 0,
            pointerEvents: "auto",
          }}
        >
          ✂️
        </motion.button>

        {/* Card stack */}
        {screenshots.length > 0 && (
          <div style={{ position: "relative", width: "40px", height: "34px", flexShrink: 0 }}>
            {screenshots.slice(-3).map((ss, i, arr) => {
              const depth = arr.length - 1 - i;
              return (
                <img
                  key={ss.id}
                  src={ss.image}
                  alt=""
                  draggable={false}
                  style={{
                    position: "absolute",
                    width: "40px",
                    height: "30px",
                    objectFit: "cover",
                    borderRadius: "5px",
                    border: "1.5px solid rgba(255,255,255,0.2)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                    top: `${depth * -2}px`,
                    left: `${depth * 2}px`,
                    zIndex: i,
                    transform: `rotate(${(depth - 1) * 4}deg)`,
                    pointerEvents: "none",
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Carousel */}
      <AnimatePresence>
        {isCarouselOpen && screenshots.length > 0 && (
          <motion.div
            ref={carouselRef}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{
              position: "relative",
              width: `${CARD_W + 60}px`,
              height: `${carouselHeight + CARD_H + 40}px`,
              flexShrink: 0,
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            {/* Scroll up indicator */}
            <AnimatePresence>
              {canScrollUp && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: "absolute",
                    top: "2px",
                    right: CARD_W / 2 - 8,
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "11px",
                    pointerEvents: "none",
                    zIndex: 20,
                  }}
                >
                  ▲
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scroll down indicator */}
            <AnimatePresence>
              {canScrollDown && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: "absolute",
                    bottom: "2px",
                    right: CARD_W / 2 - 8,
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "11px",
                    pointerEvents: "none",
                    zIndex: 20,
                  }}
                >
                  ▼
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cards container */}
            <div
              style={{
                position: "relative",
                width: `${CARD_W + 40}px`,
                height: `${carouselHeight}px`,
              }}
            >
              {visibleScreenshots.map((screenshot, index) => {
                const { translateY, bowX, rotate } = getCardTransform(index, visibleCount);
                const isHovered = hoveredId === screenshot.id;
                const opacity = hoveredId === null ? 1 : isHovered ? 1 : 0.32;
                const scale = isHovered ? 1.1 : 1;

                return (
                  <motion.div
                    key={screenshot.id}
                    animate={{ x: bowX, y: translateY, rotate, scale, opacity }}
                    initial={{ x: bowX, y: translateY, rotate, scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    onMouseEnter={() => setHoveredId(screenshot.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => handleCardClick(screenshot.id)}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: 0,
                      marginTop: `-${CARD_H / 2}px`,
                      width: CARD_W,
                      height: CARD_H,
                      cursor: "pointer",
                      borderRadius: "8px",
                      transformOrigin: "right center",
                      boxShadow: isHovered
                        ? "0 8px 28px rgba(0,0,0,0.65), 0 0 0 2px rgba(99,102,241,0.9)"
                        : "0 2px 10px rgba(0,0,0,0.45)",
                      zIndex: isHovered ? 10 : 1,
                    }}
                  >
                    <img
                      src={screenshot.image}
                      alt="Captured region"
                      draggable={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "8px",
                        display: "block",
                        border: "2px solid rgba(255,255,255,0.15)",
                      }}
                    />

                    {/* Delete button on hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ duration: 0.1 }}
                          onClick={(e) => handleDelete(e, screenshot.id)}
                          style={{
                            position: "absolute",
                            top: "-8px",
                            right: "-8px",
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: "#ef4444",
                            border: "2px solid rgba(10,10,15,0.95)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "white",
                            zIndex: 20,
                            pointerEvents: "auto",
                          }}
                        >
                          ×
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}