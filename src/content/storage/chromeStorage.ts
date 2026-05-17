import type { ScreenshotItem } from "../../shared/types";

function sendMessage(message: object): Promise<unknown> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
          return;
        }
        resolve(response);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function loadScreenshotsForPage(): Promise<ScreenshotItem[]> {
  try {
    const res = await sendMessage({ type: "GET_SCREENSHOTS", url: window.location.href }) as { screenshots?: ScreenshotItem[] };
    return res?.screenshots ?? [];
  } catch {
    return [];
  }
}

export async function persistScreenshot(item: ScreenshotItem): Promise<void> {
  try {
    await sendMessage({ type: "SAVE_SCREENSHOT", screenshot: item });
  } catch (err) {
    console.warn("[VisualMemory] Could not persist screenshot:", err);
  }
}

export async function removeScreenshot(id: string): Promise<void> {
  try {
    await sendMessage({ type: "DELETE_SCREENSHOT", id, url: window.location.href });
  } catch (err) {
    console.warn("[VisualMemory] Could not remove screenshot:", err);
  }
}