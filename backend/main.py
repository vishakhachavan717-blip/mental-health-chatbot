# backend/main.py
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from backend.database import SessionLocal, engine
from backend import models
from backend.models import User, RefreshToken
from backend.schemas import UserCreate, UserResponse, TokenResponse  # define Pydantic schemas
from backend.utils import get_password_hash, verify_password  # hashing utils

# ----------------------
# CONFIG
# ----------------------
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

# ----------------------
# APP INIT
# ----------------------
app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create DB tables if not exist
models.Base.metadata.create_all(bind=engine)


# ----------------------
# UTILS
# ----------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: int, db: Session):
    token_data = {"sub": str(user_id), "type": "refresh"}
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    token_data.update({"exp": expire})

    refresh_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    # Store token in DB
    db_token = RefreshToken(
        user_id=user_id,
        token=refresh_token,
        issued_at=datetime.utcnow(),
        expires_at=expire
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return refresh_token


def get_current_user(db: Session = Depends(get_db), token: str = Depends(OAuth2PasswordRequestForm)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token.password, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise credentials_exception
    return user


# ----------------------
# AUTH ENDPOINTS
# ----------------------

@app.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # check if email exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = get_password_hash(user.password)
    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/login", response_model=TokenResponse)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(user.id, db)
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@app.post("/refresh", response_model=TokenResponse)
def refresh_access_token(refresh_token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    # Check if token exists in DB
    stored_token = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
    if not stored_token:
        raise HTTPException(status_code=401, detail="Token revoked or not found")

    # Generate new access token
    new_access_token = create_access_token({"sub": str(user_id)})
    return {"access_token": new_access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@app.post("/logout")
def logout_user(refresh_token: str, db: Session = Depends(get_db)):
    # Remove token from DB (revoke)
    db.query(RefreshToken).filter(RefreshToken.token == refresh_token).delete()
    db.commit()
    return {"message": "Successfully logged out"}


# ----------------------
# PROTECTED ROUTE EXAMPLE
# ----------------------
@app.get("/protected")
def protected_route(current_user: User = Depends(get_current_user)):
    return {"message": f"Hello {current_user.name}, you are authorized!"}


# ----------------------
# ADMIN ROUTE EXAMPLE
# ----------------------
@app.get("/admin")
def admin_route(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return {"message": f"Welcome Admin {current_user.name}"}
