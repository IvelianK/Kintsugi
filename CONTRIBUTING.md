# Cómo contribuir

Kintsugi es un cuaderno personal: la documentación cuenta decisiones propias y no acepta cambios de contenido. Lo que sí es bienvenido:

- **Erratas, enlaces rotos o diagramas que no se ven.** Abre un issue o un Pull Request.
- **Fallos en la demo o en el paquete de despliegue.** Abre un issue con los pasos para reproducirlo.
- **Preguntas sobre una decisión.** Abre un issue; si la respuesta cambia algo, acabará en el [registro de decisiones](docs/decisiones/README.md).
- **Vulnerabilidades.** Nunca en un issue público: sigue [SECURITY.md](SECURITY.md).

## Pull Requests

La rama `main` está protegida. Todo entra por Pull Request y se fusiona con *squash*, con estas comprobaciones en verde:

| Comprobación | Qué hace |
|---|---|
| `imagen` | Construye la imagen de la demo para amd64 y arm64, sin publicarla |
| CodeQL | Analiza el JavaScript de la demo y los workflows |

Antes de abrir el PR:

1. Prueba la demo en local: `python -m http.server 8080 --directory demo`.
2. No añadas scripts ni estilos en línea: la CSP los bloquea.
3. Mantén el texto en español de España, sin datos que identifiquen a personas, empresas o sistemas reales.

## Commits

Mensajes en español, en presente y describiendo el cambio: `demo: el calendario recuerda la semana`. Los PR se fusionan con *squash*, así que el título del PR es el mensaje final.
