let sounds = [];
let data = {};
let favorites = JSON.parse(localStorage.getItem("fav") || "[]");

let currentTheme = null;

// =======================
// LOAD JSON
// =======================
async function loadSounds() {
  const res = await fetch("mp3/Sound.json");
  const json = await res.json();

  // soms zit data in results
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
    const file = "mp3/" + s.fileName;

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

  // topbar = titel + back
  document.getElementById("title").innerHTML =
    `<span onclick="renderThemes()" style="position:absolute; left:10px;">←</span>
     ${theme.toUpperCase()}`;

  const content = document.getElementById("content");
  content.innerHTML = "";

  data[theme].forEach(item => {
    const div = document.createElement("div");
    div.className = "item";

div.innerHTML = `
  <span class="label">${item.title}</span>
  <span class="fav" onclick="toggleFav('${item.file}')">
    ${favorites.includes(item.file) ? "❤️" : "🤍"}
  </span>
`;

    div.querySelector(".label").onclick = () => play(item.file);
    content.appendChild(div);
  });
}

// =======================
// AUDIO
// =======================
let currentAudio = null;

function play(file) {
  if (!file) return;

  const safeFile = encodeURI(file);

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = new Audio(safeFile);
  currentAudio.preload = "auto";

  currentAudio.play().catch(err => {
    console.log("Kan audio niet afspelen:", file, err);
  });
}

// =======================
// FAVORIETEN
// =======================
function toggleFav(file) {
  if (favorites.includes(file)) {
    favorites = favorites.filter(f => f !== file);
  } else {
    favorites.push(file);
  }

  localStorage.setItem("fav", JSON.stringify(favorites));

  if (currentTheme) renderTheme(currentTheme);
}

// =======================
// START
// =======================
loadSounds();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

window.addEventListener("load", () => {
  const splash = document.getElementById("splash");

  if (!splash) return;

  // 📱 detecteer mobiel
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  if (!isMobile) {
    // 🖥 desktop → meteen verwijderen
    splash.remove();
    return;
  }

  // 📱 mobiel → normale splash flow
  setTimeout(() => {
    splash.style.opacity = "0";
    splash.style.transition = "opacity 0.6s ease";

    setTimeout(() => {
      splash.remove();
    }, 600);

  }, 1800);
});
