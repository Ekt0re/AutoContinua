# AutoContinua

**AutoContinua** è un'estensione Chrome che clicca automaticamente i pulsanti di navigazione nelle pagine di corsi e-learning e molto altro!

**Autore:** [Ettore Sartori](https://github.com/Ekt0re)

## ⚠️ Disclaimer — leggere prima dell'uso

### Scopo del progetto

Questa estensione è un progetto a **scopo didattico/dimostrativo**, realizzato per esplorare tecniche di automazione e accessibilità nel browser, tra cui:

* manipolazione del DOM;
* `MutationObserver`;
* estensioni Chrome Manifest V3.

### ♿ Finalità di accessibilità

È pensata principalmente come **ausilio per persone con specifiche difficoltà di accessibilità**, ad esempio:

* difficoltà motorie;
* difficoltà visive;
* difficoltà di coordinazione;
* affaticamento.

L'obiettivo è permettere di fruire di contenuti con avanzamento automatico senza dover individuare ogni volta i pulsanti di navigazione a schermo o compiere ripetuti movimenti del cursore/mouse.

### ⚠️ Uso consapevole e lecito

L'autore chiede di utilizzare questa estensione in modo **consapevole, responsabile e conforme alle leggi, ai regolamenti e alle policy** della piattaforma, dell'ente formativo o del datore di lavoro coinvolti.

L'estensione **non deve essere usata** per:

* aggirare obblighi formativi reali;
* falsificare la presenza a un corso;
* superare test senza possedere le competenze richieste.

### Esclusione di responsabilità

L'autore si dissocia esplicitamente da qualsiasi uso fraudolento, scorretto o non conforme del software e prende le distanze da tali comportamenti.

Ogni conseguenza derivante da un uso improprio — inclusi, a titolo esemplificativo e non esaustivo, squalifica, invalidazione di un test o di un corso, provvedimenti disciplinari o legali — dovuta al fatto che una piattaforma di e-learning rilevi l'uso dell'estensione o ne consideri l'utilizzo una violazione delle proprie condizioni d'uso, **non è in alcun modo e in alcun caso attribuibile all'autore/creatore dell'estensione**.

L'utente utilizza il software **a proprio rischio e sotto la propria esclusiva responsabilità**.

---

## 🤖 Cosa fa l'estensione

AutoContinua:

* individua nella pagina i pulsanti di navigazione **"Continua"**, **"Avanti"** e altri tasti interattivi;
* supporta hitbox invisibili come `id^="Click_Box"` / `cp-frameset`, pulsanti con id `#next`, e pulsanti interattivi `.acc-button`;
* riconosce bottoni con testo visibile "Continua" o "Avanti";
* clicca gli elementi automaticamente, uno alla volta;
* evita di effettuare click ripetuti sullo stesso elemento mentre rimane a schermo;
* esclude i pulsanti **"Controlla Test"** o simili;
* ignora pulsanti disabilitati (con classe `cs-disabled` o `aria-disabled="true"`);
* rileva la comparsa di un test/quiz;
* si ferma automaticamente quando viene rilevato un test;
* emette un suono di avviso;
* mostra un banner a schermo;
* permette di svolgere il test normalmente;
* consente di utilizzare normalmente il PC mentre l'estensione lavora sulla scheda del corso.

## 📝 Test e quiz

Quando compare un test o un quiz, ad esempio con domande a scelta singola o multipla, AutoContinua:

1. interrompe automaticamente l'automazione;
2. emette un doppio beep;
3. mostra un banner rosso nella parte superiore della pagina;
4. permette di svolgere il test con calma.

Al termine del test è possibile riprendere l'automazione premendo:

`ALT + P`

---

# 📥 Installazione

L'installazione deve essere effettuata una sola volta.

1. Scarica l'[Ultima Release](https://github.com/Ekt0re/AutoContinua/releases/latest) 
   _(File .zip dell'estensione dalla sezione Assets. Non scaricare il codice sorgente Source code )._

2. Estrai lo ZIP dell'estensione in una cartella a tua scelta.

3. Apri Chrome.

4. Vai su:

   `chrome://extensions`

5. Attiva **Modalità sviluppatore**.

6. Clicca **Carica estensione non pacchettizzata**.

7. Seleziona la cartella che contiene `manifest.json`.

8. L'icona di AutoContinua comparirà tra le estensioni di Chrome.

Se non è visibile direttamente nella barra, apri l'icona delle estensioni 🧩 e fissa **AutoContinua**.

---

# ▶️ Utilizzo

1. Apri la pagina del corso e-learning in Chrome.

2. Clicca l'icona **AutoContinua** nella barra del browser.

3. Premi **Avvia** nel popup oppure:

   `ALT + P`

4. Lo stato passerà ad **attivo**.

5. I pulsanti di navigazione verranno cliccati automaticamente man mano che compaiono.

### Fermare l'automazione

Per fermare tutto in qualsiasi momento:

`ALT + S`

---

# ⌨️ Scorciatoie da tastiera

| Tasti       | Azione                                                           |
| ----------- | ---------------------------------------------------------------- |
| `ALT` + `P` | Avvia / riprende l'automazione e conferma anche un test rilevato |
| `ALT` + `S` | Ferma l'automazione                                              |

---

# 🖥️ Popup dell'estensione

Il popup mette a disposizione:

* **Avvia / Ferma** — controlli manuali equivalenti alle scorciatoie;
* **Stato** — mostra se l'estensione è attiva, ferma o in pausa per test;
* **Log** — elenco delle ultime azioni, utile per capire cosa succede;
* **Guida** — riapre la guida dell'estensione.

---

# 🔒 Cookie e dati locali

AutoContinua:

* **non usa cookie di tracciamento**;
* **non invia alcun dato a server esterni**.

Utilizza esclusivamente l'API:

`chrome.storage.local`

per salvare, solamente sul dispositivo dell'utente:

* lo stato attivo/fermo dell'estensione;
* il registro delle ultime azioni svolte, a scopo di diagnostica.

Questi dati:

* restano locali;
* non vengono condivisi con terze parti;
* vengono rimossi automaticamente disinstallando l'estensione;
* possono essere cancellati manualmente da `chrome://extensions`.

---

# ❓ FAQ

### L'estensione clicca troppo velocemente?

No. È presente un intervallo minimo tra un click e l'altro e ogni elemento viene cliccato una sola volta finché resta a schermo.

### Non rileva il pulsante di navigazione nella mia pagina

Apri gli Strumenti per sviluppatori:

`F12 → Elements`

Individua il pulsante e verifica:

* `id`;
* `class`;
* testo;
* struttura dell'elemento.

I selettori possono essere aggiunti o modificati nel file `content.js`.

### Il beep del quiz non si sente

Alcuni browser possono bloccare l'audio finché non interagisci con la pagina.

Prova a cliccare una volta sulla pagina del corso dopo averla aperta e riprova.

### Posso disinstallarla facilmente?

Sì.

Apri:

`chrome://extensions`

Individua la card di **AutoContinua** e seleziona **Rimuovi**.

---

# 🤖 Nota sullo sviluppo

La stesura del codice di questa estensione è stata **assistita dall'uso di Claude AI (Anthropic)**.

Le fasi di:

* progettazione;
* ideazione;
* test;

sono state svolte **interamente dal sottoscritto, Ettore Sartori, autore del progetto**.

L'autore ha definito i requisiti, verificato il funzionamento sul contenuto reale e validato ogni comportamento prima del rilascio.

---

# 📁 Struttura del progetto

```text
AutoContinua/
├── manifest.json
├── background.js
├── content.js
├── popup.html
└── ...
```

---

## 👤 Autore

**Ettore Sartori**

* GitHub: [@Ekt0re](https://github.com/Ekt0re)
* Repository: [Ekt0re/AutoContinua](https://github.com/Ekt0re/AutoContinua)

---

**AutoContinua — progetto a scopo didattico e di accessibilità.**
