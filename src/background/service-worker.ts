import type { ScreenshotItem } from "../shared/types";
import { normalizeUrl } from "../shared/utils";

async function captureVisibleTab(): Promise<string> {
  return chrome.tabs.captureVisibleTab({ format: "png" });
}

async function getScreenshots(url: string): Promise<ScreenshotItem[]> {
  const key = normalizeUrl(url);
  const result = await chrome.storage.local.get(key);
  return (result[key] as ScreenshotItem[]) ?? [];
}

async function saveScreenshot(screenshot: ScreenshotItem): Promise<void> {
  const key = normalizeUrl(screenshot.pageUrl);
  const existing = await getScreenshots(screenshot.pageUrl);
  await chrome.storage.local.set({ [key]: [...existing, screenshot] });
}

async function deleteScreenshot(id: string, url: string): Promise<void> {
  const key = normalizeUrl(url);
  const existing = await getScreenshots(url);
  await chrome.storage.local.set({ [key]: existing.filter((s) => s.id !== id) });
}

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) chrome.tabs.sendMessage(tab.id, { type: "ACTIVATE_CAPTURE" });
});

chrome.runtime.onMessage.addListener(
  (message: { type: string; [key: string]: unknown }, _sender, sendResponse) => {
    (async () => {
      try {
        switch (message.type) {
          case "CAPTURE_VISIBLE_TAB":
            sendResponse({ dataUrl: await captureVisibleTab() });
            break;
          case "GET_SCREENSHOTS":
            sendResponse({ screenshots: await getScreenshots(message.url as string) });
            break;
          case "SAVE_SCREENSHOT":
            await saveScreenshot(message.screenshot as ScreenshotItem);
            sendResponse({ ok: true });
            break;
          case "DELETE_SCREENSHOT":
            await deleteScreenshot(message.id as string, message.url as string);
            sendResponse({ ok: true });
            break;
          default:
            sendResponse({ ok: false });
        }
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
      }
    })();
    return true;
  }
);

export {};