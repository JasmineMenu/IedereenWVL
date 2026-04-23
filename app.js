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
  audio.load(); // belangrijk voor iOS/Safari

  audioCache.add(url);
}

// =======================
// AUDIO PLAYBACK
// =======================
function play(file) {
  if (!file) return;

  const url = encodeURI(file);

  // stop vorige audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  const audio = new Audio(url);
  currentAudio = audio;

  audio.play().catch(err => {
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
  const res = await fetch("mp3/Sound.json");
  const json = await res.json();

  sounds = json.results || json;

  buildData();
  renderThemes();
}

// =======================
// GROEPEREN OP THEMA
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
// THEMA OVERZICHT
// =======================
function renderThemes() {
  currentTheme = null;

document.getElementById("title").innerHTML = `
  <div class="back" onclick="renderThemes()">← terug</div>
  <div class="title-text">${theme.toUpperCase()}</div>
`;

  const content = document.getElementById("content");
  content.innerHTML = "";

  Object.keys(data).forEach(theme => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `<span>${theme}</span><span>➜</span>`;
    div.onclick = () => renderTheme(theme);

    content.appendChild(div);
  });
}

// =======================
// SUBTHEMA VIEW
// =======================
function renderTheme(theme) {
  currentTheme = theme;

document.getElementById("title").innerHTML = `
  <span class="back" onclick="renderThemes()">←</span>
  <span>${theme.toUpperCase()}</span>
`;

  const content = document.getElementById("content");
  content.innerHTML = "";

  // 🔥 PRELOAD HELE THEMA
  data[theme].forEach(item => {
    preload(item.file);
  });

  // render items
  data[theme].forEach(item => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <span class="label">${item.title}</span>
      <span class="fav">
        ${favorites.includes(item.file) ? "❤️" : "🤍"}
      </span>
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

    content.appendChild(div);
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
// iOS AUDIO UNLOCK
// =======================

  document.body.addEventListener("touchstart", () => {
    const unlock = new Audio();
    unlock.play().catch(() => {});
  }, { once: true });


// =======================
// Startscreen
// =======================

const startScreen = document.getElementById("startscreen");

if (startScreen) {
  startScreen.addEventListener("click", () => {
    startScreen.style.opacity = "0";
    startScreen.style.transition = "opacity 0.4s ease";

    setTimeout(() => {
      startScreen.remove();
    }, 400);
  });
}
