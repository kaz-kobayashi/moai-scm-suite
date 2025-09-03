#!/bin/bash

# Install Python dependencies
cd webapp
pip install -r requirements.txt

# Build frontend
cd ../frontend
npm install
npm run build

# Copy built frontend to webapp static directory
cd ..
mkdir -p webapp/static
cp -r frontend/build/* webapp/static/

# Start backend server
cd webapp
uvicorn app.main:app --host 0.0.0.0 --port 8000