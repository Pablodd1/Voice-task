# VoxCollect - Open Source Upgrade Plan

## Current Status
- ✅ Core app on Render
- ✅ Telephony service (FreeSWITCH ready)
- ✅ AI microservice (Whisper + Coqui TTS + LLM)
- ✅ Docker Compose setup

## What's Added

### 1. AI Service (`/ai-service`)
- `/transcribe` - Audio to text (Whisper)
- `/synthesize` - Text to speech (Coqui TTS)
- `/chat` - LLM conversation
- `/parse` - NLP extraction

### 2. Telephony Service (`/telephony-service`)
- `/start-call` - Start outbound call
- `/call/:id` - Get call status
- `/end-call` - End call
- FreeSWITCH ESL ready

### 3. Docker Compose
- Main app (Node.js)
- PostgreSQL
- AI Service (Python)
- FreeSWITCH (optional)

## Running Locally

```bash
# Full stack
docker-compose up

# Just AI service
cd ai-service
pip install -r requirements.txt
python main.py
```

## Tech Stack
- Node.js + Express
- PostgreSQL
- Python FastAPI
- FreeSWITCH
- Whisper + Coqui TTS + Llama.cpp
- spaCy

## Production Deployment
1. Deploy core app to Render
2. Deploy AI service separately (Render Python)
3. Deploy FreeSWITCH on cloud server or use Twilio

## License
MIT