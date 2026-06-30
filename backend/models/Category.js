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
    status: {
      type: String,
      enum: ['Active', 'Draft', 'Archived'],
      default: 'Draft',
    },
    visibility: {
      type: String,
      enum: {
        values: ['Assessment', 'Practice', 'Both'],
        message: 'visibility must be Assessment, Practice, or Both',
      },
      default: 'Both',
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

categorySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.categoryType || (update.$set && update.$set.categoryType)) {
    return next(new Error('categoryType cannot be changed after creation'));
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
