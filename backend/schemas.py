# backend/schemas.py
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

# -------------------------
# User Schemas
# -------------------------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        orm_mode = True

# -------------------------
# Mood Entry Schemas
# -------------------------
class MoodEntryCreate(BaseModel):
    mood_text: str
    mood_score: int

class MoodEntryOut(BaseModel):
    id: int
    mood_text: str
    mood_score: int
    timestamp: datetime

    class Config:
        orm_mode = True

# -------------------------
# Chat Message Schemas
# -------------------------
class ChatMessageCreate(BaseModel):
    message: str

class ChatHistoryOut(BaseModel):
    id: int
    message: str
    response: str
    timestamp: datetime

    class Config:
        orm_mode = True

# -------------------------
# Analytics Schemas
# -------------------------
class MoodTrendOut(BaseModel):
    date: str
    average_score: float

class MoodSummaryOut(BaseModel):
    positive: int
    negative: int
    neutral: int

class ChatWordOut(BaseModel):
    word: str
    count: int
