const Call = require('../models/Call');
const Claim = require('../models/Claim');
const { v4: uuidv4 } = require('uuid');

// Initiate a call (simulation mode for MVP)
const initiateCall = async (req, res) => {
  try {
    const { claimId, phoneNumber } = req.body;

    // Validate input
    if (!claimId || !phoneNumber) {
      return res.status(400).json({ error: 'Please provide claim ID and phone number' });
    }

    // Check if claim exists and belongs to user
    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    if (claim.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to initiate call for this claim' });
    }

    // In a real implementation, this would integrate with Twilio or similar
    // For MVP, we'll simulate the call initiation
    
    // Create call record
    const call = await Call.create({
      userId: req.user.userId,
      claimId: claim.id,
      phoneNumber: phoneNumber,
      callSid: `sim_${uuidv4()}`, // Simulated Call SID
      status: 'initiated'
    });

    // Update claim with call attempt
    await Claim.update(claim.id, {
      lastCalled: new Date().toISOString(),
      callAttempts: claim.callAttempts + 1
    });

    res.status(201).json({
      message: 'Call initiated successfully (simulation mode)',
      call
    });
  } catch (error) {
    console.error('Initiate call error:', error);
    res.status(500).json({ error: 'Server error initiating call' });
  }
};

// Get call logs for a user
const getCallLogs = async (req, res) => {
  try {
    const calls = await Call.findByUserId(req.user.userId);
    res.json({ calls });
  } catch (error) {
    console.error('Get call logs error:', error);
    res.status(500).json({ error: 'Server error fetching call logs' });
  }
};

// Get a specific call by ID
const getCallById = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    // Check if call belongs to user
    if (call.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to access this call' });
    }
    
    res.json({ call });
  } catch (error) {
    console.error('Get call by ID error:', error);
    res.status(500).json({ error: 'Server error fetching call' });
  }
};

// Update call status (would be called by webhook in real implementation)
const updateCallStatus = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    // Check if call belongs to user
    if (call.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this call' });
    }
    
    const { status, duration, transcript, summary, nextSteps, followUpDate, endTime } = req.body;
    
    // Build update object
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (duration !== undefined) updateData.duration = duration;
    if (transcript !== undefined) updateData.transcript = transcript;
    if (summary !== undefined) updateData.summary = summary;
    if (nextSteps !== undefined) updateData.nextSteps = nextSteps;
    if (followUpDate !== undefined) updateData.followUpDate = followUpDate;
    if (endTime !== undefined) updateData.endTime = endTime;
    
    // Update call
    const updated = await Call.update(req.params.id, updateData);
    
    if (!updated) {
      return res.status(400).json({ error: 'Failed to update call' });
    }
    
    // If call completed, update claim status based on outcome
    if (status === 'completed') {
      // In a real implementation, we'd analyze transcript/summary to determine claim status
      // For simulation, we'll randomly assign outcomes or use mock data
      const callOutcome = Math.random() > 0.7 ? 'needs_followup' : 'resolved';
      
      if (callOutcome === 'resolved') {
        await Claim.update(call.claimId, { status: 'paid' });
      } else if (callOutcome === 'needs_followup' && followUpDate) {
        await Claim.update(call.claimId, { 
          status: 'pending',
          nextCallDate: followUpDate
        });
      }
    }
    
    const updatedCall = await Call.findById(req.params.id);
    
    res.json({
      message: 'Call updated successfully',
      call: updatedCall
    });
  } catch (error) {
    console.error('Update call status error:', error);
    res.status(500).json({ error: 'Server error updating call' });
  }
};

// Get call statistics for dashboard
const getCallStats = async (req, res) => {
  try {
    const stats = await Call.getStats(req.user.userId);
    res.json({ stats });
  } catch (error) {
    console.error('Get call stats error:', error);
    res.status(500).json({ error: 'Server error fetching call statistics' });
  }
};

// Simulate a call outcome (for testing and demo purposes)
const simulateCall = async (req, res) => {
  try {
    const { claimId } = req.body;

    // Validate input
    if (!claimId) {
      return res.status(400).json({ error: 'Please provide claim ID' });
    }

    // Check if claim exists and belongs to user
    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    if (claim.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to simulate call for this claim' });
    }

    // Create a simulated call with random outcome
    const callOutcomes = [
      { status: 'completed', summary: 'Claim verified and approved for payment', nextSteps: 'Payment expected in 7-10 business days' },
      { status: 'completed', summary: 'Claim denied due to missing documentation', nextSteps: 'Submit additional documentation within 30 days' },
      { status: 'completed', summary: 'Claim requires additional information', nextSteps: 'Provide missing CPT codes and diagnosis details' },
      { status: 'completed', summary: 'Claim under review', nextSteps: 'Follow up in 14 days for status update' },
      { status: 'failed', summary: 'Call failed - number busy', nextSteps: 'Retry call in 1 hour' },
      { status: 'failed', summary: 'Call failed - no answer', nextSteps: 'Retry call in 2 hours' }
    ];
    
    const randomOutcome = callOutcomes[Math.floor(Math.random() * callOutcomes.length)];
    
    // Create call record
    const call = await Call.create({
      userId: req.user.userId,
      claimId: claim.id,
      phoneNumber: claim.payerName === 'Medicare' ? '1-800-MEDICARE' : '1-800-555-0199', // Simulated phone number
      callSid: `sim_${uuidv4()}`,
      status: randomOutcome.status,
      duration: Math.floor(Math.random() * 300) + 60, // Random duration between 1-5 minutes
      startTime: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Random time in last hour
      endTime: new Date().toISOString(),
      transcript: `SIMULATED TRANSCRIPT: Agent called regarding claim ${claim.claimNumber} for patient ${claim.patientName}. Payer representative verified claim details and provided status update.`,
      summary: randomOutcome.summary,
      nextSteps: randomOutcome.nextSteps,
      followUpDate: randomOutcome.status === 'completed' && Math.random() > 0.5 ? 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : // 7 days from now
        null
    });

    // Update claim with call attempt and potential status change
    await Claim.update(claim.id, {
      lastCalled: new Date().toISOString(),
      callAttempts: claim.callAttempts + 1
    });

    // Update claim status based on call outcome (simplified logic)
    if (randomOutcome.status === 'completed') {
      if (randomOutcome.summary.includes('approved') || randomOutcome.summary.includes('payment')) {
        await Claim.update(claim.id, { status: 'paid' });
      } else if (randomOutcome.summary.includes('denied')) {
        await Claim.update(claim.id, { status: 'denied', denialReason: 'Missing documentation (simulated)' });
      }
      // Otherwise leave as pending
    }

    res.status(201).json({
      message: 'Call simulated successfully',
      call
    });
  } catch (error) {
    console.error('Simulate call error:', error);
    res.status(500).json({ error: 'Server error simulating call' });
  }
};

module.exports = {
  initiateCall,
  getCallLogs,
  getCallById,
  updateCallStatus,
  getCallStats,
  simulateCall
};