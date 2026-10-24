# 0003. Monolito modular, no microservicios

**Estado:** aceptada

## Contexto

Una persona mantiene el sistema. Se instala en servidores de clientes que no tienen por qué tener orquestadores ni conocimientos de operación. Aun así, el dominio tiene partes claramente separables: clientes, órdenes de trabajo, vacaciones, usuarios, auditoría, notificaciones.

## Decisión

Un solo proceso dividido en módulos. Cada módulo tiene sus modelos, repositorio, servicios, eventos y API. Entre módulos solo se habla por servicios públicos o por eventos, nunca leyendo tablas ajenas. Los servicios de negocio no dependen de FastAPI.

## Alternativas descartadas

- **Microservicios.** Red, despliegue y observabilidad multiplicados por el número de servicios, para un equipo de uno y un cliente que instala con un `docker compose`.
- **Monolito sin módulos.** Es lo que había. Funciona hasta que cada cambio toca diez sitios.

## Consecuencias

- (+) Un despliegue, una base de datos, una cosa que vigilar.
- (+) Si algún módulo necesitara salir a su propio proceso, las fronteras ya están dibujadas.
- (-) Las fronteras las protege la disciplina, no la red. Los ciclos entre módulos se resolvieron con imports dentro de las funciones, que funciona pero no es bonito.
- (~) Queda pendiente un chequeo automático de dependencias entre módulos en el CI.
