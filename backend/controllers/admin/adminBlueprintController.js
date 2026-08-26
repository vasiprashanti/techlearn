import mongoose from "mongoose";
import Blueprint from "../../models/Blueprint.js";
import Category from "../../models/Category.js";
import Program from "../../models/Program.js";
import {
  BLUEPRINT_TYPE_LABELS,
  BLUEPRINT_TYPES_BY_PROGRAM_TYPE,
  normalizeBlueprintType,
} from "../../utils/blueprintTypes.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const serializeBlueprint = (blueprint) => ({
  ...blueprint,
  totalQuestionCount: (blueprint.configurations || []).reduce(
    (sum, configuration) => sum + Number(configuration.questionCount || 0),
    0
  ),
});

const getProgramOrError = async (programId, res) => {
  if (!isValidObjectId(programId)) {
    res.status(400).json({ success: false, message: "Invalid program ID format" });
    return null;
  }

  const program = await Program.findById(programId).select("_id programType").lean();
  if (!program) {
    res.status(404).json({ success: false, message: "Program not found" });
    return null;
  }

  return program;
};

const resolveConfigurations = async (rawConfigurations) => {
  if (!Array.isArray(rawConfigurations) || rawConfigurations.length === 0) {
    return { error: "Add at least one question-bank category to the blueprint." };
  }

  const normalized = rawConfigurations.map((configuration) => ({
    categoryId: configuration?.categoryId,
    questionCount: Number(configuration?.questionCount),
    difficulty: ["Any", "Easy", "Medium", "Hard"].includes(configuration?.difficulty)
      ? configuration.difficulty
      : "Any",
    pattern: String(configuration?.pattern || "").trim(),
  }));

  if (normalized.some((configuration) => !isValidObjectId(configuration.categoryId))) {
    return { error: "Every blueprint row must use a valid question-bank category." };
  }

  if (normalized.some((configuration) => !Number.isInteger(configuration.questionCount) || configuration.questionCount < 1)) {
    return { error: "Question counts must be whole numbers greater than zero." };
  }

  const categoryIds = normalized.map((configuration) => String(configuration.categoryId));
  if (new Set(categoryIds).size !== categoryIds.length) {
    return { error: "Each question-bank category can appear only once in a blueprint." };
  }

  const categories = await Category.find({
    _id: { $in: categoryIds },
    visibility: { $ne: "private" },
    status: { $in: ["Active", "Draft"] },
  })
    .select("_id title slug status visibility")
    .lean();
  const categoryById = new Map(categories.map((category) => [String(category._id), category]));

  if (categories.length !== categoryIds.length) {
    return { error: "One or more selected question-bank categories could not be found." };
  }

  return {
    configurations: normalized.map((configuration) => ({
      categoryId: configuration.categoryId,
      category: categoryById.get(String(configuration.categoryId)).title,
      questionCount: configuration.questionCount,
      difficulty: configuration.difficulty,
      pattern: configuration.pattern,
    })),
  };
};

const resolveBlueprintType = (program, value) => {
  const blueprintType = normalizeBlueprintType(value);
  const allowedTypes = BLUEPRINT_TYPES_BY_PROGRAM_TYPE[program.programType] || [];

  if (!blueprintType || !allowedTypes.includes(blueprintType)) {
    return {
      error: `${program.programType} programs support: ${allowedTypes.map((type) => BLUEPRINT_TYPE_LABELS[type]).join(", ")}.`,
    };
  }

  return { blueprintType };
};

export const listBlueprints = async (req, res) => {
  try {
    const program = await getProgramOrError(req.params.programId, res);
    if (!program) return;

    const blueprints = await Blueprint.find({ programId: program._id })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      programType: program.programType,
      allowedBlueprintTypes: BLUEPRINT_TYPES_BY_PROGRAM_TYPE[program.programType] || [],
      blueprints: blueprints.map(serializeBlueprint),
    });
  } catch (error) {
    console.error("Error listing program blueprints:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch program blueprints." });
  }
};

