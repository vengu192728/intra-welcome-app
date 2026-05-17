# Build: docker build -f deploy/Dockerfile -t intra-welcome-app .
# Run:   docker run -d -p 8080:80 --name intra-welcome intra-welcome-app

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

ARG VITE_BASE_PATH=/
ARG VITE_AUTH_API_URL=
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY deploy/nginx-docker.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1
