# 0005. Forja Git propia y el Pull Request como aprobación

**Estado:** aceptada

## Contexto

Quería que nadie necesitara entrar por SSH al servidor para el trabajo diario. Todo el ciclo (escribir, revisar, desplegar) debía pasar por Git y quedar registrado: quién cambió qué y cuándo llegó a cada entorno.

## Decisión

- **Forgejo** autoalojado, con su sistema de CI y un runner propio.
- **Tres ramas y tres entornos:** `staging`, `beta`, `main`. Las dos últimas no admiten `push`: solo Pull Request.
- **El PR es la aprobación.** Forgejo no tiene "entornos con aprobación obligatoria" como otras plataformas. En lugar de cambiar de herramienta por eso, el merge del PR es el disparador del despliegue y el registro de que se aprobó.
- **El runner usa el Docker del host**, no Docker dentro de Docker. Solo ejecuta código propio de un único repositorio, sin PRs de terceros.
- **El único que despliega es el CI**, a través de un servicio pequeño que sabe hacer exactamente dos cosas sobre tres rutas fijas: actualizar el código y levantar los contenedores. Sin shell, sin rutas arbitrarias, con token.

## Alternativas descartadas

- **GitLab CE.** Tiene entornos con aprobación, pero pide entre 4 y 8 GB de RAM. Desproporcionado.
- **Ramas `alpha` y `feature/*`.** Las tuvo una versión anterior del flujo. Con un equipo tan pequeño eran disciplina sin retorno.
- **Docker dentro de Docker para el runner.** Es el patrón recomendado, y lo probé. Pero aislaba los trabajos en una red desde la que el paso de despliegue no llegaba a nada.

## Consecuencias

- (+) Desplegar es aceptar un PR.
- (+) Dos rastros de auditoría distintos: el de la aplicación (acciones de negocio) y el de Git (código y despliegues).
- (-) El runner con acceso al Docker del host es un riesgo aceptado a sabiendas. Si algún día ejecuta código de terceros, hay que cambiarlo.
- (-) El servicio de despliegue vive fuera del repositorio de la aplicación y hay que acordarse de revisarlo.
