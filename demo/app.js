"use strict";

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n, w = 2) => String(n).padStart(w, "0");
const hex = (bytes) => [...bytes].map((b) => pad(b.toString(16))).join("");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ddmm = (f) => `${f.slice(8)}/${f.slice(5, 7)}`;
const corto = (d) => d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
const fechaLarga = (f) => new Date(f + "T12:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
const euros = (n) => Number(n || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });

function toast(texto, tipo = "") {
  const t = document.createElement("div");
  t.className = `toast ${tipo}`;
  t.textContent = texto;
  $("#toasts").append(t);
  setTimeout(() => t.remove(), 4200);
}

/* ---------- datos inventados ---------- */
const personas = [
  { id: "t1", nombre: "Lucía Marín", corto: "Lucía M.", equipo: "Norte", tipo: "tecnico", doc: "DOC-1041" },
  { id: "t2", nombre: "Andrés Pardo", corto: "Andrés P.", equipo: "Norte", tipo: "tecnico", doc: "DOC-1042" },
  { id: "t5", nombre: "Pablo Soler", corto: "Pablo S.", equipo: "Norte", tipo: "tecnico", doc: "DOC-1045" },
  { id: "t3", nombre: "Nerea Gil", corto: "Nerea G.", equipo: "Sur", tipo: "tecnico", doc: "DOC-1043" },
  { id: "t4", nombre: "Óscar Ruiz", corto: "Óscar R.", equipo: "Sur", tipo: "tecnico", doc: "DOC-1044" },
  { id: "o1", nombre: "Ana Vidal", corto: "Ana V.", equipo: "Oficina", tipo: "oficina", doc: "DOC-1001" },
  { id: "o2", nombre: "Marta Leal", corto: "Marta L.", equipo: "Oficina", tipo: "oficina", doc: "DOC-1002" },
];
const persona = (id) => personas.find((p) => p.id === id);
const tecnicos = personas.filter((p) => p.tipo === "tecnico");

const clientes = [
  { nombre: "Ferretería Olmo", sedes: ["Almacén central", "Tienda centro"] },
  { nombre: "Clínica Sauce", sedes: ["Planta 2", "Urgencias"] },
  { nombre: "Hotel Ribera", sedes: ["Recepción", "Cocinas", "Spa"] },
  { nombre: "Bodegas Tejo", sedes: ["Nave B", "Oficinas"] },
  { nombre: "Academia Nogal", sedes: ["Aula 4", "Secretaría"] },
  { nombre: "Talleres Brezo", sedes: ["Taller", "Oficina"] },
];

const catalogo = [
  ["ordenes:crear", "Crear órdenes"],
  ["ordenes:editar", "Editar cualquier orden"],
  ["ordenes:resolver", "Resolver órdenes"],
  ["ordenes:cerrar", "Cerrar órdenes"],
  ["ordenes:cancelar", "Cancelar órdenes"],
  ["ordenes:rehacer", "Reabrir órdenes resueltas"],
  ["ordenes:enlace", "Enviar enlace de firma"],
  ["nominas:gestionar", "Gestionar nóminas"],
  ["roles:gestionar", "Gestionar roles"],
  ["auditoria:ver", "Ver auditoría"],
];
const roles = {
  admin: {
    nombre: "Administración", actor: "o1", alcanceTxt: "Todo",
    permisos: catalogo.map(([p]) => p),
    alcance: () => true,
  },
  super: {
    nombre: "Supervisión", actor: "o2", alcanceTxt: "Su equipo (Norte)",
    permisos: ["ordenes:crear", "ordenes:resolver", "ordenes:cerrar", "ordenes:rehacer", "ordenes:enlace", "auditoria:ver"],
    alcance: (o) => persona(o.tecnico).equipo === "Norte",
  },
  tec: {
    nombre: "Técnico", actor: "t1", alcanceTxt: "Lo suyo",
    permisos: ["ordenes:resolver", "ordenes:enlace"],
    alcance: (o) => o.tecnico === "t1",
  },
};

/* ---------- estado ---------- */
let rol = "admin";
let semana = 0;
let filtroEstado = "";
const r = () => roles[rol];
const actor = () => persona(r().actor);
const puede = (p) => r().permisos.includes(p);
const enAlcance = (o) => r().alcance(o);
const tecnicosEnAlcance = () => tecnicos.filter((t) => r().alcance({ tecnico: t.id }));

const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
const HOY = iso(hoy);
function diasSemana(offset) {
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7) + offset * 7);
  return [...Array(5)].map((_, i) => { const d = new Date(lunes); d.setDate(lunes.getDate() + i); return d; });
}

// generador determinista: la demo es igual en cada carga
let semilla = 11;
const rnd = (n) => (semilla = (semilla * 16807) % 2147483647) % n;

const ordenes = [];
let siguienteN = 2401;
function nuevaOrden(datos) {
  const o = { n: siguienteN++, estado: "abierta", desc: "", entrada: "", salida: "", gastos: 0, km: 0, firma: "", firmante: "", ...datos };
  ordenes.push(o);
  return o;
}
const trabajos = ["Revisión periódica", "Avería en climatización", "Sustitución de equipo", "Mantenimiento preventivo", "Incidencia de red"];
for (const off of [-1, 0, 1]) {
  for (const d of diasSemana(off)) {
    const cuantas = 2 + rnd(3);
    for (let i = 0; i < cuantas; i++) {
      const c = clientes[rnd(clientes.length)];
      const fecha = iso(d);
      const o = nuevaOrden({
        fecha,
        hora: `${pad(8 + rnd(9))}:${rnd(2) ? "30" : "00"}`,
        cliente: c.nombre,
        sede: c.sedes[rnd(c.sedes.length)],
        tecnico: tecnicos[rnd(tecnicos.length)].id,
        desc: trabajos[rnd(trabajos.length)],
      });
      if (fecha >= HOY) continue;
      o.estado = ["resuelta", "cerrada", "cerrada", "abierta"][rnd(4)];
      if (o.estado === "abierta") continue;
      const salida = `${pad(+o.hora.slice(0, 2) + 1 + rnd(2))}:${o.hora.slice(3)}`;
      Object.assign(o, { entrada: o.hora, salida, km: 5 + rnd(40), gastos: rnd(3) * 12.5, firmante: "Responsable de sede" });
    }
  }
}
const [, mie, jue, vie] = diasSemana(0);
const [lunSig, marSig] = diasSemana(1);
const vacaciones = [
  { tecnico: "t3", desde: iso(mie), hasta: iso(jue), estado: "aprobadas" },
  { tecnico: "t2", desde: iso(vie), hasta: iso(vie), estado: "en revisión" },
  { tecnico: "t5", desde: iso(lunSig), hasta: iso(marSig), estado: "aprobadas" },
];
// garantiza un conflicto visible esta semana
nuevaOrden({ fecha: iso(mie), hora: "10:00", cliente: "Hotel Ribera", sede: "Cocinas", tecnico: "t3", desc: "Avería en cámara frigorífica" });

