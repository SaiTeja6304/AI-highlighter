from fastapi import APIRouter, HTTPException, Response
from services import *

router = APIRouter(
    prefix="/api",
    tags=["AI Highlighter API"]
)

@router.get("/", status_code=200, response_model=dict)
async def root():
    """Root endpoint for the AI Highlighter API"""
    return {"message": "AI Highlighter API", "status": "running"}

@router.post("/chat", status_code=200, response_model=dict)
async def chat_endpoint(payload: dict):
    """Endpoint to chat with the LLM"""
    try:
        response = generate_chat_response(payload)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/highlight", status_code=200, response_model=dict)
async def highlight_endpoint(payload: dict):
    """Endpoint to highlight text on webpage"""
    try:
        response = generate_highlight_response(payload)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))