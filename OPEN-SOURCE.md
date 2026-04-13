# VoxCollect - Open Source Upgrade Plan

## Current Status
- ✅ Core app deployed on Render
- ⚠️ Build issues fixed (npm install vs npm ci)

## Recommended Free/Open Source Upgrades

### 1. Telephony (FreeSWITCH)
- Replace simulation with real calls
- Open source PBX system
- ESL API for Node integration

### 2. AI Voice Stack
- **STT**: Whisper (OpenAI open-source)
- **TTS**: Coqui TTS
- **NLP**: spaCy

### 3. Local LLM
- Llama.cpp with 3B-7B models
- GPT-NeoX variants

### 4. Docker Compose
- Run all services locally
- Easy development

## Next Steps
1. Fix Render build
2. Add telephony service
3. Add AI microservice

## Tech Stack
- Node.js + Express
- PostgreSQL
- FreeSWITCH
- Python (AI services)