const vacacionDe = (t, f) => vacaciones.find((v) => v.tecnico === t && v.desde <= f && f <= v.hasta);
const enConflicto = (o) => o.estado === "abierta" && !!vacacionDe(o.tecnico, o.fecha);
const visibles = () => ordenes.filter(enAlcance).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora) || a.n - b.n);
const conflictos = () => visibles().filter(enConflicto);

/* ---------- auditoría encadenada ---------- */
const auditoria = [];
let rotos = null; // resultado de la última verificación; null = sin verificar
async function hash(texto) {
  if (globalThis.crypto?.subtle) {
    return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto))));
  }
  // ponytail: sin contexto seguro (algunos navegadores con file://) se usa FNV-1a; vale para la demo, no para nada real
  let h = 0x811c9dc5;
  for (const c of texto) { h ^= c.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return pad(h.toString(16), 8).repeat(8);
}
const contenido = (e) => [e.prev, e.id, e.ts, e.actor, e.accion, e.detalle, e.ref ?? ""].join("|");
let cola = Promise.resolve();
function auditar(accion, detalle, ref = null, quien = actor().corto) {
  // escritura serializada, como el bloqueo consultivo del sistema real
  cola = cola.then(async () => {
    const prev = auditoria.at(-1)?.hash ?? "génesis";
    const e = { id: auditoria.length + 1, ts: new Date().toLocaleTimeString("es-ES"), actor: quien, accion, detalle, ref, prev };
    e.hash = await hash(contenido(e));
    auditoria.push(e);
    rotos = null; // una entrada nueva invalida la verificación anterior
  });
  return cola;
}

/* ---------- pestañas y perfil ---------- */
const pintores = {};
let pestana = "panel";
function irA(id) {
  pestana = id;
  for (const b of $$("[role=tab]")) {
    const activa = b.dataset.tab === id;
    b.setAttribute("aria-selected", activa);
    b.tabIndex = activa ? 0 : -1;
  }
  $$("main > section").forEach((s) => (s.hidden = s.id !== id));
  pintores[id]?.();
}
$$("[role=tab]").forEach((b, i, todos) => {
  b.id = `tab-${b.dataset.tab}`;
  b.setAttribute("aria-controls", b.dataset.tab);
  $(`#${b.dataset.tab}`).setAttribute("aria-labelledby", b.id);
  b.addEventListener("click", () => irA(b.dataset.tab));
  b.addEventListener("keydown", (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    const sig = todos[(i + d + todos.length) % todos.length];
    sig.focus(); irA(sig.dataset.tab);
  });
});
function repintar() {
  for (const b of $$("[data-accion=nueva]")) {
    b.disabled = !puede("ordenes:crear");
    b.title = b.disabled ? "Tu perfil no tiene el permiso ordenes:crear" : "";
  }
  pintores[pestana]?.();
}

$("#rol").innerHTML = Object.entries(roles).map(([k, x]) => `<option value="${k}">${persona(x.actor).nombre.split(" ")[0]} · ${x.nombre}</option>`).join("");
$("#rol").addEventListener("change", (e) => {
  rol = e.target.value;
  toast(`Ahora ves la plataforma como ${actor().nombre} (${r().nombre}).`);
  pintarSelectTec();
  repintar();
});
$("#tema").addEventListener("click", () => {
  const oscuro = matchMedia("(prefers-color-scheme: dark)").matches;
  const actual = document.documentElement.dataset.theme || (oscuro ? "dark" : "light");
  const nuevo = actual === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nuevo;
  try { localStorage.setItem("kintsugi-tema", nuevo); } catch { /* sin almacenamiento */ }
});
// cierre común de todos los diálogos: fondo o botón [data-cerrar]
for (const d of $$("dialog")) {
  d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-cerrar]")) d.close(); });
}

