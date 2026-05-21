import Question from "../models/Questions.js";
import { writeAuditLog } from "./auditLogger.js";

const buildNotesQuestionPayload = ({ notes, topic }) => ({
  title: topic.title,
  description: `Notes for ${topic.title}`,
  categoryType: "Notes",
  trackType: "Core",
  categoryTitle: topic.title,
  categorySlug: topic.slug,
  content: {
    markdownBody: notes.parsedContent || "",
    solutionNotes: notes.parsedContent || "",
  },
  status: "Active",
  isActive: true,
});

export const syncNotesQuestionBankEntry = async ({ notes, topic, actor = null }) => {
  if (!notes || !topic) return null;

  const payload = buildNotesQuestionPayload({ notes, topic });
  let question = null;
  let operation = "updated";

  if (notes.questionBankId) {
    question = await Question.findByIdAndUpdate(notes.questionBankId, { $set: payload }, { new: true, runValidators: true });
    if (!question) {
      operation = "recreated";
    }
  }

  if (!question) {
    question = await Question.findOneAndUpdate(
      { categoryType: "Notes", title: topic.title, categorySlug: topic.slug },
      { $set: payload, $setOnInsert: { solvedCount: 0, version: 1 } },
      { new: true, upsert: true, runValidators: true }
    );
    operation = notes.questionBankId ? "recreated" : "created";
  }

  notes.questionBankId = question._id;
  notes.categoryType = "Notes";

  await writeAuditLog({
    verb: operation === "created" ? "Created" : "Updated",
    entityType: "Question",
    entityId: question._id,
    action: `Synced notes into question bank (${operation})`,
    detail: topic.title,
    actor,
    metadata: {
      source: "notes-bridge",
      notesId: String(notes._id),
      topicId: String(topic._id),
      operation,
    },
  });

  return question;
};
