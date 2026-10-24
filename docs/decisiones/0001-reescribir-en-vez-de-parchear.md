# 0001. Reescribir en vez de parchear

**Estado:** aceptada

## Contexto

El sistema antiguo funcionaba y la gente lo conocía. Tenía problemas serios (contraseñas en claro, sin pruebas, despliegue manual, permisos por rol literal, lógica cruzada que dependía de acordarse de llamar a funciones), pero todos se podían atacar por separado.

En contra de reescribir: el riesgo clásico de tardar meses en igualar lo que ya hay, y el día del cambio, que es cuando se pierden datos.

## Decisión

Reescribir, con dos condiciones:

1. La migración de datos tiene que ser un script repetible que se pueda ensayar contra una copia tantas veces como haga falta.
2. El sistema nuevo tiene que hacer todo lo que hacía el viejo antes de sustituirlo.

## Alternativas descartadas

- **Parchear por partes.** Resolvía cada síntoma, pero meter pruebas, permisos finos y despliegues seguros en un código con plantillas, lógica y SQL mezclados iba a costar casi lo mismo que reescribir, y el resultado seguiría siendo difícil de cambiar.
- **Patrón estrangulador** (sustituir pieza a pieza con los dos sistemas conviviendo). Tiene sentido con equipos grandes y sistemas que no se pueden parar. Aquí el volumen de datos era pequeño, la migración se podía hacer en minutos y mantener dos sistemas compartiendo datos era más complejo que un corte limpio.

## Consecuencias

- (+) Un sistema con estructura pensada para durar.
- (+) La seguridad se pudo diseñar, no añadir.
- (-) Durante un tiempo el nuevo hizo menos que el viejo. La segunda condición no se cumplió sola: hubo que vigilarla (ver [Tropiezos](../06-tropiezos.md#el-sistema-nuevo-hacía-menos-que-el-viejo)).
- (~) La condición 1 resultó ser la que hizo posible todo lo demás.
