# 0008. Auditoría append-only con hash encadenado

**Estado:** aceptada

## Contexto

Querer saber quién hizo qué es fácil. Que ese registro sea de fiar es otra cosa: si quien administra la base de datos puede editarlo, no prueba nada.

## Decisión

- Una tabla en la que solo se inserta. Un trigger de la base de datos rechaza `UPDATE` y `DELETE`.
- Cada fila guarda el hash SHA-256 de la anterior junto con el suyo. Modificar una fila rompe la cadena desde ese punto.
- La escritura toma un bloqueo consultivo, porque el encadenado necesita un orden total estricto. Por eso la clave es secuencial y no un UUID como en el resto.
- Las ediciones guardan el diff de campos (antes y después).
- **Sin datos personales en la auditoría.** Solo identificadores, que se resuelven a nombres al mostrarla. Así se puede borrar a una persona por una petición de protección de datos sin romper la cadena.

## Consecuencias

- (+) Alterar el historial sin dejar rastro es prácticamente imposible.
- (+) Compatible con el derecho de supresión.
- (-) Todas las escrituras de auditoría pasan por un único punto serializado. Con el volumen actual no se nota; con mucho más, habría que repensarlo.
- (~) El diff queda fuera del hash: el trigger ya impide modificarlo, y meterlo habría obligado a serializar JSON de forma canónica.

La [demo](../../demo/index.html) tiene una pestaña donde se puede manipular una fila y ver cómo la verificación lo detecta.
