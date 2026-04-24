// =======================
// STATE
// =======================
let sounds = [];
let data = {};
let favorites = JSON.parse(localStorage.getItem("fav") || "[]");

let currentTheme = null;
let currentAudio = null;
let audioCache = {};
let activeTab = "themas";
let quizMode = false;

// Volgorde thema's
const THEME_ORDER = [
  "Uitdrukkingen",
  "Uitdrukkingen per regio",  // submenu
  "Vervoegingen van ja",
  "Maaike Cafmeyer",
  "Huis/Tuin/Keuken",
  "Feestdagen",
  "Het weer",
  "Op restaurant",
  "In de winkel",
  "Dieren",
  "In het café",
  "Op straat",
  "Onderweg",
  "Alles"
];

const REGIO_THEMES = ["Oostende", "Ieper", "Kortrijk", "Brugge", "Roeselare"];

// Mapping: JSON sleutel → display naam
const CATEGORY_MAP = {
  "uitdrukking":    "Uitdrukkingen",
  "uitdrukkingen":  "Uitdrukkingen",
  "uitdruk":        "Uitdrukkingen",
  "vervoeg":        "Vervoegingen van ja",
  "ja":             "Vervoegingen van ja",
  "maaike":         "Maaike Cafmeyer",
  "cafmeyer":       "Maaike Cafmeyer",
  "huis":           "Huis/Tuin/Keuken",
  "tuin":           "Huis/Tuin/Keuken",
  "keuken":         "Huis/Tuin/Keuken",
  "huistuinkeuken": "Huis/Tuin/Keuken",
  "feest":          "Feestdagen",
  "feestdagen":     "Feestdagen",
  "weer":           "Het weer",
  "restaurant":     "Op restaurant",
  "resto":          "Op restaurant",
  "winkel":         "In de winkel",
  "dieren":         "Dieren",
  "dier":           "Dieren",
  "cafe":           "In het café",
  "café":           "In het café",
  "straat":         "Op straat",
  "onderweg":       "Onderweg",
  "oostende":       "Oostende",
  "ieper":          "Ieper",
  "kortrijk":       "Kortrijk",
  "brugge":         "Brugge",
  "roeselare":      "Roeselare",
};

// =======================
// HELPERS
// =======================
function cleanPath(fileName) {
  return ("mp3/" + fileName).replace(/\\/g, "/");
}

function vibrate() {
  if (navigator.vibrate) navigator.vibrate(20);
}

function fixSpacing(text) {
  return String(text).split(" ").map(w => `<span>${w}</span>`).join(" ");
}