/* ---------- panel ---------- */
pintores.panel = () => {
  const h = new Date().getHours();
  const saludo = h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
  $("#saludo").textContent = `${saludo}, ${actor().nombre.split(" ")[0]}`;
  $("#saludoFecha").textContent = fechaLarga(HOY);
  const v = visibles();
  const semanaIso = diasSemana(0).map(iso);
  const cs = conflictos().length;
  $("#kpis").innerHTML = [
    [v.filter((o) => o.estado === "abierta").length, "Abiertas", ""],
    [v.filter((o) => o.estado === "resuelta").length, "Resueltas, por revisar", "olive"],
    [v.filter((o) => o.estado === "cerrada" && semanaIso.includes(o.fecha)).length, "Cerradas esta semana", "muted"],
    [cs, cs === 1 ? "Conflicto con vacaciones" : "Conflictos con vacaciones", cs ? "warn" : "muted"],
  ].map(([n, t, tono]) => `<div class="card kpi" data-tono="${tono}"><b>${n}</b><span>${t}</span></div>`).join("");

  // gráfico de barras en SVG; atributos, no estilos en línea, para respetar la CSP
  const dias = diasSemana(0);
  const cuenta = dias.map((d) => v.filter((o) => o.fecha === iso(d)).length);
  const max = Math.max(4, ...cuenta);
  const W = 500, H = 190, pie = 24, ancho = W / dias.length;
  let svg = [0.5, 1].map((p) => `<line class="grid-line" x1="0" x2="${W}" y1="${(H - pie) * (1 - p)}" y2="${(H - pie) * (1 - p)}"/>`).join("");
  dias.forEach((d, i) => {
    const alto = ((H - pie - 16) * cuenta[i]) / max;
    const x = i * ancho + ancho * 0.22, w = ancho * 0.56, y = H - pie - alto;
    svg += `<rect class="bar ${iso(d) === HOY ? "hoy" : ""}" x="${x}" y="${y}" width="${w}" height="${alto}" rx="6"/>`;
    svg += `<text x="${x + w / 2}" y="${y - 5}" text-anchor="middle">${cuenta[i]}</text>`;
    svg += `<text x="${x + w / 2}" y="${H - 6}" text-anchor="middle">${corto(d)}</text>`;
  });
  $("#chart").setAttribute("viewBox", `0 0 ${W} ${H}`);
  $("#chart").innerHTML = svg;

  const carga = tecnicosEnAlcance().map((t) => [t, v.filter((o) => o.tecnico === t.id && o.estado === "abierta" && semanaIso.includes(o.fecha)).length]);
  const maxC = Math.max(1, ...carga.map(([, n]) => n));
  $("#carga").innerHTML = carga.map(([t, n]) => `
    <div class="carga-row"><span>${esc(t.corto)}</span>
      <span class="track"><i data-w="${(n / maxC) * 100}"></i></span><span class="mono">${n}</span></div>`).join("")
    + `<p class="hint">Órdenes abiertas esta semana.</p>`;
  // leer offsetWidth fija el ancho 0 inicial, así la barra crece con la transición
  $$("#carga i").forEach((i) => { void i.offsetWidth; i.style.width = `${i.dataset.w}%`; });

  const prox = v.filter((o) => o.estado === "abierta" && o.fecha >= HOY).slice(0, 5);
  $("#proximas").innerHTML = prox.length
    ? `<table><tbody>${prox.map((o) => `
        <tr class="clic" data-n="${o.n}"><td class="mono">${ddmm(o.fecha)} ${o.hora}</td>
        <td>${esc(o.cliente)}<br><small class="muted">${esc(o.sede)} · ${esc(persona(o.tecnico).corto)}</small></td></tr>`).join("")}</tbody></table>`
    : `<p class="vacio">Nada pendiente en tu alcance.</p>`;

  $("#feed").innerHTML = auditoria.slice(-6).reverse().map((e) => `<li><span><strong>${esc(e.actor)}</strong> ${esc(e.accion)}</span><time>${e.ts}</time></li>`).join("");
};
$("#proximas").addEventListener("click", (e) => { const tr = e.target.closest("[data-n]"); if (tr) abrirOrden(+tr.dataset.n); });

/* ---------- órdenes ---------- */
const estados = [["", "Todas"], ["abierta", "Abiertas"], ["resuelta", "Resueltas"], ["cerrada", "Cerradas"], ["cancelada", "Canceladas"]];
$("#fEstado").innerHTML = estados.map(([v, t]) => `<button data-e="${v}" aria-pressed="${v === filtroEstado}">${t}</button>`).join("");
$("#fEstado").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  filtroEstado = b.dataset.e;
  $$("#fEstado button").forEach((x) => x.setAttribute("aria-pressed", x === b));
  pintores.ordenes();
});
function pintarSelectTec() {
  $("#fTec").innerHTML = `<option value="">Todo el equipo visible</option>` + tecnicosEnAlcance().map((t) => `<option value="${t.id}">${esc(t.nombre)}</option>`).join("");
}
["#q", "#fTec"].forEach((s) => $(s).addEventListener("input", () => pintores.ordenes()));

pintores.ordenes = () => {
  const q = $("#q").value.trim().toLowerCase(), t = $("#fTec").value;
  const vis = visibles();
  const filas = vis.filter((o) => (!filtroEstado || o.estado === filtroEstado) && (!t || o.tecnico === t)
    && (!q || `${o.n} ${o.cliente} ${o.sede}`.toLowerCase().includes(q)));
  $("#tabla").innerHTML = filas.length
    ? filas.map((o) => `
      <tr class="clic" data-n="${o.n}" tabindex="0">
        <td class="mono">#${o.n}</td><td class="mono">${ddmm(o.fecha)} ${o.hora}</td>
        <td>${esc(o.cliente)}</td><td>${esc(o.sede)}</td>
        <td>${esc(persona(o.tecnico).corto)}${enConflicto(o) ? ` <span class="estado e-vacaciones" title="De vacaciones ese día">vacaciones</span>` : ""}</td>
        <td><span class="estado e-${o.estado}">${o.estado}</span></td>
      </tr>`).join("")
    : `<tr><td colspan="6" class="vacio">Sin resultados en tu alcance.</td></tr>`;
  $("#cuenta").textContent = `${filas.length} de ${vis.length} órdenes visibles para tu perfil (${ordenes.length} en total en el sistema).`;
};
$("#tabla").addEventListener("click", (e) => { const tr = e.target.closest("tr[data-n]"); if (tr) abrirOrden(+tr.dataset.n); });
$("#tabla").addEventListener("keydown", (e) => { const tr = e.target.closest("tr[data-n]"); if (tr && e.key === "Enter") abrirOrden(+tr.dataset.n); });

// cada transición dice su permiso y qué hace: o cambia de estado, o abre otra acción
const transiciones = {
  abierta: [
    { perm: "ordenes:resolver", txt: "Resolver", primario: true, accion: (o) => formResolver(o) },
    { perm: "ordenes:enlace", txt: "Enviar enlace de firma", accion: enviarEnlace },
    { perm: "ordenes:cancelar", txt: "Cancelar", destino: "cancelada", verbo: "canceló" },
  ],
  resuelta: [
    { perm: "ordenes:cerrar", txt: "Cerrar", destino: "cerrada", verbo: "cerró", primario: true },
    { perm: "ordenes:rehacer", txt: "Reabrir", destino: "abierta", verbo: "reabrió" },
  ],
  cerrada: [],
  cancelada: [],
};
const motivoBloqueo = (perm, o) => (!puede(perm) ? `Tu perfil no tiene el permiso ${perm}` : !enAlcance(o) ? "La orden está fuera de tu alcance" : "");

