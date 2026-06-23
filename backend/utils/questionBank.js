import mongoose from "mongoose";
export const CATEGORY_TYPES = ["Coding", "MCQ", "Notes"];

const CATEGORY_TYPE_ALIASES = {
  coding: "Coding",
  code: "Coding",
  cod: "Coding",
  mcq: "MCQ",
  multiplechoice: "MCQ",
  multiplechoicequestion: "MCQ",
  notes: "Notes",
  note: "Notes",
};

const LANGUAGE_KEY_BY_LABEL = {
  "c++": "cpp",
  cpp: "cpp",
  python: "python",
  py: "python",
  java: "java",
  javascript: "javascript",
  js: "javascript",
  c: "c",
  "c#": "csharp",
  csharp: "csharp",
  go: "go",
  rust: "rust",
};

export const normalizeCategoryType = (value) => {
  const key = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  return CATEGORY_TYPE_ALIASES[key] || "";
};

export const normalizeTestCases = (cases = []) =>
  (Array.isArray(cases) ? cases : [])
    .map((testCase) => ({
      input: String(testCase?.input || ""),
      output: String(testCase?.output ?? testCase?.expectedOutput ?? ""),
      explanation: String(testCase?.explanation || ""),
    }))
    .filter((testCase) => testCase.input.trim() || testCase.output.trim() || testCase.explanation.trim());

export const normalizeMcqOptions = (options = []) => {
  const labels = ["A", "B", "C", "D"];
  return (Array.isArray(options) ? options : [])
    .map((option, index) => {
      if (typeof option === "string") {
        return { label: labels[index] || String.fromCharCode(65 + index), text: option.trim() };
      }

      return {
        label: String(option?.label || labels[index] || String.fromCharCode(65 + index)).toUpperCase(),
        text: String(option?.text || "").trim(),
      };
    })
    .filter((option) => option.text);
};

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const buildReferenceSolution = (referenceLanguage, solutionCode) => {
  const code = String(solutionCode || "");
  if (!code.trim()) return {};

  const languageKey = LANGUAGE_KEY_BY_LABEL[String(referenceLanguage || "").trim().toLowerCase()] || "cpp";
  return {
    [languageKey]: {
      code,
      version: 1,
    },
  };
};

