// AutoContinua - background service worker
// Apre la guida HTML alla prima installazione dell'estensione.

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("guida.html") });
  }
});
