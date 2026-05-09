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
    document.getElementById("weekGrid").innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>Error en el formato de horario_config.txt</p>";
  }
}

function parseConfig(text) {
  const schedule = {};
  let generalNotes = [];
  let currentDay = null;
  let week = "";
  let readingGeneralNotes = false;

  text.split(/\r?\n/).forEach((rawLine) => {
    let line = rawLine.trim();
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
    const title = document.createElement("div");
    title.className = "day-title";
    title.textContent = displayNames[day] || day;
    card.appendChild(title);
    if (data.blocks.length === 0) {
      card.appendChild(createBlock({ type: "variable", label: "Libre", time: "✨" }));
    } else {
      data.blocks.forEach(block => card.appendChild(createBlock(block)));
    }
    if (data.note) {
      const noteDiv = document.createElement("div");
      noteDiv.className = "day-note";
      noteDiv.innerHTML = `📌 ${data.note}`;
      card.appendChild(noteDiv);
    }
    grid.appendChild(card);
  });
}

function renderGeneralNotes(notes) {
  const list = document.getElementById("notesList");
  if (list) list.innerHTML = notes.map(n => `<li>${n}</li>`).join("");
}

function createBlock(block) {
  const div = document.createElement("div");
  const css = block.type === "estudio" ? "study" : (block.type === "descanso" ? "rest" : "variable");
  div.className = `block ${css}`;
  div.innerHTML = `<div class="block-title">${icons[block.type] || "✨"} ${block.label}</div><div class="block-time">${block.time || "relax"}</div>`;
  return div;
}

function normalize(text) { return text.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function normalizeType(text) {
  const val = text.trim().toLowerCase();
  return val.includes("estudio") ? "estudio" : (val.includes("descanso") ? "descanso" : "variable");
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