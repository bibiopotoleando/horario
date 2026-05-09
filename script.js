/**
 * NOTA EXPLICATIVA:
 * El problema principal era que el código fallaba al encontrar textos extra 
 * o saltos de línea inesperados. Este nuevo código "limpia" la entrada.
 */

const CONFIG_FILE = "horario_config.txt";

const dayNames = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
const displayNames = {
  LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles",
  JUEVES: "Jueves", VIERNES: "Viernes", SABADO: "Sábado", DOMINGO: "Domingo",
};

const icons = { estudio: "📚", descanso: "☕", variable: "✨", nota: "📌" };

async function loadSchedule() {
  try {
    // Añadimos un timestamp para evitar que el navegador use una versión vieja (caché)
    const response = await fetch(CONFIG_FILE + "?v=" + Date.now());
    if (!response.ok) throw new Error("No se pudo cargar el archivo");

    const text = await response.text();
    const parsed = parseConfig(text);

    renderWeekInfo(parsed.week);
    renderSchedule(parsed.schedule);
    renderGeneralNotes(parsed.generalNotes);
  } catch (error) {
    console.error(error);
    document.getElementById("weekGrid").innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>⚠️ Error de lectura. Revisa que el archivo .txt esté bien subido.</p>";
  }
}

function parseConfig(text) {
  const schedule = {};
  let generalNotes = [];
  let currentDay = null;
  let week = "";
  let readingGeneralNotes = false;

  /**
   * NOTA: Esta línea de abajo es la SOLUCIÓN al problema de los "".
   * Busca cualquier texto que parezca una citación del chat y lo BORRA antes de empezar.
   */
  const cleanText = text.replace(/\/gi, "");

  cleanText.split(/\r?\n/).forEach((rawLine) => {
    let line = rawLine.trim();
    if (!line || line.startsWith("#")) return;

    // Detectar sección de notas generales al final
    if (line.toUpperCase().includes("[NOTAS]")) {
      readingGeneralNotes = true;
      return;
    }

    if (readingGeneralNotes) {
      generalNotes.push(line.replace(/^- /, ""));
      return;
    }

    // Detectar la línea de la SEMANA (Regex flexible para evitar errores de formato)
    if (/SEMANA:/i.test(line)) {
      week = line.split(/SEMANA:/i)[1].trim();
      return;
    }

    // Detectar el día (aunque tenga espacios o tildes)
    const dayMatch = line.match(/\[(LUNES|MARTES|MIERCOLES|MIÉRCOLES|JUEVES|VIERNES|SABADO|SÁBADO|DOMINGO)\]/i);
    if (dayMatch) {
      currentDay = normalize(dayMatch[1]);
      schedule[currentDay] = { blocks: [], note: "" };
      return;
    }

    if (!currentDay || !line.includes(":")) return;

    const [keyRaw, valueRaw] = line.split(/:(.+)/);
    const key = keyRaw.trim().toLowerCase();
    const value = valueRaw.trim();

    /**
     * NOTA: Aquí manejamos la "nota" del día como un bloque más, 
     * pero guardándola de forma especial para el diseño.
     */
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
      
      label = type === "estudio" ? `Estudio de ${key}` : (type === "descanso" ? "Descanso" : value);
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
    card.className = "day-card";
    if (day === today) card.classList.add("today");

    const title = document.createElement("div");
    title.className = "day-title";
    title.textContent = displayNames[day] || day;
    card.appendChild(title);

    // Si no hay horas puestas, mostramos que está libre
    if (data.blocks.length === 0) {
      card.appendChild(createBlock({ type: "variable", label: "Libre", time: "✨" }));
    } else {
      data.blocks.forEach(block => card.appendChild(createBlock(block)));
    }

    /**
     * NOTA: Si el día tiene una "nota", la añadimos al final de la tarjeta 
     * con un estilo visual de post-it amarillo (clase .block.nota).
     */
    if (data.note && data.note.trim() !== "") {
      const noteDiv = document.createElement("div");
      noteDiv.className = "block nota";
      noteDiv.innerHTML = `
        <div class="block-title">${icons.nota} Nota</div>
        <div class="block-time">${data.note}</div>
      `;
      card.appendChild(noteDiv);
    }
    grid.appendChild(card);
  });
}

function createBlock(block) {
  const div = document.createElement("div");
  const css = block.type === "estudio" ? "study" : (block.type === "descanso" ? "rest" : "variable");
  div.className = `block ${css}`;
  div.innerHTML = `
    <div class="block-title">${icons[block.type] || "✨"} ${block.label}</div>
    <div class="block-time">${block.time || "relax"}</div>
  `;
  return div;
}

function renderGeneralNotes(notes) {
  const list = document.getElementById("notesList");
  if (list) list.innerHTML = notes.map(n => `<li>${n}</li>`).join("");
}

function normalize(text) {
  return text.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeType(text) {
  const val = text.toLowerCase();
  if (val.includes("estudio")) return "estudio";
  if (val.includes("descanso")) return "descanso";
  return "variable";
}

function renderWeekInfo(week) {
  if (!week) return;
  /**
   * NOTA: Aquí extraemos el número del día para que el calendario de arriba 
   * deje de mostrar "-- -> --".
   */
  const match = week.match(/(\d{2})\/(\d{2})/);
  if (match) {
    document.getElementById("weekMonth").textContent = "MAYO 2026";
    document.getElementById("weekDays").textContent = `${match[1]} → ${parseInt(match[1])+6}`;
    document.getElementById("weekText").textContent = `Semana del ${week}`;
  }
}

loadSchedule();