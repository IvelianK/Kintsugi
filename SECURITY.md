# Política de seguridad

## Qué cubre

| Parte | Soporte |
|---|---|
| Demo (`demo/`) y su imagen `ghcr.io/iveliank/kintsugi-demo` | Última versión publicada |
| Paquete de despliegue (`deploy/`, workflow de publicación) | Última versión publicada |
| Documentación (`docs/`) | Errores que expongan datos o recomienden prácticas inseguras |

La demo no tiene backend, cuentas ni datos reales: todo vive en memoria del navegador. Aun así, cualquier fallo que permita ejecutar código en la página, saltarse la CSP, escalar privilegios en el contenedor o alterar la imagen publicada es relevante.

## Cómo informar de una vulnerabilidad

**No abras un issue público.** Usa el aviso privado de GitHub:

1. Ve a la pestaña [Security](https://github.com/IvelianK/Kintsugi/security) del repositorio.
2. Pulsa **Report a vulnerability**.
3. Describe el fallo, cómo reproducirlo y qué impacto tiene.

Solo yo veo el aviso hasta que se publique la corrección.

## Qué puedes esperar

| Paso | Plazo |
|---|---|
| Acuse de recibo | 72 horas |
| Primera valoración | 7 días |
| Corrección o plan de corrección | 30 días para fallos graves |

Cuando esté corregido, publicaré un aviso de seguridad con el crédito para quien lo encontró, salvo que prefieras el anonimato.

## Cómo comprobar la imagen

Cada imagen publicada lleva una atestación firmada de procedencia y su lista de componentes (SBOM). Para verificar que viene de este repositorio y de su workflow:

```bash
gh attestation verify oci://ghcr.io/iveliank/kintsugi-demo:latest -R IvelianK/Kintsugi
```

## Medidas activas en el repositorio

- Análisis de código con CodeQL en cada cambio y cada semana.
- Detección de secretos con bloqueo en el push.
- Alertas y actualizaciones automáticas de seguridad de Dependabot, también para las acciones del workflow y la imagen base.
- Acciones del workflow fijadas por SHA y permisos mínimos por trabajo.
- Rama `main` protegida: solo admite cambios por Pull Request con las comprobaciones en verde.
