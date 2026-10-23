# 0002. Una instalación por empresa, nunca alojado por nosotros

**Estado:** aceptada. Sustituye a un primer diseño multiinquilino que no llegó a implementarse.

## Contexto

El primer diseño era multiinquilino: una sola instalación para varias empresas, separadas por seguridad a nivel de fila en PostgreSQL. Estaba bien pensado. Pero se hizo antes de conocer el modelo de negocio.

El modelo real: el producto se instala en el servidor de cada cliente, se personaliza (colores, logo) y se le da soporte en remoto. Nunca se aloja en infraestructura propia. La instalación interna de la empresa es una más, idéntica a la de un cliente.

## Decisión

Una instalación es una empresa: su servidor, su base de datos completa. Sin multiinquilino y sin seguridad por filas. El aislamiento entre empresas es físico.

Para no cerrarse puertas, dos cosas baratas desde el principio:

1. **Patrón repositorio.** Cada módulo accede a sus datos solo a través de su repositorio. Si algún día hace falta filtrar por empresa, se añade en un sitio por módulo.
2. **Una entidad "organización" como raíz del dominio**, aunque cada instalación tenga exactamente una. Permite filiales o una empresa que gestione a varias sin cambiar el esquema.

## Alternativas descartadas

- **Multiinquilino con seguridad por filas.** Coste permanente en cada consulta, cada migración y cada prueba, a cambio de un aislamiento que el modelo físico ya da gratis.

## Consecuencias

- (+) Mucho menos código y menos superficie de error.
- (+) Cada cliente es dueño de sus datos de verdad.
- (+) El mecanismo de actualización pasa a ser lo importante: `docker compose pull && up` en el servidor del cliente, con migraciones que nunca destruyen.
- (-) Si algún día se ofrece una versión alojada, el coste dependerá de lo disciplinado que haya sido el uso del patrón repositorio. Hay que vigilarlo en cada revisión.
- (~) La capacidad del servidor propio solo importa para la instalación interna: el de cada cliente lo pone el cliente.
