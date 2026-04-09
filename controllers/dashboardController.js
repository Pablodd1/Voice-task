const Claim = require('../models/Claim');
const Call = require('../models/Call');

// Get dashboard data
const getDashboardData = async (req, res) => {
  try {
    // Get claim statistics
    const claimStats = await Claim.getStats(req.user.userId);
    
    // Get call statistics
    const callStats = await Call.getStats(req.user.userId);
    
    // Get recent claims (limited to 5)
    const recentClaims = await Claim.findByUserId(req.user.userId);
    const limitedRecentClaims = recentClaims.slice(0, 5).map(claim => ({
      id: claim.id,
      claimNumber: claim.claimNumber,
      patientName: claim.patientName,
      payerName: claim.payerName,
      billedAmount: claim.billedAmount,
      status: claim.status,
      lastCalled: claim.lastCalled,
      callAttempts: claim.callAttempts
    }));
    
    // Get recent calls (limited to 5)
    const recentCalls = await Call.findByUserId(req.user.userId);
    const limitedRecentCalls = recentCalls.slice(0, 5).map(call => ({
      id: call.id,
      claimNumber: call.claimNumber ? call.claimNumber : 'N/A',
      patientName: call.patientName ? call.patientName : 'N/A',
      status: call.status,
      duration: call.duration,
      startTime: call.startTime,
      summary: call.summary
    }));
    
    res.json({
      claimStats: {
        totalClaims: claimStats.totalClaims || 0,
        paidClaims: claimStats.paidClaims || 0,
        deniedClaims: claimStats.deniedClaims || 0,
        pendingClaims: claimStats.pendingClaims || 0,
        totalBilledAmount: claimStats.totalBilledAmount || 0
      },
      callStats: {
        totalCalls: callStats.totalCalls || 0,
        completedCalls: callStats.completedCalls || 0,
        failedCalls: callStats.failedCalls || 0,
        unansweredCalls: callStats.unansweredCalls || 0,
        avgDuration: callStats.avgDuration ? Math.round(callStats.avgDuration) : 0
      },
      recentClaims: limitedRecentClaims,
      recentCalls: limitedRecentCalls
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ error: 'Server error fetching dashboard data' });
  }
};

// Get recent activity (combined claims and calls)
const getRecentActivity = async (req, res) => {
  try {
    // Get recent claims
    const recentClaims = await Claim.findByUserId(req.user.userId);
    const claimActivities = recentClaims.slice(0, 10).map(claim => ({
      type: 'claim',
      id: claim.id,
      description: `Claim ${claim.claimNumber} for ${claim.patientName}`,
      status: claim.status,
      timestamp: claim.updatedAt || claim.createdAt,
      amount: claim.billedAmount
    }));
    
    // Get recent calls
    const recentCalls = await Call.findByUserId(req.user.userId);
    const callActivities = recentCalls.slice(0, 10).map(call => ({
      type: 'call',
      id: call.id,
      description: `Call to ${call.phoneNumber} regarding claim ${call.claimNumber || 'N/A'}`,
      status: call.status,
      timestamp: call.updatedAt || call.createdAt,
      duration: call.duration
    }));
    
    // Combine and sort by timestamp (newest first)
    const allActivities = [...claimActivities, ...callActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10); // Limit to 10 most recent
    
    res.json({ activities: allActivities });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ error: 'Server error fetching recent activity' });
  }
};

// Get upcoming calls (based on follow-up dates)
const getUpcomingCalls = async (req, res) => {
  try {
    const calls = await Call.findByUserId(req.user.userId);
    const now = new Date().toISOString();
    
    const upcomingCalls = calls
      .filter(call => call.followUpDate && call.followUpDate > now)
      .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))
      .slice(0, 10)
      .map(call => ({
        id: call.id,
        claimNumber: call.claimNumber || 'N/A',
        patientName: call.patientName || 'N/A',
        payerName: call.payerName || 'N/A',
        phoneNumber: call.phoneNumber,
        followUpDate: call.followUpDate,
        summary: call.summary,
        nextSteps: call.nextSteps
      }));
    
    res.json({ upcomingCalls });
  } catch (error) {
    console.error('Get upcoming calls error:', error);
    res.status(500).json({ error: 'Server error fetching upcoming calls' });
  }
};

module.exports = {
  getDashboardData,
  getRecentActivity,
  getUpcomingCalls
};