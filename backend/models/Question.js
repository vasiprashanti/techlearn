import mongoose from 'mongoose';

//  Sub-schemas

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const hiddenTestCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
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

//  Content sub-document 
// One flexible subdoc covers all 3 types.
// Frontend reads categoryType and only renders the relevant fields.
// Hidden test cases are NEVER returned to clients.

const contentSchema = new mongoose.Schema(
  {
    // --- Coding ---
    constraints: { type: String, default: '' },
    visibleTestCases: { type: [testCaseSchema], default: [] },
    hiddenTestCases: { type: [hiddenTestCaseSchema], default: [], select: false }, // excluded from default queries
    timeLimit: { type: Number, default: 1000 },   // milliseconds
    memoryLimit: { type: Number, default: 256 },  // MB
    starterCode: { type: Map, of: String },        // { javascript: '...', python: '...' }
    referenceSolution: { type: String, default: '', select: false }, // admin-only

    // --- MCQ ---
    options: { type: [mcqOptionSchema], default: [] },
    correctOption: { type: String, enum: ['A', 'B', 'C', 'D', ''], default: '', select: false }, // never sent to client
    explanation: { type: String, default: '' },

    // --- Notes ---
    markdownBody: { type: String, default: '' },
    markdownFileUrl: { type: String, default: '' },
    solutionNotes: { type: String, default: '' },
  },
  { _id: false }
);

//  Main Question schema 

const questionSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'categoryId is required'],
    },
    // Denormalized from Category — avoids extra join on every question fetch
    categoryType: {
      type: String,
      enum: ['Coding', 'MCQ', 'Notes'],
      required: [true, 'categoryType is required'],
    },
    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
    },
    tags: {
      type: [String],
      default: [],
    },
    content: {
      type: contentSchema,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

//  Indexes 
questionSchema.index({ categoryId: 1, categoryType: 1 });
questionSchema.index({ categoryId: 1, isActive: 1 });

//  Validation: enforce type-specific required fields 
questionSchema.pre('save', function (next) {
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

const Question = mongoose.model('Question', questionSchema);
export default Question;