// AutoContinua - background service worker
// Apre la guida HTML alla prima installazione dell'estensione.

// Polyfill per compatibilità cross-browser
// @ts-ignore
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    browserAPI.tabs.create({ url: browserAPI.runtime.getURL("guida.html") });
  }
});