async function enviarEnlace(o) {
  await auditar("envió el enlace de firma", "caduca en 72 h", o.n);
  toast(`Enlace de firma de la orden #${o.n} enviado. Caduca en 72 horas.`);
  abrirOrden(o.n);
}
async function transicionar(o, t) {
  const antes = o.estado;
  o.estado = t.destino;
  await auditar(`${t.verbo} la orden #${o.n}`, `${antes} → ${o.estado}`, o.n);
  toast(`Orden #${o.n}: ${antes} → ${o.estado}`);
  $("#dlgOrden").close();
  repintar();
}

function abrirOrden(n) {
  const o = ordenes.find((x) => x.n === n);
  const dlg = $("#dlgOrden");
  const historial = auditoria.filter((e) => e.ref === n).reverse();
  const ts = transiciones[o.estado];
  const acciones = ts.map((t, i) => {
    const m = motivoBloqueo(t.perm, o);
    return `<button class="btn ${t.primario && !m ? "primary" : ""}" data-t="${i}" ${m ? `disabled title="${esc(m)}"` : ""}>${t.txt}</button>`;
  }).join("");
  const conParte = o.estado === "resuelta" || o.estado === "cerrada";
  const tec = persona(o.tecnico);
  dlg.innerHTML = `
    <div class="dlg-head"><h2 id="dlgOrdenTit">Orden #${o.n}</h2><span class="estado e-${o.estado}">${o.estado}</span></div>
    <div class="dlg-body">
      ${enConflicto(o) ? `<div class="alerta">${esc(tec.nombre)} está de vacaciones ese día. Reasígnala o cancélala.</div>` : ""}
      <dl class="ficha">
        <dt>Cliente</dt><dd>${esc(o.cliente)} · ${esc(o.sede)}</dd>
        <dt>Cuándo</dt><dd>${fechaLarga(o.fecha)}, ${o.hora}</dd>
        <dt>Técnico</dt><dd>${esc(tec.nombre)} <span class="muted">(${tec.equipo})</span></dd>
        <dt>Trabajo</dt><dd>${esc(o.desc) || `<span class="muted">Sin descripción</span>`}</dd>
        ${conParte ? `<dt>Horario</dt><dd class="mono">${o.entrada} a ${o.salida}</dd><dt>Gastos</dt><dd>${euros(o.gastos)} · ${o.km} km</dd>` : ""}
      </dl>
      <h2>Historial</h2>
      ${historial.length
        ? `<ol class="timeline">${historial.map((e) => `<li>${esc(e.accion)}<small>${esc(e.actor)} · ${e.ts} · ${esc(e.detalle)}</small></li>`).join("")}</ol>`
        : `<p class="hint">Sin movimientos en esta sesión. Cada acción que hagas aparecerá aquí y en la auditoría.</p>`}
      <p class="hint">Los botones desactivados explican por qué al pasar el ratón. El servidor real hace la misma comprobación y respondería 403.</p>
    </div>
    <div class="dlg-foot">
      <button class="btn ghost" data-cerrar>Cerrar ventana</button>
      ${conParte ? `<button class="btn" data-parte>Ver parte</button>` : ""}
      ${acciones}
    </div>`;
  dlg.onclick = (e) => {
    if (e.target.closest("[data-parte]")) return verParte(o);
    const b = e.target.closest("button[data-t]");
    if (!b || b.disabled) return;
    b.disabled = true; // evita el doble clic mientras se audita
    const t = ts[+b.dataset.t];
    t.accion ? t.accion(o) : transicionar(o, t);
  };
  if (!dlg.open) dlg.showModal();
}

function formResolver(o) {
  const dlg = $("#dlgOrden");
  dlg.innerHTML = `
    <form id="fResolver">
      <div class="dlg-head"><h2 id="dlgOrdenTit">Resolver #${o.n}</h2><span class="muted">${esc(o.cliente)}</span></div>
      <div class="dlg-body form">
        <label class="field">Entrada<input type="time" name="entrada" value="${o.hora}" required></label>
        <label class="field">Salida<input type="time" name="salida" required></label>
        <label class="field">Gastos (€)<input type="number" name="gastos" min="0" step="0.01" value="0"></label>
        <label class="field">Kilómetros<input type="number" name="km" min="0" step="1" value="0"></label>
        <label class="field full">Qué se hizo<textarea name="desc" rows="3" required>${esc(o.desc)}</textarea></label>
        <div class="field full">Firma del cliente <canvas class="firma" id="firma" aria-label="Zona de firma"></canvas>
          <button type="button" class="btn sm ghost" id="borrarFirma">Borrar firma</button></div>
        <label class="field full">Nombre de quien firma<input name="firmante" required autocomplete="off"></label>
        <p class="hint full" id="errResolver" role="alert"></p>
      </div>
      <div class="dlg-foot"><button type="button" class="btn ghost" data-volver>Volver</button><button class="btn primary">Guardar y resolver</button></div>
    </form>`;
  const firma = prepararFirma($("#firma"));
  $("#borrarFirma").onclick = firma.borrar;
  dlg.onclick = (e) => { if (e.target.closest("[data-volver]")) abrirOrden(o.n); };
  $("#fResolver").onsubmit = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const err = f.salida <= f.entrada ? "La salida tiene que ser posterior a la entrada."
      : !f.desc.trim() ? "Describe qué se hizo."
      : !firma.hayTrazo() ? "Falta la firma del cliente."
      : !f.firmante.trim() ? "Falta el nombre de quien firma." : "";
    if (err) { $("#errResolver").textContent = err; return; }
    e.submitter.disabled = true;
    Object.assign(o, {
      entrada: f.entrada, salida: f.salida, gastos: +f.gastos, km: +f.km,
      desc: f.desc.trim(), firmante: f.firmante.trim(), firma: firma.png(), estado: "resuelta",
    });
    await auditar(`resolvió la orden #${o.n}`, `abierta → resuelta · firma de ${o.firmante}`, o.n);
    toast(`Orden #${o.n} resuelta. El parte ya está disponible.`);
    repintar();
    abrirOrden(o.n);
  };
}

