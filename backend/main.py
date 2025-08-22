from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import json
from datetime import datetime
from sqlalchemy.orm import Session

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

# Import database and models
from database import get_db, create_tables
from models import User, ChatSession, ChatMessage, Medication
from auth import get_password_hash, authenticate_user, create_access_token, get_current_user

load_dotenv()

import re

# Initialize database tables
create_tables()

def format_response(text: str) -> str:
    """
    Format AI response into clean Markdown with:
    - Proper headings
    - Consistent bullet points
    - Bolded keywords
    - Separated disclaimers
    """
    import re

    if not text:
        return ""

    # Ensure bullets use '-' instead of '*'
    text = re.sub(r"^\s*\*", "-", text, flags=re.MULTILINE)

    # Fix bullets like "- **Thing:**" → keep them consistent
    text = re.sub(r"-\s*\*\*(.+?):\*\*", r"- **\1**:", text)

    # Add line breaks after headings (## or ###)
    text = re.sub(r"(#+\s[^\n]+)", r"\1\n", text)

    # Add spacing after sentences
    text = re.sub(r'([.!?])\s+(?=[A-Z])', r'\1\n\n', text)

    return text.strip()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    agent_type: Optional[str] = "general"
    user_id: Optional[int] = None  # Add user identification

class ChatResponse(BaseModel):
    response: str
    session_id: str

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")

# Prompt templates for each agent type
PROMPT_TEMPLATES = {
    "general": (
        "You are a helpful general health assistant. "
        "Always format your response in **Markdown** with:\n"
        "- Clear headings (## Heading)\n"
        "- Bullet points (- item)\n"
        "- Bold keywords (**word**)\n\n"
        "Answer the following user question:\nUser: {message}"
    ),
    "symptom": (
        "You are a symptom checker AI. "
        "Always format your response in **Markdown** with:\n"
        "- Clear sections (## Symptoms, ## Possible Causes, ## Next Steps)\n"
        "- Bullet points (- item)\n"
        "- Bold important terms (**term**)\n\n"
        "User: {message}"
    ),
    "nutrition": (
        "You are a nutrition expert AI. "
        "Always format your response in **Markdown** with:\n"
        "- Headings for structure (## Diet Tips, ## Foods to Include, ## Foods to Avoid)\n"
        "- Bullet points for lists\n"
        "- Bold important nutrients and food names\n\n"
        "User: {message}"
    ),
    "mental-health": (
        "You are a mental health coach AI. "
        "Always format your response in **Markdown** with:\n"
        "- Headings for clarity (## Coping Strategies, ## Resources, ## Self-Care)\n"
        "- Bullet points for advice\n"
        "- Bold key ideas for emphasis\n\n"
        "User: {message}"
    ),
} 

def get_prompt(agent_type: str, message: str) -> str:
    print("DEBUG get_prompt called with agent_type:", agent_type, "message:", message)
    template = PROMPT_TEMPLATES.get(agent_type, PROMPT_TEMPLATES["general"])
    print("DEBUG get_prompt template:", template)
    print("DEBUG get_prompt message:", message)
    return template.format(message=message)

def llm_node(state: dict):
    print("DEBUG llm_node state at entry:", state)
    agent_type = state.get("agent_type", "general")
    message = state.get("message", "")
    prompt = get_prompt(agent_type, message)
    print("DEBUG llm_node prompt:", prompt)
    try:
        response = llm.invoke(prompt)
        print("DEBUG llm_node raw response:", response)
        # Try to extract the content robustly
        if hasattr(response, "content") and response.content:
            state["response"] = response.content
        elif hasattr(response, "text") and response.text:
            state["response"] = response.text
        elif isinstance(response, str):
            state["response"] = response
        else:
            state["response"] = str(response)
        print("DEBUG llm_node extracted response:", state["response"])
    except Exception as e:
        print("ERROR in llm_node:", e)
        state["response"] = f"Internal error in llm_node: {str(e)}"
    return state

graph = StateGraph(dict)
graph.add_node("llm_node", llm_node)
graph.set_entry_point("llm_node")
graph.add_edge("llm_node", END)
chat_workflow = graph.compile()

class SymptomDetail(BaseModel):
    name: str
    severity: str
    bodyPart: str

class SymptomAssessmentRequest(BaseModel):
    symptoms: List[SymptomDetail]

class SymptomAssessmentResponse(BaseModel):
    riskLevel: str
    conditions: list
    recommendations: list

class MedicationCreate(BaseModel):
    name: str
    dosage: str
    frequency: str
    timeToTake: List[str]
    prescribedBy: str
    startDate: datetime
    instructions: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "Welcome to the Health Chatbot FastAPI backend!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/signup")
async def signup(username: str, email: str, password: str, db: Session = Depends(get_db)):
    """User signup endpoint"""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already registered")
        
        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user with hashed password
        password_hash = get_password_hash(password)
        new_user = User(username=username, email=email, password_hash=password_hash)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {"success": True, "message": "User created successfully", "user_id": new_user.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@app.post("/api/signin")
async def signin(username: str, password: str, db: Session = Depends(get_db)):
    """User signin endpoint"""
    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "username": user.username}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username
    }

