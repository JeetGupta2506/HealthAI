from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import json
from datetime import datetime, timezone
# Enable database imports
from sqlalchemy.orm import Session
from database import get_db, create_tables
from models import User, ChatSession, ChatMessage, Medication
from auth import get_password_hash, authenticate_user, create_access_token, get_current_user

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

load_dotenv()

import re

# Medication storage
MEDICATIONS_FILE = "medications.json"

def load_medications():
    """Load medications from JSON file"""
    try:
        if os.path.exists(MEDICATIONS_FILE):
            with open(MEDICATIONS_FILE, 'r') as f:
                data = json.load(f)
                # Convert string dates back to datetime objects
                for med in data:
                    if 'startDate' in med and isinstance(med['startDate'], str):
                        med['startDate'] = datetime.fromisoformat(med['startDate'])
                    if 'endDate' in med and isinstance(med['endDate'], str):
                        med['endDate'] = datetime.fromisoformat(med['endDate'])
                return data
        return []
    except Exception as e:
        print(f"Error loading medications: {e}")
        return []

def save_medications(medications):
    """Save medications to JSON file"""
    try:
        # Convert datetime objects to strings for JSON serialization
        data_to_save = []
        for med in medications:
            med_copy = med.copy()
            if 'startDate' in med_copy and isinstance(med_copy['startDate'], datetime):
                med_copy['startDate'] = med_copy['startDate'].isoformat()
            if 'endDate' in med_copy and isinstance(med_copy['endDate'], datetime):
                med_copy['endDate'] = med_copy['endDate'].isoformat()
            data_to_save.append(med_copy)
        
        with open(MEDICATIONS_FILE, 'w') as f:
            json.dump(data_to_save, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving medications: {e}")
        return False

def format_response(text: str) -> str:
    """
    Format AI response into clean Markdown with:
    - Proper headings
    - Consistent bullet points
    - Bolded keywords
    - Separated disclaimers
    """

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

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    try:
        from database import migrate_database
        migrate_database()
        print("Database migration completed successfully")
    except Exception as e:
        print(f"Error during database migration: {e}")
        # Fallback to regular table creation
        try:
            from database import create_tables
            create_tables()
            print("Database tables created successfully (fallback)")
        except Exception as e2:
            print(f"Error creating database tables: {e2}")

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
    response_style: Optional[str] = "concise"  # Add response style parameter
    user_id: Optional[int] = None  # Add user identification

class ChatResponse(BaseModel):
    response: str
    session_id: str

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str

class SigninRequest(BaseModel):
    username: str
    password: str

class SymptomAssessmentRequest(BaseModel):
    symptoms: List[dict]

class SymptomAssessmentResponse(BaseModel):
    riskLevel: str
    conditions: List[dict]
    immediateActions: List[str]
    precautions: List[str]
    medications: List[str]
    lifestyleChanges: List[str]
    whenToSeekHelp: List[str]
    followUp: str

llm = None

# Initialize LLM only if API key is available
try:
    api_key = os.getenv("GOOGLE_API_KEY")
    print(f"DEBUG: Google API key found: {api_key is not None}")
    if api_key and api_key != "your_google_api_key_here":
        print("DEBUG: Initializing LLM with Google API key")
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
        print("DEBUG: LLM initialized successfully")
    else:
        print("Warning: Google API key not set. AI features will be limited.")
        print("DEBUG: Set GOOGLE_API_KEY environment variable to enable AI features")
except Exception as e:
    print(f"Warning: Could not initialize LLM: {e}. AI features will be limited.")
    print(f"DEBUG: LLM initialization error details: {e}")

# Prompt templates for each agent type
PROMPT_TEMPLATES = {
    "general": (
        "You are a helpful general health assistant. "
        "Response Style: {response_style}\n\n"
        "If response_style is 'concise': Keep your answer brief and to the point (2-3 sentences max). "
        "If response_style is 'detailed': Provide comprehensive information with examples and explanations.\n\n"
        "Always format your response in **Markdown** with:\n"
        "- Clear headings (## Heading)\n"
        "- Bullet points (- item)\n"
        "- Bold keywords (**word**)\n\n"
        "Answer the following user question:\nUser: {message}"
    ),
    "symptom": (
        "You are a symptom checker AI. "
        "Response Style: {response_style}\n\n"
        "If response_style is 'concise': Give brief, direct answers (2-3 sentences max). "
        "If response_style is 'detailed': Provide comprehensive analysis with multiple sections.\n\n"
        "Always format your response in **Markdown** with:\n"
        "- Clear sections (## Symptoms, ## Possible Causes, ## Next Steps)\n"
        "- Bullet points (- item)\n"
        "- Bold important terms (**term**)\n\n"
        "User: {message}"
    ),
    "nutrition": (
        "You are a nutrition expert AI. "
        "Response Style: {response_style}\n\n"
        "If response_style is 'concise': Keep advice brief and actionable (2-3 sentences max). "
        "If response_style is 'detailed': Provide comprehensive guidance with examples and explanations.\n\n"
        "Always format your response in **Markdown** with:\n"
        "- Headings for structure (## Diet Tips, ## Foods to Include, ## Foods to Avoid)\n"
        "- Bullet points for lists\n"
        "- Bold important nutrients and food names\n\n"
        "User: {message}"
    ),
    "mental-health": (
        "You are a mental health coach AI. "
        "Response Style: {response_style}\n\n"
        "If response_style is 'concise': Give brief, supportive advice (2-3 sentences max). "
        "If response_style is 'detailed': Provide comprehensive strategies with examples and resources.\n\n"
        "Always format your response in **Markdown** with:\n"
        "- Headings for clarity (## Coping Strategies, ## Resources, ## Self-Care)\n"
        "- Bullet points for advice\n"
        "- Bold key ideas for emphasis\n\n"
        "User: {message}"
    ),
} 

def get_prompt(agent_type: str, message: str, response_style: str = "concise") -> str:
    print("DEBUG get_prompt called with agent_type:", agent_type, "message:", message, "response_style:", response_style)
    template = PROMPT_TEMPLATES.get(agent_type, PROMPT_TEMPLATES["general"])
    print("DEBUG get_prompt template:", template)
    print("DEBUG get_prompt message:", message)
    return template.format(message=message, response_style=response_style)

def llm_node(state: dict):
    print("DEBUG llm_node state at entry:", state)
    agent_type = state.get("agent_type", "general")
    message = state.get("message", "")
    response_style = state.get("response_style", "concise")
    
    # Check if LLM is available
    if llm is None:
        # Provide fallback response when LLM is not available
        fallback_responses = {
            "general": "I'm currently in maintenance mode. Please try again later or contact support.",
            "symptom": "Symptom checking is temporarily unavailable. Please consult a healthcare professional for medical advice.",
            "nutrition": "Nutrition advice is temporarily unavailable. Please consult a registered dietitian for personalized guidance.",
            "mental-health": "Mental health support is temporarily unavailable. Please contact a mental health professional or crisis hotline if you need immediate help."
        }
        state["response"] = fallback_responses.get(agent_type, fallback_responses["general"])
        return state
    
    prompt = get_prompt(agent_type, message, response_style)
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

class Medication(BaseModel):
    id: str
    name: str
    dosage: str
    frequency: str
    prescribedBy: str
    startDate: datetime
    endDate: Optional[datetime] = None
    totalDoses: Optional[int] = None
    instructions: Optional[str] = None

class MedicationCreate(BaseModel):
    name: str
    dosage: str
    frequency: str
    prescribedBy: str
    startDate: datetime
    endDate: Optional[datetime] = None
    totalDoses: Optional[int] = None
    instructions: Optional[str] = None

class DoseTakenRequest(BaseModel):
    medicationId: str
    date: str  # ISO date string (YYYY-MM-DD)
    count: int

@app.get("/")
def read_root():
    return {"message": "Welcome to the Health Chatbot FastAPI backend!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/test-symptoms")
def test_symptoms():
    """Test endpoint to check if symptom assessment is working"""
    return {
        "message": "Symptom assessment endpoint is working",
        "llm_available": llm is not None,
        "api_key_set": os.getenv("GOOGLE_API_KEY") is not None,
        "llm_type": str(type(llm)) if llm else "None"
    }

@app.get("/test-llm")
def test_llm():
    """Test endpoint to check if LLM is working"""
    try:
        if llm is None:
            return {"error": "LLM not available"}
        
        # Test a simple prompt
        test_prompt = "Say 'Hello, LLM is working!'"
        response = llm.invoke(test_prompt)
        
        return {
            "success": True,
            "response": str(response.content) if hasattr(response, 'content') else str(response),
            "response_type": str(type(response))
        }
    except Exception as e:
        return {"error": str(e), "traceback": str(e.__traceback__)}

@app.post("/api/signup")
async def signup(request: SignupRequest):
    """User signup endpoint"""
    try:
        db: Session = next(get_db())
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == request.username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already registered")
        
        existing_email = db.query(User).filter(User.email == request.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user with hashed password
        password_hash = get_password_hash(request.password)
        new_user = User(username=request.username, email=request.email, password_hash=password_hash)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {"success": True, "message": "User created successfully", "user_id": new_user.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@app.post("/api/signin")
async def signin(request: SigninRequest):
    """User signin endpoint"""
    db: Session = next(get_db())
    user = authenticate_user(db, request.username, request.password)
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
        "username": user.username,
        "email": user.email
    }

@app.post("/api/users")
async def create_user(username: str, email: str):
    """Create a test user for development (legacy endpoint)"""
    try:
        db: Session = next(get_db())
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
        
        return {"success": True, "user": {"id": new_user.id, "username": username, "email": email}, "message": "User created successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@app.get("/api/users")
async def get_users():
    """Get all users for testing"""
    db: Session = next(get_db())
    users = db.query(User).all()
    return {"users": [{"id": u.id, "username": u.username, "email": u.email} for u in users]}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    print("DEBUG /chat received:", request)
    
    try:
        db: Session = next(get_db())
        # Create a new chat session first
        user_id = request.user_id or 1  # Default to user 1 for testing
        session_id = f"session_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
        
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
        state = {"agent_type": request.agent_type, "message": request.message, "response_style": request.response_style}
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
            
            print(f"DEBUG: Chat session {session_id} created, messages stored")
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
    print(f"DEBUG: assess_symptoms called with request: {request}")
    print(f"DEBUG: LLM available: {llm is not None}")
    
    # Check if LLM is available
    if llm is None:
        print("DEBUG: LLM not available, returning fallback response")
        return {
            "riskLevel": "unknown",
            "conditions": [{"name": "Service Unavailable", "probability": 0, "urgent": False, "description": "AI service unavailable"}],
            "immediateActions": ["Consult a healthcare professional for medical advice"],
            "precautions": ["Monitor your symptoms closely"],
            "medications": ["No medications recommended without professional consultation"],
            "lifestyleChanges": ["Maintain healthy habits"],
            "whenToSeekHelp": ["If symptoms worsen or become severe"],
            "followUp": "Please consult a qualified healthcare provider for proper diagnosis and treatment."
        }
    
    try:
        print("DEBUG: Entering try block")
        # For now, return a simple response to test the endpoint
        symptoms_text = ", ".join([s['name'] for s in request.symptoms])
        print(f"DEBUG: Symptoms text: {symptoms_text}")
        print("DEBUG: About to return response")
        
        # Analyze symptoms based on severity and type
        symptoms_list = [s['name'].lower() for s in request.symptoms]
        severity_counts = {'mild': 0, 'moderate': 0, 'severe': 0}
        
        # Count severity levels
        for s in request.symptoms:
            severity_counts[s['severity']] += 1
        
        # Determine overall risk level based on severity
        if severity_counts['severe'] > 0:
            risk_level = "high" if severity_counts['severe'] >= 2 else "high"
        elif severity_counts['moderate'] > 2:
            risk_level = "moderate"
        elif severity_counts['moderate'] > 0:
            risk_level = "moderate"
        else:
            risk_level = "low"
        
        # Check for urgent symptoms regardless of user-selected severity
        urgent_symptoms = ['chest pain', 'shortness of breath', 'seizures', 'paralysis', 'severe bleeding']
        has_urgent = any(urgent in symptom for symptom in symptoms_list for urgent in urgent_symptoms)
        
        if has_urgent:
            risk_level = "urgent"
        
        # Generate comprehensive response based on severity and body parts
        if any("headache" in symptom for symptom in symptoms_list):
            severity = next((s['severity'] for s in request.symptoms if 'headache' in s['name'].lower()), 'moderate')
            
            if severity == 'severe':
                response = {
                    "riskLevel": "high",
                    "conditions": [
                        {"name": "Severe Migraine", "probability": 60, "urgent": False, "description": "Intense headache requiring immediate attention"},
                        {"name": "Cluster Headache", "probability": 25, "urgent": False, "description": "Severe recurring headache"},
                        {"name": "Secondary Headache", "probability": 15, "urgent": True, "description": "Headache caused by underlying condition"}
                    ],
                    "immediateActions": ["Take prescribed pain medication", "Rest in dark, quiet room", "Apply cold compress"],
                    "precautions": ["Avoid bright lights and loud sounds", "Stay hydrated", "Avoid known triggers"],
                    "medications": ["Sumatriptan 25-100mg for migraines", "Acetaminophen 1000mg every 6 hours", "Consult doctor for prescription options"],
                    "lifestyleChanges": ["Identify and avoid triggers", "Maintain regular sleep schedule", "Practice stress management"],
                    "whenToSeekHelp": ["Sudden severe headache", "Headache with fever and stiff neck", "Headache with vision changes"],
                    "followUp": "If severe headaches persist or worsen, seek immediate medical attention."
                }
            elif severity == 'moderate':
                response = {
                    "riskLevel": "moderate",
                    "conditions": [
                        {"name": "Tension Headache", "probability": 70, "urgent": False, "description": "Common stress-related headache"},
                        {"name": "Mild Migraine", "probability": 25, "urgent": False, "description": "Moderate migraine episode"}
                    ],
                    "immediateActions": ["Take over-the-counter pain relief", "Rest in quiet environment"],
                    "precautions": ["Reduce stress", "Stay hydrated", "Monitor pain levels"],
                    "medications": ["Ibuprofen 400-600mg every 6-8 hours", "Acetaminophen 500-1000mg every 4-6 hours"],
                    "lifestyleChanges": ["Regular exercise", "Adequate sleep", "Stress management techniques"],
                    "whenToSeekHelp": ["Headache worsens significantly", "Lasts more than 72 hours", "Associated with fever"],
                    "followUp": "Monitor for 24-48 hours. If pain increases or persists, consult healthcare provider."
                }
            else:  # mild
                response = {
                    "riskLevel": "low",
                    "conditions": [
                        {"name": "Mild Tension Headache", "probability": 80, "urgent": False, "description": "Light stress or fatigue-related headache"}
                    ],
                    "immediateActions": ["Rest and relax", "Stay hydrated", "Gentle neck stretches"],
                    "precautions": ["Avoid screens if possible", "Ensure good posture", "Take breaks from activities"],
                    "medications": ["Acetaminophen 500mg if needed", "Ibuprofen 200mg if needed"],
                    "lifestyleChanges": ["Regular sleep schedule", "Stay hydrated", "Take regular breaks"],
                    "whenToSeekHelp": ["Headache becomes severe", "Lasts more than 24 hours", "Frequent recurrence"],
                    "followUp": "Should improve with rest. If persists, consider underlying causes."
                }
        elif any("pain" in symptom for symptom in symptoms_list):
            # Handle pain symptoms with body part information
            pain_symptoms = [s for s in request.symptoms if 'pain' in s['name'].lower()]
            body_parts = [s['bodyPart'] for s in pain_symptoms]
            
            if 'chest' in [bp.lower() for bp in body_parts]:
                response = {
                    "riskLevel": "high",
                    "conditions": [
                        {"name": "Cardiac Concern", "probability": 40, "urgent": True, "description": "Chest pain requires immediate evaluation"},
                        {"name": "Muscle Strain", "probability": 35, "urgent": False, "description": "Chest muscle strain from activity"},
                        {"name": "Acid Reflux", "probability": 25, "urgent": False, "description": "Gastroesophageal reflux causing chest discomfort"}
                    ],
                    "immediateActions": ["Seek immediate medical attention", "Stop physical activity", "Sit down and rest"],
                    "precautions": ["Do not ignore chest pain", "Call emergency services if severe", "Avoid strenuous activity"],
                    "medications": ["Do not self-medicate chest pain", "Follow emergency protocols", "Take prescribed cardiac medications if any"],
                    "lifestyleChanges": ["Avoid triggers", "Maintain heart-healthy diet", "Regular gentle exercise as advised"],
                    "whenToSeekHelp": ["Any chest pain", "Pain with shortness of breath", "Pain radiating to arm or jaw"],
                    "followUp": "Chest pain requires immediate medical evaluation. Do not delay seeking care."
                }
            elif 'back' in [bp.lower() for bp in body_parts]:
                response = {
                    "riskLevel": "moderate",
                    "conditions": [
                        {"name": "Muscle Strain", "probability": 60, "urgent": False, "description": "Back muscle strain from lifting or posture"},
                        {"name": "Disc Issues", "probability": 25, "urgent": False, "description": "Possible disc herniation or degeneration"},
                        {"name": "Sciatica", "probability": 15, "urgent": False, "description": "Nerve pain radiating from lower back"}
                    ],
                    "immediateActions": ["Apply ice for first 24-48 hours", "Rest in comfortable position", "Avoid heavy lifting"],
                    "precautions": ["Maintain good posture", "Use proper lifting techniques", "Sleep on firm surface"],
                    "medications": ["Ibuprofen 400-600mg every 6-8 hours", "Acetaminophen 500-1000mg every 6 hours", "Muscle relaxants if prescribed"],
                    "lifestyleChanges": ["Regular gentle stretching", "Strengthen core muscles", "Ergonomic workspace setup"],
                    "whenToSeekHelp": ["Severe pain with numbness", "Pain after injury", "Pain with fever"],
                    "followUp": "Most back pain improves in 2-4 weeks. Seek care if pain worsens or persists."
                }
            elif any(part.lower() in ['arms', 'hands', 'legs', 'feet', 'joints'] for part in body_parts):
                limb_part = next((part for part in body_parts if part.lower() in ['arms', 'hands', 'legs', 'feet', 'joints']), 'limb')
                response = {
                    "riskLevel": "low",
                    "conditions": [
                        {"name": f"{limb_part.capitalize()} Strain", "probability": 50, "urgent": False, "description": f"Muscle or joint strain in {limb_part.lower()}"},
                        {"name": "Overuse Injury", "probability": 30, "urgent": False, "description": "Repetitive stress injury"},
                        {"name": "Arthritis", "probability": 20, "urgent": False, "description": "Joint inflammation"}
                    ],
                    "immediateActions": ["Rest the affected area", "Apply ice if swollen", "Elevate if possible"],
                    "precautions": ["Avoid repetitive motions", "Use proper ergonomics", "Take regular breaks"],
                    "medications": ["Ibuprofen 200-400mg every 6-8 hours", "Topical anti-inflammatory cream", "Acetaminophen for pain"],
                    "lifestyleChanges": ["Gentle stretching exercises", "Strengthen supporting muscles", "Maintain healthy weight"],
                    "whenToSeekHelp": ["Severe swelling", "Loss of function", "Pain after injury"],
                    "followUp": f"Monitor {limb_part.lower()} pain. Most minor injuries improve with rest and care."
                }
            else:
                response = {
                    "riskLevel": "moderate",
                    "conditions": [
                        {"name": "General Pain", "probability": 70, "urgent": False, "description": "Pain requiring evaluation and management"}
                    ],
                    "immediateActions": ["Rest and avoid aggravating activities", "Apply appropriate hot/cold therapy"],
                    "precautions": ["Monitor pain levels", "Avoid overexertion", "Use pain management techniques"],
                    "medications": ["Over-the-counter pain relievers as directed", "Follow current pain management plan"],
                    "lifestyleChanges": ["Gentle exercise as tolerated", "Stress management", "Adequate sleep"],
                    "whenToSeekHelp": ["Severe or worsening pain", "New symptoms develop", "Unable to function"],
                    "followUp": "Monitor pain and seek care if it worsens or interferes with daily activities."
                }
        else:
            # Default response for other symptoms
            response = {
                "riskLevel": risk_level,
                "conditions": [
                    {"name": "Symptom Assessment", "probability": 65, "urgent": has_urgent, "description": f"Multiple symptoms with {risk_level} severity level"}
                ],
                "immediateActions": ["Monitor symptoms closely", "Rest and stay hydrated", "Track severity changes"],
                "precautions": ["Avoid activities that worsen symptoms", "Keep detailed symptom diary", "Stay in contact with healthcare provider"],
                "medications": ["Follow current medication regimen", "Over-the-counter pain relief as needed", "Consult provider for specific recommendations"],
                "lifestyleChanges": ["Maintain healthy diet", "Get adequate rest", "Gentle exercise as tolerated"],
                "whenToSeekHelp": ["Symptoms worsen significantly", "New severe symptoms develop", "Unable to manage daily activities"],
                "followUp": f"Given {risk_level} risk level, monitor closely and seek medical attention if condition changes."
            }
        
        print(f"DEBUG: Response prepared: {response}")
        return response
            
    except Exception as e:
        print(f"ERROR in symptom assessment: {e}")
        return {
            "riskLevel": "unknown",
            "conditions": [{"name": "Analysis Error", "probability": 0, "urgent": False, "description": "Could not analyze symptoms"}],
            "immediateActions": ["Please try again or consult a healthcare professional"],
            "precautions": ["Monitor symptoms closely"],
            "medications": ["No medications recommended without proper analysis"],
            "lifestyleChanges": ["Maintain healthy habits"],
            "whenToSeekHelp": ["If symptoms worsen"],
            "followUp": "Please try the symptom analysis again or consult a qualified healthcare provider."
        }

@app.get("/api/medications")
async def get_medications(current_user: User = Depends(get_current_user)):
    """Get all medications for the authenticated user"""
    db: Session = next(get_db())
    medications = db.query(Medication).filter(Medication.user_id == current_user.id).all()
    return {"medications": [{"id": med.id, "name": med.name, "dosage": med.dosage, "frequency": med.frequency, "prescribedBy": med.prescribedBy, "startDate": med.startDate, "endDate": med.endDate, "totalDoses": med.totalDoses, "instructions": med.instructions} for med in medications]}

@app.post("/api/medications")
async def create_medication(medication: MedicationCreate, current_user: User = Depends(get_current_user)):
    """Create a new medication for the authenticated user"""
    db: Session = next(get_db())
    medications = db.query(Medication).filter(Medication.user_id == current_user.id).all()
    
    # Generate unique ID
    new_id = str(len(medications) + 1)
    while any(med.id == new_id for med in medications):
        new_id = str(int(new_id) + 1)
    
    # Convert the medication data to dict and handle datetime conversion
    med_data = medication.dict()
    
    new_medication = Medication(
        id=new_id,
        user_id=current_user.id,
        **med_data
    )
    
    db.add(new_medication)
    db.commit()
    db.refresh(new_medication)
    
    return {"success": True, "medication": {"id": new_medication.id, "name": new_medication.name, "dosage": new_medication.dosage, "frequency": new_medication.frequency, "prescribedBy": new_medication.prescribedBy, "startDate": new_medication.startDate, "endDate": new_medication.endDate, "totalDoses": new_medication.totalDoses, "instructions": new_medication.instructions}}

@app.delete("/api/medications/{medication_id}")
async def delete_medication(medication_id: str, current_user: User = Depends(get_current_user)):
    """Delete a medication for the authenticated user"""
    db: Session = next(get_db())
    
    # Find and remove the medication
    medication_to_delete = db.query(Medication).filter(Medication.id == medication_id, Medication.user_id == current_user.id).first()
    if medication_to_delete:
        db.delete(medication_to_delete)
        db.commit()
        return {"success": True, "message": "Medication deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Medication not found")

# Add new endpoints for chat history
@app.get("/api/chat-history/{user_id}")
async def get_chat_history(user_id: int):
    """Get chat history for a user"""
    db: Session = next(get_db())
    sessions = db.query(ChatSession).filter(ChatSession.user_id == user_id).all()
    return {"sessions": [{"id": s.id, "session_id": s.session_id, "agent_type": s.agent_type, "created_at": s.created_at} for s in sessions]}

@app.get("/api/chat-messages/{session_id}")
async def get_chat_messages(session_id: str):
    """Get messages for a specific chat session"""
    db: Session = next(get_db())
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).all()
    return {"messages": [{"id": m.id, "message_type": m.message_type, "content": m.content, "message_metadata": m.message_metadata, "created_at": m.created_at} for m in messages]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