function prepararFirma(canvas) {
  const ctx = canvas.getContext("2d");
  let dibujando = false, trazos = 0;
  const ajustar = () => {
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width * devicePixelRatio; canvas.height = r.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.strokeStyle = "#2b2620";
    trazos = 0; // redimensionar borra el lienzo: se vuelve a firmar
  };
  ajustar();
  new ResizeObserver(ajustar).observe(canvas);
  const punto = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  canvas.onpointerdown = (e) => { dibujando = true; canvas.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(...punto(e)); };
  canvas.onpointermove = (e) => { if (!dibujando) return; ctx.lineTo(...punto(e)); ctx.stroke(); trazos++; };
  canvas.onpointerup = canvas.onpointercancel = () => (dibujando = false);
  return {
    hayTrazo: () => trazos > 3,
    borrar: () => { ctx.clearRect(0, 0, canvas.width, canvas.height); trazos = 0; },
    png: () => canvas.toDataURL("image/png"),
  };
}

function verParte(o) {
  const dlg = $("#dlgParte");
  const tec = persona(o.tecnico).nombre;
  dlg.innerHTML = `
    <div class="dlg-head"><h2 id="dlgParteTit">Parte de trabajo #${o.n}</h2></div>
    <div class="dlg-body"><div class="parte">
      <h3>Parte de trabajo nº ${o.n}</h3><small>Generado ${new Date().toLocaleString("es-ES")}</small>
      <table><tbody>
        <tr><th>Cliente</th><td>${esc(o.cliente)}</td><th>Sede</th><td>${esc(o.sede)}</td></tr>
        <tr><th>Fecha</th><td>${ddmm(o.fecha)}/${o.fecha.slice(0, 4)}</td><th>Técnico</th><td>${esc(tec)}</td></tr>
        <tr><th>Entrada</th><td>${o.entrada}</td><th>Salida</th><td>${o.salida}</td></tr>
        <tr><th>Desplazamiento</th><td>${o.km} km</td><th>Gastos</th><td>${euros(o.gastos)}</td></tr>
        <tr><th>Trabajo</th><td colspan="3">${esc(o.desc)}</td></tr>
      </tbody></table>
      <div class="firmas">
        <div>${o.firma ? `<img src="${o.firma}" alt="Firma del cliente">` : ""}Firma del cliente: ${esc(o.firmante) || "sin nombre"}</div>
        <div>Técnico: ${esc(tec)}</div>
      </div>
    </div></div>
    <div class="dlg-foot"><button class="btn ghost" data-cerrar>Cerrar</button><button class="btn primary" data-imprimir>Imprimir o guardar PDF</button></div>`;
  dlg.onclick = (e) => { if (e.target.closest("[data-imprimir]")) print(); };
  dlg.showModal();
}

/* ---------- nueva orden ---------- */
const MAX_LOTE = 31;
function nuevaOrdenDlg() {
  if (!puede("ordenes:crear")) return toast("Tu perfil no puede crear órdenes.", "warn");
  const dlg = $("#dlgNueva");
  const manana = new Date(hoy); manana.setDate(hoy.getDate() + 1);
  let modo = "una";
  dlg.innerHTML = `
    <form id="fNueva">
      <div class="dlg-head"><h2 id="dlgNuevaTit">Nueva orden</h2></div>
      <div class="dlg-body">
        <div class="seg" role="group" aria-label="Modo">
          <button type="button" data-modo="una" aria-pressed="true">Una orden</button>
          <button type="button" data-modo="rango" aria-pressed="false">Una por día laborable</button>
        </div>
        <div class="form">
          <label class="field">Cliente<select name="cliente">${clientes.map((c) => `<option>${esc(c.nombre)}</option>`).join("")}</select></label>
          <label class="field">Sede<select name="sede"></select></label>
          <label class="field">Técnico<select name="tecnico">${tecnicosEnAlcance().map((t) => `<option value="${t.id}">${esc(t.nombre)}</option>`).join("")}</select></label>
          <label class="field">Hora<input type="time" name="hora" value="09:00" required></label>
          <label class="field" data-solo="una">Fecha<input type="date" name="fecha" value="${iso(manana)}" required></label>
          <label class="field" data-solo="rango" hidden>Desde<input type="date" name="desde" value="${iso(manana)}" disabled required></label>
          <label class="field" data-solo="rango" hidden>Hasta<input type="date" name="hasta" disabled required></label>
          <label class="field full">Trabajo<input name="desc" placeholder="Ej. revisión trimestral de climatización" required></label>
          <p class="hint full" id="errNueva" role="alert"></p>
        </div>
      </div>
      <div class="dlg-foot"><button type="button" class="btn ghost" data-cerrar>Cancelar</button><button class="btn primary">Crear</button></div>
    </form>`;
  const f = $("#fNueva");
  const sedes = () => {
    const c = clientes.find((x) => x.nombre === f.cliente.value);
    f.sede.innerHTML = c.sedes.map((s) => `<option>${esc(s)}</option>`).join("");
  };
  sedes();
  f.cliente.onchange = sedes;
  dlg.onclick = (e) => {
    const m = e.target.closest("[data-modo]");
    if (!m) return;
    modo = m.dataset.modo;
    $$("[data-modo]", dlg).forEach((b) => b.setAttribute("aria-pressed", b === m));
    // los campos ocultos se desactivan para que su "required" no bloquee el envío
    for (const el of $$("[data-solo]", dlg)) {
      el.hidden = el.dataset.solo !== modo;
      $("input", el).disabled = el.hidden;
    }
  };
  const error = (t) => { $("#errNueva").textContent = t; };
  f.onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    if (!d.desc.trim()) return error("Describe el trabajo.");
    let fechas = [d.fecha];
    if (modo === "rango") {
      if (d.hasta < d.desde) return error("La fecha final no puede ser anterior a la inicial.");
      fechas = [];
      for (let x = new Date(d.desde + "T12:00"); iso(x) <= d.hasta && fechas.length <= MAX_LOTE; x.setDate(x.getDate() + 1)) {
        if (x.getDay() % 6) fechas.push(iso(x)); // 0 domingo y 6 sábado quedan fuera
      }
      if (fechas.length > MAX_LOTE) return error(`Máximo ${MAX_LOTE} órdenes por lote en la demo.`);
      if (!fechas.length) return error("El rango no tiene días laborables.");
    }
    e.submitter.disabled = true;
    const creadas = fechas.map((fecha) => nuevaOrden({ fecha, hora: d.hora, cliente: d.cliente, sede: d.sede, tecnico: d.tecnico, desc: d.desc.trim() }));
    for (const o of creadas) await auditar(`creó la orden #${o.n}`, `${o.cliente}, ${o.fecha}`, o.n);
    const choques = creadas.filter(enConflicto);
    toast(creadas.length === 1 ? `Orden #${creadas[0].n} creada.` : `${creadas.length} órdenes creadas.`);
    if (choques.length) toast(`Aviso: ${persona(d.tecnico).nombre} está de vacaciones en ${choques.length} de esas fechas.`, "warn");
    dlg.close(); repintar();
  };
  dlg.showModal();
  f.desc.focus();
}
$$("[data-accion=nueva]").forEach((b) => b.addEventListener("click", nuevaOrdenDlg));

