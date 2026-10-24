# Imagen de la demo: nginx sin privilegios sirviendo ficheros estáticos.
# Construir desde la raíz del repositorio:
#   docker build -f deploy/Dockerfile -t kintsugi-demo .
FROM nginxinc/nginx-unprivileged:1.31.7-alpine

LABEL org.opencontainers.image.title="kintsugi-demo" \
      org.opencontainers.image.description="Demo navegable de una plataforma de gestión de servicio técnico de campo" \
      org.opencontainers.image.source="https://github.com/IvelianK/Kintsugi" \
      org.opencontainers.image.licenses="MIT"

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY demo/ /usr/share/nginx/html/

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
