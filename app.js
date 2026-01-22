// DJ Ponte - Diagnóstico / FiestaScore
// Static site (sin backend). Configura WhatsApp y (opcional) un endpoint para leads.

const CONFIG = {
  whatsappNumber: "34669060192", // <-- CAMBIA ESTO (Ej: 34600111222). Sin '+'
  brandUrl: "https://djponte.com",
  leadEndpoint: "PASTE_GOOGLE_APPS_SCRIPT_WEBAPP_URL_HERE", // opcional: URL para enviar leads (Formspree / Make / Zapier / tu API). Si está vacío, no envía nada.
};

const $ = (sel) => document.querySelector(sel);

const hero = $("#hero");
const quiz = $("#quiz");
const results = $("#results");

const startBtn = $("#startBtn");
const restartLink = $("#restartLink");
const backBtn = $("#backBtn");
const nextBtn = $("#nextBtn");
const qbox = $("#qbox");
const progressFill = $("#progressFill");
const stepTxt = $("#stepTxt");
const stepTotal = $("#stepTotal");

const scoreNum = $("#scoreNum");
const riskBadge = $("#riskBadge");
const scoreExplain = $("#scoreExplain");
const packName = $("#packName");
const packPrice = $("#packPrice");
const packList = $("#packList");
const protocolList = $("#protocolList");
const persuasionBox = $("#persuasionBox");
const ctaBtn = $("#ctaBtn");
const shareBtn = $("#shareBtn");
const downloadJsonBtn = $("#downloadJsonBtn");

const reportTitle = $("#reportTitle");
const reportSubtitle = $("#reportSubtitle");

const leadForm = $("#leadForm");
const formMsg = $("#formMsg");

// ---------- State ----------
const state = {
  step: 0,
  answers: {},
  report: null,
};

// ---------- Question builders ----------
function radioQuestion({ id, title, desc = "", options }) {
  return { id, type: "radio", title, desc, options };
}
function multiQuestion({ id, title, desc = "", options, max = 3 }) {
  return { id, type: "multi", title, desc, options, max };
}
function textQuestion({ id, title, desc = "", placeholder = "" }) {
  return { id, type: "text", title, desc, placeholder };
}

function baseQuestions() {
  return [
    radioQuestion({
      id: "eventType",
      title: "¿Qué tipo de evento estás organizando?",
      desc: "Así afinamos el diagnóstico.",
      options: [
        { v: "boda", t: "Boda" },
        { v: "cumple", t: "Cumpleaños" },
        { v: "empresa", t: "Empresa / cena corporativa" },
        { v: "privada", t: "Fiesta privada" },
        { v: "otro", t: "Otro" },
      ],
    }),
    radioQuestion({
      id: "guests",
      title: "¿Cuánta gente asistirá aproximadamente?",
      options: [
        { v: "<30", t: "Menos de 30" },
        { v: "30-60", t: "30–60" },
        { v: "60-100", t: "60–100" },
        { v: ">100", t: "Más de 100" },
      ],
    }),
    radioQuestion({
      id: "venue",
      title: "¿Dónde se celebra?",
      options: [
        { v: "resto", t: "Restaurante" },
        { v: "casa", t: "Casa privada" },
        { v: "finca", t: "Pazo / finca" },
        { v: "hotel", t: "Hotel" },
        { v: "local", t: "Local alquilado" },
        { v: "otro", t: "Otro" },
      ],
    }),
    radioQuestion({
      id: "timeline",
      title: "¿Cuándo será el evento?",
      desc: "Nos ayuda a medir disponibilidad y urgencia.",
      options: [
        { v: "cerrada", t: "Ya tengo fecha cerrada" },
        { v: "<1m", t: "En menos de 1 mes" },
        { v: "1-3m", t: "En 1–3 meses" },
        { v: ">3m", t: "En más de 3 meses" },
      ],
    }),
    radioQuestion({
      id: "musicImportance",
      title: "Para ti, la música en este evento es…",
      options: [
        { v: "detalle", t: "Un detalle más" },
        { v: "importante", t: "Importante, pero no decisiva" },
        { v: "clave", t: "Clave para que el evento funcione" },
        { v: "top", t: "Lo más importante del evento" },
      ],
    }),
    multiQuestion({
      id: "worries",
      title: "¿Qué te preocupa más?",
      desc: "Elige hasta 3.",
      max: 3,
      options: [
        { v: "no_baila", t: "Que la gente no baile" },
        { v: "no_encaja", t: "Que la música no encaje con todos" },
        { v: "tecnico", t: "Problemas técnicos (sonido, volumen, cortes)" },
        { v: "ambiente", t: "Que falte ambiente" },
        { v: "nada", t: "Nada, confío en que todo saldrá bien" },
      ],
    }),
    radioQuestion({
      id: "badParty",
      title: "¿Has vivido alguna fiesta que no funcionó?",
      options: [
        { v: "si_incomodo", t: "Sí, y fue incómodo" },
        { v: "si_salvo", t: "Sí, pero se salvó" },
        { v: "no_preocupa", t: "No, pero me preocupa que pase" },
        { v: "no", t: "No, nunca" },
      ],
    }),
    radioQuestion({
      id: "expectation",
      title: "¿Qué esperas del DJ?",
      options: [
        { v: "basico", t: "Que ponga música sin complicaciones" },
        { v: "animar", t: "Que anime y lea la pista" },
        { v: "ambiente", t: "Que se encargue de todo el ambiente" },
        { v: "seguro", t: "Que sea un seguro total para el evento" },
      ],
    }),
    // Adaptativa según tipo de evento
    radioQuestion({
      id: "investment",
      title: "Para este tipo de evento buscas…",
      desc: "Sin números: solo el enfoque.",
      options: [
        { v: "sencillo", t: "Algo sencillo, sin complicaciones" },
        { v: "pro", t: "Una fiesta bien montada y sin riesgos" },
        { v: "premium", t: "Que todo funcione perfecto y yo no me preocupe de nada" },
      ],
    }),
    textQuestion({
      id: "note",
      title: "Un detalle que no pueda fallar (opcional)",
      desc: "Ej: ‘música 90s’, ‘varias edades’, ‘límite de dB’, ‘entrada sorpresa’…",
      placeholder: "Escribe aquí…",
    }),
  ];
}