/* ---------- calendario ---------- */
$("#semAnt").onclick = () => { semana--; pintores.calendario(); };
$("#semSig").onclick = () => { semana++; pintores.calendario(); };
$("#semHoy").onclick = () => { semana = 0; pintores.calendario(); };
pintores.calendario = () => {
  const dias = diasSemana(semana);
  const diaMes = (d) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  $("#semTxt").textContent = `${diaMes(dias[0])} a ${diaMes(dias[4])}`;
  $("#avisos").innerHTML = conflictos().map((o) => `
    <div class="alerta" role="alert"><strong>Conflicto</strong>
      <span>${esc(persona(o.tecnico).nombre)} tiene la orden #${o.n} (${esc(o.cliente)}) el ${fechaLarga(o.fecha)} y está de vacaciones.</span></div>`).join("");
  let html = `<div class="h">Persona</div>` + dias.map((d) => `<div class="h ${iso(d) === HOY ? "hoy" : ""}">${corto(d)}</div>`).join("");
  for (const t of tecnicosEnAlcance()) {
    html += `<div class="p">${esc(t.nombre)}<small>${t.equipo}</small></div>`;
    for (const d of dias) {
      const f = iso(d);
      const vac = vacacionDe(t.id, f);
      const os = ordenes.filter((o) => o.tecnico === t.id && o.fecha === f && o.estado !== "cancelada").sort((a, b) => a.hora.localeCompare(b.hora));
      const chips = os.map((o) => `<button class="chip e-${o.estado}" data-n="${o.n}">${o.hora} ${esc(o.cliente)}</button>`).join("");
      html += `<div class="${os.some(enConflicto) ? "conflicto" : ""}">${chips}${vac ? `<span class="chip vac">Vacaciones (${vac.estado})</span>` : ""}</div>`;
    }
  }
  $("#cal").innerHTML = html;
};
$("#cal").addEventListener("click", (e) => { const c = e.target.closest("[data-n]"); if (c) abrirOrden(+c.dataset.n); });

/* ---------- nóminas ---------- */
const mesTxt = hoy.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
const nominas = { subido: false, procesando: false, filas: {}, cola: [] };
const ILEGIBLE = "t5"; // una página que no se puede identificar sola
const ESTADO_NOMINA = { noenviada: "No enviada", enviada: "Enviada", descargada: "Descargada" };

