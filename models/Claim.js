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
  return Claim.create(claimData);
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
  const claims = await Claim.findAll({ where: { userId } });
  const totalClaims = claims.length;
  const paidClaims = claims.filter(c => c.status === 'paid').length;
  const deniedClaims = claims.filter(c => c.status === 'denied').length;
  const pendingClaims = claims.filter(c => c.status === 'pending').length;
  const totalBilledAmount = claims.reduce((sum, c) => sum + parseFloat(c.billedAmount || 0), 0);
  
  return {
    totalClaims,
    paidClaims,
    deniedClaims,
    pendingClaims,
    totalBilledAmount
  };
};

module.exports = Claim;