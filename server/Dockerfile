# ==========================================
# FutureMedia Node.js API Server - Production Build
# ==========================================

FROM node:20-alpine

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

# Install production dependencies deterministically
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code (excluding items in .dockerignore)
COPY . .

# Ensure storage directories exist with appropriate non-root permissions
RUN mkdir -p uploads logs \
    && chown -R node:node /app

# Use non-root node user for container security
USER node

EXPOSE 8080

# Production health check testing HTTP status 200 on /health
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "src/index.js"]