const CONFIG_FILE = "horario_config.txt";
const dayNames = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const displayNames = { LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles", JUEVES: "Jueves", VIERNES: "Viernes", SABADO: "Sábado", DOMINGO: "Domingo" };
const icons = { estudio: "📚", descanso: "☕", variable: "✨" };

async function loadSchedule() {
  try {
    const response = await fetch(CONFIG_FILE + "?v=" + Date.now());
    const text = await response.text();
    const parsed = parseConfig(text);
    renderWeekInfo(parsed.week);
    renderSchedule(parsed.schedule);
  } catch (error) {
    console.error("Error cargando:", error);
  }
}

function parseConfig(text) {
  const schedule = {};
  let currentDay = null;
  let week = "";
  let lastKey = null;

  // 1. Limpiamos el texto de etiquetas y basura similar
  const cleanText = text.replace(/\/gi, "");
  
  cleanText.split(/\r?\n/).forEach((rawLine) => {
    let line = rawLine.trim();
    if (!line || line.startsWith("#")) return;

    // 2. Detectar SEMANA (aunque tenga texto delante o detrás)
    if (/SEMANA:/i.test(line)) {
      week = line.split(/SEMANA:/i)[1].trim();
      return;
    }

    // 3. Detectar DÍAS con Regex flexible
    const dayMatch = line.match(/\[(LUNES|MARTES|MIERCOLES|MIÉRCOLES|JUEVES|VIERNES|SABADO|SÁBADO|DOMINGO)\]/i);
    if (dayMatch) {
      currentDay = normalize(dayMatch[1]);
      schedule[currentDay] = { blocks: [], note: "" };
      lastKey = null;
      return;
    }

    if (!currentDay) return;

    // 4. Si la línea NO tiene dos puntos, probablemente es la continuación de la línea anterior (error de salto)
    if (!line.includes(":")) {
      if (lastKey && schedule[currentDay].blocks.length > 0) {
        let lastBlock = schedule[currentDay].blocks[schedule[currentDay].blocks.length - 1];
        lastBlock.label += " " + line; // Unimos el texto cortado
        if (line.toLowerCase().includes("estudio")) lastBlock.type = "estudio";
        if (line.toLowerCase().includes("descanso")) lastBlock.type = "descanso";
      }
      return;
    }

    // 5. Procesar líneas normales (mañana:, tarde:, nota:)
    const [keyPart, ...valParts] = line.split(":");
    const key = keyPart.trim().toLowerCase();
    const val = valParts.join(":").trim();
    lastKey = key;

    if (key === "nota") {
      schedule[currentDay].note = val;
    } else {
      let time = val, type = "variable", label = val;
      if (val.includes("|")) {
        const parts = val.split("|");
        time = parts[0].trim();
        const typePart = parts[1].trim().toLowerCase();
        type = typePart.includes("estudio") ? "estudio" : (typePart.includes("descanso") ? "descanso" : "variable");
      }
      label = type === "estudio" ? `Estudio de ${key}` : (type === "descanso" ? "Descanso" : val);
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
    const data = schedule[day] || { blocks: [], note: "" };
    const card = document.createElement("article");
    card.className = "day-card" + (day === today ? " today" : "");
    let html = `<div class="day-title">${displayNames[day] || day}</div>`;
    
    if (data.blocks.length === 0) {
      html += `<div class="block variable"><div class="block-title">✨ Libre</div></div>`;
    } else {
      data.blocks.forEach(b => {
        const css = b.type === "estudio" ? "study" : (b.type === "descanso" ? "rest" : "variable");
        html += `<div class="block ${css}"><div class="block-title">${icons[b.type]} ${b.label}</div><div class="block-time">${b.time}</div></div>`;
      });
    }
    if (data.note) html += `<div class="block nota" style="background:var(--papel-2); border-left-color:var(--amarillo)"><div class="block-title">📌 Nota</div><div class="block-time">${data.note}</div></div>`;
    card.innerHTML = html;
    grid.appendChild(card);
  });
}

function renderWeekInfo(week) {
  if (!week) return;
  const match = week.match(/(\d{2})\/(\d{2})/);
  if (match) {
    document.getElementById("weekMonth").textContent = "MAYO 2026";
    document.getElementById("weekDays").textContent = `${Number(match[1])} → ${Number(match[1]) + 6}`;
  }
  document.getElementById("weekText").textContent = "Semana del " + week;
}

function normalize(t) { return t.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace("MIERCOLES", "MIERCOLES").replace("SABADO", "SABADO"); }

loadSchedule();