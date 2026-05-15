import React from "react";

export default function McqQuestionEditor({
  question,
  questionIndex,
  errors,
  onQuestionChange,
  onOptionChange,
  onAddTag,
  onRemoveTag,
}) {
  return (
    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700/40 space-y-4">
      <h3 className="font-semibold">Question {questionIndex + 1}</h3>

      <input
        type="text"
        value={question.text}
        onChange={(e) => onQuestionChange(questionIndex, "text", e.target.value)}
        placeholder="Enter question text"
        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
      {errors?.[`q-${questionIndex}-text`] && (
        <p className="text-red-500 text-sm">{errors[`q-${questionIndex}-text`]}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((opt, optIndex) => (
          <div key={optIndex}>
            <input
              type="text"
              value={opt}
              onChange={(e) => onOptionChange(questionIndex, optIndex, e.target.value)}
              placeholder={`Option ${optIndex + 1}`}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            {errors?.[`q-${questionIndex}-opt-${optIndex}`] && (
              <p className="text-red-500 text-sm">{errors[`q-${questionIndex}-opt-${optIndex}`]}</p>
            )}
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Correct Answer *</label>
        <select
          value={question.correct}
          onChange={(e) => onQuestionChange(questionIndex, "correct", parseInt(e.target.value, 10))}
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value={0}>Option 1</option>
          <option value={1}>Option 2</option>
          <option value={2}>Option 3</option>
          <option value={3}>Option 4</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Difficulty *</label>
        <select
          value={question.difficulty}
          onChange={(e) => onQuestionChange(questionIndex, "difficulty", e.target.value)}
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Tags</label>
        <input
          type="text"
          onKeyDown={(e) => onAddTag(questionIndex, e)}
          placeholder="Type tag and press Enter"
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {question.tags.map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(questionIndex, tagIndex)}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