function questionsForCurrentState() {
  const qs = baseQuestions();
  const t = state.answers.eventType;

  const inv = qs.find(q => q.id === "investment");
  if (inv) {
    if (t === "boda") {
      inv.title = "En una boda, la música para mí es…";
      inv.desc = "Esto define el nivel real de exigencia (y el tipo de montaje).";
      inv.options = [
        { v: "complemento", t: "Un complemento más" },
        { v: "importante", t: "Importante, pero sin excesos" },
        { v: "clave", t: "Clave para que el día sea perfecto" },
      ];
    } else {
      inv.title = "Para este tipo de evento buscas…";
      inv.desc = "Sin números: solo el enfoque.";
      inv.options = [
        { v: "sencillo", t: "Algo sencillo, sin complicaciones" },
        { v: "pro", t: "Una fiesta bien montada y sin riesgos" },
        { v: "premium", t: "Que todo funcione perfecto y yo no me preocupe de nada" },
      ];
    }
  }
  return qs;
}

// ---------- UI helpers ----------
function show(el){ el.classList.remove("hidden"); }
function hide(el){ el.classList.add("hidden"); }

function flash(msg) {
  const n = document.createElement("div");
  n.className = "toast";
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(()=> n.classList.add("toast--show"), 10);
  setTimeout(()=> {
    n.classList.remove("toast--show");
    setTimeout(()=> n.remove(), 250);
  }, 2200);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// ---------- Flow ----------
function resetAll() {
  state.step = 0;
  state.answers = {};
  state.report = null;
  render();
  show(hero); hide(quiz); hide(results);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

restartLink.addEventListener("click", (e)=>{ e.preventDefault(); resetAll(); });

startBtn.addEventListener("click", () => {
  hide(hero); show(quiz); hide(results);
  state.step = 0;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

backBtn.addEventListener("click", () => {
  if (state.step > 0) state.step -= 1;
  render();
});

nextBtn.addEventListener("click", () => {
  const qs = questionsForCurrentState();
  const q = qs[state.step];
  if (!validateCurrent(q)) return;

  if (state.step < qs.length - 1) {
    state.step += 1;
    render();
  } else {
    state.report = buildReport(state.answers);
    renderResults(state.report);
    hide(hero); hide(quiz); show(results);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

function validateCurrent(q) {
  const val = state.answers[q.id];
  if (q.type === "text") return true;

  if (q.type === "radio") {
    if (!val) { flash("Selecciona una opción para continuar."); return false; }
    return true;
  }

  if (q.type === "multi") {
    const arr = Array.isArray(val) ? val : [];
    if (arr.length === 0) { flash("Selecciona al menos una opción."); return false; }
    return true;
  }
  return true;
}

function render() {
  const qs = questionsForCurrentState();
  stepTotal.textContent = String(qs.length);
  stepTxt.textContent = String(state.step + 1);
  const denom = Math.max(1, (qs.length - 1));
  progressFill.style.width = `${(state.step / denom) * 100}%`;

  const q = qs[state.step];
  renderQuestion(q);

  backBtn.disabled = state.step === 0;
  nextBtn.textContent = state.step === qs.length - 1 ? "Ver mi diagnóstico" : "Continuar";
}

function renderQuestion(q) {
  qbox.innerHTML = "";

  const h = document.createElement("div");
  h.className = "qtitle";
  h.innerHTML = `<h3>${escapeHtml(q.title)}</h3>` + (q.desc ? `<p class="muted">${escapeHtml(q.desc)}</p>` : "");
  qbox.appendChild(h);

  if (q.type === "radio") return renderRadio(q);
  if (q.type === "multi") return renderMulti(q);
  if (q.type === "text") return renderText(q);
}

function renderRadio(q) {
  const group = document.createElement("div");
  group.className = "options";

  const selected = state.answers[q.id];

  q.options.forEach(opt => {
    const item = document.createElement("label");
    item.className = "opt";
    item.dataset.selected = String(selected === opt.v);

    const left = document.createElement("div");
    left.className = "opt__left";
    left.innerHTML = `<div class="opt__t">${escapeHtml(opt.t)}</div>` + (opt.s ? `<div class="opt__s">${escapeHtml(opt.s)}</div>` : "");

    const check = document.createElement("div");
    check.className = "opt__check";
    check.textContent = "✓";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = q.id;
    input.value = opt.v;
    input.checked = selected === opt.v;
    input.addEventListener("change", () => {
      state.answers[q.id] = opt.v;
      // re-render to highlight selection
      render();
    });

    item.appendChild(left);
    item.appendChild(check);
    item.appendChild(input);
    group.appendChild(item);
  });

  qbox.appendChild(group);
}

function renderMulti(q) {
  const group = document.createElement("div");
  group.className = "options";

  const selected = Array.isArray(state.answers[q.id]) ? state.answers[q.id] : [];

  q.options.forEach(opt => {
    const item = document.createElement("label");
    item.className = "opt";
    item.dataset.selected = String(selected.includes(opt.v));

    const left = document.createElement("div");
    left.className = "opt__left";
    left.innerHTML = `<div class="opt__t">${escapeHtml(opt.t)}</div>`;

    const check = document.createElement("div");
    check.className = "opt__check";
    check.textContent = "✓";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = q.id;
    input.value = opt.v;
    input.checked = selected.includes(opt.v);

    input.addEventListener("change", () => {
      let arr = Array.isArray(state.answers[q.id]) ? [...state.answers[q.id]] : [];

      if (input.checked) {
        // Special: "nada" should be exclusive
        if (opt.v === "nada") {
          arr = ["nada"];
        } else {
          arr = arr.filter(x => x !== "nada");
          if (!arr.includes(opt.v)) arr.push(opt.v);
        }
      } else {
        arr = arr.filter(x => x !== opt.v);
      }

      // Enforce max (unless 'nada')
      if (arr[0] !== "nada" && arr.length > q.max) {
        arr = arr.slice(0, q.max);
        flash(`Máximo ${q.max} opciones.`);
      }

      state.answers[q.id] = arr;
      render();
    });

    item.appendChild(left);
    item.appendChild(check);
    item.appendChild(input);
    group.appendChild(item);
  });

  qbox.appendChild(group);
}

function renderText(q) {
  const wrap = document.createElement("div");
  wrap.className = "options";

  const ta = document.createElement("input");
  ta.type = "text";
  ta.placeholder = q.placeholder || "";
  ta.value = state.answers[q.id] || "";
  ta.addEventListener("input", () => {
    state.answers[q.id] = ta.value;
  });

  const label = document.createElement("label");
  label.className = "opt";
  label.style.cursor = "text";
  label.style.display = "block";
  label.appendChild(ta);

  wrap.appendChild(label);
  qbox.appendChild(wrap);
}

// ---------- Scoring & report ----------
function buildReport(a) {
  const eventType = a.eventType || "otro";

  // Lead-quality score: 0..100
  // Higher score = better fit for DJ profesional (no necesariamente "más riesgo")
  let score = 50;

  // Music importance
  score += ({ detalle: -10, importante: 0, clave: 10, top: 15 }[a.musicImportance] ?? 0);

  // Expectation of DJ
  score += ({ basico: -10, animar: 5, ambiente: 10, seguro: 15 }[a.expectation] ?? 0);

  // Guests (bigger = more need of professional)
  score += ({ "<30": -5, "30-60": 5, "60-100": 10, ">100": 12 }[a.guests] ?? 0);

  // Venue complexity
  score += ({ casa: -2, resto: 4, local: 6, hotel: 6, finca: 7, otro: 4 }[a.venue] ?? 0);

  // Timeline urgency (very urgent can lower score if availability risk)
  score += ({ "<1m": -3, "cerrada": 0, "1-3m": 4, ">3m": 6 }[a.timeline] ?? 0);

  // Worries: having worries indicates need (good), but too many can indicate high-risk expectations.
  const worries = Array.isArray(a.worries) ? a.worries : [];
  if (worries.includes("nada")) score -= 3;
  else score += Math.min(10, worries.length * 3);

  // Past bad party indicates sensitivity to quality (good fit)
  score += ({ si_incomodo: 6, si_salvo: 4, no_preocupa: 3, no: 0 }[a.badParty] ?? 0);

  // Investment filter (without mentioning €)
  // Cumple/privada/empresa: base minimum 350
  // Boda: base minimum 750
  let investmentFit = 0;
  if (eventType === "boda") {
    investmentFit = ({ complemento: -18, importante: 0, clave: 12 }[a.investment] ?? 0);
  } else {
    investmentFit = ({ sencillo: -15, pro: 6, premium: 12 }[a.investment] ?? 0);
  }
  score += investmentFit;

  score = clamp(Math.round(score), 0, 100);

  // Risk label is about "riesgo de que la pista flojee si no se cuida"
  // More guests + more worries + high importance => higher operational risk (needs pro protocol)
  let riskRaw = 40;
  riskRaw += ({ "<30": -8, "30-60": 4, "60-100": 10, ">100": 14 }[a.guests] ?? 0);
  riskRaw += worries.includes("nada") ? -8 : worries.length * 4;
  riskRaw += ({ detalle: -8, importante: 0, clave: 8, top: 12 }[a.musicImportance] ?? 0);
  riskRaw += ({ casa: 0, resto: 3, local: 4, hotel: 4, finca: 5, otro: 3 }[a.venue] ?? 0);
  const risk = clamp(Math.round(riskRaw), 0, 100);

  const riskLevel =
    risk >= 70 ? "ALTO" :
    risk >= 45 ? "MEDIO" : "BAJO";

  const { pack, protocol, title, subtitle } = recommendPack({ a, score, risk, riskLevel });

  return {
    createdAt: new Date().toISOString(),
    answers: a,
    score,
    risk,
    riskLevel,
    title,
    subtitle,
    pack,
    protocol
  };
}

function recommendPack({ a, score, risk, riskLevel }) {
  const eventType = a.eventType || "otro";

  const isWedding = eventType === "boda";
  const isCompany = eventType === "empresa";
  const isSmall = a.guests === "<30";
  const isLarge = a.guests === ">100" || a.guests === "60-100";

  // Pack naming strategy:
  // - Always premium positioning
  // - Mention "sin riesgos / seguro" to match brand
  let packName = "Pack Fiesta Segura";
  let packPrice = "Desde 350€ (3–4 horas)";
  let items = [
    "DJ profesional (lectura de pista)",
    "Equipo de sonido ajustado al aforo",
    "Plan de energía y contingencia",
    "Transiciones sin cortes (ritmo)",
  ];

  if (isWedding) {
    packName = score >= 75 ? "Pack Boda Sin Riesgos" : "Pack Boda Esencial (bien ejecutada)";
    packPrice = "Desde 750€ (ceremonia + 4 horas de fiesta)";
    items = [
      "Música ceremonia + microfonía",
      "Coordinación de momentos clave (entrada, corte, etc.)",
      "DJ + sonido de pista (ritmo y lectura)",
      "Plan B técnico (cables / backups)",
    ];
  } else if (isCompany) {
    packName = score >= 75 ? "Pack Empresa Premium" : "Pack Empresa Pro";
    packPrice = "Desde 350€ (3–4 horas)";
    items = [
      "Ambiente elegante → fiesta (transición controlada)",
      "Volumen adaptado al local y normativa",
      "DJ con lectura de público mixto",
      "Equipo de sonido según aforo",
    ];
  } else {
    if (score >= 80) {
      packName = "Pack Fiesta Premium";
      items.unshift("Dinámica de pista (subidas/bajadas controladas)");
    } else if (isSmall) {
      packName = "Pack Fiesta Segura";
    }
  }

  // Add upgrades based on risk
  if (isLarge || riskLevel === "ALTO") {
    items.push("Refuerzo de sonido (según sala/aforo)");
    items.push("Chequeo previo de ubicación y puntos de corriente");
  }
  if (a.venue === "finca" || a.venue === "local") {
    items.push("Control de acústica / colocación de altavoces");
  }

  // Protocol always "pro"
  const protocol = [];
  protocol.push("Checklist previo: música, timing, puntos de corriente y normativa del local.");
  protocol.push("Backups: música offline + duplicado de control (cero sorpresas).");
  protocol.push("Lectura de pista: cambios por energía, edades y ‘momentos clave’.");
  if (a.worries?.includes?.("tecnico") || a.venue === "finca" || a.venue === "local") {
    protocol.push("Plan técnico: regletas, cableado y seguridad de alimentación.");
  }
  if (isWedding) {
    protocol.push("Ceremonia: prueba de micro + señales con oficiante/fotógrafo.");
  }
  if (a.worries?.includes?.("no_encaja")) {
    protocol.push("Filtro musical: bloque por edades + hits transversales (sin choques).");
  }
  if (a.worries?.includes?.("no_baila")) {
    protocol.push("Arranque de pista: 3–5 temas ‘rompehielo’ según perfil de invitados.");
  }

  // Title/subtitle
  const title = "Tu diagnóstico";
  const subtitle =
    riskLevel === "ALTO"
      ? "Con el montaje y control correctos, esto puede salir MUY bien. La clave es evitar improvisaciones."
      : riskLevel === "MEDIO"
      ? "Tienes buen margen para una gran fiesta, pero hay puntos importantes a cuidar."
      : "Buen perfil: con un DJ que lea la pista, lo normal es que salga redondo.";

  return {
    title,
    subtitle,
    pack: { name: packName, price: packPrice, items },
    protocol,
  };
}

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

// ---------- Render results ----------
function renderResults(r) {
  reportTitle.textContent = r.title;
  reportSubtitle.textContent = r.subtitle;

  scoreNum.textContent = String(r.score);

  const badgeText =
    r.riskLevel === "ALTO" ? "Riesgo ALTO" :
    r.riskLevel === "MEDIO" ? "Riesgo MEDIO" :
    "Riesgo BAJO";
  riskBadge.textContent = badgeText;

  // Persuasión por score (calidad del lead) + riesgo (necesidad de protocolo)
  let explain =
    r.score >= 85 ? "Perfil premium: aquí lo normal es que la pista se encienda si se diseña bien el ritmo." :
    r.score >= 70 ? "Muy buen perfil: con un DJ que lea la pista, el evento se vuelve memorable." :
    r.score >= 55 ? "Buen potencial: con 2–3 decisiones correctas, la fiesta sube de nivel." :
    "Hay señales de riesgo: conviene ajustar enfoque/montaje para evitar una fiesta fría.";

  const a = r.answers || {};
  const worries = Array.isArray(a.worries) ? a.worries : [];
  const hooks = [];
  if (worries.includes("no_baila")) hooks.push("Arranque de pista diseñado (rompehielo) para que no se quede nadie sentado.");
  if (worries.includes("no_encaja")) hooks.push("Bloques por edades + hits transversales para que TODOS sientan que ‘esa es su canción’.");
  if (worries.includes("tecnico")) hooks.push("Protocolo anti-fallo: backups, cableado y plan B técnico (cero sorpresas).");
  if (worries.includes("ambiente")) hooks.push("Control de energía: subidas/bajadas para que el ambiente crezca de forma natural.");
  if (worries.includes("nada")) hooks.push("Objetivo: mantener ese ‘todo bajo control’ y que se note profesional.");

  scoreExplain.textContent = explain;

  packName.textContent = r.pack.name;
  packPrice.textContent = r.pack.price;

  packList.innerHTML = "";
  r.pack.items.forEach(x => {
    const li = document.createElement("li");
    li.textContent = x;
    packList.appendChild(li);
  });

  protocolList.innerHTML = "";
  r.protocol.forEach(x => {
    const li = document.createElement("li");
    li.textContent = x;
    protocolList.appendChild(li);
  });

  // Caja persuasiva: beneficio + urgencia suave + enfoque en tranquilidad
  if (persuasionBox) {
    persuasionBox.innerHTML = "";
    const bullets = [];

    const eventLabel = {
      boda: "boda",
      cumple: "cumpleaños",
      empresa: "evento de empresa",
      privada: "fiesta privada",
      otro: "evento"
    }[a.eventType] || "evento";

    bullets.push(`Tu ${eventLabel} tiene un riesgo ${r.riskLevel === "ALTO" ? "alto" : r.riskLevel === "MEDIO" ? "medio" : "bajo"} de que la pista flojee si se improvisa. Con el pack recomendado lo reduces al mínimo.`);
    bullets.push("Resultado real: menos estrés para ti y más ‘momentos’ que la gente recuerda (entrada, subidón, cierre).");
    if (hooks.length) bullets.push(...hooks.slice(0, 2));
    if ((a.timeline || "") === "<1m") bullets.push("Si es en menos de 1 mes, conviene reservar cuanto antes para asegurar disponibilidad.");
    if ((a.timeline || "") === "cerrada") bullets.push("Como ya tienes fecha cerrada, lo ideal es cerrar el montaje para que el local y el timing no te den sorpresas.");

    // CTA copy adaptativo
    const cta =
      r.score >= 80 ? "Quiero cerrar fecha y asegurar la fiesta" :
      r.score >= 60 ? "Quiero una propuesta rápida para mi evento" :
      "Quiero que revises mi caso y evitar errores";
    ctaBtn.textContent = cta;

    bullets.forEach(b => {
      const li = document.createElement("li");
      li.textContent = b;
      persuasionBox.appendChild(li);
    });
  }
}


async function generatePdf(report) {
  // Requires jsPDF loaded from CDN (window.jspdf)
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) throw new Error("jsPDF not loaded");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Load logo as dataURL

  const logoDataUrl = await loadImageAsDataUrl("assets/logo.png");


  // --- Premium mini cover ---
  // Background
  doc.setFillColor(3, 6, 25);
  doc.rect(0, 0, w, h, "F");

  // Accent glow blocks
  doc.setFillColor(139, 92, 246);
  doc.rect(0, 0, w, 140, "F");
  doc.setFillColor(236, 72, 153);
  doc.rect(w * 0.55, 0, w * 0.45, 140, "F");
  doc.setFillColor(15, 22, 51);
  doc.roundedRect(42, 190, w - 84, 260, 22, 22, "F");

  // Logo + Brand
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 42, 40, 54, 54);
  }
  doc.setTextColor(248, 250, 252);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("DJPONTE.com", 108, 70);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Diagnóstico de Fiesta", 108, 94);

  // Big score
  const eventLabel = {
    boda: "Boda",
    cumple: "Cumpleaños",
    empresa: "Empresa",
    privada: "Fiesta privada",
    otro: "Evento"
  }[(report.answers || {}).eventType] || "Evento";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(eventLabel, 64, 230);

  doc.setFontSize(72);
  doc.text(String(report.score ?? "--"), 64, 320);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("FiestaScore (0–100)", 64, 345);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Tu DJ no es música.", 64, 392);
  doc.setFont("helvetica", "normal");
  doc.text("Es el seguro de que la fiesta funcione.", 64, 416);

  // CTA line
  doc.setFontSize(11);
  doc.setTextColor(200, 210, 230);
  doc.text("Siguiente paso: abre WhatsApp y cierra fecha.", 64, 472);

  // Footer tiny
  doc.setTextColor(160, 170, 190);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date(report.createdAt || Date.now()).toLocaleString()}`, 42, h - 30);

  // New page for report content
  doc.addPage();
  // Brand header
  const margin = 42;
  const headerH = 86;

  // Background header gradient-ish blocks (simple)
  doc.setFillColor(15, 22, 51); // deep
  doc.rect(0, 0, w, headerH, "F");
  doc.setFillColor(139, 92, 246); // accent
  doc.rect(0, headerH - 6, w * 0.55, 6, "F");
  doc.setFillColor(236, 72, 153); // accent2
  doc.rect(w * 0.55, headerH - 6, w * 0.45, 6, "F");

  // Logo
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", margin, 18, 42, 42);
  }

  // Titles
  doc.setTextColor(248, 250, 252);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Diagnóstico de Fiesta (FiestaScore)", margin + 56, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("DJ Ponte · Bodas · Cumpleaños · Empresa · Privados", margin + 56, 56);

  // Body start
  let y = headerH + 26;

  // Score block
  doc.setTextColor(15, 22, 51);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, w - margin*2, 86, 12, 12, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.text(String(report.score ?? "--"), margin + 18, y + 58);

  doc.setFontSize(12);
  doc.text("FiestaScore (0–100)", margin + 92, y + 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Nivel de riesgo: ${report.riskLevel || "—"} (${report.risk ?? "—"}/100)`, margin + 92, y + 52);

  // Persuasive line
  doc.setFontSize(11);
  doc.text(wrap(doc, report.subtitle || "Recomendación para que el evento salga redondo.", w - margin*2 - 20), margin + 92, y + 70);

  y += 106;

  // What it means (persuasion bullets)
  const a = report.answers || {};
  const bullets = buildPersuasionBullets(report);

  y = sectionTitle(doc, "Lo que esto significa para tu evento", margin, y, w);
  y = bulletList(doc, bullets, margin, y, w);

  // Pack
  y += 6;
  y = sectionTitle(doc, "Pack recomendado", margin, y, w);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(report.pack?.name || "—", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(report.pack?.price || "—", margin, y);
  y += 14;

  const packItems = (report.pack?.items || []).slice(0, 7);
  y = bulletList(doc, packItems, margin, y, w);

  // Protocol
  y += 6;
  y = sectionTitle(doc, "Protocolo de seguridad (cero sorpresas)", margin, y, w);
  const protocol = (report.protocol || []).slice(0, 8);
  y = bulletList(doc, protocol, margin, y, w);

  // CTA box
  y += 10;
  if (y > h - 120) { doc.addPage(); y = 60; }
  doc.setFillColor(15, 22, 51);
  doc.roundedRect(margin, y, w - margin*2, 78, 14, 14, "F");
  doc.setTextColor(248, 250, 252);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Siguiente paso (rápido): cerrar fecha y asegurar la fiesta", margin + 14, y + 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Escríbeme por WhatsApp con este informe y te paso propuesta en minutos.", margin + 14, y + 50);

  const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(buildWhatsappMessage(report))}`;
  doc.setTextColor(139, 92, 246);
  doc.setFont("helvetica", "bold");
  doc.textWithLink("Abrir WhatsApp", margin + 14, y + 68, { url: waUrl });

  // Footer
  doc.setTextColor(120, 130, 150);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date(report.createdAt || Date.now()).toLocaleString()}`, margin, h - 26);
  doc.text(CONFIG.brandUrl, w - margin, h - 26, { align: "right" });

  const fileName = `Informe-DJPonte-FiestaScore-${report.score ?? "X"}.pdf`;
  doc.save(fileName);
}

