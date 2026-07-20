import mongoose from 'mongoose';
import { normalizeCategoryType } from '../utils/questionBank.js';

const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Category title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    categoryType: {
      type: String,
      enum: {
        values: ['Coding', 'MCQ', 'Notes'],
        message: 'categoryType must be Coding, MCQ, or Notes',
      },
      set: normalizeCategoryType,
      required: [true, 'categoryType is required'],
    },
    mcqSection: {
      type: String,
      enum: ['Technical', 'Aptitude'],
      default: 'Technical',
    },
    status: {
      type: String,
      enum: ['Active', 'Draft', 'Archived'],
      default: 'Draft',
    },
    usage: {
      type: String,
      enum: {
        values: ['Assessment', 'Practice', 'Both'],
        message: 'usage must be Assessment, Practice, or Both',
      },
      default: 'Both',
    },
    visibility: {
      type: String,
      enum: {
        values: ['Assessment', 'Practice', 'Both'],
        message: 'visibility must be Assessment, Practice, or Both',
      },
      default: 'Both',
    },
    batches: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    }],
    bannerImage: {
      type: String,
      default: '',
      trim: true,
    },
    defaultIcon: {
      type: String,
      default: 'Code',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

categorySchema.virtual('questionCount', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'categoryId',
  count: true,
});

categorySchema.pre('save', function (next) {
  if (this.isModified('usage')) {
    this.visibility = this.usage;
  } else if (this.isModified('visibility')) {
    this.usage = this.visibility;
  }
  next();
});

categorySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.categoryType || (update.$set && update.$set.categoryType)) {
    return next(new Error('categoryType cannot be changed after creation'));
  }
  
  // Synchronize usage and visibility in updates
  if (update.usage !== undefined) {
    update.visibility = update.usage;
  } else if (update.$set && update.$set.usage !== undefined) {
    update.$set.visibility = update.$set.usage;
  } else if (update.visibility !== undefined) {
    update.usage = update.visibility;
  } else if (update.$set && update.$set.visibility !== undefined) {
    update.$set.usage = update.$set.visibility;
  }

  next();
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