pintores.nominas = () => {
  const gestiona = puede("nominas:gestionar");
  $("#subirNominas").hidden = !gestiona;
  $("#subirNominas").disabled = nominas.subido || nominas.procesando;
  $("#nomLead").textContent = gestiona
    ? `Se sube un único PDF con las nóminas de toda la plantilla de ${mesTxt}. La plataforma lo trocea, reconoce a quién pertenece cada página por su documento y la entrega solo a esa persona. El PDF completo no se guarda nunca.`
    : "Tu panel personal: solo ves tus propias nóminas. Al abrirla empieza el plazo de retención y después se borra sola.";
  if (nominas.procesando) return; // la importación en curso es dueña del contenido
  if (!gestiona) return pintarMisNominas();
  const filas = personas.map((p) => {
    const f = nominas.filas[p.id];
    const est = !f ? "noenviada" : f.descargada ? "descargada" : "enviada";
    return `<tr><td>${esc(p.nombre)}</td><td class="mono">${p.doc}</td><td><span class="estado e-${est}">${ESTADO_NOMINA[est]}</span></td>
      <td>${f ? `<label><input type="checkbox" data-pago="${p.id}" ${f.pagada ? "checked" : ""}> pagada</label>` : `<span class="muted">-</span>`}</td></tr>`;
  }).join("");
  const sinNomina = personas.filter((p) => !nominas.filas[p.id]).map((p) => `<option value="${p.id}">${esc(p.nombre)}</option>`).join("");
  const colaHtml = nominas.cola.length ? `<div class="card mt"><h2>Cola de revisión</h2>
    ${nominas.cola.map((c, i) => `<div class="toolbar"><span>Página ${c.pagina}: <span class="muted">${c.motivo}</span></span>
      <select data-cola="${i}" aria-label="Asignar a">${sinNomina}</select>
      <button class="btn sm primary" data-asignar="${i}">Asignar</button></div>`).join("")}
    <p class="hint">Asignar a mano queda en la auditoría: quién, a quién y cuándo.</p></div>` : "";
  const aviso = nominas.subido ? "" : `<div class="card"><p class="vacio">Aún no se han subido las nóminas de ${mesTxt}. La tabla de abajo lista a toda la plantilla para que se vean los huecos.</p></div>`;
  $("#nomContenido").innerHTML = aviso
    + `<div class="table-wrap mt"><table><thead><tr><th>Persona</th><th>Documento</th><th>${mesTxt}</th><th>Pago</th></tr></thead><tbody>${filas}</tbody></table></div>`
    + colaHtml;
};
$("#nomContenido").addEventListener("change", async (e) => {
  const p = e.target.dataset.pago; if (!p) return;
  nominas.filas[p].pagada = e.target.checked;
  await auditar(`marcó la nómina de ${persona(p).corto} como ${e.target.checked ? "pagada" : "pendiente"}`, mesTxt);
});
$("#nomContenido").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-asignar]");
  if (b) {
    const i = +b.dataset.asignar, quien = $(`[data-cola="${i}"]`).value;
    nominas.cola.splice(i, 1);
    nominas.filas[quien] = { descargada: false, pagada: false };
    await auditar(`asignó a mano una nómina a ${persona(quien).corto}`, "desde la cola de revisión");
    toast(`Nómina asignada a ${persona(quien).nombre}.`);
    return pintores.nominas();
  }
  if (e.target.closest("[data-descargar]")) {
    const f = nominas.filas[actor().id];
    if (!f.descargada) await auditar("descargó su nómina", `${mesTxt} · empieza la retención`);
    f.descargada = true;
    toast("Descarga simulada. En el sistema real se sirve el PDF de tu página, nada más.");
    pintores.nominas();
  }
});
$("#subirNominas").addEventListener("click", async () => {
  nominas.procesando = true;
  $("#rol").disabled = true; // cambiar de perfil a mitad dejaría la importación sin pantalla
  pintores.nominas();
  const paginas = personas.map((p, i) => ({ pagina: i + 1, p }));
  $("#nomContenido").innerHTML = `
    <p class="hint">Troceando nominas_${iso(hoy).slice(0, 7).replace("-", "_")}.pdf (${paginas.length} páginas)...</p>
    <div class="paginas">${paginas.map(({ pagina }) => `
      <div class="pag" id="pag${pagina}"><strong>Pág. ${pagina}</strong>
        <span class="lineas"><i></i><i></i><i></i><i></i></span><span class="res muted">...</span></div>`).join("")}</div>`;
  for (const { pagina, p } of paginas) {
    await espera(380);
    const el = $(`#pag${pagina}`);
    el.classList.add("hecha");
    if (p.id === ILEGIBLE) {
      el.classList.add("cola");
      $(".res", el).textContent = "Sin documento legible";
      nominas.cola.push({ pagina, motivo: "no se lee el documento de identidad" });
    } else {
      el.classList.add("ok");
      $(".res", el).textContent = `${p.doc} → ${p.corto}`;
      nominas.filas[p.id] = { descargada: false, pagada: false };
    }
  }
  await espera(400);
  nominas.subido = true; nominas.procesando = false;
  $("#rol").disabled = false;
  await auditar(`importó las nóminas de ${mesTxt}`, `${paginas.length - 1} asignadas, 1 en revisión`);
  toast(`${paginas.length - 1} nóminas entregadas. 1 página espera revisión.`);
  pintores.nominas();
});
function pintarMisNominas() {
  const f = nominas.filas[actor().id];
  if (!f) {
    $("#nomContenido").innerHTML = `<div class="card"><p class="vacio">Todavía no hay nómina de ${mesTxt} para ${esc(actor().nombre)}.<br>Cambia al perfil de administración y súbelas para verla aparecer aquí.</p></div>`;
    return;
  }
  const [est, txt, nota] = f.descargada
    ? ["descargada", "Descargada", `<br><small class="muted">Se borrará automáticamente en 30 días.</small>`]
    : ["enviada", "Disponible", ""];
  $("#nomContenido").innerHTML = `<div class="table-wrap"><table><thead><tr><th>Periodo</th><th>Estado</th><th></th></tr></thead><tbody>
    <tr><td>${mesTxt}</td><td><span class="estado e-${est}">${txt}</span>${nota}</td>
    <td><button class="btn sm primary" data-descargar>Descargar</button></td></tr></tbody></table></div>`;
}

/* ---------- roles ---------- */
pintores.roles = () => {
  const ids = Object.keys(roles);
  const celda = (k, p) => (roles[k].permisos.includes(p) ? `<td class="si" aria-label="sí">✓</td>` : `<td class="no" aria-label="no">·</td>`);
  $("#matriz").innerHTML = `
    <thead><tr><th>Permiso</th>${ids.map((k) => `<th>${roles[k].nombre}</th>`).join("")}</tr></thead>
    <tbody>
      <tr><td><strong>Alcance</strong></td>${ids.map((k) => `<td><strong>${roles[k].alcanceTxt}</strong></td>`).join("")}</tr>
      ${catalogo.map(([p, txt]) => `<tr><td>${txt}<br><small class="mono muted">${p}</small></td>${ids.map((k) => celda(k, p)).join("")}</tr>`).join("")}
    </tbody>`;
};

/* ---------- auditoría ---------- */
pintores.auditoria = () => {
  if (!puede("auditoria:ver")) {
    $("#audContenido").innerHTML = `<div class="card prohibido"><b>403</b>Tu perfil no tiene el permiso <span class="mono">auditoria:ver</span>. Cambia a administración o supervisión.</div>`;
    return;
  }
  const clase = (e) => (rotos === null ? "" : rotos.has(e.id) ? "roto" : "ok");
  $("#audContenido").innerHTML = `
    <div class="toolbar"><button class="btn primary" id="verificar">Verificar cadena</button>
      <button class="btn" id="manipular">Manipular una fila al azar</button><span class="hint" id="estadoCadena" role="status"></span></div>
    <div class="chain">${[...auditoria].reverse().map((e) => `
      <div class="eslabon ${clase(e)}"><span class="n">${e.id}</span>
        <span><strong>${esc(e.actor)}</strong> ${esc(e.accion)}<br><small class="muted">${esc(e.detalle)} · ${e.ts}</small></span>
        <span class="hs">prev ${e.prev.slice(0, 10)}<br>hash ${e.hash.slice(0, 10)}</span></div>`).join("")}</div>`;
};
$("#audContenido").addEventListener("click", async (e) => {
  if (e.target.id === "verificar") {
    const roto = new Set();
    let prev = "génesis", primero = null;
    for (const x of auditoria) {
      const bien = x.prev === prev && (await hash(contenido(x))) === x.hash;
      if (!bien && primero === null) primero = x.id;
      if (primero !== null) roto.add(x.id);
      prev = x.hash;
    }
    rotos = roto;
    pintores.auditoria();
    $("#estadoCadena").textContent = primero === null
      ? `Cadena íntegra: ${auditoria.length} registros verificados.`
      : `La cadena se rompe en el registro ${primero}. Todo lo posterior queda en entredicho.`;
  }
  if (e.target.id === "manipular") {
    const x = auditoria[rnd(Math.max(1, auditoria.length - 1))];
    x.detalle += " (editado a mano)";
    rotos = null;
    pintores.auditoria();
    $("#estadoCadena").textContent = `Alguien ha editado el registro ${x.id} directamente en la base de datos. Pulsa Verificar.`;
  }
});

