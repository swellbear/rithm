# Production Dockerfile - Ubuntu base for better native package support
FROM node:20-bullseye-slim

# Install system dependencies for native packages like canvas
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    python3-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install dependencies with legacy peer deps to resolve conflicts
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# Copy source code
COPY . .

# Build the application (if build script exists)
RUN npm run build || echo "Build script not found, continuing..."

# Create necessary directories
RUN mkdir -p data models temp

# Expose port
EXPOSE 5000

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=5000

# Start the application
CMD ["npm", "start"]
