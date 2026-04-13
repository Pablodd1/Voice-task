"""
VoxCollect AI Service
FastAPI microservice for STT, TTS, Chat, and NLP
Uses MiniMax API for chat and TTS
"""

import os
import io
import base64
import json
import re
import asyncio
from pathlib import Path
from typing import Optional

import requests
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="VoxCollect AI Service")

# CORS — allow frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MiniMax API configuration
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_API_BASE = "https://api.minimax.io"
MINIMAX_TTS_ENDPOINT = f"{MINIMAX_API_BASE}/v1/text_to_speech"
MINIMAX_CHAT_ENDPOINT = f"{MINIMAX_API_BASE}/v1/text/chatcompletion_v2"

# ================== HELPERS ==================

def minimax_headers():
    return {
        "Authorization": f"Bearer {MINIMAX_API_KEY}",
        "Content-Type": "application/json",
    }

# ================== STT ==================

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Convert audio to text using Whisper (requires local model or API)."""
    try:
        audio_data = await file.read()
        
        # Option 1: Use OpenAI Whisper API (if key provided)
        whisper_api_key = os.getenv("OPENAI_WHISPER_API_KEY")
        if whisper_api_key:
            import openai
            client = openai.OpenAI(api_key=whisper_api_key)
            # Save temp file
            temp_path = f"/tmp/{file.filename}"
            with open(temp_path, "wb") as f:
                f.write(audio_data)
            with open(temp_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            os.remove(temp_path)
            return {"text": transcript.text}
        
        # Fallback: return simulated result
        return {"text": f"[STT placeholder] Received: {file.filename}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STT error: {str(e)}")

# ================== TTS ==================

class SynthesizeRequest(BaseModel):
    text: str
    voice: str = "female_1"
    speed: float = 1.0

@app.post("/synthesize")
async def synthesize_speech(request: SynthesizeRequest):
    """Convert text to speech using MiniMax TTS API."""
    try:
        if not MINIMAX_API_KEY:
            # Return error — MiniMax key is required
            raise HTTPException(
                status_code=503,
                detail="MINIMAX_API_KEY not configured. Please set your MiniMax API key."
            )

        payload = {
            "model": "speech-02-hd",
            "text": request.text,
            "stream": False,
            "voice_setting": {
                "voice_id": map_voice_id(request.voice),
                "speed": request.speed,
                "vol": 1.0,
                "pitch": 0,
                "emotion": "neutral"
            },
            "audio_setting": {
                "sample_rate": 32000,
                "bitrate": 128000,
                "format": "mp3"
            }
        }

        response = requests.post(
            MINIMAX_TTS_ENDPOINT,
            headers=minimax_headers(),
            json=payload,
            timeout=30
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"MiniMax TTS error: {response.text}"
            )

        result = response.json()
        
        # MiniMax TTS returns base64-encoded audio
        audio_base64 = result.get("data", {}).get("audio", "")
        
        return {
            "audio": audio_base64,
            "sample_rate": 32000,
            "text": request.text,
            "model": "speech-02-hd"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")

def map_voice_id(voice: str) -> str:
    """Map friendly voice names to MiniMax voice IDs."""
    voice_map = {
        "female_1": "female-tianmei",     # Chinese female
        "female_2": "female-yunjian",     # Chinese female 2
        "female_3": "female-xiaoyi",       # Chinese female 3
        "male_1": "male-shawn",           # English male
        "male_2": "male-alex",            # English male 2
        "male_3": "male-jordan",          # English male 3
        "female_cute": "female-xiaoxiao", # Cute female
        "male_stable": "male-en-us",      # Stable English male
    }
    return voice_map.get(voice, "female-tianmei")

# ================== CHAT ==================

class ChatRequest(BaseModel):
    message: str
    context: dict = {}

@app.post("/chat")
async def chat_with_ai(request: ChatRequest):
    """Chat with MiniMax LLM."""
    try:
        if not MINIMAX_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="MINIMAX_API_KEY not configured."
            )

        # Build conversation context
        system_prompt = build_system_prompt(request.context)
        
        payload = {
            "model": "M2-her",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            "max_tokens": 500,
            "temperature": 0.7
        }

        response = requests.post(
            MINIMAX_CHAT_ENDPOINT,
            headers=minimax_headers(),
            json=payload,
            timeout=30
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"MiniMax chat error: {response.text}"
            )

        result = response.json()
        ai_response = result["choices"][0]["messages"][-1]["content"]
        
        return {
            "response": ai_response,
            "message": request.message,
            "model": "M2-her"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

def build_system_prompt(context: dict) -> str:
    """Build system prompt for the AI collections agent."""
    action = context.get("action", "collections")
    
    prompts = {
        "collections": """You are Eva, a professional and empathetic AI voice agent for LunaBill medical collections. 
You are calling patients about their outstanding medical bills.
- Be polite, professional, and empathetic
- Never reveal sensitive medical details
- Offer payment plan options when appropriate  
- Always confirm the patient's best contact number and time to call
- If the patient requests not to be called again, mark their record accordingly
- Keep responses concise (under 2 sentences) for TTS readability
- Speak as if in a natural phone conversation""",
        
        "reminder": """You are Eva, a friendly AI appointment reminder agent for a medical office.
- Confirm or reschedule appointments
- Be warm and professional
- Collect any pre-visit information
- Keep responses concise and natural""",
        
        "intake": """You are Eva, an AI medical office intake assistant.
- Greet patients and collect their information
- Verify insurance details
- Explain what to expect at their visit
- Be professional and reassuring""",
    }
    
    return prompts.get(action, prompts["collections"])

# ================== NLP ==================

class ParseRequest(BaseModel):
    text: str

@app.post("/parse")
async def parse_text(request: ParseRequest):
    """Extract structured data from text (amounts, dates, invoice numbers)."""
    try:
        text = request.text
        
        # Extract dollar amounts
        amounts = re.findall(r'\$?[\d,]+\.?\d{0,2}', text)
        
        # Extract dates
        dates = re.findall(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', text)
        
        # Extract invoice/claim numbers
        invoices = re.findall(r'(?:INV|INVOICE|CLM|Claim|Claim#)?[-\s#]?\d{4,12}', text, re.IGNORECASE)
        
        # Extract phone numbers
        phones = re.findall(r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        
        # Extract email addresses
        emails = re.findall(r'[\w.-]+@[\w.-]+\.\w+', text)
        
        return {
            "original": text,
            "extracted": {
                "amounts": [a.strip() for a in amounts if a.strip()],
                "dates": dates,
                "invoice_numbers": [i.strip() for i in invoices if i.strip()],
                "phone_numbers": phones,
                "email_addresses": emails
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parse error: {str(e)}")

# ================== HEALTH ==================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "ai-service",
        "minimax_configured": bool(MINIMAX_API_KEY),
        "port": 5001
    }

# ================== MAIN ==================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "5001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
