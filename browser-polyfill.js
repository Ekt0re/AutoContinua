// Polyfill per compatibilità cross-browser (Chrome/Firefox)
// Normalizza l'API chrome.* e browser.*

if (typeof browser === 'undefined' && typeof chrome === 'undefined') {
  // Ambiente non compatibile
  console.error('AutoContinua: ambiente browser non supportato');
} else if (typeof browser === 'undefined') {
  // Chrome: definisci browser come alias di chrome
  window.browser = chrome;
} else if (typeof chrome === 'undefined') {
  // Firefox: definisci chrome come alias di browser
  window.chrome = browser;
}

// Usa l'API normalizzata
const browserAPI = window.browser || window.chrome;
