import React, { useState } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { HiOutlineUpload } from "react-icons/hi";
import { useSearchParams } from "react-router-dom";

const BASE_URL = "";

export default function UploadTopicsPage() {
  const [courseName, setCourseName] = useState("");
  const [numTopics, setNumTopics] = useState("");
  const [topics, setTopics] = useState([]);
  const [quizInputOpen, setQuizInputOpen] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [exerciseFile, setExerciseFile] = useState(null); // NEW state for exercise file
  const [exerciseStatus, setExerciseStatus] = useState(""); // For displaying exercise file upload status

  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");

  // update topics
  React.useEffect(() => {
    const count = parseInt(numTopics, 10) || 0;
    setTopics((prevTopics) =>
      Array.from({ length: count }, (_, i) => prevTopics[i] || {
        title: `Topic ${i + 1}: `,
        file: null,
        status: "",
        quiz: ""
      })
    );
  }, [numTopics]);

  // file upload for topics
  const handleFileUpload = (i, file) => {
    setTopics((prev) => {
      const updated = [...prev];
      updated[i] = {
        ...updated[i],
        file,
        status: file ? `Uploaded: ${file.name}` : "",
      };
      return updated;
    });
  };

  // topic title change
  const handleTopicTitleChange = (idx, value) => {
    setTopics((prev) => {
      const updated = [...prev];
      updated[idx].title = value;
      return updated;
    });
  };

  // quiz input toggle per topic
  const handleQuizToggle = (idx) => {
    setQuizInputOpen((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // quiz text change
  const handleQuizChange = (idx, value) => {
    setTopics((prev) => {
      const updated = [...prev];
      updated[idx].quiz = value;
      return updated;
    });
  };

  // New: handle exercise file input change
  const handleExerciseFileChange = (file) => {
    setExerciseFile(file);
    setExerciseStatus(file ? `Uploaded: ${file.name}` : "");
  };

  /** MAIN SUBMIT HANDLER **/
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // Upload all topic files and exercise file
      const formData = new FormData();
      topics.forEach((t, i) => {
        if (t.file) {
          formData.append(`file${i}`, t.file);
        }
      });
      if (exerciseFile) {
        formData.append("exerciseFile", exerciseFile); // append exercise file with key 'exerciseFile'
      }

      if (topics.some(t => t.file) || exerciseFile) {
        const filesRes = await fetch(`${BASE_URL}/dashboard/files`, {
          method: "POST",
          body: formData,
        });
        if (!filesRes.ok) throw new Error("Uploading files failed!");
        // const filesData = await filesRes.json();
      }

      // POST topics to /courses/:courseId/topics
      const payload = {
        topics: topics.map((t) => ({
          title: t.title,
          noteFile: t.file ? t.file.name : "",
          quiz: t.quiz,
        })),
        // Optional: if your backend expects an exercise file name, send here
        exerciseFileName: exerciseFile ? exerciseFile.name : "",
      };
      const topicsRes = await fetch(
        `${BASE_URL}/courses/${courseId}/topics`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!topicsRes.ok) throw new Error("Saving topics failed!");

      setMessage("Topics and files uploaded successfully!");
    } catch (err) {
      setMessage("Error uploading topics. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] transition-all duration-300">
      <Sidebar />
      <div className="flex-1 flex justify-center items-start lg:items-center min-h-screen px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-0 pt-28 sm:pt-32 md:pt-28 lg:pt-0 lg:mt-8">
        <div className="bg-white/50 dark:bg-gray-800/70 backdrop-blur rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 max-w-full sm:max-w-4xl lg:max-w-5xl w-full max-h-[90vh] lg:max-h-none overflow-y-auto lg:overflow-visible">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold brand-heading-primary mb-2">
            Upload Topics for Course
          </h1>
          {!courseId && (
            <div className="text-red-500 text-xs sm:text-sm font-medium mb-2">
              No course selected. Please create or select a course to upload topics.
            </div>
          )}
          {message && (
            <div className={`mb-3 p-2 rounded text-xs sm:text-sm ${message.startsWith("Error") ? "bg-red-200 text-red-700" : "bg-green-200 text-green-700"}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Existing Course Name & Number of Topics inputs */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 mt-6 lg:mt-8 mb-4">
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">Course Name</label>
                <input
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter course name"
                  required
                  disabled
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">Number of Topics</label>
                <input
                  type="number"
                  min="1"
                  value={numTopics}
                  onChange={e => setNumTopics(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter topics count"
                  required
                />
              </div>
            </div>

            {/* Topic Details Section with mobile/tablet cards and desktop table */}
            <h2 className="text-base sm:text-lg font-semibold mt-6 lg:mt-8 mb-4 text-light-text/80 dark:text-dark-text/70">Topic Details</h2>

            {/* Mobile/Tablet Card View (unchanged)... */}
            <div className="block lg:hidden space-y-4">
              {topics.map((topic, i) => (
                <div key={i} className="bg-white/50 dark:bg-gray-800/70 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Topic {i + 1}</h3>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded bg-blue-200 hover:bg-blue-300 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-900 dark:text-blue-200 font-semibold transition"
                      onClick={() => handleQuizToggle(i)}
                    >
                      {topic.quiz ? "Edit Quiz" : "Add Quiz"}
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Topic Title</label>
                    <input
                      value={topic.title}
                      onChange={e => handleTopicTitleChange(i, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Upload File</label>
                      <label className="cursor-pointer font-medium text-blue-700 hover:underline inline-flex items-center gap-1 text-sm">
                        <HiOutlineUpload className="inline text-base" />
                        <input
                          type="file"
                          accept=".md"
                          className="hidden"
                          onChange={e => handleFileUpload(i, e.target.files?.[0] || null)}
                        />
                        Upload .md
                      </label>
                    </div>
                    {topic.status && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 max-w-32 truncate">
                        {topic.status}
                      </div>
                    )}
                  </div>
                  {quizInputOpen[i] && (
                    <div className="border-l-4 border-blue-300 dark:border-blue-700 pl-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-r-lg py-2">
                      <label className="block text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Quiz for this topic:
                      </label>
                      <input
                        type="text"
                        value={topic.quiz}
                        onChange={e => handleQuizChange(i, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-blue-200 dark:border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-900 transition"
                        placeholder="Enter quiz question or description"
                      />
                    </div>
                  )}
                </div>
              ))}
              {topics.length === 0 && (
                <div className="text-center py-8 text-gray-400 italic text-sm">
                  Add number of topics above...
                </div>
              )}
            </div>

            {/* Desktop Table View (unchanged)... */}
            <div className="hidden lg:block rounded-xl overflow-x-auto bg-white/50 dark:bg-gray-800/70">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/30 dark:bg-gray-800/70">
                    <th className="px-4 py-3 text-left text-light-text/80 dark:text-dark-text/70">Topic Title</th>
                    <th className="px-4 py-3 text-left text-light-text/80 dark:text-dark-text/70">Upload .md File</th>
                    <th className="px-4 py-3 text-left text-light-text/80 dark:text-dark-text/70">Status</th>
                    <th className="px-4 py-3 text-left text-light-text/80 dark:text-dark-text/70">Quiz</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((topic, i) => (
                    <React.Fragment key={i}>
                      <tr>
                        <td className="px-4 py-2">
                          <input
                            value={topic.title}
                            onChange={e => handleTopicTitleChange(i, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </td>
                        <td className="px-4 py-2">
                          <label className="cursor-pointer font-medium text-blue-700 hover:underline inline-flex items-center gap-1">
                            <HiOutlineUpload className="inline text-lg" />
                            <input
                              type="file"
                              accept=".md"
                              className="hidden"
                              onChange={e => handleFileUpload(i, e.target.files?.[0] || null)}
                            />
                            Upload
                          </label>
                        </td>
                        <td className="px-4 py-2 text-gray-700 text-xs">
                          {topic.status || (topic.file ? `Uploaded: ${topic.file.name}` : "")}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            className="text-xs px-3 py-1 rounded bg-blue-200 hover:bg-blue-300 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-900 dark:text-blue-200 font-semibold transition"
                            onClick={() => handleQuizToggle(i)}
                          >
                            {topic.quiz ? "Edit Quiz" : "Add Quiz"}
                          </button>
                        </td>
                      </tr>
                      {quizInputOpen[i] && (
                        <tr>
                          <td colSpan={4} className="pl-8 border-l-4 border-blue-300 dark:border-blue-700 bg-transparent">
                            <div className="flex flex-col gap-1 py-2">
                              <label className="ml-2 font-medium text-xs text-blue-800 dark:text-blue-100 mb-1">
                                Quiz for this topic:
                              </label>
                              <input
                                type="text"
                                value={topic.quiz}
                                onChange={e => handleQuizChange(i, e.target.value)}
                                className="w-full px-3 py-2 border border-blue-200 dark:border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-900 transition text-sm"
                                placeholder="Enter quiz question or description"
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {topics.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-400 italic">
                        Add number of topics above...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* --- NEW Exercise file upload UI --- */}
            <div className="mt-8 border-t border-gray-300 dark:border-gray-700 pt-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 text-light-text/80 dark:text-dark-text/70">
                Exercise File
              </h2>
              <label className="cursor-pointer font-medium text-blue-700 hover:underline inline-flex items-center gap-2 text-sm sm:text-base">
                <HiOutlineUpload className="inline text-lg" />
                <input
                  type="file"
                  accept=".md"
                  className="hidden"
                  onChange={(e) => handleExerciseFileChange(e.target.files?.[0] || null)}
                />
                Upload Exercise File (.md)
              </label>
              {exerciseStatus && (
                <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">
                  {exerciseStatus}
                </p>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white rounded-lg px-4 sm:px-6 py-2 text-sm sm:text-base font-semibold shadow hover:bg-blue-700 transition w-full sm:w-auto"
                disabled={loading || !courseId}
              >
                {loading ? "Uploading..." : "Submit"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}