import React from "react";

export default function CodingRoundProblemEditor({
  problem,
  problemIndex,
  errors,
  formFieldClass,
  formSelectClass,
  textareaClass,
  onProblemChange,
  onVisibleTestCaseChange,
  onHiddenTestCaseChange,
  onAddVisibleTestCase,
  onRemoveVisibleTestCase,
  onAddHiddenTestCase,
  onRemoveHiddenTestCase,
}) {
  const fieldClass = formFieldClass || "dashboard-input-surface w-full rounded-xl px-3 py-2.5";
  const selectClass = formSelectClass || "dashboard-input-surface w-full rounded-xl px-3 py-2.5";
  const taClass = textareaClass || "dashboard-input-surface w-full rounded-xl px-3 py-2.5 min-h-[7rem]";

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={problem.problemTitle}
        onChange={(e) => onProblemChange(problemIndex, "problemTitle", e.target.value)}
        placeholder={`Problem ${problemIndex + 1} Title`}
        className={fieldClass}
      />
      {errors?.[`p-${problemIndex}-title`] && (
        <p className="text-red-500 text-sm">{errors[`p-${problemIndex}-title`]}</p>
      )}

      <select
        value={problem.difficulty}
        onChange={(e) => onProblemChange(problemIndex, "difficulty", e.target.value)}
        className={selectClass}
      >
        <option value="">Select difficulty</option>
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>
      {errors?.[`p-${problemIndex}-difficulty`] && (
        <p className="text-red-500 text-sm">{errors[`p-${problemIndex}-difficulty`]}</p>
      )}

      <textarea
        value={problem.description}
        onChange={(e) => onProblemChange(problemIndex, "description", e.target.value)}
        placeholder="Problem description"
        rows="3"
        className={taClass}
      />
      {errors?.[`p-${problemIndex}-description`] && (
        <p className="text-red-500 text-sm">{errors[`p-${problemIndex}-description`]}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[#0d2a57] dark:text-[#8fd9ff]">Input Description</label>
          <textarea
            value={problem.inputDescription}
            onChange={(e) => onProblemChange(problemIndex, "inputDescription", e.target.value)}
            placeholder="Describe the input format"
            rows="2"
            className={`${taClass} text-sm min-h-[5.5rem]`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[#0d2a57] dark:text-[#8fd9ff]">Output Description</label>
          <textarea
            value={problem.outputDescription}
            onChange={(e) => onProblemChange(problemIndex, "outputDescription", e.target.value)}
            placeholder="Describe the output format"
            rows="2"
            className={`${taClass} text-sm min-h-[5.5rem]`}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Visible Test Cases:</h4>
        {problem.visibleTestCases.map((testCase, tcIndex) => (
          <div
            key={tcIndex}
            className="dashboard-surface-strong rounded-xl border border-black/10 dark:border-white/10 p-3 space-y-2"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Visible Test Case {tcIndex + 1}</span>
              {problem.visibleTestCases.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveVisibleTestCase(problemIndex, tcIndex)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            <textarea
              value={testCase.input}
              onChange={(e) => onVisibleTestCaseChange(problemIndex, tcIndex, "input", e.target.value)}
              placeholder="Input (e.g., '9\n2 7 11 15')"
              rows="2"
              className={`${taClass} text-sm min-h-[5.5rem]`}
            />
            <textarea
              value={testCase.expectedOutput}
              onChange={(e) => onVisibleTestCaseChange(problemIndex, tcIndex, "expectedOutput", e.target.value)}
              placeholder="Expected Output (e.g., '0 1')"
              rows="2"
              className={`${taClass} text-sm min-h-[5.5rem]`}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => onAddVisibleTestCase(problemIndex)}
          className="text-[#2d7fe8] hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff] text-sm font-medium"
        >
          + Add Visible Test Case
        </button>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Hidden Test Cases:</h4>
        {problem.hiddenTestCases.map((testCase, tcIndex) => (
          <div
            key={tcIndex}
            className="dashboard-surface-strong rounded-xl border border-black/10 dark:border-white/10 p-3 space-y-2"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Hidden Test Case {tcIndex + 1}</span>
              {problem.hiddenTestCases.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveHiddenTestCase(problemIndex, tcIndex)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            <textarea
              value={testCase.input}
              onChange={(e) => onHiddenTestCaseChange(problemIndex, tcIndex, "input", e.target.value)}
              placeholder="Input (e.g., '6\n3 3')"
              rows="2"
              className={`${taClass} text-sm min-h-[5.5rem]`}
            />
            <textarea
              value={testCase.expectedOutput}
              onChange={(e) => onHiddenTestCaseChange(problemIndex, tcIndex, "expectedOutput", e.target.value)}
              placeholder="Expected Output (e.g., '6')"
              rows="2"
              className={`${taClass} text-sm min-h-[5.5rem]`}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => onAddHiddenTestCase(problemIndex)}
          className="text-[#2d7fe8] hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff] text-sm font-medium"
        >
          + Add Hidden Test Case
        </button>
      </div>
    </div>
  );
}