/* ---------- despliegue ---------- */
const nuevoDigest = () => "sha256:" + hex(crypto.getRandomValues(new Uint8Array(6)));
const base = { version: "2.14.0", digest: nuevoDigest(), esquema: 27 };
const envs = { staging: { ...base }, beta: { ...base }, main: { ...base } };
const etiquetaEnv = { staging: "pruebas", beta: "preproducción", main: "producción" };
const pasosNombres = ["Pruebas", "Imagen", "Staging", "Beta", "Producción"];
const estadoPasos = {};
let ocupado = false;
pintores.despliegue = () => {
  $("#envs").innerHTML = Object.entries(envs).map(([n, e]) => `
    <div class="card env"><h2>${n}<span class="tag">${etiquetaEnv[n]}</span></h2>
      <dl><dt>Versión</dt><dd class="mono">v${e.version}</dd><dt>Imagen</dt><dd class="mono">${e.digest}</dd>
      <dt>Esquema</dt><dd class="mono">${pad(e.esquema, 4)}</dd></dl></div>`).join("");
  $("#pasos").innerHTML = pasosNombres.map((p) => `<span class="paso ${estadoPasos[p] || ""}">${p}</span>`).join("");
  const igual = (a, b) => envs[a].digest === envs[b].digest;
  $("#push").disabled = ocupado;
  $("#prBeta").disabled = ocupado || igual("staging", "beta");
  $("#prMain").disabled = ocupado || igual("beta", "main");
};
const paso = (p, est) => { estadoPasos[p] = est; pintores.despliegue(); };
async function linea(t, ms = 320) { const l = $("#log"); l.textContent += t + "\n"; l.scrollTop = l.scrollHeight; await espera(ms); }
const migracion = (aplica, n) => `alembic upgrade head ${aplica ? `(aplica ${pad(n, 4)})` : "(sin cambios)"}`;
async function enExclusiva(fn) {
  ocupado = true; $("#log").textContent = "";
  try { await fn(); } finally { ocupado = false; pintores.despliegue(); }
}
$("#push").addEventListener("click", () => enExclusiva(async () => {
  pasosNombres.forEach((p) => delete estadoPasos[p]);
  const migra = rnd(2) === 1;
  await linea("$ git push origin staging");
  paso("Pruebas", "run");
  await linea("CI: pruebas del backend .......... 174 passed", 650);
  await linea("CI: pruebas del frontend ......... passed", 400);
  await linea("CI: pip-audit / npm audit ........ 0 vulnerabilidades", 400);
  paso("Pruebas", "ok"); paso("Imagen", "run");
  const d = nuevoDigest();
  await linea(`CI: docker build → ${d}`, 650);
  paso("Imagen", "ok"); paso("Staging", "run");
  const version = envs.staging.version.replace(/\d+$/, (m) => +m + 1);
  envs.staging = { version, digest: d, esquema: envs.staging.esquema + (migra ? 1 : 0) };
  await linea(`staging: arranque → ${migracion(migra, envs.staging.esquema)}`);
  await linea("staging: healthcheck 200 ✓");
  paso("Staging", "ok");
  await auditar(`desplegó v${version} en staging`, d, null, "CI");
}));
const promover = (de, a, nombrePaso) => enExclusiva(async () => {
  paso(nombrePaso, "run");
  await linea(`PR ${de} → ${a}: CI en verde, merge`);
  await linea(`CI: docker tag ${envs[de].digest} → ${a}   (misma imagen, sin reconstruir)`, 600);
  const migra = envs[de].esquema > envs[a].esquema;
  envs[a] = { ...envs[de] };
  await linea(`${a}: copia de la base de datos ✓`);
  await linea(`${a}: arranque → ${migracion(migra, envs[a].esquema)}`);
  await linea(`${a}: healthcheck 200 ✓`);
  paso(nombrePaso, "ok");
  await auditar(`promovió v${envs[a].version} a ${a}`, envs[a].digest, null, "CI");
});
$("#prBeta").addEventListener("click", () => promover("staging", "beta", "Beta"));
$("#prMain").addEventListener("click", () => promover("beta", "main", "Producción"));

/* ---------- atajos ---------- */
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || $("dialog[open]") || e.target.closest("input, textarea, select")) return;
  if (e.key === "/") { e.preventDefault(); irA("ordenes"); $("#q").focus(); }
  if (e.key.toLowerCase() === "n") { e.preventDefault(); nuevaOrdenDlg(); }
});

/* ---------- arranque ---------- */
(async () => {
  await auditar("creó la instalación", "organización raíz", null, "Sistema");
  await auditar("creó el rol Supervisión", "6 permisos, alcance de equipo", null, "Ana V.");
  const resuelta = ordenes.find((o) => o.estado === "resuelta");
  if (resuelta) await auditar(`resolvió la orden #${resuelta.n}`, "abierta → resuelta", resuelta.n, persona(resuelta.tecnico).corto);
  await auditar("generó las órdenes del mes desde un servicio", "Ferretería Olmo, mensual", null, "Ana V.");
  pintarSelectTec();
  irA("panel");
  repintar();
  $("#log").textContent = "Pulsa \"Push a staging\" para simular un cambio.\n";
  pintores.despliegue();
})();
