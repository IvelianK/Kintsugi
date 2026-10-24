# 0010. Límite de login por cuenta, y por IP real después

**Estado:** aceptada

## Contexto

El login no tenía límite de intentos. La solución habitual es limitar por IP. Pero toda la oficina sale por la misma IP y, detrás del proxy, el servidor veía todas las peticiones como si vinieran del mismo sitio.

## Decisión

1. **Primero, por cuenta.** Diez fallos de una cuenta en quince minutos devuelven 429 para esa cuenta. El contador vive en Valkey y se limpia con un login correcto.
2. **Después, por IP real**, con un umbral mucho más alto (treinta en quince minutos), para frenar el relleno de credenciales: muchas cuentas, pocos intentos en cada una, que el límite por cuenta no ve.

Para lo segundo hacía falta la IP real. nginx la toma de la cabecera del proxy y el backend solo se fía de ella si la petición llega desde la red privada.

## Alternativas descartadas

- **Solo por IP.** Un error repetido de una persona habría dejado fuera a toda la oficina.

## Consecuencias

- (+) Protege frente a fuerza bruta sobre una cuenta y frente a relleno de credenciales.
- (+) De paso, la auditoría empezó a guardar la IP real en lugar de la del proxy.
- (-) Alguien puede bloquear temporalmente la cuenta de otra persona fallando a propósito. Se acepta: dura quince minutos.
- (~) En las pruebas, cada caso usa una IP aleatoria; con una fija, el contador de una ejecución bloqueaba la siguiente.
