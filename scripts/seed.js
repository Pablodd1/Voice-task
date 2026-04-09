const User = require('../models/User');
const Claim = require('../models/Claim');
const { testConnection, syncModels } = require('../config/database');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await testConnection();
    await syncModels();
    
    // Create test user
    const testUserExists = await User.findOne({ where: { email: 'test@lunabill.com' } });
    
    if (!testUserExists) {
      const testUser = await User.create({
        email: 'test@lunabill.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        practiceName: 'Test Medical Practice',
        phone: '555-123-4567'
      });
      
      console.log(`✅ Created test user: ${testUser.email}`);
      
      // Create sample claims
      const sampleClaims = [
        { claimNumber: 'CLM-2026-001', patientName: 'John Smith', payerName: 'Blue Cross Blue Shield', billedAmount: 250.00, submissionDate: '2026-03-01' },
        { claimNumber: 'CLM-2026-002', patientName: 'Jane Doe', payerName: 'UnitedHealthcare', billedAmount: 450.00, submissionDate: '2026-03-05' },
        { claimNumber: 'CLM-2026-003', patientName: 'Robert Johnson', payerName: 'Medicare', billedAmount: 1200.00, submissionDate: '2026-03-10' },
        { claimNumber: 'CLM-2026-004', patientName: 'Maria Garcia', payerName: 'Aetna', billedAmount: 300.00, submissionDate: '2026-03-15', status: 'paid' },
        { claimNumber: 'CLM-2026-005', patientName: 'David Wilson', payerName: 'Cigna', billedAmount: 750.00, submissionDate: '2026-03-20', status: 'denied', denialReason: 'Missing prior authorization' }
      ];
      
      for (const claimData of sampleClaims) {
        await Claim.create({
          userId: testUser.id,
          ...claimData
        });
      }
      
      console.log(`✅ Created ${sampleClaims.length} sample claims`);
    } else {
      console.log('ℹ️  Test user already exists, skipping seed');
    }
    
    console.log('🌿 Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };