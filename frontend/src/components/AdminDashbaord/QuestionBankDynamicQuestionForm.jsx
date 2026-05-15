/**
 * Question-bank add/edit modal: reuses the same leaf editors as the dedicated admin flows
 * (no duplicate form implementations here).
 * - Coding → `CodingRoundProblemEditor` (same as `pages/AdminDashbaord/CodingRoundUpload.jsx`)
 * - MCQ → `McqQuestionEditor` (same as `pages/AdminDashbaord/McqUpload.jsx`)
 * - Notes → `MarkdownFileUploadField` + textarea (same upload control as
 *   `EditTopicForm.jsx` / `UploadTopicsPage.jsx` after consolidation on this component)
 */
import React, { useMemo, useState } from "react";
import CodingRoundProblemEditor from "./CodingRoundProblemEditor";
import McqQuestionEditor from "./McqQuestionEditor";
import MarkdownFileUploadField from "./MarkdownFileUploadField";

const fieldClass = "dashboard-input-surface w-full rounded-xl px-3 py-2.5";
const textareaClass = "dashboard-input-surface w-full rounded-xl px-3 py-2.5 min-h-[7rem]";

const normalizeCodingTestCases = (testCases = []) =>
  testCases.map((testCase) => ({
    input: testCase.input || "",
    expectedOutput: testCase.output || testCase.expectedOutput || "",
  }));

export default function QuestionBankDynamicQuestionForm({
  categoryType,
  form,
  errors,
  onFieldChange,
  onAddTag,
  onRemoveTag,
}) {
  const [notesFile, setNotesFile] = useState(null);

  const codingProblem = useMemo(
    () => ({
      problemTitle: form.title || "",
      difficulty: form.difficulty || "",
      description: form.problemDescription || "",
      inputDescription: form.inputFormat || "",
      outputDescription: form.outputFormat || "",
      visibleTestCases: normalizeCodingTestCases(form.visibleTestCases),
      hiddenTestCases: normalizeCodingTestCases(form.hiddenTestCases),
    }),
    [form]
  );

  const mcqQuestion = useMemo(
    () => ({
      text: form.problemDescription || "",
      options: form.mcqOptions || ["", "", "", ""],
      correct: form.mcqCorrectIndex || 0,
      difficulty: form.difficulty || "Medium",
      tags: form.tags || [],
    }),
    [form]
  );

  const setCodingTestCase = (section, testCaseIndex, field, value) => {
    const outputField = field === "expectedOutput" ? "output" : field;
    const nextCases = (form[section] || []).map((testCase, index) =>
      index === testCaseIndex ? { ...testCase, [outputField]: value } : testCase
    );
    onFieldChange(section, nextCases);
  };

  const addCodingTestCase = (section) => {
    onFieldChange(section, [...(form[section] || []), { input: "", output: "", explanation: "" }]);
  };

  const removeCodingTestCase = (section, testCaseIndex) => {
    const currentCases = form[section] || [];
    if (currentCases.length <= 1) return;
    onFieldChange(section, currentCases.filter((_, index) => index !== testCaseIndex));
  };

  const handleNotesFileChange = (file) => {
    setNotesFile(file);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onFieldChange("title", form.title || file.name.replace(/\.md$/i, ""));
      onFieldChange("notesMarkdown", String(reader.result || ""));
    };
    reader.readAsText(file);
  };

  if (categoryType === "MCQ") {
    return (
      <div className="space-y-4">
        <McqQuestionEditor
          question={mcqQuestion}
          questionIndex={0}
          errors={errors}
          onQuestionChange={(_, field, value) => {
            if (field === "text") onFieldChange("problemDescription", value);
            if (field === "correct") onFieldChange("mcqCorrectIndex", value);
            if (field === "difficulty") onFieldChange("difficulty", value);
          }}
          onOptionChange={(_, optionIndex, value) => {
            const nextOptions = [...(form.mcqOptions || ["", "", "", ""])];
            nextOptions[optionIndex] = value;
            onFieldChange("mcqOptions", nextOptions);
          }}
          onAddTag={(_, event) => onAddTag(event)}
          onRemoveTag={(_, tagIndex) => onRemoveTag((form.tags || [])[tagIndex])}
        />

        <div>
          <label className="block text-sm font-semibold mb-2">Explanation</label>
          <input
            value={form.mcqExplanation || ""}
            onChange={(event) => onFieldChange("mcqExplanation", event.target.value)}
            placeholder="Short explanation"
            className={fieldClass}
          />
        </div>
      </div>
    );
  }

  if (categoryType === "Notes") {
    return (
      <div className="space-y-4">
        <input
          type="text"
          value={form.title}
          onChange={(event) => onFieldChange("title", event.target.value)}
          placeholder="Notes title"
          className={fieldClass}
        />

        <MarkdownFileUploadField
          label="Notes File"
          file={notesFile}
          onChange={handleNotesFileChange}
          accept=".md"
        />

        <textarea
          value={form.notesMarkdown || ""}
          onChange={(event) => onFieldChange("notesMarkdown", event.target.value)}
          rows={12}
          placeholder="Write or upload Markdown notes"
          className={textareaClass}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CodingRoundProblemEditor
        problem={codingProblem}
        problemIndex={0}
        errors={errors}
        formFieldClass={fieldClass}
        formSelectClass={fieldClass}
        textareaClass={textareaClass}
        onProblemChange={(_, field, value) => {
          if (field === "problemTitle") onFieldChange("title", value);
          if (field === "difficulty") onFieldChange("difficulty", value);
          if (field === "description") onFieldChange("problemDescription", value);
          if (field === "inputDescription") onFieldChange("inputFormat", value);
          if (field === "outputDescription") onFieldChange("outputFormat", value);
        }}
        onVisibleTestCaseChange={(_, testCaseIndex, field, value) =>
          setCodingTestCase("visibleTestCases", testCaseIndex, field, value)
        }
        onHiddenTestCaseChange={(_, testCaseIndex, field, value) =>
          setCodingTestCase("hiddenTestCases", testCaseIndex, field, value)
        }
        onAddVisibleTestCase={() => addCodingTestCase("visibleTestCases")}
        onRemoveVisibleTestCase={(_, testCaseIndex) =>
          removeCodingTestCase("visibleTestCases", testCaseIndex)
        }
        onAddHiddenTestCase={() => addCodingTestCase("hiddenTestCases")}
        onRemoveHiddenTestCase={(_, testCaseIndex) =>
          removeCodingTestCase("hiddenTestCases", testCaseIndex)
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[#0d2a57] dark:text-[#8fd9ff]">Time Limit</label>
          <input
            type="number"
            min="1"
            value={form.timeLimit}
            onChange={(event) => onFieldChange("timeLimit", event.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[#0d2a57] dark:text-[#8fd9ff]">Memory Limit</label>
          <input
            type="number"
            min="1"
            value={form.memoryLimit}
            onChange={(event) => onFieldChange("memoryLimit", event.target.value)}
            className={fieldClass}
          />
        </div>
      </div>
    </div>
  );
}
