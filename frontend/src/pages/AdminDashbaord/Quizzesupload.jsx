import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { MdQuiz } from "react-icons/md";

const Quizzesupload = () => {
  const [topic, setTopic] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(1); // user editable
  const [currentIdx, setCurrentIdx] = useState(0); // which question is being edited

  const makeBlankQuestion = () => ({
    question: "",
    options: ["", "", "", ""], // default 4 options
    correctIndex: null, // store index instead of text (more robust)
    tags: [],
    difficulty: "medium",
  });

  const [questions, setQuestions] = useState([makeBlankQuestion()]);

  const [currentTag, setCurrentTag] = useState("");
  const [errors, setErrors] = useState({}); // errors for CURRENT question only

  // ---- API base (mock-ready) ----
  const BASE_URL = import.meta.env.VITE_API_URL;

  const difficultyOptions = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  // Keep questions array length in sync with `totalQuestions`
  useEffect(() => {
    const n = Math.max(1, Number(totalQuestions || 1));
    setTotalQuestions(n);

    setQuestions((prev) => {
      const copy = [...prev];
      if (n > copy.length) {
        // extend
        for (let i = copy.length; i < n; i++) copy.push(makeBlankQuestion());
      } else if (n < copy.length) {
        // shrink
        copy.length = n;
      }
      return copy;
    });

    setCurrentIdx((idx) => Math.min(idx, n - 1));
  }, [totalQuestions]);

  // Convenience: the question object we're editing right now
  const q = questions[currentIdx];

  // Update helpers for current question
  const updateCurrent = (updater) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[currentIdx] =
        typeof updater === "function"
          ? updater(next[currentIdx])
          : { ...next[currentIdx], ...updater };
      return next;
    });
  };

  const handleOptionChange = (optIndex, value) => {
    updateCurrent((curr) => {
      const options = [...curr.options];
      options[optIndex] = value;
      return { ...curr, options };
    });

    // Clear option-specific error if any
    if (value && errors[`option${optIndex}`]) {
      const next = { ...errors };
      delete next[`option${optIndex}`];
      setErrors(next);
    }
  };

  const addOption = () => {
    if (q.options.length < 6) {
      updateCurrent((curr) => ({ ...curr, options: [...curr.options, ""] }));
    }
  };

  const removeOption = (optIndex) => {
    if (q.options.length > 2) {
      updateCurrent((curr) => {
        const opts = curr.options.filter((_, i) => i !== optIndex);
        let correctIndex = curr.correctIndex;
        if (correctIndex === optIndex)
          correctIndex = null; // removed the correct one
        else if (correctIndex !== null && optIndex < correctIndex) {
          // shift index left
          correctIndex = correctIndex - 1;
        }
        return { ...curr, options: opts, correctIndex };
      });
    }
  };

  const addTag = () => {
    const tag = currentTag.trim();
    if (tag && !q.tags.includes(tag)) {
      updateCurrent((curr) => ({ ...curr, tags: [...curr.tags, tag] }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    updateCurrent((curr) => ({
      ...curr,
      tags: curr.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  // Validate a single question object
  const validateQuestion = (questionObj) => {
    const err = {};
    if (!topic.trim()) err.topic = "Topic is required";
    if (!totalQuestions || totalQuestions < 1)
      err.totalQuestions = "Enter total number of questions (min 1)";

    if (!questionObj.question.trim()) err.question = "Question is required";
    questionObj.options.forEach((opt, i) => {
      if (!opt.trim()) err[`option${i}`] = `Option ${i + 1} is required`;
    });
    if (questionObj.correctIndex === null)
      err.correctIndex = "Please select the correct option";
    if (!questionObj.tags || questionObj.tags.length === 0)
      err.tags = "At least one tag is required";

    return err;
  };

  // Validate all questions; jump to first invalid
  const firstInvalidIndex = useMemo(() => {
    for (let i = 0; i < questions.length; i++) {
      const e = validateQuestion(questions[i]);
      if (Object.keys(e).length > 0) return i;
    }
    return -1;
  }, [questions, topic, totalQuestions]);

  // For progress display
  const completedCount = useMemo(() => {
    let count = 0;
    for (const qi of questions) {
      const e = validateQuestion(qi);
      if (!Object.keys(e).length) count++;
    }
    return count;
  }, [questions, topic, totalQuestions]);

  /**
   * 📡 Mock API request — sends the WHOLE quiz (topic + all questions) in one payload.
   * Replace the URL with your real backend later.
   */
  const uploadQuiz = async (quizData) => {
    try {
      const response = await fetch(
        /**
         * 📌 API URL — CHANGE THIS WHEN BACKEND IS READY
         * Example: `${BASE_URL}/quizzes`
         */
        `${BASE_URL || "https://jsonplaceholder.typicode.com/posts"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quizData),
        }
      );
      if (!response.ok) throw new Error("Failed to upload quiz");
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Error uploading quiz:", error);
      return { success: false, error: error.message };
    }
  };

  // Save current question (validate current only)
  const handleSaveCurrent = () => {
    const err = validateQuestion(q);
    setErrors(err);
    if (Object.keys(err).length === 0) {
      // Move to next question if exists
      if (currentIdx < totalQuestions - 1) setCurrentIdx(currentIdx + 1);
    }
  };

  // Final submit (validate ALL)
  const handleFinalSubmit = async () => {
    const idx = firstInvalidIndex;
    if (idx !== -1) {
      setCurrentIdx(idx);
      setErrors(validateQuestion(questions[idx]));
      alert(`Please complete Question ${idx + 1} before submitting.`);
      return;
    }

    const payload = {
      topic,
      totalQuestions,
      questions: questions.map((qi) => ({
        question: qi.question,
        options: qi.options,
        answerIndex: qi.correctIndex,
        answerText:
          qi.correctIndex !== null ? qi.options[qi.correctIndex] : null,
        tags: qi.tags,
        difficulty: qi.difficulty,
      })),
    };

    const result = await uploadQuiz(payload);
    if (result.success) {
      alert("Quiz uploaded successfully!");
      // Reset everything
      setTopic("");
      setTotalQuestions(1);
      setQuestions([makeBlankQuestion()]);
      setCurrentIdx(0);
      setCurrentTag("");
      setErrors({});
    } else {
      alert(`Failed to upload quiz: ${result.error}`);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <Sidebar />
      <div className="flex-1 flex justify-center items-start lg:items-center min-h-screen px-4 sm:px-6 lg:px-8 py-4 pt-28 lg:pt-0 lg:mt-24">
        <div className="bg-white/50 dark:bg-gray-800/70 rounded-2xl shadow-xl p-6 w-full max-w-4xl">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold brand-heading-primary mb-6">
            <MdQuiz /> Build Quiz
          </h1> 

          {/* Meta: Topic + Total Questions + Progress */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">Topic *</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter topic name..."
              />
              {errors.topic && (
                <p className="text-red-500 text-sm">{errors.topic}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">
                Total Questions *
              </label>
              <input
                type="number"
                min={1}
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., 5"
              />
              {errors.totalQuestions && (
                <p className="text-red-500 text-sm">{errors.totalQuestions}</p>
              )}
            </div>

            <div className="flex items-end">
              <div className="w-full">
                <div className="text-sm mb-1">
                  Progress:{" "}
                  <span className="font-semibold">{completedCount}</span> /{" "}
                  {totalQuestions} complete
                </div>
                <div className="w-full h-2 bg-gray-200 rounded">
                  <div
                    className="h-2 bg-blue-600 rounded"
                    style={{
                      width: `${(completedCount / totalQuestions) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Question Switcher (tabs) */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Array.from({ length: totalQuestions }).map((_, i) => {
              const isActive = i === currentIdx;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setCurrentIdx(i);
                    setErrors({}); // clear errors when switching
                  }}
                  className={`px-3 py-1 rounded-full border text-sm ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  }`}
                  title={`Go to Question ${i + 1}`}
                >
                  Q{i + 1}
                </button>
              );
            })}
          </div>

          {/* Current Question Form */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Question {currentIdx + 1} of {totalQuestions}
              </h2>
              <span className="text-xs text-gray-400">
                (* changes affect only this question)
              </span>
            </div>

            {/* Question text */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">Question *</label>
              <textarea
                rows={3}
                value={q.question}
                onChange={(e) => updateCurrent({ question: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter quiz question..."
              />
              {errors.question && (
                <p className="text-red-500 text-sm">{errors.question}</p>
              )}
            </div>

            {/* Options */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">Options *</label>
              <div className="space-y-2">
                {q.options.map((opt, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                      placeholder={`Option ${index + 1}`}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-500 px-2"
                        title="Remove option"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {q.options.length < 6 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-blue-600 text-sm"
                  >
                    + Add Option
                  </button>
                )}
              </div>
              {/* Option-specific errors */}
              <div className="mt-1 space-y-1">
                {q.options.map((_, i) =>
                  errors[`option${i}`] ? (
                    <p key={i} className="text-red-500 text-xs">
                      {errors[`option${i}`]}
                    </p>
                  ) : null
                )}
              </div>
            </div>

            {/* Correct answer (by index) */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">
                Correct Answer *
              </label>
              <select
                value={q.correctIndex ?? ""}
                onChange={(e) =>
                  updateCurrent({
                    correctIndex:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select correct option</option>
                {q.options.map((_, index) => (
                  <option key={index} value={index}>
                    Option {index + 1}
                  </option>
                ))}
              </select>
              {errors.correctIndex && (
                <p className="text-red-500 text-sm">{errors.correctIndex}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">Tags *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type tag and press Enter"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-blue-500 text-white px-4 rounded"
                >
                  Add
                </button>
              </div>
              <div className="flex gap-2 flex-wrap mt-2">
                {q.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-100 px-2 py-1 rounded flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      title="Remove tag"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              {errors.tags && (
                <p className="text-red-500 text-sm">{errors.tags}</p>
              )}
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">Difficulty *</label>
              <select
                value={q.difficulty}
                onChange={(e) => updateCurrent({ difficulty: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {difficultyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              {currentIdx < totalQuestions - 1 ? (
                <>
                  <button
                    type="button"
                    onClick={handleSaveCurrent}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700
                   dark:bg-gray-600 dark:hover:bg-gray-500 dark:!text-gray-300"
                  >
                    Save & Next
                  </button>
                  {currentIdx > 0 && (
                    <button
                      type="button"
                      onClick={() => setCurrentIdx(currentIdx - 1)}
                      className="px-4 py-2 border rounded-lg
                     dark:bg-gray-600 dark:hover:bg-gray-500 dark:!text-gray-300"
                    >
                      Previous
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentIdx(
                        Math.min(totalQuestions - 1, currentIdx + 1)
                      )
                    }
                    className="px-4 py-2 border rounded-lg
                   dark:bg-gray-600 dark:hover:bg-gray-500 dark:!text-gray-300"
                  >
                    Next
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveCurrent}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700
                   dark:bg-gray-600 dark:hover:bg-gray-500 dark:!text-gray-300"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700
                   dark:bg-gray-600 dark:hover:bg-gray-500 dark:!text-gray-300"
                  >
                    Submit All
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quizzesupload;