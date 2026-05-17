import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Dock } from "../dock/Dock";
import { ExpandedPreview } from "../dock/ExpandedPreview";
import { SelectionOverlay } from "../capture/SelectionOverlay";
import { useStore } from "../storage/store";
import { loadScreenshotsForPage } from "../storage/chromeStorage";

export function Overlay() {
  const { setScreenshots, setCapturing, expandedId, isCapturing } = useStore();

  useEffect(() => {
    loadScreenshotsForPage().then(setScreenshots);
  }, [setScreenshots]);

  useEffect(() => {
    const handler = (message: { type: string }) => {
      if (message.type === "ACTIVATE_CAPTURE") setCapturing(true);
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [setCapturing]);

  return (
    <>
      {!isCapturing && <Dock />}
      <AnimatePresence>
        {isCapturing && <SelectionOverlay key="selection" />}
      </AnimatePresence>
      <AnimatePresence>
        {expandedId && <ExpandedPreview key="preview" />}
      </AnimatePresence>
    </>
  );
}