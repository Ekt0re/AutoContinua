// Polyfill per compatibilità cross-browser
// @ts-ignore
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

document.getElementById("start").onclick = () => browserAPI.storage.local.set({ running: true });
document.getElementById("stop").onclick = () => browserAPI.storage.local.set({ running: false });
document.getElementById("guide").onclick = () => browserAPI.tabs.create({ url: browserAPI.runtime.getURL("guida.html") });

function refresh() {
  // Promise.resolve(...): funziona sia su Chrome (Promise quando non si passa
  // un callback) sia su Firefox (browser.* è sempre basato su Promise).
  Promise.resolve(browserAPI.storage.local.get({ running: false, quizPause: false, logs: [] }))
    .then((data) => {
      let stato = "fermo";
      if (data.quizPause) stato = "in pausa: TEST da svolgere (CTRL+SHIFT+ALT+P per riprendere)";
      else if (data.running) stato = "attivo";
      document.getElementById("statusText").textContent = stato;
      document.getElementById("log").textContent = data.logs.slice(-50).join("\n");
      document.getElementById("log").scrollTop = document.getElementById("log").scrollHeight;
    })
    .catch(() => {});
}

refresh();
setInterval(refresh, 1000);
