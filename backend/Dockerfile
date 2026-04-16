FROM node:20-alpine

# Set production environment
ENV NODE_ENV=production

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Use npm ci for deterministic, faster installs
RUN npm ci --only=production

# Copy application source
COPY . .

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5001

# Use dumb-init or node directly with proper signal forwarding
CMD ["node", "server.js"]
