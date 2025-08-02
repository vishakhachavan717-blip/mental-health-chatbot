from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Mental Health Chatbot Backend")

class Message(BaseModel):
    text: str

@app.get("/")
def root():
    return {"message": "Backend is running!"}

@app.post("/chat")
def chat(msg: Message):
    # placeholder ML logic
    return {"reply": f"You said: {msg.text}"}
