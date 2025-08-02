# Production-ready ML Platform Dockerfile
FROM node:20-alpine AS builder

# Install system dependencies needed for building
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    python3-dev

# Set working directory
WORKDIR /app

# Copy package files and install all dependencies (needed for build)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN node build-production.js

# Production stage
FROM node:20-alpine AS production

# Install system dependencies for Python ML packages
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-numpy \
    py3-pandas \
    py3-scikit-learn \
    build-base \
    python3-dev

# Set working directory
WORKDIR /app

# Create necessary directories
RUN mkdir -p data models temp

# Copy built application from builder stage
COPY --from=builder /app/dist/ ./

# Install only production dependencies using the filtered package.json
RUN npm install --only=production --ignore-scripts

# Expose port
EXPOSE 5000

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=5000

# Start the application
CMD ["node", "production-server.js"]