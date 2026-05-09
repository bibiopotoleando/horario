const CONFIG_FILE = "horario_config.txt";
const dayNames = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const displayNames = { LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles", JUEVES: "Jueves", VIERNES: "Viernes", SABADO: "Sábado", DOMINGO: "Domingo" };
const icons = { estudio: "📚", descanso: "☕", variable: "✨" };

async function loadSchedule() {
  try {
    const response = await fetch(CONFIG_FILE + "?v=" + Date.now());
    if (!response.ok) throw new Error("Error al cargar config");
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
  const generalNotes = [];
  let currentDay = null;
  let week = "";
  let isGeneralNotes = false;

  text.split(/\r?\n/).forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith("#")) return;

    if (line.toUpperCase() === "[NOTAS]") { isGeneralNotes = true; return; }
    if (isGeneralNotes) { generalNotes.push(line.replace(/^-/, "").trim()); return; }

    if (line.toUpperCase().includes("SEMANA:")) {
      week = line.split(/:(.+)/)[1].trim();
      return;const CONFIG_FILE = "horario_config.txt";

const dayNames = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

const displayNames = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

const icons = {
  estudio: "📚",
  descanso: "☕",
  variable: "✨",
};

async function loadSchedule() {
  try {
    const response = await fetch(CONFIG_FILE + "?v=" + Date.now());

    if (!response.ok) {
      throw new Error("No se pudo cargar horario_config.txt");
    }

    const text = await response.text();
    const parsed = parseConfig(text);

    renderWeekInfo(parsed.week);
    renderSchedule(parsed.schedule);
    renderGeneralNotes(parsed.generalNotes); // Carga las notas generales
  } catch (error) {
    document.getElementById("weekGrid").innerHTML = `
      <div class="block rest">
        <div class="block-title">☕ No se pudo cargar el horario</div>
        <div class="block-time">Revisa horario_config.txt</div>
      </div>
    `;
    console.error(error);
  }
}

function parseConfig(text) {
  const schedule = {};
  const generalNotes = [];
  let currentDay = null;
  let week = "";
  let isGeneralNotesSection = false;

  text.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) return;

    // Detectar la sección de notas generales
    if (line.toUpperCase().includes("[NOTAS]")) {
      isGeneralNotesSection = true;
      return;
    }

    if (isGeneralNotesSection) {
      generalNotes.push(line.replace(/^-/, "").trim());
      return;
    }

    // Detectar la línea de la semana
    if (line.toUpperCase().includes("SEMANA:")) {
      week = line.split(/:(.+)/)[1].trim();
      return;
    }

    // Detectar bloques de días
    const dayMatch = line.match(/^\[(.+?)\]$/);
    if (dayMatch) {
      currentDay = normalize(dayMatch[1]);
      schedule[currentDay] = { blocks: [], note: "" };
      return;
    }

    if (!currentDay || !line.includes(":")) return;

    const [key, val] = line.split(/:(.+)/);
    const keyLower = key.trim().toLowerCase();
    const value = val.trim();

    // Separar la nota individual del día de los bloques de estudio
    if (keyLower === "nota") {
      schedule[currentDay].note = value;
    } else {
      let time = "";
      let type = "";
      let label = "";

      if (value.includes("|")) {
        const parts = value.split("|");
        time = parts[0].trim();
        type = normalizeType(parts[1]);
      } else {
        type = normalizeType(value);
      }

      if (type === "estudio") {
        label = keyLower === "mañana" ? "Estudio de mañana" : "Estudio de tarde";
      } else if (type === "descanso") {
        label = "Descanso";
      } else {
        label = value;
        type = "variable";
      }

      schedule[currentDay].blocks.push({ time, type, label });
    }
  });

  return { week, schedule, generalNotes };
}

function renderWeekInfo(week) {
  if (!week) return;

  // Regex ajustada para detectar tanto formatos largos como cortos de fecha
  const match = week.match(/(\d{2})\/(\d{2})\/(\d{4})\s+al\s+(\d{2})/);

  const weekMonth = document.getElementById("weekMonth");
  const weekDays = document.getElementById("weekDays");
  const weekText = document.getElementById("weekText");

  if (!match || !weekMonth || !weekDays || !weekText) return;

  const startDay = match[1];
  const startMonth = match[2];
  const startYear = match[3];
  const endDay = match[4];

  const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  
  weekMonth.textContent = months[parseInt(startMonth) - 1] + " " + startYear;
  weekDays.textContent = `${Number(startDay)} → ${Number(endDay)}`;
  weekText.textContent = `Semana del ${week}`;
}

function renderSchedule(schedule) {
  const grid = document.getElementById("weekGrid");
  const today = dayNames[new Date().getDay()];

  const orderedDays = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

  grid.innerHTML = "";

  orderedDays.forEach((day) => {
    const data = schedule[day] || { blocks: [], note: "" };
    const card = document.createElement("article");
    card.className = "day-card";

    if (day === today) {
      card.classList.add("today");
    }

    const title = document.createElement("div");
    title.className = "day-title";
    title.textContent = displayNames[day] || day;
    card.appendChild(title);

    if (data.blocks.length === 0) {
      card.appendChild(createBlock({
        type: "variable",
        label: "Libre",
        time: "✨",
      }));
    } else {
      data.blocks.forEach((block) => {
        card.appendChild(createBlock(block));
      });
    }

    // Insertar la nota individual del día si existe
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
  if (list) {
    list.innerHTML = notes.map(n => `<li>${n}</li>`).join("");
  }
}

function createBlock(block) {
  const div = document.createElement("div");
  div.className = `block ${cssClass(block.type)}`;

  const title = document.createElement("div");
  title.className = "block-title";
  title.textContent = `${icons[block.type] || "✨"} ${block.label}`;

  const time = document.createElement("div");
  time.className = "block-time";
  time.textContent = block.time || (block.type === "descanso" ? "descanso" : "flexible");

  div.appendChild(title);
  div.appendChild(time);

  return div;
}

function normalize(text) {
  return text.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeType(text) {
  const value = text.trim().toLowerCase();
  if (value.includes("estudio")) return "estudio";
  if (value.includes("descanso")) return "descanso";
  return "variable";
}

function cssClass(type) {
  if (type === "estudio") return "study";
  if (type === "descanso") return "rest";
  return "variable";
}

async function loadLastUpdate() {
  try {
    const response = await fetch(
      "https://api.github.com/repos/bibiopotoleando/horario/commits?path=horario_config.txt&page=1&per_page=1"
    );

    const data = await response.json();

    if (!data || !data[0]) return;

    const date = new Date(data[0].commit.committer.date);

    const formatted = date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const element = document.getElementById("lastUpdate");
    if (element) {
      element.textContent = `🗓️ actualizado el ${formatted}`;
    }
  } catch (error) {
    console.error("No se pudo cargar la fecha de actualización", error);
  }
}

loadLastUpdate();
loadSchedule();