const content = document.getElementById("content");

let state = "themes";
let currentTheme = null;

let favorites = JSON.parse(localStorage.getItem("fav") || "[]");

// 👉 jouw mp3 lijst (later automatisch uit map te laden kan ook)
const files = [
  "mp3/WVL_APP_9_UitdrukkingenRoeselare_TswienDeBietnInjaeghen.mp3",
  "mp3/WVL_APP_7_Weer_Smuk'n.mp3",
  "mp3/WVL_APP_5_HuisTuinKeuken_Buzzestove.mp3",
  "mp3/WVL_APP_2_Resto_Gernoars.mp3",
  "mp3/WVL_APP_1_Cafe_Kaffie.mp3",
  "mp3/ja_jijvorm.mp3",
  "mp3/mijnschatje.mp3",
  "mp3/_t_Zwien_deur_de_beat_n_joagen.mp3",
  "mp3/WVL_APP_11_DaBesanNie.mp3"
];

// 🎯 thema detectie
function getTheme(file) {
  const f = file.toLowerCase();

  if (f.includes("uitdrukk")) return "Uitdrukkingen";
  if (f.includes("weer")) return "Het weer";
  if (f.includes("huis") || f.includes("tuin") || f.includes("keuken")) return "Huis/tuin/keuken";
  if (f.includes("resto")) return "Op restaurant";
  if (f.includes("cafe")) return "In het café";
  if (f.includes("ja_jijvorm")) return "Vervoegingen van ja";

  return "Rest";
}

// 🎯 alles groeperen
function group() {
  const map = { "Alles": [] };

  files.forEach(f => {
    const t = getTheme(f);
    if (!map[t]) map[t] = [];
    map[t].push(f);
    map["Alles"].push(f);
  });

  return map;
}

const data = group();

// 🟢 START VIEW
function renderThemes() {
  state = "themes";
  content.innerHTML = "";

  Object.keys(data).forEach(theme => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<span>${theme}</span><span class="arrow">➜</span>`;
    div.onclick = () => renderTheme(theme);
    content.appendChild(div);
  });
}

// 🟡 SUBMENU
function renderTheme(theme) {
  state = "theme";
  currentTheme = theme;

  content.innerHTML = "";

  const header = document.createElement("div");
  header.className = "header";
  header.innerHTML = `
    <div class="back" onclick="renderThemes()">← terug</div>
    ${theme}
  `;
  content.appendChild(header);

  data[theme].forEach(file => {
    const div = document.createElement("div");
    div.className = "item";

    const name = file.split("/").pop().replace(".mp3", "");

    div.innerHTML = `
      <span onclick="play('${file}')">${name}</span>
      <span class="fav" onclick="toggleFav('${file}')">
        ${favorites.includes(file) ? "❤️" : "🤍"}
      </span>
    `;

    content.appendChild(div);
  });
}

// 🎵 audio
function play(file) {
  const a = new Audio(file);
  a.play();
}

// ❤️ favorites
function toggleFav(file) {
  if (favorites.includes(file)) {
    favorites = favorites.filter(f => f !== file);
  } else {
    favorites.push(file);
  }
  localStorage.setItem("fav", JSON.stringify(favorites));
  renderTheme(currentTheme);
}

// init
renderThemes();
