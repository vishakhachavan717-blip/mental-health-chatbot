from pydantic import BaseModel, EmailStr
from datetime import datetime

# ============================
# User Schemas
# ============================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        orm_mode = True

# ============================
# Mood Entry Schemas
# ============================

class MoodEntryCreate(BaseModel):
    mood_text: str
    mood_score: int

class MoodEntryResponse(BaseModel):
    id: int
    mood_text: str
    mood_score: int
    date: datetime

    class Config:
        orm_mode = True

# ============================
# Chat Message Schemas
# ============================

class ChatMessageCreate(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    id: int
    message: str
    response: str
    timestamp: datetime

    class Config:
        orm_mode = True
