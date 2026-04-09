const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize based on environment
let sequelize;

if (process.env.DATABASE_URL) {
  // Production: Use PostgreSQL from Render.com
  console.log('🔗 Connecting to PostgreSQL (Production)...');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false, // Disable logging in production
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  // Development: Use SQLite
  console.log('🔗 Connecting to SQLite (Development)...');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_PATH || './database/lunabill.db',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
  }
};

// Sync models (create tables if they don't exist)
const syncModels = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized');
  } catch (error) {
    console.error('❌ Error synchronizing models:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncModels
};