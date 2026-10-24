# 0007. Construir una vez, promover por etiqueta, migrar al arrancar

**Estado:** aceptada

## Contexto

Con tres entornos, la tentación es construir la imagen en cada uno. Pero entonces lo que llega a producción no es lo que se probó: es algo construido a partir del mismo código, con las dependencias que hubiera ese día.

Además, los primeros despliegues fallaban si había cambios de esquema, porque las migraciones se lanzaban a mano.

## Decisión

- La imagen se construye **una sola vez**, en `staging`, después de pasar las pruebas.
- `beta` y `main` la **re-etiquetan** (`docker tag`). Mismo identificador de imagen en los tres entornos. Comprobado.
- Sin registro de imágenes mientras todo viva en una máquina: no aportaría nada.
- El contenedor del backend ejecuta **`alembic upgrade head` al arrancar**. Si falla, no arranca.
- Las migraciones **no destruyen** en la misma versión en que se deja de usar algo: una columna que sobra se elimina más adelante.

## Consecuencias

- (+) "En pruebas funcionaba" deja de ser una frase posible por diferencias de build.
- (+) Desplegar con cambios de esquema no requiere ningún paso manual.
- (+) Un fallo de migración deja el contenedor parado en lugar de sirviendo errores.
- (-) Las migraciones tienen que ser compatibles hacia atrás durante una versión, y a veces eso obliga a hacer un cambio en dos pasos.
- (~) Con más de un servidor hará falta un registro de imágenes. El diseño ya lo admite.
