# 0004. PostgreSQL, Valkey y SeaweedFS

**Estado:** aceptada

## Contexto

El producto se instala en servidores de terceros. Eso convierte las licencias de cada pieza en un tema de negocio, no solo técnico. Además, el sistema antiguo guardaba ficheros en el disco local y usaba MariaDB.

## Decisión

- **PostgreSQL** como base de datos. Buen soporte de tipos, bloqueos consultivos (que acabaron haciendo falta dos veces) y encaja bien con SQLAlchemy 2 y Alembic.
- **Valkey** para sesiones y flujos de eventos. Es el fork de Redis con licencia BSD; Redis cambió de licencia y dejó de ser código abierto en sentido estricto.
- **SeaweedFS** para ficheros, detrás de una interfaz propia (`StorageProvider`: subir, descargar, borrar, URL firmada). Un cliente que ya tenga almacenamiento compatible con S3 puede apuntar allí sin tocar la aplicación.

## Alternativas descartadas

- **MinIO.** Era la opción natural para almacenamiento de objetos, pero su edición comunitaria quedó archivada.
- **Redis.** Por la licencia.
- **Disco local.** Ata los ficheros a una máquina concreta y no da URLs firmadas.

## Consecuencias

- (+) Ninguna pieza con una licencia que complique instalar en casa de un cliente.
- (+) Cambiar de almacenamiento es configuración, no código.
- (-) SeaweedFS es menos conocido que MinIO; hay menos respuestas en internet cuando algo falla.
- (~) Las versiones de todo quedan fijadas. Una etiqueta `latest` se cambió por la versión concreta que estaba corriendo.