function wrap(doc, text, maxWidth) {
  return doc.splitTextToSize(String(text || ""), maxWidth);
}

function sectionTitle(doc, title, margin, y, w) {
  if (y > doc.internal.pageSize.getHeight() - 90) { doc.addPage(); y = 60; }
  doc.setTextColor(15, 22, 51);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, margin, y);
  doc.setDrawColor(220, 225, 235);
  doc.setLineWidth(1);
  doc.line(margin, y + 6, w - margin, y + 6);
  return y + 20;
}

function bulletList(doc, items, margin, y, w) {
  const maxWidth = w - margin*2 - 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(15, 22, 51);

  for (const it of items) {
    const lines = wrap(doc, it, maxWidth);
    // Page break
    if (y > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 60; }
    doc.text("•", margin, y);
    doc.text(lines, margin + 14, y);
    y += 14 * lines.length + 4;
  }
  return y;
}

function buildPersuasionBullets(report) {
  const a = report.answers || {};
  const worries = Array.isArray(a.worries) ? a.worries : [];
  const eventLabel = { boda:"boda", cumple:"cumpleaños", empresa:"evento de empresa", privada:"fiesta privada", otro:"evento" }[a.eventType] || "evento";

  const b = [];
  b.push(`Tu ${eventLabel}: el objetivo es que la gente recuerde ‘la fiesta’ y no solo ‘el evento’.`);
  b.push(`Con el montaje correcto reduces el riesgo real de pista floja y evitas improvisaciones.`);

  if (worries.includes("no_baila")) b.push("Arranque de pista rompehielo + progresión de energía para llenar pista pronto.");
  if (worries.includes("no_encaja")) b.push("Bloques por edades + hits transversales: todos se sienten incluidos.");
  if (worries.includes("tecnico")) b.push("Protocolo anti-fallo (backups y plan B técnico) para cero sorpresas.");
  if (worries.includes("ambiente")) b.push("Gestión del ambiente: subidas/bajadas para mantener a la gente dentro.");
  if (worries.includes("nada")) b.push("Perfecto: el foco es que se note profesional y fluido de principio a fin.");

  if ((a.timeline || "") === "<1m") b.push("Si es en <1 mes: cuanto antes se cierre fecha, mejor (disponibilidad).");

  // Social proof-style without making factual claims
  if (report.score >= 80) b.push("Este perfil suele convertir eventos ‘bien’ en eventos ‘inolvidables’ cuando se ejecuta con lectura de pista.");
  return b.slice(0, 7);
}

