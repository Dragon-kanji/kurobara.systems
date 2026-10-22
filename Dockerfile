# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.30.6-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03

FROM ${NODE_IMAGE} AS build
WORKDIR /src
COPY . .
RUN npm ci
RUN npm run build

FROM ${NGINX_IMAGE} AS runtime
ENV CONTACT_HUB_PROXY_TOKEN=""
COPY security-headers.conf /etc/nginx/security-headers.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /src/dist/ /usr/share/nginx/html/

USER 101
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:8080/healthz || exit 1
