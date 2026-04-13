# VoxCollect / LunaBill — Railway Deployment Guide

## Architecture

```
Railway Service 1: Node.js Backend (Express) — Port 5000
Railway Service 2: Python AI Service (FastAPI) — Port 5001  
Railway Plugin: PostgreSQL Database
Vercel (optional): Static frontend
Twilio: Outbound voice calls
```

## Step 1: Set Up Railway

1. Go to **railway.app** → Sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select `Pablodd1/Voice-task`

## Step 2: Add PostgreSQL Database

1. In your Railway project → **Add Plugin** → **PostgreSQL**
2. Copy the `DATABASE_URL` environment variable shown
3. Add it to your service's variables (see Step 3)

## Step 3: Environment Variables

Add these in Railway → Service → Variables:

**For Node.js Backend (Port 5000):**
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:XXX@YYY.railway.internal:5432/railway
JWT_SECRET=<generate with: openssl rand -base64 32>
JWT_EXPIRES_IN=24h
AI_SERVICE_URL=http://python-ai-service:5001
```

**For Python AI Service (Port 5001):**
```
PORT=5001
MINIMAX_API_KEY=your_minimax_api_key_here
NODE_ENV=production
```

## Step 4: Set Start Command

**Node.js Backend:**
```
npm start
```

**Python AI Service:**
```
cd ai-service && pip install -r requirements.txt && python main.py
```
Or use the included Dockerfile in `ai-service/`

## Step 5: Twilio Setup (for voice calls)

1. Create account at **twilio.com** (pay-as-you-go)
2. Get your **Account SID** and **Auth Token** from Twilio Console
3. Buy a phone number ($1/month)
4. Add to Railway environment variables:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## Step 6: Update Voice-task Code

The telephony service (`telephony-service/`) currently runs in demo mode. 
To connect real Twilio, update it to use the Twilio Node.js SDK:

```bash
npm install twilio
```

Then in `telephony-service/index.js`, replace the demo code with:
```javascript
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Make outbound call
await client.calls.create({
  to: to_number,
  from: process.env.TWILIO_PHONE_NUMBER,
  url: 'http://your-railway-app.railway.app/twiml/' + call_id
});
```

## Quick Start Commands

```bash
# Generate JWT secret
openssl rand -base64 32

# Test API locally
curl http://localhost:5000/health

# Test AI service locally  
curl -X POST http://localhost:5001/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "hello", "context": {}}'
```
