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
  currentAudio.play().catch(err => {
    console.log("Audio error:", url, err);
  });
}

// =======================
// FAVORIETEN
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
    const item = {
      file,
      title: s.soundTitle || s.dialectTitle || file
    };
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
  document.getElementById("title").innerHTML = "THEMA'S";

  const content = document.getElementById("content");
  content.innerHTML = "";

  // Wrapper voor max-breedte op desktop
  const inner = document.createElement("div");
  inner.id = "content-inner";
  content.appendChild(inner);

  Object.keys(data).forEach(theme => {
    const div = document.createElement("div");
    div.className = "item";
    // FIX: .label class toegevoegd zodat CSS correct werkt
    div.innerHTML = `<span class="label">${theme}</span><span class="arrow">➜</span>`;
    div.onclick = () => renderTheme(theme);
    inner.appendChild(div);
  });
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

  // Wrapper voor max-breedte op desktop
  const inner = document.createElement("div");
  inner.id = "content-inner";
  content.appendChild(inner);

  (data[theme] || []).forEach(item => {
    preload(item.file);

    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <span class="label">${item.title}</span>
      <span class="fav">${favorites.includes(item.file) ? "❤️" : "🤍"}</span>
    `;

    const label = div.querySelector(".label");
    const fav = div.querySelector(".fav");

    label.onclick = () => {
      vibrate();
      play(item.file);
    };

    fav.onclick = (e) => {
      e.stopPropagation();
      toggleFav(item.file);
    };

    inner.appendChild(div);
  });
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
