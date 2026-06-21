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
  return Call.build(callData).save();
};

Call.update = async function(id, updateData) {
  const call = await Call.findByPk(id);
  if (!call) return false;
  await call.update(updateData);
  return true;
};

Call.getStats = async function(userId) {
  // Bolt optimization: reduces memory overhead from O(N) to O(1) by using database-level aggregation
  // instead of fetching all records and filtering/reducing in JavaScript.
  const stats = await Call.findOne({
    where: { userId },
    attributes: [
      [Call.sequelize.fn('COUNT', Call.sequelize.col('id')), 'totalCalls'],
      [Call.sequelize.literal("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)"), 'completedCalls'],
      [Call.sequelize.literal("SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)"), 'failedCalls'],
      [Call.sequelize.literal("SUM(CASE WHEN status IN ('busy', 'no-answer') THEN 1 ELSE 0 END)"), 'unansweredCalls'],
      [Call.sequelize.literal("AVG(CASE WHEN duration > 0 THEN duration ELSE NULL END)"), 'avgDuration']
    ],
    raw: true
  }) || {};
  
  return {
    totalCalls: parseInt(stats.totalCalls || 0, 10),
    completedCalls: parseInt(stats.completedCalls || 0, 10),
    failedCalls: parseInt(stats.failedCalls || 0, 10),
    unansweredCalls: parseInt(stats.unansweredCalls || 0, 10),
    avgDuration: parseFloat(stats.avgDuration || 0)
  };
};

module.exports = Call;