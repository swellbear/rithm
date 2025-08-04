# Multi-stage build for production deployment on Render
FROM node:20-alpine AS builder

# Install comprehensive system dependencies for all native modules (Grok-enhanced)
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-numpy \
    py3-pandas \
    py3-scikit-learn \
    build-base \
    python3-dev \
    cairo-dev \
    cairo-tools \
    cmake \
    giflib-dev \
    git \
    libjpeg-turbo-dev \
    librsvg-dev \
    pango-dev \
    pixman-dev \
    pkg-config \
    musl-dev \
    pangomm-dev \
    freetype-dev \
    g++ \
    make \
    libc6-compat \
    glib-dev \
    expat-dev \
    libpng-dev \
    fontconfig-dev \
    harfbuzz-dev

# Set Python path and build environment
ENV PYTHON=/usr/bin/python3
ENV CC=gcc
ENV CXX=g++

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Update npm to latest version (Grok recommendation)
RUN npm install -g npm@latest

# Configure npm for native compilation
RUN npm config set python ${PYTHON} && \
    npm config set build-from-source true && \
    npm config set canvas_binary_host_mirror https://github.com/Automattic/node-canvas/releases/download/

# Install all dependencies including native modules
RUN npm install --legacy-peer-deps --verbose

# Copy all source code
COPY . .

# Build the application
RUN npm run build

# Production stage with runtime dependencies
FROM node:20-alpine AS production

# Install runtime dependencies for native modules (Grok-optimized)
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-numpy \
    py3-pandas \
    py3-scikit-learn \
    cairo \
    giflib \
    libjpeg-turbo \
    librsvg \
    pango \
    pixman \
    freetype \
    fontconfig \
    ttf-dejavu \
    glib \
    expat \
    libpng \
    harfbuzz

# Set working directory
WORKDIR /app

# Copy built application and dependencies from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server ./server

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 10000

# Set production environment
ENV NODE_ENV=production
ENV PORT=10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').request('http://localhost:10000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1)).end()"

# Start the application
CMD ["node", "dist/index.js"]
