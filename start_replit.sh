#!/bin/bash

# Replit startup script for MOAI SCM Suite

echo "🚀 Starting MOAI SCM Suite on Replit..."

# Set environment variables
export PORT=${PORT:-8080}
export PYTHONUNBUFFERED=1

# Install Python dependencies
echo "📦 Installing Python dependencies..."
cd webapp
pip install -r requirements.txt

# Build frontend (if not already built)
echo "🏗️ Building frontend..."
cd ../frontend

# Check if build directory exists and is recent
if [ ! -d "build" ] || [ ! -f "build/static/js/main.*.js" ]; then
    echo "Building frontend from source..."
    npm install
    GENERATE_SOURCEMAP=false npm run build
    echo "✅ Frontend built successfully"
else
    echo "✅ Frontend build already exists"
fi

# Copy build to webapp static directory
echo "📁 Copying frontend to backend..."
rm -rf ../webapp/static
cp -r build ../webapp/static
echo "✅ Frontend copied to backend static directory"

# Start the application
echo "🌟 Starting FastAPI server on port $PORT..."
cd ../webapp
exec python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT --reload