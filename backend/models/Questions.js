import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: '' },
    output: { type: String, default: '' },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const hiddenTestCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: '' },
    output: { type: String, default: '' },
  },
  { _id: false }
);

const mcqOptionSchema = new mongoose.Schema(
  {
    label: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const contentSchema = new mongoose.Schema(
  {
    constraints: { type: String, default: '' },
    visibleTestCases: { type: [testCaseSchema], default: [] },
    hiddenTestCases: { type: [hiddenTestCaseSchema], default: [], select: false },
    timeLimit: { type: Number, default: 1000 },
    memoryLimit: { type: Number, default: 256 },
    starterCode: { type: Map, of: String },
    referenceSolution: { type: String, default: '', select: false },

    options: { type: [mcqOptionSchema], default: [] },
    correctOption: { type: String, enum: ['A', 'B', 'C', 'D', ''], default: '', select: false },
    explanation: { type: String, default: '' },

    markdownBody: { type: String, default: '' },
    markdownFileUrl: { type: String, default: '' },
    solutionNotes: { type: String, default: '' },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    // Central question-bank fields
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false,
    },
    categoryType: {
      type: String,
      enum: ['Coding', 'MCQ', 'Notes'],
      required: false,
    },
    content: {
      type: contentSchema,
      default: {},
    },

    // Existing legacy fields used by the rest of the app
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
    },
    trackType: {
      type: String,
      default: 'Core',
      trim: true,
    },
    categorySlug: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    categoryTitle: {
      type: String,
      trim: true,
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    inputFormat: {
      type: String,
      default: '',
    },
    outputFormat: {
      type: String,
      default: '',
    },
    visibleTestCases: { type: [testCaseSchema], default: [] },
    hiddenTestCases: { type: [testCaseSchema], default: [] },
    timeLimit: Number,
    memoryLimit: Number,
    status: {
      type: String,
      enum: ['Active', 'Draft', 'Archived'],
      default: 'Active',
    },
    solvedCount: {
      type: Number,
      default: 0,
    },
    referenceLanguage: {
      type: String,
      default: 'C++',
    },
    solutionCode: {
      type: String,
      default: '',
    },
    editorial: {
      type: String,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

questionSchema.index({ categoryId: 1, categoryType: 1 });
questionSchema.index({ categorySlug: 1, status: 1 });
questionSchema.index({ trackType: 1 });
questionSchema.index({ categoryId: 1, isActive: 1 });

questionSchema.pre('save', function (next) {
  // Only enforce the new question-bank validation when the new fields are being used.
  if (!this.categoryType || !this.content) {
    return next();
  }

  const c = this.content;

  if (this.categoryType === 'Coding') {
    if (!c.visibleTestCases || c.visibleTestCases.length === 0) {
      return next(new Error('Coding questions require at least one visible test case'));
    }
    if (!c.hiddenTestCases || c.hiddenTestCases.length === 0) {
      return next(new Error('Coding questions require at least one hidden test case'));
    }
  }

  if (this.categoryType === 'MCQ') {
    if (!c.options || c.options.length < 2) {
      return next(new Error('MCQ questions require at least 2 options'));
    }
    if (!c.correctOption) {
      return next(new Error('MCQ questions require correctOption to be set'));
    }
  }

  if (this.categoryType === 'Notes') {
    if (!c.markdownBody && !c.markdownFileUrl) {
      return next(new Error('Notes questions require either markdownBody or markdownFileUrl'));
    }
  }

  next();
});

const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);
export default Question;