@app.post("/api/users")
async def create_user(username: str, email: str, db: Session = Depends(get_db)):
    """Create a test user for development (legacy endpoint)"""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            return {"success": True, "user": existing_user, "message": "User already exists"}
        
        # Create new user with default password
        password_hash = get_password_hash("password123")  # Default password
        new_user = User(username=username, email=email, password_hash=password_hash)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {"success": True, "user": new_user, "message": "User created successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@app.get("/api/users")
async def get_users(db: Session = Depends(get_db)):
    """Get all users for testing"""
    users = db.query(User).all()
    return {"users": users}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    print("DEBUG /chat received:", request)
    
    try:
        # Create a new chat session first
        user_id = request.user_id or 1  # Default to user 1 for testing
        session_id = f"session_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Create chat session
        chat_session = ChatSession(
            user_id=user_id,
            session_id=session_id,
            agent_type=request.agent_type
        )
        db.add(chat_session)
        db.flush()  # Get the ID without committing yet
        
        # Store user message
        user_message = ChatMessage(
            session_id=chat_session.id,  # Use the actual session ID
            message_type="user",
            content=request.message,
            message_metadata={"agent_type": request.agent_type}
        )
        db.add(user_message)
        
        # Generate AI response
        state = {"agent_type": request.agent_type, "message": request.message}
        try:
            result = chat_workflow.invoke(state)
            if not result or not isinstance(result, dict):
                response_text = "Sorry, I couldn't generate a response (workflow returned nothing)."
            else:
                raw_response = result.get("response", "Sorry, I couldn't generate a response.")
                response_text = format_response(raw_response)
            
            # Store AI response
            ai_message = ChatMessage(
                session_id=chat_session.id,  # Use the actual session ID
                message_type="assistant",
                content=response_text,
                message_metadata={"agent_type": request.agent_type}
            )
            db.add(ai_message)
            
            # Commit everything to database
            db.commit()
            
            print(f"DEBUG: Chat session {chat_session.id} created, messages stored")
            return ChatResponse(response=response_text, session_id=session_id)

        except Exception as e:
            db.rollback()
            print("ERROR in AI response generation:", e)
            raise HTTPException(status_code=500, detail=f"AI response error: {str(e)}")

    except Exception as e:
        db.rollback()
        print("ERROR in /chat:", e)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/assess-symptoms", response_model=SymptomAssessmentResponse)
async def assess_symptoms(request: SymptomAssessmentRequest):
    symptoms_text = "\n".join(
        [f"- {s.name} (Severity: {s.severity}, Body Part: {s.bodyPart})" for s in request.symptoms]
    )
    prompt = (
        "You are a medical AI assistant. Given these symptoms, provide:\n"
        "1. Risk level (low, moderate, high)\n"
        "2. 2-3 possible conditions with probability and urgency\n"
        "3. 3-4 recommendations for the user\n"
        f"Symptoms:\n{symptoms_text}\n"
        "Respond in JSON with keys: riskLevel, conditions, recommendations."
    )
    response = llm.invoke(prompt)
    import json, re
    raw = response.content if hasattr(response, 'content') else response
    # Remove code block markers and any leading/trailing whitespace
    cleaned = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()
    # Extract the first {...} block if extra text is present
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if match:
        cleaned = match.group(0)
    try:
        data = json.loads(cleaned)
        return data
    except Exception as e:
        return {
            "riskLevel": "unknown",
            "conditions": [],
            "recommendations": [f"Could not parse AI response: {str(e)}", "Raw response: " + str(raw)]
        }

@app.get("/api/medications")
async def get_medications(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get all medications for a user"""
    if user_id is None:
        # For testing purposes, return all medications
        medications = db.query(Medication).all()
    else:
        medications = db.query(Medication).filter(Medication.user_id == user_id).all()
    return {"medications": medications}

@app.post("/api/medications")
async def create_medication(medication: MedicationCreate, user_id: Optional[int] = 1, db: Session = Depends(get_db)):
    """Create a new medication"""
    db_medication = Medication(
        user_id=user_id,
        name=medication.name,
        dosage=medication.dosage,
        frequency=medication.frequency,
        time_to_take=medication.timeToTake,
        prescribed_by=medication.prescribedBy,
        start_date=medication.startDate,
        instructions=medication.instructions
    )
    
    db.add(db_medication)
    db.commit()
    db.refresh(db_medication)
    
    return {"success": True, "medication": db_medication}

@app.delete("/api/medications/{medication_id}")
async def delete_medication(medication_id: int, user_id: Optional[int] = 1, db: Session = Depends(get_db)):
    """Delete a medication"""
    medication = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.user_id == user_id
    ).first()
    
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    db.delete(medication)
    db.commit()
    
    return {"success": True, "message": "Medication deleted successfully"}

# Add new endpoints for chat history
@app.get("/api/chat-history/{user_id}")
async def get_chat_history(user_id: int, db: Session = Depends(get_db)):
    """Get chat history for a user"""
    sessions = db.query(ChatSession).filter(ChatSession.user_id == user_id).all()
    return {"sessions": sessions}

@app.get("/api/chat-messages/{session_id}")
async def get_chat_messages(session_id: int, db: Session = Depends(get_db)):
    """Get messages for a specific chat session"""
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).all()
    return {"messages": messages}
