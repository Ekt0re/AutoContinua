// AutoContinua - content script
// Clicca i "Click Box" / pulsanti Continua nel DOM, ma si ferma da solo,
// avvisa con un suono e un banner quando compare un elemento di TEST/QUIZ
// (es. classi Captivate cp-singleChoiceInput, cp-multipleChoiceInput, ecc.).
// L'utente riprende manualmente con ALT+P dopo aver svolto il test.
//
// Hotkey:
//   ALT+S -> STOP  (ferma il click automatico in qualsiasi momento)
//   ALT+P -> START (avvia / riprende, anche dopo una pausa da quiz)

(function () {
  const CONFIG = {
    // Candidati "Continua" / Click Box
    continueSelector: [
      '[id^="Click_Box"]',
      '.cp-frameset[role="button"]',
      '.cp-rewrap[role="button"]',
      '[aria-label="Click Box "]',
      '[aria-label="Click Box"]',
      '#next',
      '.acc-button'
    ].join(", "),

    // Candidati "elemento di quiz/test": pattern Captivate per input di domanda.
    // Il suffisso "Input" nella classe è stabile anche se l'id (es. si7615404r) cambia.
    quizSelector: [
      '.cp-singleChoiceInput',
      '.cp-multipleChoiceInput',
      '.cp-trueFalseInput',
      '.cp-fillInTheBlankInput',
      '.cp-shortAnswerInput',
      '.cp-matchingInput',
      '.cp-sequenceInput',
      '[class*="cp-"][class*="Input"]'
    ].join(", "),

    scanInterval: 500,
    clickCooldown: 1200,
    sameElementCooldown: 3000
  };

  let running = false;      // motore di click abilitato dall'utente (popup / ALT+P / ALT+S)
  let quizPause = false;    // pausa forzata perché è comparso un test
  let lastClickTime = 0;
  const recentlyClicked = new Map();     // key -> timestamp (dedupe click "Continua")
  let resumeGraceUntil = 0;              // timestamp: fino a quando ignorare i quiz dopo una ripresa (ALT+P)
  const QUIZ_RESUME_GRACE_MS = 2000;
  let intervalId = null;
  let observer = null;
  let banner = null;

  // ---------------------------------------------------------------------
  // LOG
  // ---------------------------------------------------------------------
  function log(msg) {
    const line = `[AutoContinua ${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(line);
    try {
      chrome.storage.local.get({ logs: [] }, (data) => {
        const logs = data.logs || [];
        logs.push(line);
        if (logs.length > 300) logs.shift();
        chrome.storage.local.set({ logs });
      });
    } catch (e) {}
  }

  // ---------------------------------------------------------------------
  // SUONO DI AVVISO (Web Audio API, nessun file esterno necessario)
  // ---------------------------------------------------------------------
  function playAlertSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const beep = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      beep(880, 0, 0.15);
      beep(880, 0.25, 0.15);
    } catch (e) {
      log("Impossibile riprodurre il suono di avviso: " + e.message);
    }
  }

  // ---------------------------------------------------------------------
  // BANNER A SCHERMO
  // ---------------------------------------------------------------------
  function showBanner(text) {
    hideBanner();
    banner = document.createElement("div");
    banner.style.display = "flex";
    banner.style.alignItems = "center";
    banner.style.justifyContent = "center";
    banner.style.gap = "8px";
    banner.innerHTML =
      '<svg viewBox="0 -960 960 960" width="22" height="22" fill="currentColor" style="flex:none">' +
      '<path d="M40-120l440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z"/>' +
      "</svg><span></span>";
    banner.querySelector("span").textContent = text;
    Object.assign(banner.style, {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      zIndex: "2147483647",
      background: "#c0392b",
      color: "#fff",
      fontFamily: "sans-serif",
      fontSize: "16px",
      fontWeight: "bold",
      padding: "12px 16px",
      textAlign: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
    });
    document.documentElement.appendChild(banner);
  }

  function hideBanner() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
  }

  // ---------------------------------------------------------------------
  // UTILITY
  // ---------------------------------------------------------------------
  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 2 || rect.height <= 2) return false;
    const style = window.getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") return false;
    if (el.classList.contains("cs-disabled")) return false;
    if (el.getAttribute("aria-disabled") === "true") return false;
    return true;
  }

  function elementKey(el) {
    const rect = el.getBoundingClientRect();
    if (el.id) return `${el.id}`;
    return `${el.className}|${Math.round(rect.left)}|${Math.round(rect.top)}`;
  }

  // Rileva bottoni "Continua" / "Avanti" identificati dal TESTO visibile (es. la slide
  // "Risultato Test": bottoni "Continua" / "Controlla Test" con testo reale,
  // non hitbox invisibili come i Click_Box). Esclude esplicitamente qualsiasi
  // bottone il cui testo contenga "Controll..." (es. "Controlla Test").
  function findTextContinueCandidates() {
    let pool;
    try {
      pool = document.querySelectorAll(
        'button, [role="button"], [class*="btn"], [class*="button"], [tabindex]'
      );
    } catch (e) {
      return [];
    }
    const results = [];
    pool.forEach((el) => {
      if (!isVisible(el)) return;
      const t = (el.textContent || "").trim().toLowerCase();
      if (!t || t.length > 20) return;
      if (t.includes("controll")) return; // esclude "Controlla Test" e simili
      if (t === "continua" || t.startsWith("continua") || t === "avanti" || t.startsWith("avanti")) results.push(el);
    });
    return results;
  }

  function simulateClick(el) {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
    el.dispatchEvent(new MouseEvent("mousedown", opts));
    el.dispatchEvent(new MouseEvent("mouseup", opts));
    el.dispatchEvent(new MouseEvent("click", opts));
  }

  // ---------------------------------------------------------------------
  // RILEVAMENTO QUIZ
  // ---------------------------------------------------------------------
  function checkQuiz() {
    // Subito dopo una ripresa (ALT+P) ignoriamo per una breve finestra,
    // per non ribloccare istantaneamente sullo stesso quiz ancora a schermo
    // nel preciso istante in cui l'utente riprende.
    if (Date.now() < resumeGraceUntil) return;
    if (quizPause) return; // già in pausa: evita chiamate ridondanti

    // Nota: gli hitbox dei quiz Captivate spesso hanno opacity:0 di proposito
    // (sono overlay trasparenti sopra la grafica reale), quindi qui NON
    // filtriamo per opacità: basta che siano presenti nel DOM con dimensioni reali.
    let quizElements;
    try {
      quizElements = Array.from(document.querySelectorAll(CONFIG.quizSelector)).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 2 && rect.height > 2;
      });
    } catch (e) {
      return;
    }

    if (quizElements.length === 0) return;

    // Nessuna memoria permanente: ogni apparizione di un test, con
    // l'automazione avviata, provoca il blocco — anche se è lo stesso
    // id/elemento di un test già svolto in precedenza (alcuni player
    // riciclano lo stesso contenitore DOM per domande diverse).
    quizPause = true;
    stopEngine(false); // ferma il click ma non tocca 'running' nello storage
    playAlertSound();
    showBanner("È presente un TEST da svolgere. Completalo, poi premi ALT+P per riprendere.");
    log(`Rilevato test (${quizElements.length} elemento/i). Autoclicker in pausa: premi ALT+P dopo averlo svolto.`);
    try {
      chrome.storage.local.set({ quizPause: true });
    } catch (e) {}
  }

  function acknowledgeQuizAndResume() {
    quizPause = false;
    resumeGraceUntil = Date.now() + QUIZ_RESUME_GRACE_MS;
    hideBanner();
    try {
      chrome.storage.local.set({ quizPause: false });
    } catch (e) {}
  }

  // ---------------------------------------------------------------------
  // SCANSIONE / CLICK "CONTINUA"
  // ---------------------------------------------------------------------
  function scan() {
    checkQuiz();
    if (!running || quizPause) return;

    const now = Date.now();
    for (const [k, t] of recentlyClicked) {
      if (now - t > CONFIG.sameElementCooldown) recentlyClicked.delete(k);
    }
    if (now - lastClickTime < CONFIG.clickCooldown) return;

    let candidates;
    try {
      candidates = Array.from(document.querySelectorAll(CONFIG.continueSelector)).filter(isVisible);
    } catch (e) {
      candidates = [];
    }
    candidates = candidates.concat(findTextContinueCandidates());

    for (const el of candidates) {
      const key = elementKey(el);
      if (recentlyClicked.has(key)) continue;
      simulateClick(el);
      lastClickTime = now;
      recentlyClicked.set(key, now);
      const rect = el.getBoundingClientRect();
      log(`Click su '${el.id || el.className}' @ (${Math.round(rect.left)},${Math.round(rect.top)})`);
    }
  }

  // ---------------------------------------------------------------------
  // START / STOP MOTORE
  // ---------------------------------------------------------------------
  function startEngine() {
    if (intervalId) return;
    intervalId = setInterval(scan, CONFIG.scanInterval);
    observer = new MutationObserver(() => scan());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"]
    });
  }

  function stopEngine(clearLog = true) {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    if (observer) observer.disconnect();
    observer = null;
    if (clearLog) log("Fermato.");
  }

  function start() {
    running = true;
    startEngine();
    log("Avviato.");
  }

  function stop() {
    running = false;
    stopEngine();
  }

  // ALT+P: avvia / riprende (conferma eventuale quiz in corso)
  function handleAltP() {
    if (quizPause) {
      log("ALT+P: test confermato, riprendo.");
      acknowledgeQuizAndResume();
    }
    running = true;
    startEngine();
    try {
      chrome.storage.local.set({ running: true });
    } catch (e) {}
    log("ALT+P: avviato.");
  }

  // ALT+S: stop manuale
  function handleAltS() {
    running = false;
    stopEngine(false);
    try {
      chrome.storage.local.set({ running: false });
    } catch (e) {}
    log("ALT+S: fermato.");
  }

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.altKey && e.key.toLowerCase() === "s") {
        handleAltS();
      } else if (e.altKey && e.key.toLowerCase() === "p") {
        handleAltP();
      }
    },
    true
  );

  // ---------------------------------------------------------------------
  // SINCRONIZZAZIONE CON IL POPUP (chrome.storage)
  // ---------------------------------------------------------------------
  try {
    chrome.storage.local.get({ running: false, quizPause: false }, (data) => {
      quizPause = !!data.quizPause;
      if (data.running) start();
    });
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.running) {
        if (changes.running.newValue) start();
        else stop();
      }
    });
  } catch (e) {
    // pagina non compatibile con l'estensione
  }
})();
