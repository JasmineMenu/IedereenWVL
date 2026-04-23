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
  data = { "Alles": [] };
  sounds.forEach(s => {
    const file = cleanPath(s.fileName);
    const item = { file, title: s.soundTitle || s.dialectTitle || file };
    const them
