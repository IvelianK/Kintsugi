# 8. Lo aprendido

Sin orden de importancia. Algunas son técnicas y otras no tanto.

## Sobre decidir

**La pregunta de negocio va antes que el diagrama.** Diseñé una arquitectura multiinquilino entera antes de preguntar dónde se iba a instalar el producto. La respuesta la tiró abajo en cinco minutos. Ahora la primera pregunta de cualquier diseño es quién lo va a operar y dónde.

**Discutir con alguien que no está de acuerdo contigo.** Contrasté la arquitectura en varias rondas con dos asistentes de IA distintos, pasándole a cada uno los argumentos del otro. Lo útil no fue que me dieran la razón, sino que me obligaran a defender cada punto o soltarlo. Cambié de opinión en varios, y ellos también.

**Dejar escrito el porqué, no solo el qué.** El [registro de decisiones](decisiones/README.md) existe para no reabrir debates ya cerrados ni olvidar por qué se cerraron. Cuando una decisión cambia, no se borra: se escribe otra que la sustituye.

**Diferir lo que es barato añadir después.** La comprobación de licencias, por ejemplo, es un punto de extensión vacío. Es un mecanismo delgado que se puede meter en cualquier momento. En cambio, la identidad enchufable y el patrón repositorio son caros de añadir tarde, y esos sí los hice desde el principio.

## Sobre construir

**Lo que depende de acordarse, se olvida.** Migraciones al arrancar, tareas programadas dentro de la aplicación, recálculos por eventos. Cada vez que algo dependía de que una persona (yo) recordara un paso, acabé convirtiéndolo en parte del proceso.

**Construir una vez, promover muchas.** Que lo que llega a producción sea exactamente lo que se probó elimina una categoría entera de "en pruebas funcionaba".

**Elegir lo aburrido cuando funciona.** Un solo trabajo de CI con pasos condicionales en vez de un grafo de dependencias elegante que fallaba en silencio. Una imagen de directorio vieja y probada en vez de la nueva que no arrancaba.

**Comprobar antes de asumir.** No adiviné nombres de imágenes, versiones ni valores de enumerados: los miré en los datos reales antes de escribir el mapeo. Al escribir este mismo repositorio estuve a punto de vender como nuevas funciones que el sistema antiguo ya tenía. Lo vi porque fui a mirar su código.

## Sobre seguridad

**El filtro del listado no protege la ruta por identificador.** La interfaz no te deja llegar, pero la API sí. Cada ruta comprueba propiedad o permiso, sin excepciones.

**Cuando arregles un fallo, busca a sus hermanos.** Arreglé la comprobación de alcance en unas rutas y el pentest la encontró en otras. Ahora, ante un fallo de autorización, reviso todas las rutas que hacen algo parecido.

**La respuesta de libro puede ser la equivocada.** Limitar el login por IP habría dejado fuera a la oficina entera. Conocer cómo se usa el sistema importa más que conocer la regla.

**Separar lo que se puede arreglar ya de lo que cambia el comportamiento.** Lo primero, ya. Lo segundo, con plan, interruptor y una fecha tranquila.

## Sobre el alcance

**Más escalable no es mejor si hace menos.** Es la lección que más me costó. El sistema nuevo fue perdiendo funciones por el camino, cada recorte razonable por separado, y la suma era peor que el original. La regla que me quedo: YAGNI vale para la arquitectura especulativa, no para entregar menos de lo que ya existía.

**"Hecho" tiene que significar lo que parece.** Si digo que algo está hecho en toda la aplicación, es porque lo he visto en cada pantalla, no porque el CSS se herede.

## Sobre migrar

**Separar código, datos y tráfico.** Cada uno con su momento, su verificación y su vuelta atrás.

**Ensayar hasta que el día del cambio sea aburrido.** El corte real fueron minutos porque el script ya se había ejecutado antes contra una copia.

**El plan de vuelta atrás tiene que existir antes del cambio, no después.** Y no tiene por qué depender de mantener el sistema viejo encendido: puede depender de una copia verificada.

## Lo que haría distinto

- Compararía con el sistema antiguo desde el primer día, pantalla a pantalla, en vez de descubrir los huecos en la segunda semana.
- Fijaría las dependencias desde el primer commit, no después de llevarme un susto.
- Mediría tiempos de las tareas de la oficina antes del cambio. Ahora sé que el sistema es mejor; me gustaría poder decir cuánto.
- Pondría la base de datos sin superusuario desde el principio. Con la base vacía es un cambio pequeño; con datos reales hay que hacerlo con cuidado.

---

Anterior: [Impacto](07-impacto.md) · Siguiente: [Hoja de ruta](09-hoja-de-ruta.md)
