"""
認証エンドポイント
"""

import os
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse, JSONResponse
from authlib.integrations.starlette_client import OAuthError
from datetime import timedelta

from app.auth import oauth, AuthService, get_current_user, require_auth

router = APIRouter()

@router.get("/login")
async def login(request: Request):
    """Google OAuth ログイン開始"""
    if not oauth._registry.get('google'):
        return JSONResponse(
            status_code=501,
            content={
                "error": "Google OAuth が設定されていません",
                "message": "GOOGLE_CLIENT_ID 環境変数が必要です"
            }
        )
    
    # リダイレクトURIを設定
    redirect_uri = str(request.url_for('auth_callback'))
    
    try:
        return await oauth.google.authorize_redirect(request, redirect_uri)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "認証エラー", "message": str(e)}
        )

@router.get("/callback")
async def auth_callback(request: Request):
    """Google OAuth コールバック"""
    if not oauth._registry.get('google'):
        return JSONResponse(
            status_code=501,
            content={"error": "Google OAuth が設定されていません"}
        )
    
    try:
        # Googleからトークンを取得
        token = await oauth.google.authorize_access_token(request)
        
        # ユーザー情報を取得
        user_info = token.get('userinfo')
        if not user_info:
            # idトークンから情報を取得
            user_info = AuthService.verify_google_token(token.get('id_token', ''))
        
        if not user_info:
            raise HTTPException(status_code=400, detail="ユーザー情報を取得できませんでした")
        
        # セッションにユーザー情報を保存
        user_data = {
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "picture": user_info.get("picture"),
            "sub": user_info.get("sub")  # Google user ID
        }
        
        request.session["user"] = user_data
        
        # JWTトークンも生成
        access_token_expires = timedelta(minutes=30)
        access_token = AuthService.create_access_token(
            data=user_data, expires_delta=access_token_expires
        )
        
        # クエリパラメータでトークンを渡してフロントエンドにリダイレクト
        frontend_url = f"/public/login-success?token={access_token}"
        return RedirectResponse(url=frontend_url)
        
    except OAuthError as e:
        return JSONResponse(
            status_code=400,
            content={"error": "OAuth認証エラー", "message": str(e)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "認証処理エラー", "message": str(e)}
        )

@router.get("/logout")
async def logout(request: Request):
    """ログアウト"""
    # セッションからユーザー情報を削除
    request.session.pop("user", None)
    
    return {"message": "ログアウトしました"}

@router.get("/user")
async def get_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """現在のユーザー情報を取得"""
    if not current_user:
        return {"authenticated": False, "user": None}
    
    return {
        "authenticated": True,
        "user": current_user
    }

@router.get("/protected")
async def protected_endpoint(current_user: Dict[str, Any] = Depends(require_auth)):
    """認証が必要なテストエンドポイント"""
    return {
        "message": f"こんにちは、{current_user.get('name', 'ユーザー')}さん！",
        "user": current_user
    }