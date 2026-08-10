import mongoose from 'mongoose';
import dbConnect from '../lib/db.js';

async function resetDatabase() {
  const allowReset = process.env.ALLOW_DB_RESET === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  if (!allowReset || isProduction) {
    console.error('❌ Database Reset Guard Rejected execution: ALLOW_DB_RESET must be true and NODE_ENV must NOT be production.');
    process.exit(1);
  }

  console.log('⚠️ RESETTING DATABASE (DEVELOPMENT ONLY)...');
  await dbConnect();

  const collections = await mongoose.connection.db.collections();
  for (const col of collections) {
    await col.deleteMany({});
  }

  console.log('✅ Database reset complete.');
  process.exit(0);
}

resetDatabase().catch((err) => {
  console.error('❌ Reset error:', err);
  process.exit(1);
});
