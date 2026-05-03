const CONFIG_FILE = "horario_config.txt";

const dayNames = [
  "DOMINGO",
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
];

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
      schedule[currentDay] = [];
      return;
    }

    if (!currentDay || !line.includes(":")) return;

    const [slotRaw, restRaw] = line.split(/:(.+)/);
    const slot = slotRaw.trim().toLowerCase();
    const rest = restRaw.trim();

    let time = "";
    let type = "";
    let label = "";

    if (rest.includes("|")) {
      const parts = rest.split("|");
      time = parts[0].trim();
      type = normalizeType(parts[1]);
    } else {
      type = normalizeType(rest);
    }

    if (type === "estudio") {
      label = slot === "mañana" ? "Estudio de mañana" : "Estudio de tarde";
    } else if (type === "descanso") {
      label = slot === "mañana" ? "Descanso de mañana" : "Descanso de tarde";
    } else if (type === "variable") {
      label = slot === "mañana" ? "Mañana flexible" : "Tarde flexible";
    } else {
      label = rest;
      type = "variable";
    }

    schedule[currentDay].push({
      slot,
      time,
      type,
      label,
    });
  });

  return {
    week,
    schedule,
  };
}

function renderWeekInfo(week) {
  if (!week) return;

  const match = week.match(/(\d{2})\/(\d{2})\/(\d{4})\s+al\s+(\d{2})\/(\d{2})\/(\d{4})/);

  const weekMonth = document.getElementById("weekMonth");
  const weekDays = document.getElementById("weekDays");
  const weekText = document.getElementById("weekText");

  if (!match || !weekMonth || !weekDays || !weekText) return;

  const startDay = match[1];
  const startMonth = match[2];
  const startYear = match[3];
  const endDay = match[4];

  const monthNames = {
    "01": "ENERO",
    "02": "FEBRERO",
    "03": "MARZO",
    "04": "ABRIL",
    "05": "MAYO",
    "06": "JUNIO",
    "07": "JULIO",
    "08": "AGOSTO",
    "09": "SEPTIEMBRE",
    "10": "OCTUBRE",
    "11": "NOVIEMBRE",
    "12": "DICIEMBRE",
  };

  weekMonth.textContent = `${monthNames[startMonth]} ${startYear}`;
  weekDays.textContent = `${Number(startDay)} → ${Number(endDay)}`;
  weekText.textContent = `Semana del ${week}`;
}

function renderSchedule(schedule) {
  const grid = document.getElementById("weekGrid");
  const today = dayNames[new Date().getDay()];

  const orderedDays = [
    "LUNES",
    "MARTES",
    "MIERCOLES",
    "JUEVES",
    "VIERNES",
    "SABADO",
    "DOMINGO",
  ];

  grid.innerHTML = "";

  orderedDays.forEach((day) => {
    const card = document.createElement("article");
    card.className = "day-card";

    if (day === today) {
      card.classList.add("today");
    }

    const title = document.createElement("div");
    title.className = "day-title";
    title.textContent = displayNames[day] || day;
    card.appendChild(title);

    const blocks = schedule[day] || [];

    if (blocks.length === 0) {
      card.appendChild(createBlock({
        type: "variable",
        label: "Sin horario definido",
        time: "✨",
      }));
    } else {
      blocks.forEach((block) => {
        card.appendChild(createBlock(block));
      });
    }

    grid.appendChild(card);
  });
}

function createBlock(block) {
  const div = document.createElement("div");
  div.className = `block ${cssClass(block.type)}`;

  const title = document.createElement("div");
  title.className = "block-title";
  title.textContent = `${icons[block.type] || "✨"} ${block.label}`;

  const time = document.createElement("div");
  time.className = "block-time";
  time.textContent = block.time || getTextForType(block.type);

  div.appendChild(title);
  div.appendChild(time);

  return div;
}

function normalize(text) {
  return text
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeType(text) {
  const value = text.trim().toLowerCase();

  if (value.includes("estudio")) return "estudio";
  if (value.includes("descanso")) return "descanso";
  if (value.includes("variable")) return "variable";

  return value;
}

function cssClass(type) {
  if (type === "estudio") return "study";
  if (type === "descanso") return "rest";
  return "variable";
}

function getTextForType(type) {
  if (type === "descanso") return "descanso";
  if (type === "variable") return "según energía";
  return "";
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