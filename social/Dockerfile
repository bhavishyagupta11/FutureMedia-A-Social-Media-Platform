# ==========================================
# FutureMedia React Frontend - Production Multi-Stage Build
# ==========================================

# ── Stage 1: Build Application ────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Deterministic dependency installation
COPY package*.json ./
RUN npm ci

# Default build arguments for API and WebSocket URLs
ARG REACT_APP_API_BASE_URL=http://localhost:8080
ARG REACT_APP_SOCKET_URL=http://localhost:8080

ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL
ENV CI=false

# Copy source code and build
COPY . .
RUN npm run build

# ── Stage 2: Production Nginx Server ──────
FROM nginx:alpine

# Remove default Nginx configuration
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom Nginx configuration with SPA fallback & API proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

# Health check against Nginx health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]