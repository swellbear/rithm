# Use Node.js 20 Alpine as base
FROM node:20-alpine AS builder

# Install Python and system dependencies for ML
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

# Copy package files and install dependencies with legacy peer deps
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install Python and system dependencies for production
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

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server ./server

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Expose port
EXPOSE 10000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=10000

# Start the application
CMD ["node", "dist/index.js"]
