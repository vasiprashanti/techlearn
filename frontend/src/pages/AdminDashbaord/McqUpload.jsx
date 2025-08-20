import React, { useState, useEffect } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";

const McqUpload = () => {
  const [title, setTitle] = useState("");
  const [college, setCollege] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("");
  const [numQuestions, setNumQuestions] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Previous quizzes
  const [previousQuizzes, setPreviousQuizzes] = useState([]);
  const [loadingPrev, setLoadingPrev] = useState(true);
  const [expandedQuiz, setExpandedQuiz] = useState(null);

  const BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch previous quizzes
  useEffect(() => {
    const fetchPreviousQuizzes = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/mcq`);
        if (!res.ok) throw new Error("Failed to fetch quizzes");
        const data = await res.json();
        setPreviousQuizzes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPrev(false);
      }
    };

    fetchPreviousQuizzes();
  }, [BASE_URL]);

  // Handle number of questions input
  const handleNumQuestionsChange = (e) => {
    const value = parseInt(e.target.value, 10) || 0;
    setNumQuestions(value);

    const newQuestions = Array.from({ length: value }, () => ({
      text: "",
      options: ["", "", "", ""],
      correct: 0,
      difficulty: "Medium",
      tags: [],
    }));
    setQuestions(newQuestions);
  };

  // Update question fields
  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  // Update options
  const handleOptionChange = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  // Tags
  const handleAddTag = (qIndex, e) => {
    if (e.key === "Enter" && e.target.value.trim() !== "") {
      e.preventDefault();
      const updated = [...questions];
      updated[qIndex].tags.push(e.target.value.trim());
      setQuestions(updated);
      e.target.value = "";
    }
  };

  const handleRemoveTag = (qIndex, tagIndex) => {
    const updated = [...questions];
    updated[qIndex].tags.splice(tagIndex, 1);
    setQuestions(updated);
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Quiz title is required";
    if (!college.trim()) newErrors.college = "College is required";
    if (!date) newErrors.date = "Date & time required";
    if (!duration || duration <= 0)
      newErrors.duration = "Duration must be positive";
    if (questions.length === 0)
      newErrors.questions = "At least one question required";

    questions.forEach((q, i) => {
      if (!q.text.trim()) newErrors[`q-${i}-text`] = "Question text required";
      q.options.forEach((opt, j) => {
        if (!opt.trim())
          newErrors[`q-${i}-opt-${j}`] = `Option ${j + 1} required`;
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = { title, college, date, duration, questions };

    try {
      setSubmitting(true);
      setMessage("");

      const res = await fetch(`${BASE_URL}/api/mcq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to upload quiz");

      setMessage("Quiz uploaded successfully!");
      setTitle("");
      setCollege("");
      setDate("");
      setDuration("");
      setNumQuestions(0);
      setQuestions([]);

      // Refresh quizzes
      const updated = await fetch(`${BASE_URL}/api/mcq`).then((r) => r.json());
      setPreviousQuizzes(updated);
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <Sidebar />

      <div className="flex-1 flex flex-col items-center min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-10 pt-28 lg:pt-32">
        
        {/* Upload Form Section */}
        <div className="bg-white/50 dark:bg-gray-800/70 rounded-2xl shadow-xl p-6 w-full max-w-4xl">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold brand-heading-primary mb-6">
              MCQ Round
          </h1>

          {message && (
            <div
              className={`mb-4 p-3 rounded text-sm ${
                message.startsWith("Error")
                  ? "bg-red-200 text-red-700"
                  : "bg-green-200 text-green-700"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-2">Quiz Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter quiz title"
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
            </div>

            {/* College */}
            <div>
              <label className="block text-sm font-semibold mb-2">College *</label>
              <select
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select college</option>
                <option value="VNR">VNR</option>
                <option value="MUJ">MUJ</option>
                <option value="VJIT">VJIT</option>
              </select>
              {errors.college && <p className="text-red-500 text-sm">{errors.college}</p>}
            </div>

            {/* Date & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Duration (minutes) *</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g. 60"
                />
                {errors.duration && <p className="text-red-500 text-sm">{errors.duration}</p>}
              </div>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-semibold mb-2">Number of Questions *</label>
              <input
                type="number"
                min="1"
                value={numQuestions}
                onChange={handleNumQuestionsChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {errors.questions && <p className="text-red-500 text-sm">{errors.questions}</p>}
            </div>

            {/* Questions Section */}
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700/40 space-y-4">
                <h3 className="font-semibold">Question {qIndex + 1}</h3>

                {/* Question Text */}
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => handleQuestionChange(qIndex, "text", e.target.value)}
                  placeholder="Enter question text"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors[`q-${qIndex}-text`] && <p className="text-red-500 text-sm">{errors[`q-${qIndex}-text`]}</p>}

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex}>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                        placeholder={`Option ${optIndex + 1}`}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      {errors[`q-${qIndex}-opt-${optIndex}`] && (
                        <p className="text-red-500 text-sm">{errors[`q-${qIndex}-opt-${optIndex}`]}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Correct Answer */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Correct Answer *</label>
                  <select
                    value={q.correct}
                    onChange={(e) => handleQuestionChange(qIndex, "correct", e.target.value)}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="0">Option 1</option>
                    <option value="1">Option 2</option>
                    <option value="2">Option 3</option>
                    <option value="3">Option 4</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Difficulty *</label>
                  <select
                    value={q.difficulty}
                    onChange={(e) => handleQuestionChange(qIndex, "difficulty", e.target.value)}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Tags</label>
                  <input
                    type="text"
                    onKeyDown={(e) => handleAddTag(qIndex, e)}
                    placeholder="Type tag and press Enter"
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {q.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(qIndex, tagIndex)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </form>
        </div>

        {/* Previous Quizzes Section */}
        <div className="bg-white/50 dark:bg-gray-800/70 rounded-2xl shadow-xl p-6 w-full max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Previous MCQ</h2>
          {loadingPrev ? (
            <p>Loading...</p>
          ) : previousQuizzes.length === 0 ? (
            <p className="text-gray-500">No previous MCQ found.</p>
          ) : (
            <div className="space-y-4">
              {previousQuizzes.map((quiz) => (
                <div key={quiz._id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700/40">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{quiz.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">College: {quiz.college}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Date: {new Date(quiz.date).toLocaleString()}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Duration: {quiz.duration} mins</p>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedQuiz(expandedQuiz === quiz._id ? null : quiz._id)
                      }
                      className="text-blue-600 hover:underline"
                    >
                      {expandedQuiz === quiz._id ? "Hide Questions" : "View Questions"}
                    </button>
                  </div>

                  {expandedQuiz === quiz._id && (
                    <div className="mt-4 space-y-3">
                      {quiz.questions.map((q, i) => (
                        <div key={i} className="p-3 border rounded bg-white dark:bg-gray-800">
                          <p className="font-semibold">{i + 1}. {q.text}</p>
                          <ul className="list-disc ml-6 text-sm">
                            {q.options.map((opt, j) => (
                              <li key={j} className={q.correct == j ? "font-bold text-green-600" : ""}>
                                {opt}
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs mt-1">Difficulty: {q.difficulty}</p>
                          {q.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {q.tags.map((tag, tIdx) => (
                                <span key={tIdx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default McqUpload;
