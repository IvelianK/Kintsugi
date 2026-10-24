# 0006. Eventos internos con outbox

**Estado:** aceptada. Pospuesta al principio y aplicada cuando hubo un motivo real.

## Contexto

En el sistema antiguo, el recálculo de "técnico con trabajo un día que está de vacaciones" se llamaba explícitamente desde cada función que podía afectarlo. En el sistema nuevo eran nueve sitios: seis en órdenes y tres en vacaciones. Añadir uno más y olvidarse era cuestión de tiempo.

## Decisión

Al principio, nada: llamadas directas entre módulos, igual que antes pero ordenadas. Decidí no construir eventos hasta tener un motivo real.

Lo apliqué unas fases después, al completar la superficie de órdenes de trabajo, cuando las llamadas directas ya eran nueve y seguían creciendo. Entonces: los módulos publican un evento en un flujo de Valkey (`XADD`) y un consumidor en segundo plano lo lee en grupo (`XREADGROUP`) y recalcula. Un recálculo por lote leído, no por evento, para no multiplicar el trabajo cuando se crean muchas órdenes de golpe.

Semántica de "mejor esfuerzo", a propósito: se confirma la lectura siempre, sin reintentos. El recálculo es idempotente y la próxima escritura relacionada vuelve a publicar.

## Alternativas descartadas

- **`LISTEN/NOTIFY` de PostgreSQL a secas.** No es duradero: si el consumidor no está escuchando, el aviso se pierde.
- **Un broker de mensajes completo.** Otra pieza que instalar en cada cliente para un único consumidor.

## Consecuencias

- (+) Ningún módulo necesita saber quién reacciona a sus cambios.
- (+) El usuario recibe la respuesta sin esperar al recálculo.
- (-) Dos fallos reales aparecieron con esto: el consumidor usaba el cliente de Valkey compartido para un comando bloqueante, y más tarde dos procesos recalculaban a la vez. Ver [Tropiezos](../06-tropiezos.md#dos-procesos-recalculando-lo-mismo-a-la-vez).
- (~) Inspeccionar el flujo hoy se hace desde la línea de comandos. Una pantalla para eso queda pendiente.
