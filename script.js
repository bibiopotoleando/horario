const CONFIG_FILE = "horario_config.txt";

const dayNames = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const displayNames = { LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles", JUEVES: "Jueves", VIERNES: "Viernes", SABADO: "Sábado", DOMINGO: "Domingo" };
const icons = { estudio: "📚", descanso: "☕", variable: "✨" };

async function loadSchedule() {
  try {
    const response = await fetch(CONFIG_FILE + "?v=" + Date.now());
    if (!response.ok) throw new Error("No se pudo cargar horario_config.txt");

    const text = await response.text();
    const parsed = parseConfig(text);

    renderWeekInfo(parsed.week);
    renderSchedule(parsed.schedule);
    renderGeneralNotes(parsed.generalNotes);
  } catch (error) {
    console.error(error);
  }
}

function parseConfig(text) {
  const schedule = {};
  const generalNotes = [];
  let currentDay = null;
  let week = "";
  let isGeneralNotes = false;

  text.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return;

    // Detectar sección [NOTAS] al final
    if (line.toUpperCase().includes("[NOTAS]")) {
      isGeneralNotes = true;
      return;
    }

    if (isGeneralNotes) {
      generalNotes.push(line.replace(/^-/, "").trim());
      return;
    }

    // Detectar línea de SEMANA
    if (line.toUpperCase().startsWith("SEMANA:")) {
      week = line.split(/:(.+)/)[1].trim();
      return;
    }

    // Detectar días [LUNES], etc.
    const dayMatch = line.match(/^\[(.+?)\]$/);
    if (dayMatch) {
      currentDay = normalize(dayMatch[1]);
      schedule[currentDay] = { blocks: [], note: "" };
      return;
    }

    if (!currentDay || !line.includes(":")) return;

    const [keyRaw, restRaw] = line.split(/:(.+)/);
    const key = keyRaw.trim().toLowerCase();
    const rest = restRaw.trim();

    if (key === "nota") {
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

      if (type === "estudio") label = key === "mañana" ? "Estudio de mañana" : "Estudio de tarde";
      else if (type === "descanso") label = "Descanso";
      else { label = rest; type = "variable"; }

      schedule[currentDay].blocks.push({ time, type, label });
    }
  });
  return { week, schedule, generalNotes };
}

function renderSchedule(schedule) {
  const grid = document.getElementById("weekGrid");
  const today = dayNames[new Date().getDay()];
  const orderedDays = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
  
  grid.innerHTML = "";

  orderedDays.forEach((day) => {
    const data = schedule[day] || { blocks: [], note: "" };
    const card = document.createElement("article");
    card.className = "day-card" + (day === today ? " today" : "");

    let html = `<div class="day-title">${displayNames[day] || day}</div>`;

    if (data.blocks.length === 0) {
      html += createBlockHTML({ type: "variable", label: "Libre", time: "✨" });
    } else {
      data.blocks.forEach(block => html += createBlockHTML(block));
    }

    // Nota individual al final de la tarjeta
    if (data.note) {
      html += `<div class="day-note">📌 ${data.note}</div>`;
    }

    card.innerHTML = html;
    grid.appendChild(card);
  });
}

function createBlockHTML(block) {
  const css = block.type === "estudio" ? "study" : (block.type === "descanso" ? "rest" : "variable");
  return `
    <div class="block ${css}">
      <div class="block-title">${icons[block.type] || "✨"} ${block.label}</div>
      <div class="block-time">${block.time || (block.type === "descanso" ? "relax" : "flexible")}</div>
    </div>`;
}

function renderGeneralNotes(notes) {
  const list = document.getElementById("generalNotesList");
  if (list) list.innerHTML = notes.map(n => `<li>${n}</li>`).join("");
}

function normalize(text) { return text.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function normalizeType(text) {
  const v = text.trim().toLowerCase();
  if (v.includes("estudio")) return "estudio";
  if (v.includes("descanso")) return "descanso";
  return "variable";
}

function renderWeekInfo(week) {
  if (!week) return;
  const match = week.match(/(\d{2})\/(\d{2})\/(\d{4})\s+al\s+(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return;
  const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  document.getElementById("weekMonth").textContent = `${months[parseInt(match[2]) - 1]} ${match[3]}`;
  document.getElementById("weekDays").textContent = `${Number(match[1])} → ${Number(match[4])}`;
  document.getElementById("weekText").textContent = `Semana del ${week}`;
}

async function loadLastUpdate() {
  try {
    const response = await fetch("https://api.github.com/repos/bibiopotoleando/horario/commits?path=horario_config.txt&per_page=1");
    const data = await response.json();
    if (data && data[0]) {
      const date = new Date(data[0].commit.committer.date);
      document.getElementById("lastUpdate").textContent = `🗓️ actualizado el ${date.toLocaleDateString("es-ES", {day: 'numeric', month: 'long', year: 'numeric'})}`;
    }
  } catch (e) { console.error(e); }
}

loadLastUpdate();
loadSchedule();