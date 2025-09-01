import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";

const getTodayDate = () => {
  // Get current date in IST (Indian Standard Time)
  const now = new Date();
  // Convert to IST by adding 5:30 hours offset
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istTime.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentISTTime = () => {
  // Get current time in IST
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  
  const hours = String(istTime.getUTCHours()).padStart(2, "0");
  const minutes = String(istTime.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export default function CodingRoundForm() {
  const [college, setCollege] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(getTodayDate());
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
      inputDescription: "", // Added missing field
      outputDescription: "", // Added missing field
      visibleTestCases: [{ input: "", expectedOutput: "" }], // Added visible test cases
      hiddenTestCases: [{ input: "", expectedOutput: "" }],
    },
  ]);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  //edit state
  const [editingId, setEditingId] = useState(null);

  // Previous coding rounds state
  const [previousRounds, setPreviousRounds] = useState([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [roundExpanded, setRoundExpanded] = useState([]);

  // Get base URL from environment variables
  const BASE_URL = import.meta.env.VITE_API_URL;

  // Fixed: Get token inside functions to ensure fresh token
  const getToken = () => localStorage.getItem("token");

  // Number of questions handler
  const handleNumQuestionsChange = (e) => {
    const count = parseInt(e.target.value, 10);
    setNumQuestions(count);

    const newProblems = [...problems];
    while (newProblems.length < count) {
      newProblems.push({
        problemTitle: "",
        difficulty: "",
        description: "",
        inputDescription: "", // Added missing field
        outputDescription: "", // Added missing field
        visibleTestCases: [{ input: "", expectedOutput: "" }], // Added visible test cases
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

  // Handle visible test cases changes
  const handleVisibleTestCaseChange = (
    problemIndex,
    testCaseIndex,
    field,
    value
  ) => {
    const updated = [...problems];
    updated[problemIndex].visibleTestCases[testCaseIndex][field] = value;
    setProblems(updated);
  };

  // Handle hidden test cases changes
  const handleHiddenTestCaseChange = (
    problemIndex,
    testCaseIndex,
    field,
    value
  ) => {
    const updated = [...problems];
    updated[problemIndex].hiddenTestCases[testCaseIndex][field] = value;
    setProblems(updated);
  };

  // Add new visible test case
  const addVisibleTestCase = (problemIndex) => {
    const updated = [...problems];
    updated[problemIndex].visibleTestCases.push({
      input: "",
      expectedOutput: "",
    });
    setProblems(updated);
  };

  // Remove visible test case
  const removeVisibleTestCase = (problemIndex, testCaseIndex) => {
    const updated = [...problems];
    if (updated[problemIndex].visibleTestCases.length > 1) {
      updated[problemIndex].visibleTestCases.splice(testCaseIndex, 1);
      setProblems(updated);
    }
  };

  // Add new hidden test case
  const addHiddenTestCase = (problemIndex) => {
    const updated = [...problems];
    updated[problemIndex].hiddenTestCases.push({
      input: "",
      expectedOutput: "",
    });
    setProblems(updated);
  };

  // Remove hidden test case
  const removeHiddenTestCase = (problemIndex, testCaseIndex) => {
    const updated = [...problems];
    if (updated[problemIndex].hiddenTestCases.length > 1) {
      updated[problemIndex].hiddenTestCases.splice(testCaseIndex, 1);
      setProblems(updated);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this round?")) return;
    try {
      const token = getToken();
      await axios.delete(`${BASE_URL}/college-coding/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Coding round deleted successfully!");
      fetchPreviousRounds();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete coding round.");
    }
  };

  // Enhanced validation with proper IST handling
  // Enhanced validation with IST handling
const validate = () => {
  let newErrors = {};

  if (!college) newErrors.college = "College is required.";
  if (!title) newErrors.title = "Test title is required.";
  if (!date) newErrors.date = "Date is required.";
  if (!startTime) newErrors.startTime = "Start time is required.";
  if (!endTime) newErrors.endTime = "End time is required.";
  if (!duration || duration <= 0)
    newErrors.duration = "Duration must be a positive number.";

  if (date && startTime && endTime) {
    const [year, month, day] = date.split("-").map(Number);
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);

    // Create IST datetime → convert to UTC
    const startDateTime = new Date(Date.UTC(year, month - 1, day, sh - 5, sm - 30));
    const endDateTime = new Date(Date.UTC(year, month - 1, day, eh - 5, em - 30));

    // Current IST
    const now = new Date();
    const nowIST = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const minimumTime = new Date(nowIST.getTime() + 60000);

    if (startDateTime < minimumTime) {
      newErrors.date = "Start time must be in the future (IST).";
    }

    if (startDateTime >= endDateTime) {
      newErrors.endTime = "End time must be after start time (IST).";
    }
  }

  problems.forEach((p, i) => {
    if (!p.problemTitle)
      newErrors[`p-${i}-title`] = "Problem title is required.";
    if (!p.difficulty)
      newErrors[`p-${i}-difficulty`] = "Difficulty is required.";
    if (!p.description)
      newErrors[`p-${i}-description`] = "Problem description is required.";

    const hasValidHiddenTestCase = p.hiddenTestCases.some(
      (tc) => tc.input.trim() && tc.expectedOutput.trim()
    );
    if (!hasValidHiddenTestCase) {
      newErrors[`p-${i}-testcases`] =
        "At least one complete hidden test case is required.";
    }
  });

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

    // Problem validation
    problems.forEach((p, i) => {
      if (!p.problemTitle)
        newErrors[`p-${i}-title`] = "Problem title is required.";
      if (!p.difficulty)
        newErrors[`p-${i}-difficulty`] = "Difficulty is required.";
      if (!p.description)
        newErrors[`p-${i}-description`] = "Problem description is required.";

      // Validate that at least one test case has both input and output
      const hasValidHiddenTestCase = p.hiddenTestCases.some(
        (tc) => tc.input.trim() && tc.expectedOutput.trim()
      );
      if (!hasValidHiddenTestCase) {
        newErrors[`p-${i}-testcases`] =
          "At least one complete hidden test case is required.";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Update (prefill form for updating) - Fixed IST time conversion
 // Prefill form when updating (convert UTC → IST for inputs)
const handleUpdate = (round) => {
  setEditingId(round._id);
  setCollege(round.college);
  setTitle(round.title);

  const startUTC = new Date(round.startTime);
  const endUTC = new Date(round.endTime);

  // Convert UTC → IST
  const startIST = new Date(startUTC.getTime() + 5.5 * 60 * 60 * 1000);
  const endIST = new Date(endUTC.getTime() + 5.5 * 60 * 60 * 1000);

  // Set date
  const year = startIST.getUTCFullYear();
  const month = String(startIST.getUTCMonth() + 1).padStart(2, "0");
  const day = String(startIST.getUTCDate()).padStart(2, "0");
  setDate(`${year}-${month}-${day}`);

  // Set times
  const sh = String(startIST.getUTCHours()).padStart(2, "0");
  const sm = String(startIST.getUTCMinutes()).padStart(2, "0");
  setStartTime(`${sh}:${sm}`);

  const eh = String(endIST.getUTCHours()).padStart(2, "0");
  const em = String(endIST.getUTCMinutes()).padStart(2, "0");
  setEndTime(`${eh}:${em}`);

  setDuration(round.duration);
  setProblems(
    round.problems.map((p) => ({
      problemTitle: p.problemTitle,
      difficulty: p.difficulty,
      description: p.description,
      inputDescription: p.inputDescription || "",
      outputDescription: p.outputDescription || "",
      visibleTestCases: p.visibleTestCases.length
        ? p.visibleTestCases
        : [{ input: "", expectedOutput: "" }],
      hiddenTestCases: p.hiddenTestCases.length
        ? p.hiddenTestCases
        : [{ input: "", expectedOutput: "" }],
    }))
  );
  setNumQuestions(round.problems.length);
  setExpanded(new Array(round.problems.length).fill(true));
};


  // Modified handleSubmit with proper IST to UTC conversion
  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;
  setSubmitting(true);

  // Convert IST → UTC
  const [year, month, day] = date.split("-").map(Number);
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  const startDateTime = new Date(Date.UTC(year, month - 1, day, sh - 5, sm - 30));
  const endDateTime = new Date(Date.UTC(year, month - 1, day, eh - 5, em - 30));

  const payload = {
    title,
    college,
    startTime: startDateTime.toISOString(),
    endTime: endDateTime.toISOString(),
    duration: parseInt(duration),
    problems: problems.map((problem) => ({
      problemTitle: problem.problemTitle,
      description: problem.description,
      difficulty: problem.difficulty,
      inputDescription: problem.inputDescription || "",
      outputDescription: problem.outputDescription || "",
      visibleTestCases: problem.visibleTestCases.filter(
        (tc) => tc.input.trim() && tc.expectedOutput.trim()
      ),
      hiddenTestCases: problem.hiddenTestCases.filter(
        (tc) => tc.input.trim() && tc.expectedOutput.trim()
      ),
    })),
  };

  try {
    const token = getToken();
    if (!token) {
      alert("Authentication token not found. Please login again.");
      return;
    }

    let res;
    if (editingId) {
      res = await axios.put(`${BASE_URL}/college-coding/${editingId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Coding Test Updated Successfully!");
    } else {
      res = await axios.post(`${BASE_URL}/college-coding/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Coding Test Created Successfully!");
    }

    console.log("Response:", res.data);

    // Reset form
    setEditingId(null);
    setCollege("");
    setTitle("");
    setDate(getTodayDate());
    setStartTime("");
    setEndTime("");
    setDuration("");
    setNumQuestions(1);
    setProblems([
      {
        problemTitle: "",
        difficulty: "",
        description: "",
        inputDescription: "",
        outputDescription: "",
        visibleTestCases: [{ input: "", expectedOutput: "" }],
        hiddenTestCases: [{ input: "", expectedOutput: "" }],
      },
    ]);
    setExpanded([]);
    setErrors({});
    fetchPreviousRounds();
  } catch (error) {
    console.error("Error saving coding round:", error);
    alert("Something went wrong.");
  } finally {
    setSubmitting(false);
  }
};


  // Fetch previous rounds
  const fetchPreviousRounds = async () => {
    try {
      setLoadingRounds(true);
      const token = getToken();

      if (!token) {
        console.warn("No authentication token found");
        setPreviousRounds([]);
        setRoundExpanded([]);
        return;
      }

      const res = await axios.get(
        `${BASE_URL}/college-coding/admin/getAllCodingRounds`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Previous rounds response:", res);

      // Handle the response structure from the API
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setPreviousRounds(res.data.data);
        setRoundExpanded(new Array(res.data.data.length).fill(false));
      } else if (Array.isArray(res.data)) {
        // Handle case where data is directly an array
        setPreviousRounds(res.data);
        setRoundExpanded(new Array(res.data.length).fill(false));
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
            {/* College */}
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-dark-text/70">
                College *
              </label>
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
              {errors.college && (
                <p className="text-red-500 text-sm">{errors.college}</p>
              )}
            </div>

            {/* Test Title */}
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-dark-text/70">
                Test Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter test title"
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title}</p>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-dark-text/70">
                  Test Date * (IST)
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.date && (
                  <p className="text-red-500 text-sm">{errors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-dark-text/70">
                  Start Time * (IST)
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.startTime && (
                  <p className="text-red-500 text-sm">{errors.startTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-dark-text/70">
                  End Time * (IST)
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.endTime && (
                  <p className="text-red-500 text-sm">{errors.endTime}</p>
                )}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-dark-text/70">
                Duration (minutes) *
              </label>
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g. 120"
              />
              {errors.duration && (
                <p className="text-red-500 text-sm">{errors.duration}</p>
              )}
            </div>

            {/* Number of Problems */}
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-dark-text/70">
                Number of Problems *
              </label>
              <input
                type="number"
                min="1"
                value={numQuestions}
                onChange={handleNumQuestionsChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Problems Section */}
            {problems.map((p, i) => (
              <div
                key={i}
                className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700/40 space-y-4"
              >
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
                      onChange={(e) =>
                        handleProblemChange(i, "problemTitle", e.target.value)
                      }
                      placeholder={`Problem ${i + 1} Title`}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {errors[`p-${i}-title`] && (
                      <p className="text-red-500 text-sm">
                        {errors[`p-${i}-title`]}
                      </p>
                    )}

                    <select
                      value={p.difficulty}
                      onChange={(e) =>
                        handleProblemChange(i, "difficulty", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select difficulty</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                    {errors[`p-${i}-difficulty`] && (
                      <p className="text-red-500 text-sm">
                        {errors[`p-${i}-difficulty`]}
                      </p>
                    )}

                    <textarea
                      value={p.description}
                      onChange={(e) =>
                        handleProblemChange(i, "description", e.target.value)
                      }
                      placeholder="Problem description"
                      rows="3"
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {errors[`p-${i}-description`] && (
                      <p className="text-red-500 text-sm">
                        {errors[`p-${i}-description`]}
                      </p>
                    )}

                    {/* Input/Output Descriptions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Input Description
                        </label>
                        <textarea
                          value={p.inputDescription}
                          onChange={(e) =>
                            handleProblemChange(
                              i,
                              "inputDescription",
                              e.target.value
                            )
                          }
                          placeholder="Describe the input format"
                          rows="2"
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Output Description
                        </label>
                        <textarea
                          value={p.outputDescription}
                          onChange={(e) =>
                            handleProblemChange(
                              i,
                              "outputDescription",
                              e.target.value
                            )
                          }
                          placeholder="Describe the output format"
                          rows="2"
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        />
                      </div>
                    </div>

                    {/* Visible Test Cases Section */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                        Visible Test Cases:
                      </h4>
                      {p.visibleTestCases.map((testCase, tcIndex) => (
                        <div
                          key={tcIndex}
                          className="border rounded-md p-3 bg-white dark:bg-gray-600 space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              Visible Test Case {tcIndex + 1}
                            </span>
                            {p.visibleTestCases.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeVisibleTestCase(i, tcIndex)
                                }
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <textarea
                            value={testCase.input}
                            onChange={(e) =>
                              handleVisibleTestCaseChange(
                                i,
                                tcIndex,
                                "input",
                                e.target.value
                              )
                            }
                            placeholder="Input (e.g., '9\n2 7 11 15')"
                            rows="2"
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                          />
                          <textarea
                            value={testCase.expectedOutput}
                            onChange={(e) =>
                              handleVisibleTestCaseChange(
                                i,
                                tcIndex,
                                "expectedOutput",
                                e.target.value
                              )
                            }
                            placeholder="Expected Output (e.g., '0 1')"
                            rows="2"
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addVisibleTestCase(i)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        + Add Visible Test Case
                      </button>
                    </div>

                    {/* Hidden Test Cases Section */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                        Hidden Test Cases:
                      </h4>
                      {p.hiddenTestCases.map((testCase, tcIndex) => (
                        <div
                          key={tcIndex}
                          className="border rounded-md p-3 bg-white dark:bg-gray-600 space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              Hidden Test Case {tcIndex + 1}
                            </span>
                            {p.hiddenTestCases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeHiddenTestCase(i, tcIndex)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <textarea
                            value={testCase.input}
                            onChange={(e) =>
                              handleHiddenTestCaseChange(
                                i,
                                tcIndex,
                                "input",
                                e.target.value
                              )
                            }
                            placeholder="Input (e.g., '6\n3 3')"
                            rows="2"
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                          />
                          <textarea
                            value={testCase.expectedOutput}
                            onChange={(e) =>
                              handleHiddenTestCaseChange(
                                i,
                                tcIndex,
                                "expectedOutput",
                                e.target.value
                              )
                            }
                            placeholder="Expected Output (e.g., '0 1')"
                            rows="2"
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addHiddenTestCase(i)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        + Add Hidden Test Case
                      </button>
                      {errors[`p-${i}-testcases`] && (
                        <p className="text-red-500 text-sm">
                          {errors[`p-${i}-testcases`]}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Submitting..."
                : editingId
                ? "Update Coding Test"
                : "Create Coding Test"}
            </button>
          </form>
        </div>

        {/* Previous Coding Rounds */}
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
                <div
                  key={round._id || i}
                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700/40 space-y-3"
                >
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
                        Date: {new Date(round.date).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </p>
                      <p className="text-sm">
                        Time: {new Date(round.date).toLocaleTimeString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })} IST
                      </p>
                      <p className="text-sm">
                        Duration: {round.duration} minutes
                      </p>
                      <p className="text-sm">
                        Status: {round.isActive ? "Active" : "Inactive"}
                      </p>

                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => handleUpdate(round)}
                          className="px-3 py-1 text-white bg-blue-600 rounded-md hover:bg-blue-700 text-sm"
                        >
                          Update
                        </button>

                        <button
                          onClick={() => handleDelete(round._id)}
                          className="px-3 py-1 text-white bg-red-600 rounded-md hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
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
