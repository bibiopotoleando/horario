const CONFIG_FILE = "horario_config.txt";

const dayNames = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const displayNames = {
  LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles",
  JUEVES: "Jueves", VIERNES: "Viernes", SABADO: "Sábado", DOMINGO: "Domingo",
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
  } catch (error) {
    document.getElementById("weekGrid").innerHTML = `<div class="block rest"><div class="block-title">☕ Error de formato</div><div class="block-time">Revisa horario_config.txt</div></div>`;
    console.error(error);
  }
}

function parseConfig(text) {
  const schedule = {};
  let currentDay = null;
  let week = "";

  text.split(/\r?\n/).forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith("#") || line.startsWith("[source")) return;

    if (line.toUpperCase().startsWith("SEMANA:")) {
      week = line.split(/:(.+)/)[1].trim();
      return;
    }

    const dayMatch = line.match(/^\[(.+?)\]$/);
    if (dayMatch) {
      const dayName = dayMatch[1].toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (dayNames.includes(dayName) || dayName === "SABADO" || dayName === "MIERCOLES") {
        currentDay = dayName;
        schedule[currentDay] = { blocks: [], note: "" };
      }
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
        const typePart = parts[1].trim().toLowerCase();
        type = typePart.includes("estudio") ? "estudio" : (typePart.includes("descanso") ? "descanso" : "variable");
      } else {
        type = rest.toLowerCase().includes("descanso") ? "descanso" : "variable";
        time = rest;
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
    card.className = "day-card" + (day === today ? " today" : "");

    let html = `<div class="day-title">${displayNames[day] || day}</div>`;

    if (dayData.blocks.length === 0) {
      html += createBlockHTML({ type: "variable", label: "Sin horario", time: "✨" });
    } else {
      dayData.blocks.forEach((block) => html += createBlockHTML(block));
    }

    if (dayData.note) {
      html += `<div class="block nota"><div class="block-title">📌 Nota</div><div class="block-time">${dayData.note}</div></div>`;
    }
    card.innerHTML = html;
    grid.appendChild(card);
  });
}

function createBlockHTML(block) {
  const css = block.type === "estudio" ? "study" : (block.type === "descanso" ? "rest" : "variable");
  return `<div class="block ${css}"><div class="block-title">${icons[block.type] || "✨"} ${block.label}</div><div class="block-time">${block.time || "relax"}</div></div>`;
}

function renderWeekInfo(week) {
  if (!week) return;
  const match = week.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return;
  const months = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
  document.getElementById("weekMonth").textContent = `${months[parseInt(match[2])-1]} ${match[3]}`;
  document.getElementById("weekText").textContent = `Semana del ${week}`;
}

loadSchedule();