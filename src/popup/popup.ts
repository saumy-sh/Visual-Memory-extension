document.getElementById("captureBtn")?.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "ACTIVATE_CAPTURE" });
    window.close();
  }
});