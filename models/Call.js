const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Call = sequelize.define('Call', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  claimId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'claims',
      key: 'id'
    }
  },
  callSid: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('initiated', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer'),
    defaultValue: 'initiated'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  transcript: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nextSteps: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  followUpDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'calls',
  timestamps: true,
  underscored: true
});

// Class methods for backward compatibility
Call.findByUserId = async function(userId) {
  return Call.findAll({
    where: { userId },
    include: [
      { model: sequelize.models.Claim, as: 'claim', attributes: ['claimNumber', 'patientName', 'payerName'] }
    ],
    order: [['createdAt', 'DESC']]
  });
};

Call.findById = async function(id) {
  return Call.findByPk(id, {
    include: [
      { model: sequelize.models.Claim, as: 'claim', attributes: ['claimNumber', 'patientName', 'payerName'] }
    ]
  });
};

Call.create = async function(callData) {
  return Call.create(callData);
};

Call.update = async function(id, updateData) {
  const call = await Call.findByPk(id);
  if (!call) return false;
  await call.update(updateData);
  return true;
};

Call.getStats = async function(userId) {
  const calls = await Call.findAll({ where: { userId } });
  const totalCalls = calls.length;
  const completedCalls = calls.filter(c => c.status === 'completed').length;
  const failedCalls = calls.filter(c => c.status === 'failed').length;
  const unansweredCalls = calls.filter(c => c.status === 'busy' || c.status === 'no-answer').length;
  const durations = calls.filter(c => c.duration).map(c => c.duration);
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  
  return {
    totalCalls,
    completedCalls,
    failedCalls,
    unansweredCalls,
    avgDuration
  };
};

module.exports = Call;