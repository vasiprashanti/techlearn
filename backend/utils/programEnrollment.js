import Program from "../models/Program.js";

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

const normalizeSelection = (selection) => String(selection || "").trim();

export const resolveProgramForSelection = async (programSelection) => {
  const selection = normalizeSelection(programSelection);

  // "Both" does not identify one parent Program, so keep the legacy choice
  // intact until the enrollment flow can represent multiple Programs.
  if (!selection || selection === "Both") return null;

  return Program.findOne({
    programType: new RegExp(`^${escapeRegex(selection)}$`, "i"),
    status: "Active",
    visibility: "Public",
  })
    .sort({ createdAt: -1 })
    .lean();
};

export const syncProgramEnrollment = async ({ user, student, batchId, programSelection }) => {
  if (!user || !student) return null;

  const program = await resolveProgramForSelection(programSelection);
  if (!program) return null;

  const programId = program._id;
  const previousProgramId = user.programId || student.programId;

  if (previousProgramId && String(previousProgramId) !== String(programId)) {
    await Program.updateOne(
      { _id: previousProgramId },
      { $pull: { studentIds: student._id } },
    );
  }

  user.programId = programId;
  student.programId = programId;

  await Promise.all([
    user.save(),
    student.save(),
    Program.updateOne(
      { _id: programId },
      {
        $addToSet: {
          studentIds: student._id,
          ...(batchId ? { batchIds: batchId } : {}),
        },
      },
    ),
  ]);

  return program;
};
