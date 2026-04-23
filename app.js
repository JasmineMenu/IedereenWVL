// =======================
// STATE
// =======================
let sounds = [];
let data = {};
let favorites = JSON.parse(localStorage.getItem("fav") || "[]");

let currentTheme = null;
let currentAudio = null;

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
// AUDIO
// =======================
function play(file) {
  console.log("TRY PLAY:", file);

  const url = new URL(file, window.location.href).href;
  console.log("FULL URL:", url);

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = new Audio(url);

  currentAudio.play().catch(err => {
    console.log("AUDIO FAIL:", err, url);
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

  // topbar
  const title = document.getElementById("title");
  title.innerHTML = "";

  const back = document.createElement("span");
  back.innerText = "←";
  back.style.position = "absolute";
  back.style.left = "10px";
  back.style.cursor = "pointer";
  back.onclick = renderThemes;

  title.appendChild(back);
  title.appendChild(document.createTextNode(theme.toUpperCase()));

  const content = document.getElementById("content");
  content.innerHTML = "";

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

    // 🎵 play
    label.onclick = () => {
      vibrate();
      play(item.file);
    };

    // ❤️ fav
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
