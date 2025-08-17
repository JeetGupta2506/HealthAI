from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv
load_dotenv()

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
    "general": "You are a helpful general health assistant. Answer the following user question as helpfully as possible.\nUser: {message}",
    "symptom": "You are a symptom checker AI. Help the user understand their symptoms and suggest next steps.\nUser: {message}",
    "nutrition": "You are a nutrition expert AI. Give evidence-based nutrition and diet advice.\nUser: {message}",
    "mental-health": "You are a mental health coach AI. Support the user with mental health tips and resources.\nUser: {message}"
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
        response = result.get("response", "Sorry, I couldn't generate a response.")
        print("DEBUG /chat returning:", response)
        return {"response": response}
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