async function loadImageAsDataUrl(url) {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ---------- Lead form ----------
downloadJsonBtn.addEventListener("click", async () => {
  if (!state.report) return;
  try {
    await generatePdf(state.report);
  } catch (e) {
    flash("No se pudo generar el PDF. Prueba en HTTPS (GitHub Pages) o revisa que el CDN no esté bloqueado.");
  }
});

leadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.report) return;

  const fd = new FormData(leadForm);
  const payload = {
    lead: {
      name: (fd.get("name") || "").toString().trim(),
      email: (fd.get("email") || "").toString().trim(),
      whatsapp: (fd.get("whatsapp") || "").toString().trim(),
      zone: (fd.get("zone") || "").toString().trim(),
      consent: fd.get("consent") === "on",
    },
    report: state.report,
    source: {
      page: location.href,
      ref: document.referrer || "",
      userAgent: navigator.userAgent,
      ts: new Date().toISOString(),
    }
  };

  if (payload.lead.name === "" && payload.lead.email === "" && payload.lead.whatsapp === "") {
    flash("Si quieres que te contacte, deja al menos email o WhatsApp.");
    return;
  }
  if (!payload.lead.consent) {
    flash("Marca la casilla de consentimiento para que pueda contactarte.");
    return;
  }

  // Save locally (always)
  localStorage.setItem("djponte_lastLead", JSON.stringify(payload));

  if (!CONFIG.leadEndpoint || String(CONFIG.leadEndpoint).includes("PASTE_GOOGLE_APPS_SCRIPT_WEBAPP_URL_HERE")) {
    // Fallback mientras conectas Google Sheets: abre email con resumen
    const subject = "Lead - Diagnóstico DJ Ponte";
    const body = buildEmailBody(payload);
    const mailto = `mailto:djponteabailar@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
    formMsg.textContent = "Listo. Se abrió tu correo para enviar el lead (conecta Google Sheets para envío automático).";
    return;
  }

  formMsg.textContent = "Enviando…";
  try {
    const res = await fetch(CONFIG.leadEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Bad status");
    formMsg.textContent = "¡Enviado! Te contacto en cuanto lo vea.";
  } catch (err) {
    formMsg.textContent = "No se pudo enviar. Prueba de nuevo o usa el botón de WhatsApp.";
  }
});


function buildEmailBody(payload) {
  const r = payload.report || {};
  const a = (r.answers || {});
  const lead = payload.lead || {};
  const eventLabel = { boda:"Boda", cumple:"Cumpleaños", empresa:"Empresa", privada:"Fiesta privada", otro:"Evento" }[a.eventType] || "Evento";
  const worries = Array.isArray(a.worries) ? a.worries.join(", ") : (a.worries || "");
  return [
    "Nuevo lead (Diagnóstico DJ Ponte)",
    "------------------------------",
    `Nombre: ${lead.name || ""}`,
    `Email: ${lead.email || ""}`,
    `WhatsApp: ${lead.whatsapp || ""}`,
    `Zona: ${lead.zone || ""}`,
    `Consentimiento: ${lead.consent ? "Sí" : "No"}`,
    "",
    `Evento: ${eventLabel}`,
    `Invitados: ${a.guests || ""}`,
    `Lugar: ${a.venue || ""}`,
    `Cuándo: ${a.timeline || ""}`,
    `Importancia música: ${a.musicImportance || ""}`,
    `Preocupaciones: ${worries}`,
    `Experiencia previa: ${a.badParty || ""}`,
    `Expectativa DJ: ${a.expectation || ""}`,
    `Enfoque inversión: ${a.investment || ""}`,
    `Detalle: ${a.note || ""}`,
    "",
    `FiestaScore: ${r.score ?? ""}`,
    `Riesgo: ${r.riskLevel || ""} (${r.risk ?? ""}/100)`,
    `Pack: ${(r.pack && r.pack.name) ? r.pack.name : ""} — ${(r.pack && r.pack.price) ? r.pack.price : ""}`,
    "",
    `Página: ${(payload.source || {}).page || ""}`,
    `Referrer: ${(payload.source || {}).ref || ""}`
  ].join("\n");
}

// ---------- CTA & Share ----------
ctaBtn.addEventListener("click", () => {
  const msg = buildWhatsappMessage(state.report);
  const wa = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  window.open(wa, "_blank");
});

shareBtn.addEventListener("click", async () => {
  const url = location.href;
  const text = "Acabo de hacer mi diagnóstico de fiesta (FiestaScore).";
  try {
    if (navigator.share) {
      await navigator.share({ title: document.title, text, url });
    } else if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      flash("Enlace copiado.");
    } else {
      window.prompt("Copia este enlace:", url);
    }
  } catch {
    window.prompt("Copia este enlace:", url);
  }
});


function buildWhatsappMessage(report) {
  const r = report || {};
  const a = r.answers || {};
  const eventLabel = {
    boda: "Boda",
    cumple: "Cumpleaños",
    empresa: "Empresa",
    privada: "Fiesta privada",
    otro: "Evento",
  }[a.eventType] || "Evento";

  const guestsLabel = a.guests || "—";
  const whenLabel = a.timeline || "—";

  const note = (a.note || "").trim();
  const extra = note ? `\nDetalle: ${note}` : "";

  return `Hola DJ Ponte 👋\nHe hecho el Diagnóstico de Fiesta.\n\nEvento: ${eventLabel}\nInvitados: ${guestsLabel}\nFiestaScore: ${r.score ?? "—"}/100\nPack recomendado: ${r.pack?.name ?? "—"}\n${extra}\n\n¿Podemos hablar y asegurar que salga perfecto?`;
}

// Boot
render();