export const createBlueprint = async (req, res) => {
  try {
    const program = await getProgramOrError(req.params.programId, res);
    if (!program) return;

    const typeResult = resolveBlueprintType(program, req.body.blueprintType);
    if (typeResult.error) return res.status(400).json({ success: false, message: typeResult.error });

    const configurationResult = await resolveConfigurations(
      req.body.configurations || req.body.questionConfigurations
    );
    if (configurationResult.error) {
      return res.status(400).json({ success: false, message: configurationResult.error });
    }

    const existing = await Blueprint.findOne({
      programId: program._id,
      blueprintType: typeResult.blueprintType,
    }).lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `${BLUEPRINT_TYPE_LABELS[typeResult.blueprintType]} already exists for this program. Edit the existing blueprint instead.`,
      });
    }

    const blueprint = await Blueprint.create({
      programId: program._id,
      name: String(req.body.name || BLUEPRINT_TYPE_LABELS[typeResult.blueprintType]).trim(),
      blueprintType: typeResult.blueprintType,
      configurations: configurationResult.configurations,
      status: req.body.status || "Draft",
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Blueprint created successfully.",
      blueprint: serializeBlueprint(blueprint.toObject()),
    });
  } catch (error) {
    console.error("Error creating program blueprint:", error);
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "This blueprint type already exists for the program." });
    }
    return res.status(400).json({ success: false, message: error.message || "Failed to create blueprint." });
  }
};

export const updateBlueprint = async (req, res) => {
  try {
    const program = await getProgramOrError(req.params.programId, res);
    if (!program) return;

    if (!isValidObjectId(req.params.blueprintId)) {
      return res.status(400).json({ success: false, message: "Invalid blueprint ID format" });
    }

    const blueprint = await Blueprint.findOne({
      _id: req.params.blueprintId,
      programId: program._id,
    });
    if (!blueprint) {
      return res.status(404).json({ success: false, message: "Blueprint not found for this program." });
    }

    const typeResult = resolveBlueprintType(
      program,
      req.body.blueprintType === undefined ? blueprint.blueprintType : req.body.blueprintType
    );
    if (typeResult.error) return res.status(400).json({ success: false, message: typeResult.error });

    const configurationResult = await resolveConfigurations(
      req.body.configurations === undefined && req.body.questionConfigurations === undefined
        ? blueprint.configurations
        : (req.body.configurations || req.body.questionConfigurations)
    );
    if (configurationResult.error) {
      return res.status(400).json({ success: false, message: configurationResult.error });
    }

    const duplicate = await Blueprint.findOne({
      _id: { $ne: blueprint._id },
      programId: program._id,
      blueprintType: typeResult.blueprintType,
    }).lean();
    if (duplicate) {
      return res.status(409).json({ success: false, message: "This blueprint type already exists for the program." });
    }

    blueprint.name = String(req.body.name || blueprint.name || BLUEPRINT_TYPE_LABELS[typeResult.blueprintType]).trim();
    blueprint.blueprintType = typeResult.blueprintType;
    blueprint.configurations = configurationResult.configurations;
    if (req.body.status !== undefined) blueprint.status = req.body.status;
    blueprint.updatedBy = req.user?._id || blueprint.updatedBy;
    await blueprint.save();

    return res.json({
      success: true,
      message: "Blueprint updated successfully.",
      blueprint: serializeBlueprint(blueprint.toObject()),
    });
  } catch (error) {
    console.error("Error updating program blueprint:", error);
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "This blueprint type already exists for the program." });
    }
    return res.status(400).json({ success: false, message: error.message || "Failed to update blueprint." });
  }
};

export const deleteBlueprint = async (req, res) => {
  try {
    const program = await getProgramOrError(req.params.programId, res);
    if (!program) return;

    if (!isValidObjectId(req.params.blueprintId)) {
      return res.status(400).json({ success: false, message: "Invalid blueprint ID format" });
    }

    const deleted = await Blueprint.findOneAndDelete({
      _id: req.params.blueprintId,
      programId: program._id,
    });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Blueprint not found for this program." });
    }

    return res.json({ success: true, message: "Blueprint deleted successfully." });
  } catch (error) {
    console.error("Error deleting program blueprint:", error);
    return res.status(500).json({ success: false, message: "Failed to delete blueprint." });
  }
};
