import mongoose from 'mongoose';

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
    // Drives which form the frontend renders, immutable after creation
    categoryType: {
      type: String,
      enum: {
        values: ['Coding', 'MCQ', 'Notes'],
        message: 'categoryType must be Coding, MCQ, or Notes',
      },
      required: [true, 'categoryType is required'],
    },
    icon: {
      type: String, // icon key string or CDN URL
      default: '',
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
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

// Virtual: question count — always fresh, no counter drift
categorySchema.virtual('questionCount', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'categoryId',
  count: true,
});

// Prevent categoryType changes after creation
categorySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.categoryType || (update.$set && update.$set.categoryType)) {
    return next(new Error('categoryType cannot be changed after creation'));
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);
export default Category;