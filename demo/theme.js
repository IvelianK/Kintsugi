// Aplica el tema guardado antes de pintar, para no ver un parpadeo claro/oscuro.
try {
  const t = localStorage.getItem("kintsugi-tema");
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch { /* sin almacenamiento: tema del sistema */ }
