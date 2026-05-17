document.getElementById("captureBtn")?.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  // Try sending message, if content script not ready inject it manually
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "ACTIVATE_CAPTURE" });
  } catch {
    // Content script not loaded — inject it programmatically
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/index.js"],
    });
    // Wait a moment then send message
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id!, { type: "ACTIVATE_CAPTURE" });
    }, 500);
  }

  window.close();
});