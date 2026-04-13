# AI Service - Voice AI Stack

## Running Locally with Docker

```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

## API Endpoints

### POST /transcribe
Audio to text using Whisper

### POST /synthesize  
Text to audio using Coqui TTS

### POST /chat
LLM chat for conversation

### POST /parse
Extract structured data from text

## Environment
```
OPENAI_API_KEY=your_key  # Optional - uses local Whisper if not set
MODEL_PATH=./models    # Path to local LLM models
```

## Docker
```bash
docker build -t voxcollect-ai .
docker run -p 5001:5001 voxcollect-ai
```