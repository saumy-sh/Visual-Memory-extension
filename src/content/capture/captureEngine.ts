export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function captureAndCrop(cropRect: CropRect): Promise<string> {
  const dataUrl = await requestViewportCapture();
  return cropImage(dataUrl, cropRect);
}

function requestViewportCapture(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(
        { type: "CAPTURE_VISIBLE_TAB", tabId: 0 },
        (response: { dataUrl?: string; error?: string }) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response?.error) {
            reject(new Error(response.error));
            return;
          }
          if (!response?.dataUrl) {
            reject(new Error("No dataUrl in response"));
            return;
          }
          resolve(response.dataUrl);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

function cropImage(dataUrl: string, rect: CropRect): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const canvas = document.createElement("canvas");
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No canvas context"));
      ctx.drawImage(
        img,
        rect.x * dpr, rect.y * dpr,
        rect.width * dpr, rect.height * dpr,
        0, 0,
        rect.width, rect.height
      );
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = dataUrl;
  });
}