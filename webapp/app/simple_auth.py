"""
シンプルなメール/パスワード認証
"""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# 設定
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# パスワードハッシュ化
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTPベアラー認証
security = HTTPBearer(auto_error=False)

# ハードコードされたユーザー（本番環境ではデータベースを使用）
USERS_DB = {
    "admin@moai-lab.jp": {
        "email": "admin@moai-lab.jp",
        "hashed_password": pwd_context.hash("moai2024"),  # パスワード: moai2024
        "full_name": "管理者",
        "is_active": True,
    },
    "user@moai-lab.jp": {
        "email": "user@moai-lab.jp", 
        "hashed_password": pwd_context.hash("user2024"),  # パスワード: user2024
        "full_name": "一般ユーザー",
        "is_active": True,
    }
}

def verify_password(plain_password, hashed_password):
    """パスワードを検証"""
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """ユーザー認証"""
    user = USERS_DB.get(email)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """アクセストークンを作成"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """トークンを検証"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return {"email": email, **payload}
    except JWTError:
        return None

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """現在のユーザーを取得"""
    if not credentials:
        return None
    
    token = credentials.credentials
    user_info = verify_token(token)
    return user_info

def require_auth(
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
) -> Dict[str, Any]:
    """認証必須のエンドポイント用"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証が必要です",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user