export const buildCentralQuestionPayload = async ({ category, body = {}, existingQuestion = null }) => {
  const categoryType = normalizeCategoryType(category?.categoryType || existingQuestion?.categoryType);
  if (!categoryType) {
    throw new Error("A valid categoryType is required.");
  }

  const description = String(body.description ?? body.problemDescription ?? existingQuestion?.description ?? "").trim();
  const tags = Array.isArray(body.tags) ? body.tags.filter(Boolean) : existingQuestion?.tags || [];
  const status = body.status || existingQuestion?.status || "Active";
  const timeLimitSeconds = parsePositiveNumber(body.timeLimit ?? existingQuestion?.timeLimit, 1);
  const memoryLimit = parsePositiveNumber(body.memoryLimit ?? existingQuestion?.memoryLimit, 256);

  const content = {
    ...(existingQuestion?.content?.toObject?.() || existingQuestion?.content || {}),
  };

  if (categoryType === "Coding") {
    const visibleTestCases = normalizeTestCases(body.visibleTestCases ?? content.visibleTestCases);
    const hiddenTestCases = normalizeTestCases(body.hiddenTestCases ?? content.hiddenTestCases);

    content.constraints = String(body.constraints ?? content.constraints ?? "");
    content.visibleTestCases = visibleTestCases;
    content.hiddenTestCases = hiddenTestCases;
    content.timeLimit = Math.round(timeLimitSeconds * 1000);
    content.memoryLimit = memoryLimit;
    content.referenceSolution = buildReferenceSolution(body.referenceLanguage, body.solutionCode);
    content.solutionNotes = String(body.editorial ?? content.solutionNotes ?? "");
  }

  if (categoryType === "MCQ") {
    content.options = normalizeMcqOptions(body.options ?? content.options);
    content.correctOption = String(body.correctOption ?? content.correctOption ?? "").toUpperCase();
    content.explanation = String(body.explanation ?? content.explanation ?? body.editorial ?? "");
  }

  if (categoryType === "Notes") {
    content.markdownBody = String(body.markdownBody ?? body.notesBody ?? content.markdownBody ?? description ?? "");
    content.markdownFileUrl = String(body.markdownFileUrl ?? content.markdownFileUrl ?? "");
    content.solutionNotes = String(body.solutionNotes ?? body.editorial ?? content.solutionNotes ?? "");
  }

  // Resolve and generate unique title
  let titleVal = String(body.title ?? existingQuestion?.title ?? "").trim();
  const categoryTitleVal = category?.title || body.categoryTitle || existingQuestion?.categoryTitle || "";
  
  const categoryTitleLower = categoryTitleVal.toLowerCase();
  const titleLower = titleVal.toLowerCase();

  const isPlaceholderTitle =
    !titleVal ||
    titleLower === categoryTitleLower ||
    titleLower === "jsp" ||
    titleLower === "coding" ||
    titleLower === "mcq" ||
    titleLower === "notes" ||
    titleLower === "general";

  if (isPlaceholderTitle && description) {
    const cleanPrompt = description.replace(/[#*`_]/g, "").replace(/\s+/g, " ").trim();
    const words = cleanPrompt.split(" ").slice(0, 4).join(" ");
    if (words) {
      titleVal = words;
    }
  }

  if (!titleVal) {
    titleVal = "Question";
  }

  let baseTitle = titleVal.trim();
  let uniqueTitle = baseTitle;
  let index = 1;
  const QuestionModel = mongoose.model("Question");

  while (true) {
    const query = { title: uniqueTitle, isActive: true };
    if (existingQuestion?._id) {
      query._id = { $ne: existingQuestion._id };
    }
    const exists = await QuestionModel.findOne(query);
    if (!exists) {
      break;
    }
    uniqueTitle = `${baseTitle} ${index}`;
    index++;
  }

  const payload = {
    title: uniqueTitle,
    description,
    difficulty: body.difficulty || existingQuestion?.difficulty || "Easy",
    tags,
    status,
    isActive: status !== "Archived",
    categoryId: category?._id || existingQuestion?.categoryId,
    categoryType,
    categorySlug: category?.slug || body.categorySlug || existingQuestion?.categorySlug || "",
    categoryTitle: categoryTitleVal,
    trackType: body.trackType || existingQuestion?.trackType || category?.title || "General",
    content,
  };

  if (categoryType === "Coding") {
    payload.inputFormat = String(body.inputFormat ?? existingQuestion?.inputFormat ?? "");
    payload.outputFormat = String(body.outputFormat ?? existingQuestion?.outputFormat ?? "");
    payload.visibleTestCases = content.visibleTestCases;
    payload.hiddenTestCases = content.hiddenTestCases;
    payload.timeLimit = timeLimitSeconds;
    payload.memoryLimit = memoryLimit;
    payload.referenceLanguage = body.referenceLanguage || existingQuestion?.referenceLanguage || "C++";
    payload.solutionCode = String(body.solutionCode ?? existingQuestion?.solutionCode ?? "");
    payload.editorial = String(body.editorial ?? existingQuestion?.editorial ?? content.solutionNotes ?? "");
  } else {
    payload.inputFormat = "";
    payload.outputFormat = "";
    payload.visibleTestCases = [];
    payload.hiddenTestCases = [];
    payload.timeLimit = timeLimitSeconds;
    payload.memoryLimit = memoryLimit;
    payload.referenceLanguage = body.referenceLanguage || existingQuestion?.referenceLanguage || "C++";
    payload.solutionCode = "";
    payload.editorial = String(body.editorial ?? existingQuestion?.editorial ?? content.explanation ?? content.solutionNotes ?? "");
  }

  validateQuestionPayload(payload);
  return payload;
};

export const validateQuestionPayload = (question) => {
  if (!String(question.title || "").trim()) {
    throw new Error("Question title is required.");
  }

  if (!question.categoryId) {
    throw new Error("Question must belong to a central Question Bank category.");
  }

  const categoryType = normalizeCategoryType(question.categoryType);
  if (!categoryType) {
    throw new Error("Question must have a valid categoryType.");
  }

  const content = question.content || {};

  if (categoryType === "Coding") {
    if (!content.visibleTestCases?.length) {
      throw new Error("Coding questions require at least one visible test case.");
    }
    if (!content.hiddenTestCases?.length) {
      throw new Error("Coding questions require at least one hidden test case.");
    }
  }

  if (categoryType === "MCQ") {
    if (!content.options || content.options.length < 2) {
      throw new Error("MCQ questions require at least two options.");
    }
    if (!content.correctOption) {
      throw new Error("MCQ questions require a correct option.");
    }
    if (!content.options.some((option) => option.label === content.correctOption)) {
      throw new Error("MCQ correct option must match one of the provided options.");
    }
  }

  if (categoryType === "Notes") {
    if (!String(content.markdownBody || "").trim() && !String(content.markdownFileUrl || "").trim()) {
      throw new Error("Notes entries require markdown body or a markdown file URL.");
    }
  }
};

export const formatQuestionForAdmin = (question, category = null) => {
  const content = question.content || {};
  const categoryType = normalizeCategoryType(question.categoryType || category?.categoryType) || "Coding";
  const timeLimitSeconds = question.timeLimit || (content.timeLimit ? Number(content.timeLimit) / 1000 : 1);

  return {
    id: question._id,
    title: question.title,
    difficulty: question.difficulty || "Easy",
    track: question.trackType || category?.title || question.categoryTitle || "General",
    created: question.createdAt?.toISOString?.().slice(0, 10) || "",
    status: question.status || (question.isActive === false ? "Archived" : "Active"),
    tags: question.tags || [],
    description: question.description || "",
    inputFormat: question.inputFormat || "",
    outputFormat: question.outputFormat || "",
    visibleTestCases: content.visibleTestCases?.length ? content.visibleTestCases : question.visibleTestCases || [],
    hiddenTestCases: content.hiddenTestCases?.length ? content.hiddenTestCases : question.hiddenTestCases || [],
    timeLimit: String(timeLimitSeconds || 1),
    memoryLimit: String(question.memoryLimit || content.memoryLimit || 256),
    solved: String(question.solvedCount || 0),
    referenceLanguage: question.referenceLanguage || "C++",
    solutionCode: question.solutionCode || "",
    editorial: question.editorial || content.explanation || content.solutionNotes || "",
    categoryId: question.categoryId || category?._id,
    categorySlug: category?.slug || question.categorySlug || "",
    categoryTitle: category?.title || question.categoryTitle || "",
    categoryType,
    content,
    options: content.options || [],
    correctOption: content.correctOption || "",
    explanation: content.explanation || "",
    markdownBody: content.markdownBody || "",
    markdownFileUrl: content.markdownFileUrl || "",
    solutionNotes: content.solutionNotes || "",
  };
};
