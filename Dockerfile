# Simple single-stage production Dockerfile
FROM node:20-alpine

# Install system dependencies for Python ML packages
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    python3-dev

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
