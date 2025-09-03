# Multi-stage build for optimized image size

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend

# Install dependencies
RUN apk add --no-cache git python3 make g++

# Copy package.json first
COPY frontend/package.json ./
# Copy package-lock.json if it exists
COPY frontend/package-lock.json* ./

# Clean install dependencies
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY frontend/ .
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS="--max_old_space_size=4096"
RUN npm run build

# Stage 2: Python application
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY webapp/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY webapp/app ./app
COPY nbs/core.py ./

# Copy MetroVI binaries (select appropriate one during deployment)
COPY webapp/metroVI-linux-intel ./metroVI
RUN chmod +x ./metroVI

# Copy built frontend from stage 1
COPY --from=frontend-builder /frontend/build ./static

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Expose port
EXPOSE 8080

# Run the application
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]