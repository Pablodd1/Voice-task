const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Claim = sequelize.define('Claim', {
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
  claimNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  patientName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  payerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  billedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'denied'),
    defaultValue: 'pending'
  },
  denialReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submissionDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastCalled: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextCallDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  callAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'claims',
  timestamps: true,
  underscored: true
});

// Class methods for backward compatibility
Claim.findByUserId = async function(userId) {
  return Claim.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });
};

Claim.findById = async function(id) {
  return Claim.findByPk(id);
};

Claim.create = async function(claimData) {
  return Claim.build(claimData).save();
};

Claim.update = async function(id, updateData) {
  const claim = await Claim.findByPk(id);
  if (!claim) return false;
  await claim.update(updateData);
  return true;
};

Claim.delete = async function(id) {
  const claim = await Claim.findByPk(id);
  if (!claim) return false;
  await claim.destroy();
  return true;
};

Claim.getStats = async function(userId) {
  // Bolt optimization: reduces memory overhead from O(N) to O(1) by using database-level aggregation
  // instead of fetching all records and filtering/reducing in JavaScript.
  const stats = await Claim.findOne({
    where: { userId },
    attributes: [
      [Claim.sequelize.fn('COUNT', Claim.sequelize.col('id')), 'totalClaims'],
      [Claim.sequelize.literal("SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)"), 'paidClaims'],
      [Claim.sequelize.literal("SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END)"), 'deniedClaims'],
      [Claim.sequelize.literal("SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)"), 'pendingClaims'],
      [Claim.sequelize.fn('SUM', Claim.sequelize.col('billed_amount')), 'totalBilledAmount']
    ],
    raw: true
  }) || {};
  
  return {
    totalClaims: parseInt(stats.totalClaims || 0, 10),
    paidClaims: parseInt(stats.paidClaims || 0, 10),
    deniedClaims: parseInt(stats.deniedClaims || 0, 10),
    pendingClaims: parseInt(stats.pendingClaims || 0, 10),
    totalBilledAmount: parseFloat(stats.totalBilledAmount || 0)
  };
};

module.exports = Claim;