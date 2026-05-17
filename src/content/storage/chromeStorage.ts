import type { ScreenshotItem } from "../../shared/types";

export async function loadScreenshotsForPage(): Promise<ScreenshotItem[]> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "GET_SCREENSHOTS", url: window.location.href },
      (res) => resolve(res?.screenshots ?? [])
    );
  });
}

export async function persistScreenshot(item: ScreenshotItem): Promise<void> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "SAVE_SCREENSHOT", screenshot: item }, () => resolve());
  });
}

export async function removeScreenshot(id: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "DELETE_SCREENSHOT", id, url: window.location.href }, () => resolve());
  });
}