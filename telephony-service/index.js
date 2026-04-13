/**
 * VoxCollect Telephony Service
 * FreeSWITCH ESL Integration for real phone calls
 */

const express = require('express');
const { EventEmitter } = require('events');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());

// FreeSWITCH connection config
const FS_CONFIG = {
  host: process.env.FS_HOST || 'localhost',
  port: process.env.FS_PORT || 8021,
  password: process.env.FS_PASSWORD || 'voxcollect',
  context: process.env.FS_CONTEXT || 'default'
};

// In-memory call store (use Redis in production)
const activeCalls = new Map();

// Event emitter for call events
const callEvents = new EventEmitter();

// ================== API ==================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'telephony-service' });
});

// Start outbound call
app.post('/start-call', async (req, res) => {
  try {
    const { to_number, from_number, script, invoice_id } = req.body;
    
    if (!to_number) {
      return res.status(400).json({ error: 'to_number is required' });
    }
    
    const call_id = `call_${crypto.randomUUID()}`;
    const from = from_number || process.env.DEFAULT_FROM || '15005551234';
    
    // In production, connect to FreeSWITCH via ESL:
    // const fs = require('freeswitch-esl');
    // const conn = await fs.connect(FS_CONFIG);
    // await conn.api('originate', ` sofia/gateway/your_gateway/${to_number} ${script}`);

    // Demo mode - simulate call
    const call = {
      call_id,
      to_number,
      from_number: from,
      status: 'initiated',
      script,
      invoice_id,
      started_at: new Date().toISOString()
    };
    
    activeCalls.set(call_id, call);
    
    // Simulate call progression
    setTimeout(() => {
      call.status = 'ringing';
      callEvents.emit('status', call);
    }, 1000);
    
    setTimeout(() => {
      call.status = 'in-progress';
      callEvents.emit('status', call);
    }, 3000);
    
    res.json({
      success: true,
      call_id,
      status: 'initiated',
      message: 'Call initiated (demo mode)'
    });
    
  } catch (error) {
    console.error('Start call error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get call status
app.get('/call/:callId', (req, res) => {
  const { callId } = req.params;
  const call = activeCalls.get(callId);
  
  if (!call) {
    return res.status(404).json({ error: 'Call not found' });
  }
  
  res.json(call);
});

// End call
app.post('/end-call', async (req, res) => {
  try {
    const { call_id } = req.body;
    const call = activeCalls.get(call_id);
    
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    // In production, send hangup to FreeSWITCH
    call.status = 'completed';
    call.ended_at = new Date().toISOString();
    
    res.json({
      success: true,
      call_id,
      status: 'completed'
    });
    
  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all calls
app.get('/calls', (req, res) => {
  const calls = Array.from(activeCalls.values());
  res.json({ calls });
});

// Get call transcription (simulated)
app.get('/call/:callId/transcript', (req, res) => {
  const { callId } = req.params;
  const call = activeCalls.get(callId);
  
  if (!call) {
    return res.status(404).json({ error: 'Call not found' });
  }
  
  // Return simulated transcript
  res.json({
    call_id: callId,
    transcript: "AI: Hello, this is an automated call regarding your invoice. How can I help you today?",
    duration: call.duration || 120,
    summary: "Caller expressed intent to pay. Requested payment plan.",
    next_steps: "Follow up in 7 days"
  });
});

// ================== SERVER ==================
const PORT = process.env.TELEPHONY_PORT || 5002;

app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('📞 VoxCollect Telephony Service');
  console.log('========================================');
  console.log(`🌐 Running on port ${PORT}`);
  console.log(`🔗 FreeSWITCH: ${FS_CONFIG.host}:${FS_CONFIG.port}`);
  console.log('========================================');
});

module.exports = app;