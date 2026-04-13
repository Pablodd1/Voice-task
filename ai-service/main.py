"""
VoxCollect AI Service
FastAPI microservice for STT, TTS, Chat, and NLP
"""

import os
import io
import base64
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import numpy as np

app = FastAPI(title="VoxCollect AI Service")

# Models directory
MODELS_PATH = os.getenv("MODEL_PATH", "./models")

# ================== STT ==================
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Convert audio to text using Whisper"""
    try:
        # Read audio file
        audio_data = await file.read()
        
        # In production, use Whisper:
        # import whisper
        # model = whisper.load_model("base")
        # result = model.transcribe(audio_data)
        # return {"text": result["text"]}
        
        # Placeholder for demo
        return {"text": "Simulated transcript from audio file: " + file.filename}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STT error: {str(e)}")

# ================== TTS ==================
class SynthesizeRequest(BaseModel):
    text: str
    voice: str = "female_1"

@app.post("/synthesize")
async def synthesize_speech(request: SynthesizeRequest):
    """Convert text to speech using Coqui TTS"""
    try:
        text = request.text
        voice = request.voice
        
        # In production, use Coqui TTS:
        # from TTS.api import TTS
        # tts = TTS(model_path="coqui/tts --model", gpu=False)
        # wav = tts.tts(text=text, speaker=voice)
        
        # Placeholder for demo - return audio data
        sample_rate = 22050
        duration = min(len(text) * 0.1, 5.0)  # ~0.1s per char
        t = np.linspace(0, duration, int(sample_rate * duration))
        audio = np.sin(440 * 2 * np.pi * t).astype(np.float32)
        
        # Convert to base64 for demo
        audio_b64 = base64.b64encode(audio.tobytes()).decode()
        
        return {
            "audio": audio_b64,
            "sample_rate": sample_rate,
            "text": text
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")

# ================== CHAT ==================
class ChatRequest(BaseModel):
    message: str
    context: dict = {}

@app.post("/chat")
async def chat_with_ai(request: ChatRequest):
    """Chat with local LLM"""
    try:
        message = request.message
        context = request.context
        
        # In production, use Llama.cpp:
        # from llama_cpp import Llama
        # llm = Llama(model_path="./models/llama-7b.gguf")
        # response = llm(f"Context: {context}\nUser: {message}\nAI:")
        
        # Simple rule-based responses for demo
        responses = {
            "claim": "I'm calling about your invoice. Let me help you understand the status.",
            "payment": "I can help set up a payment plan for you.",
            "default": "I'm here to help resolve your account. What questions do you have?"
        }
        
        response = responses.get("default", responses["default"])
        for key, value in responses.items():
            if key.lower() in message.lower():
                response = value
                break
                
        return {
            "response": response,
            "message": message
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

# ================== NLP ==================
class ParseRequest(BaseModel):
    text: str

@app.post("/parse")
async def parse_text(request: ParseRequest):
    """Extract structured data from text using spaCy"""
    try:
        text = request.text
        
        # In production, use spaCy:
        # import spacy
        # nlp = spacy.load("en_core_web_sm")
        # doc = nlp(text)
        
        # Simple rule-based extraction for demo
        import re
        
        # Extract amounts
        amounts = re.findall(r'\$[\d,]+(?:\.\d{2})?', text)
        
        # Extract dates
        dates = re.findall(r'\d{1,2}/\d{1,2}/\d{2,4}', text)
        
        # Extract invoice numbers
        invoices = re.findall(r'(?:INV|INVOICE|CLM)[-\s]?\d+', text, re.IGNORECASE)
        
        return {
            "original": text,
            "extracted": {
                "amounts": amounts,
                "dates": dates,
                "invoice_numbers": invoices
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parse error: {str(e)}")

# ================== HEALTH ==================
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "ai-service"}

# ================== MAIN ==================
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "5001"))
    uvicorn.run(app, host="0.0.0.0", port=port)