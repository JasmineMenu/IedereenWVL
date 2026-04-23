// =======================
// STATE
// =======================
let sounds = [];
let data = {};
let favorites = JSON.parse(localStorage.getItem("fav") || "[]");

let currentTheme = null;
let currentAudio = null;
let audioCache = new Set();

// =======================
// HELPERS
// =======================
function cleanPath(fileName) {
  return ("mp3/" + fileName).replace(/\\/g, "/");
}

function vibrate() {
  if (navigator.vibrate) navigator.vibrate(20);
}

// SVG hartje — rood gevuld (aan) of transparant (uit)
function heartSVG(filled) {
  const color = filled ? "#e8192c" : "none";
  const stroke = filled ? "#e8192c" : "#aaa";
  return `<svg class="heart-icon" viewBox="0 0 32 30" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 27 C16 27 2 18 2 9.5 C2 5.36 5.36 2 9.5 2 C12.1 2 14.4 3.3 16 5.3 C17.6 3.3 19.9 2 22.5 2 C26.64 2 30 5.36 30 9.5 C30 18 16 27 16 27Z"
      fill="${color}" stroke="${stroke}" stroke-width="2"/>
  </svg>`;
}

// =======================
// AUDIO PRELOAD
// =======================
function preload(file) {
  const url = encodeURI(file);
  if (audioCache.has(url)) return;
  const audio = new Audio(url);
  audio.preload = "auto";
  audio.load();
  audioCache.add(url);
}

// =======================
// AUDIO PLAY
// =======================
function play(file) {
  if (!file) return;
  const url = encodeURI(file);
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = new Audio(url);
  currentAudio.play().catch(err => console.log("Audio error:", url, err));
}

// =======================
// FAVORIETEN TOGGLE
// =======================
function toggleFav(file) {
  if (navigator.vibrate) navigator.vibrate(15);
  if (favorites.includes(file)) {
    favorites = favorites.filter(f => f !== file);
  } else {
    favorites.push(file);
  }
  localStorage.setItem("fav", JSON.stringify(favorites));
  if (currentTheme) renderTheme(currentTheme);
}

// =======================
// BOTTOMBAR
// =======================
function renderBottombar(showDeleteFav = false) {
  const bar = document.querySelector(".bottombar");

  if (showDeleteFav) {
    bar.innerHTML = `
      <button class="delete-fav-btn" onclick="confirmDeleteFavs()">🗑 Verwijder alle<br>favorieten</button>
      <div class="bottombar-divider"></div>
      <button class="bottombar-btn" onclick="renderInfo()">
        <img src="img/logo_wvl@2x.png" class="btn-icon" alt="Info">
        <span>Info</span>
      </button>
    `;
  } else {
    bar.innerHTML = `
      <button class="bottombar-btn" onclick="renderFavorieten()">
        ${heartSVG(true)}
        <span>Favorieten</span>
      </button>
      <div class="bottombar-divider"></div>
      <button class="bottombar-btn" onclick="renderInfo()">
        <img src="img/logo_wvl@2x.png" class="btn-icon" alt="Info">
        <span>Info</span>
      </button>
    `;
  }
}

// =======================
// POPUP: VERWIJDER FAVORIETEN
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
  data = { "Alles": [] };
  sounds.forEach(s => {
    const file = cleanPath(s.fileName);
    const item = { file, title: s.soundTitle || s.dialectTitle || file };
    const theme = getTheme(file);
    if (!data[theme]) data[theme] = [];
    data[theme].push(item);
    data["Alles"].push(item);
  });
}

// =======================
// THEMA DETECTIE
// =======================
function getTheme(file) {
  const f = file.toLowerCase();
  if (f.includes("uitdruk")) return "Uitdrukkingen";
  if (f.includes("weer")) return "Het weer";
  if (f.includes("huis") || f.includes("tuin") || f.includes("keuken")) return "Huis/tuin/keuken";
  if (f.includes("resto")) return "Op restaurant";
  if (f.includes("cafe")) return "In het café";
  if (f.includes("ja_jijvorm") || f.includes("ja")) return "Vervoegingen van ja";
  return "Rest";
}

// =======================
// THEME OVERVIEW
// =======================
function renderThemes() {
  currentTheme = null;
  document.getElementById("title").innerHTML = `<div class="title-text">THEMA'S</div>`;

  const content = document.getElementById("content");
  content.innerHTML = "";

  const inner = document.createElement("div");
  inner.id = "content-inner";
  content.appendChild(inner);

  Object.keys(data).forEach(theme => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<span class="label">${theme}</span><span class="arrow">➜</span>`;
    div.onclick = () => renderTheme(theme);
    inner.appendChild(div);
  });

  renderBottombar(false);
}

// =======================
// SUBTHEME VIEW
// =======================
function renderTheme(theme) {
  currentTheme = theme;
  document.getElementById("title").innerHTML = `
    <div class="back" onclick="renderThemes()">← Terug</div>
    <div class="title-text">${theme.toUpperCase()}</div>
  `;

  const content = document.getElementById("content");
  content.innerHTML = "";

  const inner = document.createElement("div");
  inner.id = "content-inner";
  content.appendChild(inner);

  (data[theme] || []).forEach(item => {
    preload(item.file);
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <span class="label">${item.title}</span>
      <span class="fav">${heartSVG(favorites.includes(item.file))}</span>
    `;
    div.querySelector(".label").onclick = () => { vibrate(); play(item.file); };
    div.querySelector(".fav").onclick = (e) => { e.stopPropagation(); toggleFav(item.file); };
    inner.appendChild(div);
  });

  renderBottombar(false);
}

// =======================
// FAVORIETEN PAGINA
// =======================
function renderFavorieten() {
  currentTheme = null;
  document.getElementById("title").innerHTML = `
    <div class="back" onclick="renderThemes()">← Terug</div>
    <div class="title-text">FAVORIETEN</div>
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
      preload(item.file);
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <span class="label">${item.title}</span>
        <span class="fav">${heartSVG(true)}</span>
      `;
      div.querySelector(".label").onclick = () => { vibrate(); play(item.file); };
      div.querySelector(".fav").onclick = (e) => {
        e.stopPropagation();
        toggleFav(item.file);
        renderFavorieten();
      };
      inner.appendChild(div);
    });
  }

  renderBottombar(true);
}

// =======================
// INFO PAGINA
// =======================
function renderInfo() {
  currentTheme = null;
  document.getElementById("title").innerHTML = `
    <div class="back" onclick="renderThemes()">← Terug</div>
    <div class="title-text">INFO</div>
  `;

  const content = document.getElementById("content");
  content.innerHTML = "";

  const inner = document.createElement("div");
  inner.id = "content-inner";
  inner.style.cssText = "padding: 30px 20px; color: #888; text-align: center; font-size: 18px;";
  inner.textContent = "Pagina in opbouw.";
  content.appendChild(inner);

  renderBottombar(false);
}

// =======================
// START APP
// =======================
loadSounds();

// =======================
// SERVICE WORKER
// =======================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

// =======================
// IOS AUDIO UNLOCK
// =======================
window.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("touchstart", () => {
    const unlock = new Audio();
    unlock.play().catch(() => {});
  }, { once: true });
});

// =======================
// STARTSCREEN
// =======================
window.addEventListener("DOMContentLoaded", () => {
  const startScreen = document.getElementById("startscreen");
  if (!startScreen) return;
  startScreen.addEventListener("click", () => {
    startScreen.style.opacity = "0";
    startScreen.style.transition = "opacity 0.4s ease";
    setTimeout(() => {
      startScreen.remove();
      renderThemes();
    }, 400);
  });
});
