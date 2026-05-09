const CONFIG_FILE = "horario_config.txt";

const dayNames = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const displayNames = {
  LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles",
  JUEVES: "Jueves", VIERNES: "Viernes", SABADO: "Sábado", DOMINGO: "Domingo"
};

const icons = { estudio: "📚", descanso: "☕", variable: "✨" };

async function loadSchedule() {
  try {
    const response = await fetch(CONFIG_FILE + "?v=" + Date.now());
    if (!response.ok) throw new Error("No se pudo cargar el archivo");
    const text = await response.text();
    const parsed = parseConfig(text);

    renderWeekInfo(parsed.week);
    renderSchedule(parsed.schedule);
    renderGeneralNotes(parsed.generalNotes);
  } catch (error) {
    console.error(error);
    document.getElementById("weekGrid").innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>⚠️ Error de formato en horario_config.txt</p>";
  }
}

function parseConfig(text) {
  const schedule = {};
  let generalNotes = [];
  let currentDay = null;
  let week = "";
  let readingGeneralNotes = false;

  text.split(/\r?\n/).forEach((rawLine) => {
    // Limpieza de marcas de citación accidentales
    let line = rawLine.replace(/\/g, "").trim();
    if (!line || line.startsWith("#")) return;

    if (line.toUpperCase().includes("[NOTAS]")) {
      readingGeneralNotes = true;
      return;
    }
    if (readingGeneralNotes) {
      generalNotes.push(line.replace(/^- /, ""));
      return;
    }
    if (line.toUpperCase().includes("SEMANA:")) {
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

    const [keyRaw, valueRaw] = line.split(/:(.+)/);
    const key = keyRaw.trim().toLowerCase();
    const value = valueRaw.trim();

    if (key === "nota") {
      schedule[currentDay].note = value;
    } else {
      let time = "", type = "", label = "";
      if (value.includes("|")) {
        const parts = value.split("|");
        time = parts[0].trim();
        type = normalizeType(parts[1]);
      } else {
        type = normalizeType(value);
      }
      label = type === "estudio" ? (key === "mañana" ? "Estudio de mañana" : "Estudio de tarde") : (type === "descanso" ? "Descanso" : value);
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
      html += `<div class="block variable"><div class="block-title">✨ Libre</div></div>`;
    } else {
      data.blocks.forEach(b => {
        const css = b.type === "estudio" ? "study" : (b.type === "descanso" ? "rest" : "variable");
        html += `<div class="block ${css}"><div class="block-title">${icons[b.type] || "✨"} ${b.label}</div><div class="block-time">${b.time || "relax"}</div></div>`;
      });
    }

    if (data.note) {
      html += `<div class="day-note">📌 ${data.note}</div>`;
    }

    card.innerHTML = html;
    grid.appendChild(card);
  });
}

function renderGeneralNotes(notes) {
  const list = document.getElementById("notesList");
  if (list) list.innerHTML = notes.map(n => `<li>${n}</li>`).join("");
}

function normalize(t) { return t.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function normalizeType(t) {
  const v = t.toLowerCase();
  return v.includes("estudio") ? "estudio" : (v.includes("descanso") ? "descanso" : "variable");
}

function renderWeekInfo(week) {
  if (!week) return;
  const match = week.match(/(\d{2})\/(\d{2})\/(\d{4})\s+al\s+(\d{2})/);
  if (match) {
    const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    document.getElementById("weekMonth").textContent = months[parseInt(match[2]) - 1] + " " + match[3];
    document.getElementById("weekDays").textContent = `${match[1]} → ${match[4]}`;
    document.getElementById("weekText").textContent = `Semana del ${week}`;
  }
}

loadSchedule();