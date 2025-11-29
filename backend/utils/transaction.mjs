import mongoose from 'mongoose';
import logger from '../config/logger.mjs';

export const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    logger.error('Transaction aborted:', { error: error.message });
    throw error;
  } finally {
    session.endSession();
  }
};

// Usage example:
// await withTransaction(async (session) => {
//   await Booking.create([bookingData], { session });
//   await Tour.updateOne({ _id: tourId }, { $inc: { bookedCount: 1 } }, { session });
//   return booking;
// });

export default { withTransaction };
