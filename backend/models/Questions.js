import mongoose from 'mongoose';
import { normalizeCategoryType, validateQuestionPayload } from '../utils/questionBank.js';

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

    // Multi-language starter code schema (explicit languages)
    starterCode: {
      type: new mongoose.Schema(
        {
          cpp: { code: String, version: { type: Number, default: 1 } },
          python: { code: String, version: { type: Number, default: 1 } },
          java: { code: String, version: { type: Number, default: 1 } },
          javascript: { code: String, version: { type: Number, default: 1 } },
          c: { code: String, version: { type: Number, default: 1 } },
          csharp: { code: String, version: { type: Number, default: 1 } },
          go: { code: String, version: { type: Number, default: 1 } },
          rust: { code: String, version: { type: Number, default: 1 } },
        },
        { _id: false }
      ),
      default: {},
    },

    // Multi-language reference solution (hidden)
    referenceSolution: {
      type: new mongoose.Schema(
        {
          cpp: { code: String, version: { type: Number, default: 1 } },
          python: { code: String, version: { type: Number, default: 1 } },
          java: { code: String, version: { type: Number, default: 1 } },
          javascript: { code: String, version: { type: Number, default: 1 } },
          c: { code: String, version: { type: Number, default: 1 } },
          csharp: { code: String, version: { type: Number, default: 1 } },
          go: { code: String, version: { type: Number, default: 1 } },
          rust: { code: String, version: { type: Number, default: 1 } },
        },
        { _id: false, select: false }
      ),
      default: {},
    },
    contentVersion: { type: Number, default: 1 },

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
      set: normalizeCategoryType,
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

  // --- Migration fallback: if starterCode was previously stored as a Map<string,string>,
  // convert it into the explicit language schema so older records remain compatible.
  try {
    if (c.starterCode && typeof c.starterCode === 'object' && !c.starterCode.cpp && !c.starterCode.python) {
      const legacy = c.starterCode;
      const normalized = {};
      for (const k of Object.keys(legacy)) {
        const val = legacy[k];
        if (typeof val === 'string') {
          normalized[k] = { code: val, version: 1 };
        } else if (val && val.code) {
          normalized[k] = { code: val.code, version: val.version || 1 };
        }
      }
      c.starterCode = normalized;
    }
  } catch (e) {
    // ignore migration fallback errors; validation will surface issues if any
  }

  try {
    validateQuestionPayload(this);
  } catch (error) {
    return next(error);
  }

  next();
});

const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);
export default Question;
