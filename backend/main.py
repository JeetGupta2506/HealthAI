from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import json
from datetime import datetime

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

@app.get("/")
def read_root():
    return {"message": "Welcome to the Health Chatbot FastAPI backend!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    print("DEBUG /chat received:", request)
    state = {"agent_type": request.agent_type, "message": request.message}
    try:
        result = chat_workflow.invoke(state)
        if not result or not isinstance(result, dict):
            print("DEBUG /chat returning: Sorry, I couldn't generate a response (workflow returned nothing).")
            return {"response": "Sorry, I couldn't generate a response (workflow returned nothing)."}
        raw_response = result.get("response", "Sorry, I couldn't generate a response.")
        formatted_response = format_response(raw_response)
        print("DEBUG /chat formatted response:", formatted_response)
        return {"response": formatted_response}

    except Exception as e:
        print("ERROR in /chat:", e)
        return {"response": f"Internal server error: {str(e)}"}

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
async def get_medications():
    """Get all medications"""
    medications = load_medications()
    return {"medications": medications}

@app.post("/api/medications")
async def create_medication(medication: MedicationCreate):
    """Create a new medication"""
    medications = load_medications()
    
    # Generate unique ID
    new_id = str(len(medications) + 1)
    while any(med['id'] == new_id for med in medications):
        new_id = str(int(new_id) + 1)
    
    # Convert the medication data to dict and handle datetime conversion
    med_data = medication.dict()
    
    new_medication = {
        "id": new_id,
        **med_data
    }
    
    medications.append(new_medication)
    
    if save_medications(medications):
        return {"success": True, "medication": new_medication}
    else:
        return {"success": False, "error": "Failed to save medication"}

@app.delete("/api/medications/{medication_id}")
async def delete_medication(medication_id: str):
    """Delete a medication"""
    medications = load_medications()
    
    # Find and remove the medication
    original_count = len(medications)
    medications = [med for med in medications if med['id'] != medication_id]
    
    if len(medications) < original_count:
        if save_medications(medications):
            return {"success": True, "message": "Medication deleted successfully"}
        else:
            return {"success": False, "error": "Failed to save medications after deletion"}
    else:
        return {"success": False, "error": "Medication not found"}
