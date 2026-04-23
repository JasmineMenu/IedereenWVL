// =======================
// STATE
// =======================
let sounds = [];
let data = {};
let favorites = JSON.parse(localStorage.getItem("fav") || "[]");

let currentTheme = null;
let currentAudio = null;
let audioCache = new Map();

// =======================
// HELPERS
// =======================
function cleanPath(fileName) {
  return ("mp3/" + fileName).replace(/\\/g, "/");
}

function vibrate() {
  if (navigator.vibrate) navigator.vibrate(20);
}
function getAudio(file) {
  const url = encodeURI(file);

  if (!audioCache.has(url)) {
    const audio = new Audio(url);
    audio.preload = "auto";
    audioCache.set(url, audio);
  }

  return audioCache.get(url);
}
// =======================
// AUDIO
// =======================
function play(file) {
  if (!file) return;

  const audio = getAudio(file);

  if (currentAudio && currentAudio !== audio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = audio;

  audio.currentTime = 0;
  audio.play().catch(err => {
    console.log("Audio error:", file, err);
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

  // refresh view
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

  document.getElementById("title").innerText = "THEMA'S";

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

  document.getElementById("title").innerText = theme.toUpperCase();

  const content = document.getElementById("content");
  content.innerHTML = "";

  // 🔥 PRELOAD HELE THEMA (hier moet het staan)
  data[theme].forEach(item => {
    getAudio(item.file);
  });

  // daarna pas renderen
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
// SPLASH LOGIC
// =======================
window.addEventListener("load", () => {
  const splash = document.getElementById("splash");

  if (!splash) return;

  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  if (!isMobile) {
    splash.remove();
    return;
  }

  setTimeout(() => {
    splash.style.opacity = "0";
    splash.style.transition = "opacity 0.6s ease";

    setTimeout(() => {
      splash.remove();
    }, 600);

  }, 1800);
});
