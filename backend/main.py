from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models, schemas
import hashlib

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mental Health Chatbot Backend")

# Dependency: Get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "Backend is running with DB!"}

@app.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password before saving
    hashed_pw = hashlib.sha256(user.password.encode()).hexdigest()
    new_user = models.User(name=user.name, email=user.email, password_hash=hashed_pw)@app.post("/chat")
def chat(user_message: schemas.ChatMessageCreate, db: Session = Depends(get_db)):
    user_id = 1  # Temporary until login is added

    # Placeholder ML logic (later replace with AI model)
    bot_response = f"I understand you said: {user_message.message}"

    new_chat = models.ChatHistory(
        user_id=user_id,
        message=user_message.message,
        response=bot_response
    )
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)

    return {
        "message": new_chat.message,
        "response": new_chat.response,
        "timestamp": new_chat.timestamp
    }


    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully!", "user_id": new_user.id}

@app.post("/mood")
def add_mood(mood: schemas.MoodEntryCreate, db: Session = Depends(get_db)):
    # For now, we’ll assign user_id=1 (later we’ll link to logged-in user)
    user_id = 1  

    new_mood = models.MoodEntry(
        user_id=user_id,
        mood_text=mood.mood_text,
        mood_score=mood.mood_score
    )
    db.add(new_mood)
    db.commit()
    db.refresh(new_mood)

    return {"message": "Mood entry added!", "mood_id": new_mood.id}

@app.post("/chat")
def chat(user_message: schemas.ChatMessageCreate, db: Session = Depends(get_db)):
    user_id = 1  # Temporary until login is added

    # Placeholder ML logic (later replace with AI model)
    bot_response = f"I understand you said: {user_message.message}"

    new_chat = models.ChatHistory(
        user_id=user_id,
        message=user_message.message,
        response=bot_response
    )
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)

    return {
        "message": new_chat.message,
        "response": new_chat.response,
        "timestamp": new_chat.timestamp
    }


