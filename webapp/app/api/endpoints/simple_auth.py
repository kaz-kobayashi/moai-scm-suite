"""
シンプルな認証エンドポイント
"""
from typing import Dict, Any
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr

from app.simple_auth import (
    authenticate_user, 
    create_access_token, 
    get_current_user,
    require_auth,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class UserResponse(BaseModel):
    email: str
    full_name: str
    is_active: bool

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """メールアドレスとパスワードでログイン"""
    user = authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # トークンを作成
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "full_name": user["full_name"]},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user["email"],
            "full_name": user["full_name"],
            "is_active": user["is_active"]
        }
    }

@router.post("/login/form")
async def login_form(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2互換のフォームログイン（Swagger UI用）"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "full_name": user["full_name"]},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: Dict[str, Any] = Depends(require_auth)):
    """現在のユーザー情報を取得"""
    return {
        "email": current_user["email"],
        "full_name": current_user.get("full_name", ""),
        "is_active": True
    }

@router.get("/check")
async def check_auth(current_user: Dict[str, Any] = Depends(get_current_user)):
    """認証状態をチェック"""
    if current_user:
        return {
            "authenticated": True,
            "user": {
                "email": current_user["email"],
                "full_name": current_user.get("full_name", "")
            }
        }
    return {"authenticated": False}

@router.get("/test-users")
async def get_test_users():
    """テスト用ユーザー情報（開発環境のみ）"""
    return {
        "message": "テスト用アカウント",
        "users": [
            {
                "email": "admin@moai-lab.jp",
                "password": "moai2024",
                "role": "管理者"
            },
            {
                "email": "user@moai-lab.jp",
                "password": "user2024", 
                "role": "一般ユーザー"
            }
        ]
    }