"""
FastAPIメインアプリケーション
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from .api.api import api_router

app = FastAPI(
    title="Supply Chain Management Optimization API",
    description="サプライチェーン最適化システム - Jupyter notebookから完全移植されたAPI",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切に制限する
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "Supply Chain Management Optimization API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Serve React app
static_dir = "static"
if os.path.exists(static_dir):
    # Mount static files
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_react_app(full_path: str):
        """Catch all route to serve React app"""
        # Don't serve React app for API routes
        if full_path.startswith("api/"):
            return {"detail": "Not found"}
        
        # Check if file exists in static directory
        file_path = os.path.join(static_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Serve index.html for all other routes (SPA routing)
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        
        return {"detail": "Not found"}