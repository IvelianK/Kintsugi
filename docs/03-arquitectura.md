# 3. Arquitectura

Cada pieza tiene su porqué en el [registro de decisiones](decisiones/README.md). Aquí va la foto de conjunto.

## Vista de despliegue

Una instalación es un servidor con un `docker compose`. La instalación de la propia empresa es una más, idéntica a la que recibiría cualquier cliente.

```mermaid
flowchart TB
    U["Navegador"] -->|HTTPS| T["Túnel inverso<br/>sin puertos abiertos"]
    T --> N["nginx<br/>estáticos + proxy /api"]
    subgraph Servidor["Servidor de la empresa"]
        N --> B["Backend<br/>FastAPI, usuario sin privilegios"]
        B --> PG[("PostgreSQL<br/>rol de aplicación sin superusuario")]
        B --> V[("Valkey<br/>sesiones + flujo de eventos")]
        B --> S[("SeaweedFS<br/>adjuntos y firmas")]
        B -.->|"/metrics, solo red interna"| PR["Prometheus + Grafana"]
        BK["Copia diaria de la BD<br/>14 días de rotación"] -.-> PG
    end
```

Nada escucha en una IP pública. El único camino de entrada es el túnel, y las herramientas de administración solo son accesibles desde la propia máquina.

## Vista lógica: monolito modular

Un solo proceso, pero dividido en módulos que no se tocan las tripas. Cada módulo tiene sus modelos, su repositorio, sus servicios y su API. Si un módulo necesita algo de otro, llama a su servicio público o publica un evento. Nunca consulta sus tablas directamente.

```mermaid
flowchart LR
    subgraph Núcleo
        AUTH["auth<br/>identidad enchufable"]
        ROLES["roles<br/>permisos con nombre"]
        AUD["auditoría<br/>append-only"]
        ORG["organización"]
    end
    subgraph Negocio
        CLI["clientes<br/>empresa > cliente > subcliente > sede"]
        OT["órdenes de trabajo"]
        AUTO["automatizaciones<br/>servicios recurrentes"]
        VAC["vacaciones"]
        NOM["nóminas"]
        USU["usuarios"]
    end
    subgraph Soporte
        NOT["notificaciones"]
        ARC["archivos<br/>StorageProvider"]
    end
    AUTO -->|"genera"| OT
    OT -->|"evento"| NOT
    VAC -->|"evento"| NOT
    OT --> ARC
    OT --> CLI
    OT -.->|"registra"| AUD
    USU --> ROLES
```

Dos reglas que he intentado no romper:

1. **El dominio no conoce el framework.** Los servicios de negocio no importan nada de FastAPI. FastAPI solo expone endpoints.
2. **Cada módulo habla con sus datos por su repositorio.** Si algún día hace falta separar empresas dentro de una misma instalación, el filtro se añade en un sitio por módulo y no en cien consultas sueltas.

## El ciclo de vida de una orden de trabajo

```mermaid
stateDiagram-v2
    [*] --> Abierta: crear (a mano, por lote o desde un servicio)
    Abierta --> Resuelta: el técnico registra entrada, salida, gastos y firmas
    Abierta --> Cancelada
    Resuelta --> Abierta: rehacer
    Resuelta --> Cerrada: revisión de oficina
    Cerrada --> [*]
    Cancelada --> [*]
    note right of Cerrada: cerrada es definitiva,\ntambién para el enlace público
```

El cliente puede firmar desde un enlace público con caducidad, sin cuenta. Ese enlace usa un esquema de datos propio, más pequeño: no ve importes ni datos internos.

## Permisos: rol, permiso y alcance

El sistema antiguo preguntaba "¿eres administrador?". El nuevo hace tres preguntas:

```mermaid
flowchart LR
    R["Petición"] --> Q1{"¿Tiene el permiso?<br/>p. ej. ordenes:editar"}
    Q1 -->|no| X1["403"]
    Q1 -->|sí| Q2{"¿El dato está en su alcance?<br/>propio, de su equipo, todo"}
    Q2 -->|no| X2["403"]
    Q2 -->|sí| OK["Adelante<br/>y queda auditado"]
```

Los permisos se agrupan en roles editables desde la interfaz, y a una persona se le pueden dar permisos sueltos además de los de su rol. El alcance depende del tipo de rol: un técnico ve lo suyo, un supervisor lo de su equipo, administración todo.

## Eventos: el patrón outbox

El problema del sistema antiguo era que recalcular avisos dependía de que cada función se acordara de llamar al recálculo. Ahora los módulos publican un evento en un flujo de Valkey y un consumidor en segundo plano hace el trabajo.

```mermaid
sequenceDiagram
    participant OT as Órdenes
    participant V as Valkey Stream
    participant W as Consumidor
    participant N as Notificaciones
    OT->>V: XADD eventos:dominio tipo=orden_guardada
    Note over OT: responde al usuario sin esperar
    W->>V: XREADGROUP (bloqueante)
    V-->>W: lote de eventos
    W->>N: recalcular conflictos (uno por lote)
    N->>N: advisory lock en Postgres
    W->>V: XACK
```

Es "mejor esfuerzo" a propósito: el recálculo es idempotente y la siguiente escritura vuelve a publicar. Detalle en [ADR 0006](decisiones/0006-eventos-con-outbox.md).

## Auditoría

Una tabla donde solo se puede insertar. Un trigger de la base de datos rechaza cualquier `UPDATE` o `DELETE`, y cada fila guarda el hash de la anterior, así que alterar el historial sin dejar rastro es prácticamente imposible. Las ediciones guardan el diff de campos (antes y después).

La auditoría no guarda datos personales, solo identificadores. Así se puede borrar a una persona por una petición de protección de datos sin romper la cadena. Ver [ADR 0008](decisiones/0008-auditoria-encadenada.md). La demo tiene una pestaña que enseña cómo funciona.

## Entrega: tres entornos, una imagen

```mermaid
gitGraph
    commit id: "base"
    branch beta
    branch staging
    commit id: "cambio A"
    commit id: "cambio B"
    checkout beta
    merge staging id: "PR a beta"
    checkout main
    merge beta id: "PR a main" type: HIGHLIGHT
```

`beta` y `main` están protegidas: no admiten `push`, solo Pull Request. El PR no está para pedir permiso a nadie (somos muy pocos), sino porque deja escrito qué se promovió, cuándo y con qué pruebas en verde. El detalle:

```mermaid
sequenceDiagram
    actor Yo
    participant G as Forja Git
    participant CI as CI
    participant S as Pruebas
    participant B as Beta
    participant P as Producción
    Yo->>G: push a staging
    G->>CI: dispara
    CI->>CI: pruebas backend + frontend
    CI->>CI: construye imagen (una sola vez)
    CI->>S: despliega
    Yo->>G: PR staging → beta, merge
    CI->>B: re-etiqueta la misma imagen y despliega
    Yo->>G: PR beta → main, merge
    CI->>P: re-etiqueta la misma imagen y despliega
    P->>P: al arrancar: alembic upgrade head
    Note over P: si la migración falla,<br/>el contenedor no arranca
```

La imagen se construye una vez y se promueve por etiqueta. Lo que llega a producción es, byte a byte, lo que pasó las pruebas. Lo comprobé comparando el identificador de la imagen en los tres entornos.

---

Anterior: [Línea del tiempo](02-linea-del-tiempo.md) · Siguiente: [La migración](04-migracion.md)
