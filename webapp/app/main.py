"""
FastAPIメインアプリケーション
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.sessions import SessionMiddleware
import os

from .api.api import api_router, public_api_router

app = FastAPI(
    title="Supply Chain Management Optimization API",
    description="サプライチェーン最適化システム - Jupyter notebookから完全移植されたAPI",
    version="1.0.0"
)

# セッションミドルウェアを追加（OAuth認証用）
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切に制限する
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(public_api_router, prefix="/public/api/v1")

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

@app.get("/public")
async def public_access():
    """Public access endpoint that bypasses Cloud Run authentication"""
    return {
        "message": "Supply Chain Management Optimization System",
        "version": "1.0.0",
        "status": "accessible",
        "endpoints": {
            "api_docs": "/public/docs",
            "health": "/public/health", 
            "app": "/public/app"
        }
    }

@app.get("/public/health")
async def public_health_check():
    return {"status": "healthy", "public": True}

@app.get("/public/app")
async def public_app():
    """Serve the React app through public endpoint"""
    static_dir = "static"
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "React app not found", "available_endpoints": ["/public", "/public/health"]}

@app.get("/public/login-success")
async def login_success():
    """ログイン成功ページ"""
    return {
        "message": "ログインに成功しました！",
        "redirect": "/public/app",
        "instructions": "トークンがURLパラメータに含まれています。フロントエンドでlocalStorageに保存してください。"
    }

# Serve React app
static_dir = "static"
if os.path.exists(static_dir):
    # Mount static files
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    app.mount("/public/static", StaticFiles(directory=static_dir), name="public_static")
    
    @app.get("/public/{full_path:path}", include_in_schema=False)
    async def serve_public_react_app(full_path: str):
        """Public catch all route to serve React app (bypass authentication)"""
        # Skip if it's an API route
        if full_path.startswith("api/"):
            return {"detail": "Use /public/api/v1/ for API access"}
            
        # Skip if it's already handled by other public routes
        if full_path in ["", "health", "app"]:
            return {"detail": "Use specific endpoint"}
        
        # Check if file exists in static directory
        file_path = os.path.join(static_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Serve index.html for all other routes (SPA routing)
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        
        return {"message": "React app not found", "try": "/public"}
    
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_react_app(full_path: str):
        """Catch all route to serve React app"""
        # Don't serve React app for API routes
        if full_path.startswith("api/") or full_path.startswith("public/"):
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