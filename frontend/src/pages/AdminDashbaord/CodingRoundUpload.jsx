import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";

export default function CodingRoundForm() {
  const [college, setCollege] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState("");
  const [numQuestions, setNumQuestions] = useState(1);
  const [expanded, setExpanded] = useState([]);

  const [problems, setProblems] = useState([
    {
      problemTitle: "",
      difficulty: "",
      description: "",
      input: "",
      output: "",
      hiddenTestCases: [{ input: "", expectedOutput: "" }],
    },
  ]);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // 🔹 Previous coding rounds state
  const [previousRounds, setPreviousRounds] = useState([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [roundExpanded, setRoundExpanded] = useState([]); // for expanding previous rounds

  // Get base URL from environment variables
  const BASE_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  // number of questions handler
  const handleNumQuestionsChange = (e) => {
    const count = parseInt(e.target.value, 10);
    setNumQuestions(count);

    const newProblems = [...problems];
    while (newProblems.length < count) {
      newProblems.push({
        problemTitle: "",
        difficulty: "",
        description: "",
        input: "",
        output: "",
        hiddenTestCases: [{ input: "", expectedOutput: "" }],
      });
    }
    while (newProblems.length > count) {
      newProblems.pop();
    }
    setProblems(newProblems);

    const newExpanded = [...expanded];
    while (newExpanded.length < count) newExpanded.push(false);
    while (newExpanded.length > count) newExpanded.pop();
    setExpanded(newExpanded);
  };

  const handleProblemChange = (index, field, value) => {
    const updated = [...problems];
    updated[index][field] = value;
    setProblems(updated);
  };

  // Handle test cases changes
  const handleTestCaseChange = (problemIndex, testCaseIndex, field, value) => {
    const updated = [...problems];
    updated[problemIndex].hiddenTestCases[testCaseIndex][field] = value;
    setProblems(updated);
  };

  // Add new test case
  const addTestCase = (problemIndex) => {
    const updated = [...problems];
    updated[problemIndex].hiddenTestCases.push({ input: "", expectedOutput: "" });
    setProblems(updated);
  };

  // Remove test case
  const removeTestCase = (problemIndex, testCaseIndex) => {
    const updated = [...problems];
    if (updated[problemIndex].hiddenTestCases.length > 1) {
      updated[problemIndex].hiddenTestCases.splice(testCaseIndex, 1);
      setProblems(updated);
    }
  };

  // validation
  const validate = () => {
    let newErrors = {};
    if (!college) newErrors.college = "College is required.";
    if (!title) newErrors.title = "Test title is required.";
    if (!date) newErrors.date = "Date is required.";
    if (!startTime) newErrors.startTime = "Start time is required.";
    if (!endTime) newErrors.endTime = "End time is required.";
    if (!duration) newErrors.duration = "Duration is required.";

    problems.forEach((p, i) => {
      if (!p.problemTitle) newErrors[`p-${i}-title`] = "Problem title is required.";
      if (!p.difficulty)
        newErrors[`p-${i}-difficulty`] = "Difficulty is required.";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // API call using axios
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    // Format the payload according to the API structure shown in the image
    const payload = {
      title,
      college,
      date: `${date}T${startTime}:00`, // Combine date and start time
      duration: parseInt(duration), // Convert to number
      problems: problems.map(problem => ({
        problemTitle: problem.problemTitle,
        description: problem.description,
        difficulty: problem.difficulty,
        hiddenTestCases: problem.hiddenTestCases.filter(tc => tc.input && tc.expectedOutput) // Only include complete test cases
      }))
    };

    try {
      const res = await axios.post(
        `${BASE_URL}/college-coding/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`, // attach token here
          },
        }
      );

      alert("Coding Test Created Successfully!");
      console.log("Response:", res.data);

      // reset form
      setCollege("");
      setTitle("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setDuration("");
      setNumQuestions(1);
      setProblems([
        {
          problemTitle: "",
          difficulty: "",
          description: "",
          input: "",
          output: "",
          hiddenTestCases: [{ input: "", expectedOutput: "" }],
        },
      ]);
      setExpanded([]);

      // 🔹 Refresh rounds after creating a new one
      fetchPreviousRounds();
    } catch (error) {
      console.error("Error saving coding round:", error);
      alert("Something went wrong while saving the test.");
    } finally {
      setSubmitting(false);
    }
  };

  // 🔹 Fetch previous rounds
  const fetchPreviousRounds = async () => {
    try {
      setLoadingRounds(true);
      const res = await axios.get(
        `${BASE_URL}/college-coding/admin/getAllCodingRounds`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // send token to backend
          },
        }
      );
       console.log(res);     
      // Handle the response structure from the API
      if (res.data.success && res.data.data) {
        setPreviousRounds(res.data.data);
        // set expanded state for each round
        setRoundExpanded(new Array(res.data.data.length).fill(false));
      } else {
        setPreviousRounds([]);
        setRoundExpanded([]);
      }
    } catch (error) {
      console.error("Error fetching coding rounds:", error);
      setPreviousRounds([]);
      setRoundExpanded([]);
    } finally {
      setLoadingRounds(false);
    }
  };

  useEffect(() => {
    fetchPreviousRounds();
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <Sidebar />
      <div className="flex-1 flex flex-col items-center min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-10 pt-28 lg:pt-32">
        
        {/* Coding Round Creation Form */}
        <div className="bg-white/50 dark:bg-gray-800/70 rounded-2xl shadow-xl p-6 w-full max-w-4xl">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold brand-heading-primary mb-6">
            Coding Round
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* --- College --- */}
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-dark-text/70">College *</label>
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

            {/* --- Test Title --- */}
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-dark-text/70">Test Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter test title"
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
            </div>

            {/* --- Date & Time --- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-dark-text/70">Test Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-dark-text/70">Start Time *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.startTime && <p className="text-red-500 text-sm">{errors.startTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-dark-text/70">End Time *</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.endTime && <p className="text-red-500 text-sm">{errors.endTime}</p>}
              </div>
            </div>

            {/* --- Duration --- */}
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-dark-text/70">Duration (minutes) *</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g. 120"
              />
              {errors.duration && <p className="text-red-500 text-sm">{errors.duration}</p>}
            </div>

            {/* --- Number of Problems --- */}
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-dark-text/70">Number of Problems *</label>
              <input
                type="number"
                min="1"
                value={numQuestions}
                onChange={handleNumQuestionsChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* --- Problems Section --- */}
            {problems.map((p, i) => (
              <div key={i} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700/40 space-y-4">
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((prev) => {
                      const updated = [...prev];
                      updated[i] = !updated[i];
                      return updated;
                    })
                  }
                  className="w-full text-left font-semibold text-blue-600"
                >
                  {expanded[i] ? `▼ Problem ${i + 1}` : `▶ Problem ${i + 1}`}
                </button>

                {expanded[i] && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={p.problemTitle}
                      onChange={(e) => handleProblemChange(i, "problemTitle", e.target.value)}
                      placeholder={`Problem ${i + 1} Title`}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {errors[`p-${i}-title`] && <p className="text-red-500 text-sm">{errors[`p-${i}-title`]}</p>}

                    <select
                      value={p.difficulty}
                      onChange={(e) => handleProblemChange(i, "difficulty", e.target.value)}
                      className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select difficulty</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                    {errors[`p-${i}-difficulty`] && <p className="text-red-500 text-sm">{errors[`p-${i}-difficulty`]}</p>}

                    <textarea
                      value={p.description}
                      onChange={(e) => handleProblemChange(i, "description", e.target.value)}
                      placeholder="Problem description"
                      rows="3"
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />

                    {/* Hidden Test Cases Section */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-300">Hidden Test Cases:</h4>
                      {p.hiddenTestCases.map((testCase, tcIndex) => (
                        <div key={tcIndex} className="border rounded-md p-3 bg-white dark:bg-gray-600 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Test Case {tcIndex + 1}</span>
                            {p.hiddenTestCases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTestCase(i, tcIndex)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={testCase.input}
                            onChange={(e) => handleTestCaseChange(i, tcIndex, "input", e.target.value)}
                            placeholder="Input (e.g., '1 2 3 4 5')"
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                          />
                          <input
                            type="text"
                            value={testCase.expectedOutput}
                            onChange={(e) => handleTestCaseChange(i, tcIndex, "expectedOutput", e.target.value)}
                            placeholder="Expected Output (e.g., '15')"
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addTestCase(i)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        + Add Test Case
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* --- Submit --- */}
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
            >
              {submitting ? "Submitting..." : "Create Coding Test"}
            </button>
          </form>
        </div>

        {/* 🔹 Previous Coding Rounds */}
        <div className="bg-white/50 dark:bg-gray-800/70 rounded-2xl shadow-xl p-6 w-full max-w-4xl">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold brand-heading-primary mb-6">
            Previous Coding Rounds
          </h2>

          {loadingRounds ? (
            <p className="text-gray-500">Loading...</p>
          ) : previousRounds.length === 0 ? (
            <p className="text-gray-500">No previous coding rounds found.</p>
          ) : (
            <div className="space-y-4">
              {previousRounds.map((round, i) => (
                <div key={round._id || i} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700/40 space-y-3">
                  <button
                    type="button"
                    onClick={() =>
                      setRoundExpanded((prev) => {
                        const updated = [...prev];
                        updated[i] = !updated[i];
                        return updated;
                      })
                    }
                    className="w-full text-left font-semibold text-blue-600"
                  >
                    {roundExpanded[i] ? `▼ ${round.title}` : `▶ ${round.title}`}
                  </button>

                  {roundExpanded[i] && (
                    <div className="space-y-2 pl-3">
                      <p className="text-sm">College: {round.college}</p>
                      <p className="text-sm">
                        Date: {new Date(round.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm">Duration: {round.duration} minutes</p>
                      <p className="text-sm">Status: {round.isActive ? "Active" : "Inactive"}</p>
                      <p className="text-sm">Total Attempts: {round.totalAttempts}</p>
                      <p className="text-sm">Problem Count: {round.problemCount}</p>
                      <p className="text-sm">Link ID: {round.linkId}</p>
                      <p className="text-sm">Created: {new Date(round.createdAt).toLocaleDateString()}</p>
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
}