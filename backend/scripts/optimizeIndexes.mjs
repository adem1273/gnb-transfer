import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const analyzeIndexes = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.warn('Connected to MongoDB');

  const collections = await mongoose.connection.db.listCollections().toArray();

  for (const collection of collections) {
    const { name } = collection;
    console.warn(`\n=== ${name} ===`);

    // Get existing indexes
    const indexes = await mongoose.connection.db.collection(name).indexes();
    console.warn('Current indexes:', indexes.map((i) => i.name));

    // Get index stats
    const stats = await mongoose.connection.db
      .collection(name)
      .aggregate([{ $indexStats: {} }])
      .toArray();

    // Find unused indexes
    const unusedIndexes = stats.filter((s) => s.accesses.ops === 0 && s.name !== '_id_');
    if (unusedIndexes.length > 0) {
      console.warn('Unused indexes:', unusedIndexes.map((i) => i.name));
    }
  }

  await mongoose.disconnect();
  console.warn('\nAnalysis complete');
};

const recommendedIndexes = {
  users: [{ key: { email: 1 }, unique: true }, { key: { role: 1 } }, { key: { createdAt: -1 } }],
  bookings: [
    { key: { user: 1, createdAt: -1 } },
    { key: { tour: 1, date: 1 } },
    { key: { status: 1, date: 1 } },
    { key: { createdAt: -1 } },
  ],
  tours: [{ key: { active: 1, price: 1 } }, { key: { location: 1 } }, { key: { createdAt: -1 } }],
  refreshtokens: [
    { key: { tokenId: 1 }, unique: true },
    { key: { userId: 1, revoked: 1 } },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ],
  coupons: [{ key: { code: 1 }, unique: true }, { key: { active: 1, validUntil: 1 } }],
};

console.warn('Recommended indexes:', JSON.stringify(recommendedIndexes, null, 2));

analyzeIndexes().catch(console.error);
