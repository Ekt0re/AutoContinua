document.getElementById("start").onclick = () => chrome.storage.local.set({ running: true });
document.getElementById("stop").onclick = () => chrome.storage.local.set({ running: false });
document.getElementById("guide").onclick = () => chrome.tabs.create({ url: chrome.runtime.getURL("guida.html") });

function refresh() {
  chrome.storage.local.get({ running: false, quizPause: false, logs: [] }, (data) => {
    let stato = "fermo";
    if (data.quizPause) stato = "in pausa: TEST da svolgere (ALT+P per riprendere)";
    else if (data.running) stato = "attivo";
    document.getElementById("statusText").textContent = stato;
    document.getElementById("log").textContent = data.logs.slice(-50).join("\n");
    document.getElementById("log").scrollTop = document.getElementById("log").scrollHeight;
  });
}

refresh();
setInterval(refresh, 1000);
