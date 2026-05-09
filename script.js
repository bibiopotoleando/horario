const CONFIG_FILE = "horario_config.txt";

const dayNames = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

const displayNames = {
  LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles",
  JUEVES: "Jueves", VIERNES: "Viernes", SABADO: "Sábado", DOMINGO: "Domingo",
};

const icons = { estudio: "📚", descanso: "☕", variable: "✨", nota: "📌" };

async function loadSchedule() {
  try {
    const response = await fetch(CONFIG_FILE + "?v=" + Date.now());
    if (!response.ok) throw new Error("No se pudo cargar el archivo");
    const text = await response.text();
    const parsed = parseConfig(text);

    renderWeekInfo(parsed.week);
    renderSchedule(parsed.schedule);
  } catch (error) {
    document.getElementById("weekGrid").innerHTML = `<div class="block rest"><div class="block-title">☕ Error al cargar</div></div>`;
    console.error(error);
  }
}

function parseConfig(text) {
  const schedule = {};
  let currentDay = null;
  let week = "";

  text.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return;

    if (line.toUpperCase().startsWith("SEMANA:")) {
      week = line.split(/:(.+)/)[1].trim();
      return;
    }

    const dayMatch = line.match(/^\[(.+?)\]$/);
    if (dayMatch) {
      currentDay = normalize(dayMatch[1]);
      schedule[currentDay] = { blocks: [], note: "" };
      return;
    }

    if (!currentDay || !line.includes(":")) return;

    const [slotRaw, restRaw] = line.split(/:(.+)/);
    const slot = slotRaw.trim().toLowerCase();
    const rest = restRaw.trim();

    if (slot === "nota") {
      schedule[currentDay].note = rest;
    } else {
      let time = "", type = "", label = "";
      if (rest.includes("|")) {
        const parts = rest.split("|");
        time = parts[0].trim();
        type = normalizeType(parts[1]);
      } else {
        type = normalizeType(rest);
      }

      if (type === "estudio") label = slot === "mañana" ? "Estudio de mañana" : "Estudio de tarde";
      else if (type === "descanso") label = "Descanso";
      else { label = rest; type = "variable"; }

      schedule[currentDay].blocks.push({ time, type, label });
    }
  });

  return { week, schedule };
}

function renderSchedule(schedule) {
  const grid = document.getElementById("weekGrid");
  const today = dayNames[new Date().getDay()];
  const orderedDays = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

  grid.innerHTML = "";

  orderedDays.forEach((day) => {
    const dayData = schedule[day] || { blocks: [], note: "" };
    const card = document.createElement("article");
    card.className = "day-card";
    if (day === today) card.classList.add("today");

    const title = document.createElement("div");
    title.className = "day-title";
    title.textContent = displayNames[day] || day;
    card.appendChild(title);

    if (dayData.blocks.length === 0) {
      card.appendChild(createBlock({ type: "variable", label: "Sin horario", time: "✨" }));
    } else {
      dayData.blocks.forEach((block) => card.appendChild(createBlock(block)));
    }

    // AÑADIR NOTA SI EXISTE
    if (dayData.note) {
      const noteDiv = document.createElement("div");
      noteDiv.className = "block nota";
      noteDiv.innerHTML = `<div class="block-title">📌 Nota</div><div class="block-time">${dayData.note}</div>`;
      card.appendChild(noteDiv);
    }

    grid.appendChild(card);
  });
}

function createBlock(block) {
  const div = document.createElement("div");
  div.className = `block ${cssClass(block.type)}`;
  div.innerHTML = `<div class="block-title">${icons[block.type] || "✨"} ${block.label}</div><div class="block-time">${block.time || "relax"}</div>`;
  return div;
}

function normalize(text) { return text.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function normalizeType(text) {
  const val = text.trim().toLowerCase();
  if (val.includes("estudio")) return "estudio";
  if (val.includes("descanso")) return "descanso";
  return "variable";
}
function cssClass(type) { return type === "estudio" ? "study" : (type === "descanso" ? "rest" : "variable"); }

function renderWeekInfo(week) {
  if (!week) return;
  const weekMonth = document.getElementById("weekMonth");
  const weekDays = document.getElementById("weekDays");
  const weekText = document.getElementById("weekText");
  const match = week.match(/(\d{2})\/(\d{2})\/(\d{4})\s+al\s+(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return;
  const months = {"01":"ENERO","02":"FEBRERO","03":"MARZO","04":"ABRIL","05":"MAYO","06":"JUNIO","07":"JULIO","08":"AGOSTO","09":"SEPTIEMBRE","10":"OCTUBRE","11":"NOVIEMBRE","12":"DICIEMBRE"};
  weekMonth.textContent = `${months[match[2]]} ${match[3]}`;
  weekDays.textContent = `${Number(match[1])} → ${Number(match[4])}`;
  weekText.textContent = `Semana del ${week}`;
}

async function loadLastUpdate() {
  try {
    const response = await fetch("https://api.github.com/repos/bibiopotoleando/horario/commits?path=horario_config.txt&page=1&per_page=1");
    const data = await response.json();
    if (data && data[0]) {
      const date = new Date(data[0].commit.committer.date);
      document.getElementById("lastUpdate").textContent = `🗓️ actualizado el ${date.toLocaleDateString("es-ES")}`;
    }
  } catch (e) { console.error(e); }
}

loadLastUpdate();
loadSchedule();