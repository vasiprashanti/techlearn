import React, { useState } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { HiOutlineUpload } from "react-icons/hi";
import { useSearchParams } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function UploadTopicsPage() {
  const [courseName, setCourseName] = useState("");
  const [numTopics, setNumTopics] = useState("");
  const [topics, setTopics] = useState([]);
  const [quizInputOpen, setQuizInputOpen] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [exerciseFile, setExerciseFile] = useState(null);
  const [exerciseStatus, setExerciseStatus] = useState("");

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
        quizFile: null,
        quizStatus: ""
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

  // quiz file upload handler
  const handleQuizFileUpload = (idx, file) => {
    setTopics((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        quizFile: file,
        quizStatus: file ? `Quiz uploaded: ${file.name}` : "",
      };
      return updated;
    });
  };

  // handle exercise file input change
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
      //  Upload all topic files and quiz files to /dashboard/files
      const formData = new FormData();
      
      // Add topic notes files with correct field names (notesFile${index})
      topics.forEach((topic, index) => {
        if (topic.file) {
          formData.append(`notesFile${index}`, topic.file);
        }
      });

      // Add quiz files with field names (quizFile${index})
      topics.forEach((topic, index) => {
        if (topic.quizFile) {
          formData.append(`quizFile${index}`, topic.quizFile);
        }
      });

      // Add titles array as JSON string
      const topicTitles = topics.map(topic => topic.title);
      formData.append("titles", JSON.stringify(topicTitles));

      // Add quiz files info (for topics that have quiz files)
      const quizFilesInfo = topics.map((topic, index) => ({
        index,
        hasQuiz: !!topic.quizFile,
        quizFileName: topic.quizFile ? topic.quizFile.name : ""
      }));
      formData.append("quizFilesInfo", JSON.stringify(quizFilesInfo));

      const token = localStorage.getItem("token");
      
      // Only proceed if we have files to upload
      if (!topics.some(t => t.file) && !exerciseFile) {
        throw new Error("Please upload at least one file before submitting.");
      }

      // Upload files and get processed response
      const filesRes = await fetch(`${BASE_URL}/dashboard/files`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`  
        },
        body: formData,  
      });

      if (!filesRes.ok) {
        const errorText = await filesRes.text();
        throw new Error(`Uploading files failed! ${errorText}`);
      }

      const filesData = await filesRes.json();
      console.log("Files upload response:", filesData);

      // Upload exercise file to separate endpoint if exists
      let exerciseData = null;
      if (exerciseFile) {
        const exerciseFormData = new FormData();
        exerciseFormData.append("exerciseFile", exerciseFile);

        const exerciseRes = await fetch(`${BASE_URL}/dashboard/${courseId}/exercise`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: exerciseFormData,
        });

        if (!exerciseRes.ok) {
          const errorText = await exerciseRes.text();
          throw new Error(`Uploading exercise file failed! ${errorText}`);
        }

        exerciseData = await exerciseRes.json();
        console.log("Exercise upload response:", exerciseData);
      }

      // Extract topics from the response
      const processedTopics = filesData.topics || [];
      
      // Use the processed topics data for the final API call
      const finalTopics = processedTopics.map((processedTopic, index) => {
        const userTopic = topics[index] || {};
        
        return {
          title: processedTopic.title || userTopic.title || `Topic ${index + 1}`,
          noteFile: userTopic.file ? userTopic.file.name : "",
          quizFile: userTopic.quizFile ? userTopic.quizFile.name : "",
          notesFilePath: processedTopic.notesFilePath || null,
          quizFilePath: processedTopic.quizFilePath || null,
          index: processedTopic.index || index + 1
        };
      });

      // POST topics to /courses/:courseId/topics with the processed data
      const payload = {
        topics: finalTopics,
        exerciseFileName: exerciseFile ? exerciseFile.name : "",
        processedTopics: processedTopics,
        // Include exercise data if available
        ...(exerciseData && { exerciseData: exerciseData }),
      };

      const topicsRes = await fetch(
        `${BASE_URL}/courses/${courseId}/topics`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        }
      );

      if (!topicsRes.ok) {
        const errorData = await topicsRes.json().catch(() => ({}));
        throw new Error(errorData.message || "Saving topics failed!");
      }

      const topicsData = await topicsRes.json();
      console.log("Topics creation response:", topicsData);

      setMessage("Topics and files uploaded successfully!");

      // Cleanup temp files from server
      try {
        await fetch(`${BASE_URL}/dashboard/notes/exercises/cleanup`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        console.log("Temporary files cleaned up successfully.");
      } catch (cleanupErr) {
        console.warn("Cleanup failed:", cleanupErr.message);
      }


    } catch (err) {
      console.error("Upload error:", err);
      setMessage("Error uploading topics: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] transition-all duration-300">
      <Sidebar />
      <div className="flex-1 flex justify-center items-start lg:items-center min-h-screen px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-0 pt-28 sm:pt-32 md:pt-28 lg:pt-0 lg:mt-24">
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
            {/* Course Name & Number of Topics inputs */}
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter topics count"
                  required
                />
              </div>
            </div>

            {/* Topic Details Section */}
            <h2 className="text-base sm:text-lg font-semibold mt-6 lg:mt-8 mb-4 text-light-text/80 dark:text-dark-text/70">Topic Details</h2>

            {/* Mobile/Tablet Card View */}
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
                      {topic.quizFile ? "Change Quiz" : "Add Quiz"}
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
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Upload Notes File</label>
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
                    <div className="border-l-4 border-green-300 dark:border-green-700 pl-3 bg-green-50/50 dark:bg-green-900/20 rounded-r-lg py-2">
                      <label className="block text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                        Upload Quiz File:
                      </label>
                      <label className="cursor-pointer font-medium text-green-700 hover:underline inline-flex items-center gap-1 text-sm">
                        <HiOutlineUpload className="inline text-base" />
                        <input
                          type="file"
                          accept=".md"
                          className="hidden"
                          onChange={e => handleQuizFileUpload(i, e.target.files?.[0] || null)}
                        />
                        Upload Quiz .md
                      </label>
                      {topic.quizStatus && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {topic.quizStatus}
                        </p>
                      )}
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

            {/* Desktop Table View */}
            <div className="hidden lg:block rounded-xl overflow-x-auto bg-white/50 dark:bg-gray-800/70">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/30 dark:bg-gray-800/70">
                    <th className="px-4 py-3 text-left text-light-text/80 dark:text-dark-text/70">Topic Title</th>
                    <th className="px-4 py-3 text-left text-light-text/80 dark:text-dark-text/70">Upload Notes File</th>
                    <th className="px-4 py-3 text-left text-light-text/80 dark:text-dark-text/70">Status</th>
                    <th className="px-4 py-3 text-left text-light-text/80 dark:text-dark-text/70">Quiz File</th>
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
                            className="text-xs px-3 py-1 rounded bg-green-200 hover:bg-green-300 dark:bg-green-800 dark:hover:bg-green-700 text-green-900 dark:text-green-200 font-semibold transition"
                            onClick={() => handleQuizToggle(i)}
                          >
                            {topic.quizFile ? "Change Quiz" : "Add Quiz"}
                          </button>
                        </td>
                      </tr>
                      {quizInputOpen[i] && (
                        <tr>
                          <td colSpan={4} className="pl-8 border-l-4 border-green-300 dark:border-green-700 bg-transparent">
                            <div className="flex flex-col gap-2 py-2">
                              <label className="ml-2 font-medium text-xs text-green-800 dark:text-green-100 mb-1">
                                Upload Quiz File:
                              </label>
                              <div className="flex items-center gap-4">
                                <label className="cursor-pointer font-medium text-green-700 hover:underline inline-flex items-center gap-1">
                                  <HiOutlineUpload className="inline text-base" />
                                  <input
                                    type="file"
                                    accept=".md"
                                    className="hidden"
                                    onChange={e => handleQuizFileUpload(i, e.target.files?.[0] || null)}
                                  />
                                  Upload Quiz .md
                                </label>
                                {topic.quizStatus && (
                                  <span className="text-xs text-green-600 dark:text-green-400">
                                    {topic.quizStatus}
                                  </span>
                                )}
                              </div>
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

            {/* Exercise file upload UI */}
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
