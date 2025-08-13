# backend/main.py
# =======================

# 1) Load environment variables first
import os
from dotenv import load_dotenv

# Load variables from .env in the project root
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend import models, schemas
from backend.database import SessionLocal, engine
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from collections import Counter
from typing import List
import random

# Create DB tables (create mental_health.db in backend folder)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mental Health Chatbot Backend")

# ---------------- CORS CONFIGURATION ----------------
origins = [
    "https://menta-health-chatbot-frontend.onrender.com"  # production frontend
    # Add localhost URLs here if testing locally:
    # "http://localhost:5173",
    # "http://127.0.0.1:5173",
    # "http://localhost:3000",
    # "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # only allow specified frontend(s)
    allow_credentials=True,
    allow_methods=["*"],              # allow all HTTP methods
    allow_headers=["*"],              # allow all headers
)

# ---------------- Dependency: DB session ----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------- JWT & Auth config ----------------
SECRET_KEY = os.getenv("SECRET_KEY", "mysecretkey")  # pulled from .env if exists
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = HTTPBearer()  # using HTTPBearer to accept Authorization: Bearer <token>

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# ---------------------- ROUTES ----------------------
@app.get("/")
def root():
    return {"message": "Backend is running with DB & JWT!"}

# ---------------- Auth Endpoints ----------------
@app.post("/auth/signup")
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = get_password_hash(user.password)
    new_user = models.User(name=user.name, email=user.email, password_hash=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "user_id": new_user.id}

@app.post("/auth/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/auth/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# ---------------- Mood Endpoints ----------------
@app.post("/mood")
def add_mood(
    mood: schemas.MoodEntryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        new_mood = models.MoodEntry(
            user_id=current_user.id,
            mood_text=mood.mood_text,
            mood_score=mood.mood_score
        )
        db.add(new_mood)
        db.commit()
        db.refresh(new_mood)
        return {"message": "Mood entry added!", "mood_id": new_mood.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/mood/history", response_model=List[schemas.MoodEntryOut])
def get_mood_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.MoodEntry).filter(models.MoodEntry.user_id == current_user.id).order_by(models.MoodEntry.timestamp.desc()).all()

# ---------------- Chat Endpoints ----------------
@app.post("/chat", response_model=schemas.ChatHistoryOut)
def chat(
    user_message: schemas.ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    def generate_bot_response(text: str) -> str:
        t = text.lower()
        if "stress" in t or "anxious" in t:
            return random.choice([
                "I'm sorry you're feeling stressed. Try a 4-4-4 breathing exercise.",
                "Stress is hard — would you like a short grounding exercise?",
                "Try to take a small break and breathe; I'm here to listen."
            ])
        if "sad" in t or "depressed" in t:
            return random.choice([
                "I'm really sorry you're feeling down. Talking to someone trusted may help.",
                "Would you like suggestions for small activities that often help a bit?",
                "You are not alone — I can suggest resources if you'd like."
            ])
        if "happy" in t or "good" in t:
            return random.choice([
                "That's wonderful! What contributed to your good mood today?",
                "Great to hear! Sharing it can amplify the positive feeling.",
            ])
        if "tired" in t or "sleep" in t:
            return random.choice([
                "Rest is important. Can you try a short nap or a break?",
                "Hydration and a short walk sometimes helps with fatigue."
            ])
        return "Thanks for sharing. Would you like a relaxation or grounding exercise?"

    response_text = generate_bot_response(user_message.message)
    try:
        new_chat = models.ChatHistory(
            user_id=current_user.id,
            message=user_message.message,
            response=response_text
        )
        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)
        return new_chat
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/chat/history", response_model=List[schemas.ChatHistoryOut])
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.ChatHistory).filter(models.ChatHistory.user_id == current_user.id).order_by(models.ChatHistory.timestamp.asc()).all()

# ---------------- Analytics ----------------
@app.get("/analytics/mood-trend", response_model=List[schemas.MoodTrendOut])
def mood_trend(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    results = (
        db.query(
            func.date(models.MoodEntry.timestamp).label("date"),
            func.avg(models.MoodEntry.mood_score).label("average_score")
        )
        .filter(models.MoodEntry.user_id == current_user.id)
        .group_by(func.date(models.MoodEntry.timestamp))
        .order_by(func.date(models.MoodEntry.timestamp).asc())
        .all()
    )
    return [{"date": str(r.date), "average_score": float(r.average_score)} for r in results]

@app.get("/analytics/mood-summary", response_model=schemas.MoodSummaryOut)
def mood_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    moods = db.query(models.MoodEntry).filter(models.MoodEntry.user_id == current_user.id).all()
    positive = sum(1 for m in moods if m.mood_score > 6)
    negative = sum(1 for m in moods if m.mood_score < 4)
    neutral = len(moods) - positive - negative
    return {"positive": positive, "negative": negative, "neutral": neutral}

@app.get("/analytics/chat-words", response_model=List[schemas.ChatWordOut])
def chat_word_frequency(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    chats = db.query(models.ChatHistory).filter(models.ChatHistory.user_id == current_user.id).all()
    words = " ".join([c.message for c in chats]).lower().split()
    word_counts = Counter(words)
    return [{"word": w, "count": c} for w, c in word_counts.most_common(20)]
