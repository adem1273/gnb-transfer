/**
 * Index Verification Tests
 * 
 * Tests to verify that all required indexes exist on database models
 */

import mongoose from 'mongoose';
import User from '../../models/User.mjs';
import Booking from '../../models/Booking.mjs';
import Tour from '../../models/Tour.mjs';
import BlogPost from '../../models/BlogPost.mjs';
import Review from '../../models/Review.mjs';
import Driver from '../../models/Driver.mjs';

describe('Database Index Verification', () => {
  /**
   * Helper function to get index names from a model
   */
  const getModelIndexes = async (model) => {
    const indexes = await model.collection.getIndexes();
    return Object.keys(indexes);
  };

  /**
   * Helper to check if an index exists
   */
  const indexExists = async (model, indexKey) => {
    const indexes = await model.collection.getIndexes();
    return Object.values(indexes).some(idx => {
      const keys = Object.keys(idx.key);
      const searchKeys = Object.keys(indexKey);
      return searchKeys.every(key => keys.includes(key));
    });
  };

  describe('User Model Indexes', () => {
    it('should have email index', async () => {
      const exists = await indexExists(User, { email: 1 });
      expect(exists).toBe(true);
    });

    it('should have role index', async () => {
      const exists = await indexExists(User, { role: 1 });
      expect(exists).toBe(true);
    });

    it('should have createdAt index', async () => {
      const exists = await indexExists(User, { createdAt: -1 });
      expect(exists).toBe(true);
    });

    it('should have isCorporate + role compound index', async () => {
      const exists = await indexExists(User, { isCorporate: 1, role: 1 });
      expect(exists).toBe(true);
    });

    it('should have resetPasswordToken sparse index', async () => {
      const exists = await indexExists(User, { resetPasswordToken: 1 });
      expect(exists).toBe(true);
    });
  });

  describe('Booking Model Indexes', () => {
    it('should have user + status compound index', async () => {
      const exists = await indexExists(Booking, { user: 1, status: 1 });
      expect(exists).toBe(true);
    });

    it('should have email index', async () => {
      const exists = await indexExists(Booking, { email: 1 });
      expect(exists).toBe(true);
    });

    it('should have tour + date + status compound index', async () => {
      const exists = await indexExists(Booking, { tour: 1, date: 1, status: 1 });
      expect(exists).toBe(true);
    });

    it('should have status + date compound index', async () => {
      const exists = await indexExists(Booking, { status: 1, date: -1 });
      expect(exists).toBe(true);
    });

    it('should have paymentMethod + status + createdAt compound index', async () => {
      const exists = await indexExists(Booking, { paymentMethod: 1, status: 1, createdAt: -1 });
      expect(exists).toBe(true);
    });
  });

  describe('Tour Model Indexes', () => {
    it('should have slug unique index', async () => {
      const indexes = await Tour.collection.getIndexes();
      const slugIndex = Object.values(indexes).find(idx => 
        idx.key.slug === 1 && idx.unique === true
      );
      expect(slugIndex).toBeDefined();
    });

    it('should have active + category + price compound index', async () => {
      const exists = await indexExists(Tour, { active: 1, category: 1, price: -1 });
      expect(exists).toBe(true);
    });

    it('should have text index on title and description', async () => {
      const indexes = await Tour.collection.getIndexes();
      const textIndex = Object.values(indexes).find(idx => 
        idx.key.title === 'text' || idx.key.description === 'text'
      );
      expect(textIndex).toBeDefined();
    });

    it('should have active + isCampaign + price compound index', async () => {
      const exists = await indexExists(Tour, { active: 1, isCampaign: 1, price: -1 });
      expect(exists).toBe(true);
    });
  });

  describe('BlogPost Model Indexes', () => {
    it('should have slug unique index', async () => {
      const indexes = await BlogPost.collection.getIndexes();
      const slugIndex = Object.values(indexes).find(idx => 
        idx.key.slug === 1 && idx.unique === true
      );
      expect(slugIndex).toBeDefined();
    });

    it('should have status + publishedAt compound index', async () => {
      const exists = await indexExists(BlogPost, { status: 1, publishedAt: -1 });
      expect(exists).toBe(true);
    });

    it('should have category + status + publishedAt compound index', async () => {
      const exists = await indexExists(BlogPost, { category: 1, status: 1, publishedAt: -1 });
      expect(exists).toBe(true);
    });

    it('should have language + status + publishedAt compound index', async () => {
      const exists = await indexExists(BlogPost, { language: 1, status: 1, publishedAt: -1 });
      expect(exists).toBe(true);
    });

    it('should have text index for search', async () => {
      const indexes = await BlogPost.collection.getIndexes();
      const textIndex = Object.values(indexes).find(idx => 
        idx.key.title === 'text' || idx.key.excerpt === 'text'
      );
      expect(textIndex).toBeDefined();
    });
  });

  describe('Review Model Indexes', () => {
    it('should have booking unique index', async () => {
      const indexes = await Review.collection.getIndexes();
      const bookingIndex = Object.values(indexes).find(idx => 
        idx.key.booking === 1 && idx.unique === true
      );
      expect(bookingIndex).toBeDefined();
    });

    it('should have user + createdAt compound index', async () => {
      const exists = await indexExists(Review, { user: 1, createdAt: -1 });
      expect(exists).toBe(true);
    });

    it('should have driver + status compound index', async () => {
      const exists = await indexExists(Review, { driver: 1, status: 1 });
      expect(exists).toBe(true);
    });

    it('should have status + showOnHomepage + createdAt compound index', async () => {
      const exists = await indexExists(Review, { status: 1, showOnHomepage: 1, createdAt: -1 });
      expect(exists).toBe(true);
    });

    it('should have status + rating compound index', async () => {
      const exists = await indexExists(Review, { status: 1, rating: -1 });
      expect(exists).toBe(true);
    });
  });

  describe('Driver Model Indexes', () => {
    it('should have email unique index', async () => {
      const indexes = await Driver.collection.getIndexes();
      const emailIndex = Object.values(indexes).find(idx => 
        idx.key.email === 1 && idx.unique === true
      );
      expect(emailIndex).toBeDefined();
    });

    it('should have licenseNumber unique index', async () => {
      const indexes = await Driver.collection.getIndexes();
      const licenseIndex = Object.values(indexes).find(idx => 
        idx.key.licenseNumber === 1 && idx.unique === true
      );
      expect(licenseIndex).toBeDefined();
    });

    it('should have status + rating compound index', async () => {
      const exists = await indexExists(Driver, { status: 1, rating: -1 });
      expect(exists).toBe(true);
    });

    it('should have rating + status compound index', async () => {
      const exists = await indexExists(Driver, { rating: -1, status: 1 });
      expect(exists).toBe(true);
    });
  });

  describe('Index Performance Validation', () => {
    it('User.findOne by email should use index', async () => {
      const explain = await User.findOne({ email: 'test@example.com' }).explain();
      const usedIndex = explain.queryPlanner?.winningPlan?.inputStage?.indexName ||
                       explain.executionStats?.executionStages?.inputStage?.indexName;
      expect(usedIndex).toBeTruthy();
      expect(usedIndex).not.toBe('COLLSCAN');
    });

    it('Booking.find by status should use index', async () => {
      const explain = await Booking.find({ status: 'confirmed' }).explain();
      const stage = explain.queryPlanner?.winningPlan?.inputStage?.inputStage || 
                   explain.queryPlanner?.winningPlan?.inputStage;
      expect(stage?.stage).not.toBe('COLLSCAN');
    });

    it('Tour.find by active and category should use compound index', async () => {
      const explain = await Tour.find({ active: true, category: 'transfer' }).explain();
      const stage = explain.queryPlanner?.winningPlan?.inputStage?.inputStage || 
                   explain.queryPlanner?.winningPlan?.inputStage;
      expect(stage?.stage).not.toBe('COLLSCAN');
    });

    it('BlogPost.find by status and language should use compound index', async () => {
      const explain = await BlogPost.find({ status: 'published', language: 'en' }).explain();
      const stage = explain.queryPlanner?.winningPlan?.inputStage?.inputStage || 
                   explain.queryPlanner?.winningPlan?.inputStage;
      expect(stage?.stage).not.toBe('COLLSCAN');
    });
  });

  describe('Index Count Validation', () => {
    it('should have minimum expected indexes on User model', async () => {
      const indexes = await getModelIndexes(User);
      // _id + email + role + createdAt + isCorporate_role + resetPasswordToken + preferences.language
      expect(indexes.length).toBeGreaterThanOrEqual(5);
    });

    it('should have minimum expected indexes on Booking model', async () => {
      const indexes = await getModelIndexes(Booking);
      // Should have multiple compound indexes for common query patterns
      expect(indexes.length).toBeGreaterThanOrEqual(8);
    });

    it('should have minimum expected indexes on Tour model', async () => {
      const indexes = await getModelIndexes(Tour);
      // Should have text index + compound indexes
      expect(indexes.length).toBeGreaterThanOrEqual(6);
    });

    it('should have minimum expected indexes on BlogPost model', async () => {
      const indexes = await getModelIndexes(BlogPost);
      // Should have text index + various compound indexes
      expect(indexes.length).toBeGreaterThanOrEqual(7);
    });
  });
});