function parseCategories(raw) {
  if (!raw) return [];
  return String(raw)
    .replace(/['"]/g, "")
    .split(/[\s,]+/)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

function resolveCategory(key) {
  const k = key.toLowerCase().trim();
  if (CATEGORY_MAP[k]) return CATEGORY_MAP[k];
  for (const [pattern, name] of Object.entries(CATEGORY_MAP)) {
    if (k.includes(pattern) || pattern.includes(k)) return name;
  }
  return null;
}

// =======================
// SVG ICONEN
// =======================
function heartSVG(filled) {
  const color = filled ? "#e8192c" : "none";
  const stroke = filled ? "#e8192c" : "#aaa";
  return `<svg class="heart-icon" viewBox="0 0 32 30" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 27 C16 27 2 18 2 9.5 C2 5.36 5.36 2 9.5 2 C12.1 2 14.4 3.3 16 5.3 C17.6 3.3 19.9 2 22.5 2 C26.64 2 30 5.36 30 9.5 C30 18 16 27 16 27Z"
      fill="${color}" stroke="${stroke}" stroke-width="2"/>
  </svg>`;
}

function bookSVG(active) {
  const c = active ? "white" : "#888";
  return `<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="3" width="16" height="22" rx="2" stroke="${c}" stroke-width="1.8"/>
    <rect x="8" y="3" width="12" height="22" rx="2" stroke="${c}" stroke-width="1.8" fill="${active ? '#555' : 'none'}"/>
    <line x1="10" y1="9" x2="18" y2="9" stroke="${c}" stroke-width="1.5"/>
    <line x1="10" y1="13" x2="18" y2="13" stroke="${c}" stroke-width="1.5"/>
    <line x1="10" y1="17" x2="16" y2="17" stroke="${c}" stroke-width="1.5"/>
  </svg>`;
}

function tabHeartSVG(active) {
  const c = active ? "white" : "#888";
  return `<svg viewBox="0 0 32 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 27 C16 27 2 18 2 9.5 C2 5.36 5.36 2 9.5 2 C12.1 2 14.4 3.3 16 5.3 C17.6 3.3 19.9 2 22.5 2 C26.64 2 30 5.36 30 9.5 C30 18 16 27 16 27Z"
      fill="none" stroke="${c}" stroke-width="2"/>
  </svg>`;
}

function quizSVG(active) {
  const c = active ? "#f0a500" : "#888";
  return `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 8 Q6 4 10 4 L22 4 Q26 4 26 8 L26 20 Q26 24 22 24 L18 24 L12 29 L12 24 L10 24 Q6 24 6 20 Z"
      stroke="${c}" stroke-width="2" fill="none"/>
    <line x1="11" y1="11" x2="21" y2="11" stroke="${c}" stroke-width="1.8"/>
    <line x1="11" y1="15" x2="18" y2="15" stroke="${c}" stroke-width="1.8"/>
  </svg>`;
}

// =======================
// AUDIO
// =======================
function preload(file) {
  const url = encodeURI(file);
  if (audioCache[url]) return;
  const audio = new Audio(url);
  audio.preload = "auto";
  audio.load();
  audioCache[url] = audio;
}

function play(file) {
  if (!file) return;
  const url = encodeURI(file);
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  const audio = audioCache[url] || new Audio(url);
  audioCache[url] = audio;
  audio.currentTime = 0;
  audio.play().catch(() => {
    const retry = new Audio(url);
    audioCache[url] = retry;
    retry.play().catch(e => console.error(`Audio mislukt: ${file} — ${e.message}`));
  });
  currentAudio = audio;
}

// Diagnose via console: checkAllAudio()
async function checkAllAudio() {
  console.log("=== AUDIO DIAGNOSE START ===");
  const errors = [];
  const allItems = [...new Map(Object.values(data).flat().map(i => [i.file, i])).values()];
  for (const item of allItems) {
    await new Promise(resolve => {
      const url = encodeURI(item.file);
      const audio = new Audio(url);
      const timeout = setTimeout(() => {
        errors.push({ title: item.title, file: item.file, fout: "Timeout" });
        resolve();
      }, 5000);
      audio.addEventListener("canplaythrough", () => { clearTimeout(timeout); resolve(); }, { once: true });
      audio.addEventListener("error", () => {
        clearTimeout(timeout);
        const msg = audio.error ? `code ${audio.error.code}` : "onbekend";
        errors.push({ title: item.title, file: item.file, fout: msg });
        resolve();
      }, { once: true });
      audio.load();
    });
  }
  console.log(`=== KLAAR: ${errors.length} fouten op ${allItems.length} bestanden ===`);
  if (errors.length) console.table(errors);
  else console.log("✅ Alles werkt!");
  return errors;
}
window.checkAllAudio = checkAllAudio;

// =======================
// FAVORIETEN
// =======================
function toggleFav(file) {
  if (navigator.vibrate) navigator.vibrate(15);
  favorites = favorites.includes(file)
    ? favorites.filter(f => f !== file)
    : [...favorites, file];
  localStorage.setItem("fav", JSON.stringify(favorites));
  if (currentTheme) renderTheme(currentTheme);
}

// =======================
// QUIZ MODE
// =======================
function toggleQuiz() {
  quizMode = !quizMode;
  const badge = document.getElementById("quiz-badge");
  const content = document.getElementById("content");
  if (quizMode) {
    if (!badge) {
      const b = document.createElement("div");
      b.id = "quiz-badge";
      b.className = "quiz-badge";
b.textContent = "We gon eki kik'n ofdaj der 'ntwa van verstoan 'et";
      document.body.appendChild(b);
    }
    content.classList.add("quiz-active");
  } else {
    badge?.remove();
    content.classList.remove("quiz-active");
  }
  renderBottombar();
  // Herladen huidige pagina om labels te wisselen
  if (currentTheme) renderTheme(currentTheme);
  else if (activeTab === "favorieten") renderFavorieten();
}

// =======================
// BOTTOMBAR
// =======================
function renderBottombar() {
  const bar = document.querySelector(".bottombar");
  bar.innerHTML = `
    <button class="bottombar-btn ${activeTab === 'themas' ? 'active' : ''}" onclick="renderThemes()">
      ${bookSVG(activeTab === 'themas')}
      <span>Thema's</span>
    </button>
    <button class="bottombar-btn ${activeTab === 'favorieten' ? 'active' : ''}" onclick="renderFavorieten()">
      ${tabHeartSVG(activeTab === 'favorieten')}
      <span>'t Beste</span>
    </button>
    <button class="bottombar-btn ${quizMode ? 'active' : ''}" onclick="toggleQuiz()" style="${quizMode ? 'color:#f0a500' : ''}">
      ${quizSVG(quizMode)}
      <span>Quiz</span>
    </button>
    <button class="bottombar-btn ${activeTab === 'info' ? 'active' : ''}" onclick="renderInfo()">
      <img src="img/logo_wvl@2x.png" class="tab-logo" alt="Info">
      <span>Info</span>
    </button>
  `;
}

// =======================
// POPUP
// =======================
function confirmDeleteFavs() {
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";
  overlay.innerHTML = `
    <div class="popup-box">
      <p>Ben je het zeker?</p>
      <div class="popup-actions">
        <button class="btn-cancel" onclick="this.closest('.popup-overlay').remove()">Annuleren</button>
        <button class="btn-confirm" onclick="deleteAllFavs()">Verwijderen</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function deleteAllFavs() {
  favorites = [];
  localStorage.setItem("fav", JSON.stringify(favorites));
  document.querySelector(".popup-overlay")?.remove();
  renderFavorieten();
}

// =======================
// LOAD JSON
// =======================
async function loadSounds() {
  try {
    const res = await fetch("mp3/Sound.json");
    const json = await res.json();
    sounds = json.results || json;
    buildData();
    renderThemes();
  } catch (e) {
    console.error("JSON load failed", e);
  }
}

// =======================
// BUILD DATA
// =======================
function buildData() {
  data = {};
  [...THEME_ORDER, ...REGIO_THEMES].forEach(t => { data[t] = []; });

  sounds.forEach(s => {
    const file = cleanPath(s.fileName);
    const item = {
      file,
      title: s.soundTitle || s.dialectTitle || file,
      dialect: s.dialectTitle || s.soundTitle || file
    };

    const rawCats = s.categories || "";
    const catKeys = parseCategories(rawCats);
    let resolved = catKeys.map(resolveCategory).filter(Boolean);
    resolved = [...new Set(resolved)];

    // Fallback op bestandsnaam
    if (resolved.length === 0) {
      const detected = detectCategoryFromFile(file);
      if (detected) resolved.push(detected);
    }

    resolved.forEach(cat => {
      if (!data[cat]) data[cat] = [];
      // Geen duplicaten
      if (!data[cat].find(i => i.file === file)) {
        data[cat].push(item);
      }
    });

    // Altijd in Alles
    if (!data["Alles"]) data["Alles"] = [];
    if (!data["Alles"].find(i => i.file === file)) {
      data["Alles"].push(item);
    }

    preload(file);
  });
}

function detectCategoryFromFile(file) {
  const f = file.toLowerCase();
  if (f.includes("uitdruk"))  return "Uitdrukkingen";
  if (f.includes("weer"))     return "Het weer";
  if (f.includes("huis") || f.includes("tuin") || f.includes("keuken")) return "Huis/Tuin/Keuken";
  if (f.includes("resto"))    return "Op restaurant";
  if (f.includes("cafe"))     return "In het café";
  if (f.includes("dieren") || f.includes("dier")) return "Dieren";
  if (f.includes("winkel"))   return "In de winkel";
  if (f.includes("straat"))   return "Op straat";
  if (f.includes("onderweg")) return "Onderweg";
  if (f.includes("feest"))    return "Feestdagen";
  if (f.includes("maaike") || f.includes("cafmeyer")) return "Maaike Cafmeyer";
  if (f.includes("ja"))       return "Vervoegingen van ja";
  return null;
}

// =======================
// ITEM RENDEREN (herbruikbaar)
// =======================
function renderItem(item, onFavClick) {
  const div = document.createElement("div");
  div.className = "item";

  const displayTitle = quizMode ? item.dialect : item.title;
  const flipTitle = quizMode ? item.title : item.dialect;

  div.innerHTML = `
    <span class="label">${fixSpacing(displayTitle)}</span>
    <span class="fav">${heartSVG(favorites.includes(item.file))}</span>
  `;

  const label = div.querySelector(".label");
  let flipTimeout = null;

  label.onclick = () => {
    vibrate();

    // Stop vorige timeout zodat labels niet door elkaar lopen
    if (flipTimeout) clearTimeout(flipTimeout);

    // Speel audio EERST af, los van de label-animatie
    play(item.file);

    // Label wisselen pas daarna
    label.innerHTML = fixSpacing(flipTitle);
    label.classList.add("showing-dialect");

    flipTimeout = setTimeout(() => {
      label.innerHTML = fixSpacing(displayTitle);
      label.classList.remove("showing-dialect");
      flipTimeout = null;
    }, 2000);
  };

  div.querySelector(".fav").onclick = (e) => {
    e.stopPropagation();
    onFavClick(item.file);
  };

  return div;
}

// =======================
// THEME OVERVIEW
// =======================
function renderThemes() {
  activeTab = "themas";
  currentTheme = null;
  document.getElementById("title").innerHTML = `<div class="title-text">THEMA'S</div>`;

  const content = document.getElementById("content");
  content.innerHTML = "";

  const inner = document.createElement("div");
  inner.id = "content-inner";
  content.appendChild(inner);

  THEME_ORDER.forEach(theme => {
    // Submenu "Uitdrukkingen per regio" apart behandelen
    if (theme === "Uitdrukkingen per regio") {
      const hasRegio = REGIO_THEMES.some(r => data[r] && data[r].length > 0);
      if (!hasRegio) return;
      const div = document.createElement("div");
      div.className = "item";
      div.style.paddingLeft = "28px";
      div.innerHTML = `<span class="label" style="color:#aaa; font-size:0.95em">${fixSpacing("Uitdrukkingen per regio")}</span><span class="arrow">➜</span>`;
      div.onclick = () => renderRegioMenu();
      inner.appendChild(div);
      return;
    }

    if (!data[theme] || data[theme].length === 0) return;
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<span class="label">${fixSpacing(theme)}</span><span class="arrow">➜</span>`;
    div.onclick = () => renderTheme(theme);
    inner.appendChild(div);
  });

  renderBottombar();
}

// =======================
// REGIO SUBMENU
// =======================
function renderRegioMenu() {
  currentTheme = null;
  document.getElementById("title").innerHTML = `
    <div class="back" onclick="renderThemes()">← Terug</div>
    <div class="title-text">PER REGIO</div>
  `;

  const content = document.getElementById("content");
  content.innerHTML = "";
  const inner = document.createElement("div");
  inner.id = "content-inner";
  content.appendChild(inner);

  REGIO_THEMES.forEach(regio => {
    if (!data[regio] || data[regio].length === 0) return;
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<span class="label">${fixSpacing(regio)}</span><span class="arrow">➜</span>`;
    div.onclick = () => renderTheme(regio);
    inner.appendChild(div);
  });

  renderBottombar();
}

// =======================
// SUBTHEME VIEW
// =======================
function renderTheme(theme) {
  currentTheme = theme;
  const isRegio = REGIO_THEMES.includes(theme);

  document.getElementById("title").innerHTML = `
    <div class="back" onclick="${isRegio ? 'renderRegioMenu()' : 'renderThemes()'}">← Terug</div>
    <div class="title-text">${fixSpacing(theme.toUpperCase())}</div>
  `;

  const content = document.getElementById("content");
  content.innerHTML = "";
  const inner = document.createElement("div");
  inner.id = "content-inner";
  content.appendChild(inner);

  (data[theme] || []).forEach(item => {
    inner.appendChild(renderItem(item, (file) => toggleFav(file)));
  });

  renderBottombar();
}

// =======================
// FAVORIETEN PAGINA
// =======================
function renderFavorieten() {
  activeTab = "favorieten";
  currentTheme = null;

  document.getElementById("title").innerHTML = `
    <div class="back" onclick="renderThemes()">← Terug</div>
    <div class="title-text">FAVORIETEN</div>
    <div class="topbar-with-action">
      <button class="delete-fav-topbtn" onclick="confirmDeleteFavs()" title="Verwijder alle favorieten">🗑️</button>
    </div>
  `;

  const content = document.getElementById("content");
  content.innerHTML = "";
  const inner = document.createElement("div");
  inner.id = "content-inner";
  content.appendChild(inner);

  const seen = new Set();
  const favItems = [];
  Object.values(data).flat().forEach(item => {
    if (favorites.includes(item.file) && !seen.has(item.file)) {
      seen.add(item.file);
      favItems.push(item);
    }
  });

  if (favItems.length === 0) {
    const empty = document.createElement("div");
    empty.style.cssText = "text-align:center; padding: 40px 20px; color: #888; font-size: 18px;";
    empty.textContent = "Nog geen favorieten toegevoegd.";
    inner.appendChild(empty);
  } else {
    favItems.forEach(item => {
      inner.appendChild(renderItem(item, () => {
        toggleFav(item.file);
        renderFavorieten();
      }));
    });
  }

  renderBottombar();
}

// =======================
// INFO PAGINA
// =======================
function renderInfo() {
  activeTab = "info";
  currentTheme = null;
  document.getElementById("title").innerHTML = `
    <div class="back" onclick="renderThemes()">← Terug</div>
    <div class="title-text">INFO</div>
  `;

  const content = document.getElementById("content");
  content.innerHTML = "";

  const inner = document.createElement("div");
  inner.className = "info-content";
  // Geen logo hier — staat al vast in de subbar
  inner.innerHTML = `
    <p class="info-section-title">Over West-Vlamingen</p>
    <p class="info-intro">Het zijn nogal levensgenieters: ze weten alles van lekker eten en drinken, van cultureel én sportief ontspannen.</p>
    <p class="info-body">Levenskwaliteit is er ook genoeg in de enige provincie aan de zee: met de uitgestrekte provinciale domeinen en de prachtige fiets- en wandelpaden in de polders, de heuvels of langs de Leie. Daarenboven zijn West-Vlamingen een zeer ondernemend volkje. Stil zitten staat niet in hun woordenboek. Vwoert'doen daarentegen wel...</p>
    <div class="info-wvl-logo">
      <img src="img/logo_wvl@2x.png" alt="West-Vlaanderen">
    </div>
    <hr class="info-divider">
    <p class="info-section-title">Over de app</p>
    <p class="info-intro">Verras vriend en vijand met de leukste West-Vlaamse woorden en uitspraken.</p>
    <p class="info-body">Voor elke situatie en bij elke gelegenheid kan je vanaf nu uitpakken met een perfecte West-Vlaamse tongval. Onderweg, op café of restaurant, in de winkel, ...</p>
  `;
  content.appendChild(inner);

  renderBottombar();
}

// =======================
// START
// =======================
loadSounds();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

window.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("touchstart", () => {
    const unlock = new Audio();
    unlock.play().catch(() => {});
  }, { once: true });
});

window.addEventListener("DOMContentLoaded", () => {
  const startScreen = document.getElementById("startscreen");
  if (!startScreen) return;
  startScreen.addEventListener("click", () => {
    startScreen.style.opacity = "0";
    startScreen.style.transition = "opacity 0.4s ease";
    setTimeout(() => { startScreen.remove(); renderThemes(); }, 400);
  });
});
