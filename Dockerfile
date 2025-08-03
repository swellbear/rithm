# Optimized Multi-stage Dockerfile - Production Ready
# Stage 1: Builder (includes dev dependencies for build)
FROM node:20-bookworm-slim AS builder

# Install system dependencies for native packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    python3-dev \
    git \
    cmake \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Update npm to latest version
RUN npm install -g npm@latest

WORKDIR /app

# Copy package files and install ALL dependencies (including dev for build)
COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy source code and build the application  
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production runtime (lean image)
FROM node:20-bookworm-slim

# Install only runtime dependencies (no build tools needed)
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install ONLY production dependencies
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Copy necessary runtime files
COPY shared ./shared

# Create necessary directories
RUN mkdir -p data models temp

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["npm", "start"]
