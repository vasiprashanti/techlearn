import React, { useState, useEffect } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { HiOutlineUpload } from "react-icons/hi";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { FiChevronDown, FiPlus, FiArrowLeft, FiClock, FiFileText } from "react-icons/fi";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function UploadTopicsPage() {
  const [courseName, setCourseName] = useState("");
  const [numTopics, setNumTopics] = useState("");
  const [topics, setTopics] = useState([]);
  const [mcqInputOpen, setMcqInputOpen] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [exerciseFile, setExerciseFile] = useState(null);
  const [exerciseStatus, setExerciseStatus] = useState("");

  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  const navigate = useNavigate();

  // Theme & layout states
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isDarkMode = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch course name if courseId is available
  useEffect(() => {
    if (courseId) {
      const token = localStorage.getItem("token");
      fetch(`${BASE_URL}/courses/${courseId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data?.course?.title) {
            setCourseName(data.course.title);
          }
        })
        .catch(err => console.error("Error loading course:", err));
    }
  }, [courseId]);

  // update topics count
  useEffect(() => {
    const count = parseInt(numTopics, 10) || 0;
    setTopics((prevTopics) =>
      Array.from({ length: count }, (_, i) => prevTopics[i] || {
        title: `Topic ${i + 1}: `,
        file: null,
        status: "",
        mcqFile: null,
        mcqStatus: ""
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
  const handleMcqToggle = (idx) => {
    setMcqInputOpen((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // MCQ file upload handler
  const handleMcqFileUpload = (idx, file) => {
    setTopics((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        mcqFile: file,
        mcqStatus: file ? `MCQ uploaded: ${file.name}` : "",
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
      // Step 1: Upload all topic files and quiz files to /dashboard/files
      const formData = new FormData();
      
      topics.forEach((topic, index) => {
        if (topic.file) {
          formData.append(`notesFile${index}`, topic.file);
        }
      });

      topics.forEach((topic, index) => {
        if (topic.mcqFile) {
          formData.append(`mcqFile${index}`, topic.mcqFile);
        }
      });

      const topicTitles = topics.map(topic => topic.title);
      formData.append("titles", JSON.stringify(topicTitles));

      const mcqFilesInfo = topics.map((topic, index) => ({
        index,
        hasMcq: !!topic.mcqFile,
        mcqFileName: topic.mcqFile ? topic.mcqFile.name : ""
      }));
      formData.append("mcqFilesInfo", JSON.stringify(mcqFilesInfo));

      const token = localStorage.getItem("token");
      
      if (!topics.some(t => t.file) && !exerciseFile) {
        throw new Error("Please upload at least one file before submitting.");
      }

      const filesRes = await fetch(`${BASE_URL}/admin/files`, {
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

      let exerciseData = null;
      if (exerciseFile) {
        const exerciseFormData = new FormData();
        exerciseFormData.append("exerciseFile", exerciseFile);

        const exerciseRes = await fetch(`${BASE_URL}/admin/${courseId}/exercise`, {
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

      const processedTopics = filesData.topics || [];
      
      const finalTopics = processedTopics.map((processedTopic, index) => {
        const userTopic = topics[index] || {};
        
        return {
          title: processedTopic.title || userTopic.title || `Topic ${index + 1}`,
          noteFile: userTopic.file ? userTopic.file.name : "",
          mcqFile: userTopic.mcqFile ? userTopic.mcqFile.name : "",
          notesFilePath: processedTopic.notesFilePath || null,
          mcqFilePath: processedTopic.mcqFilePath || null,
          index: processedTopic.index || index + 1
        };
      });

      const payload = {
        topics: finalTopics,
        exerciseFileName: exerciseFile ? exerciseFile.name : "",
        processedTopics: processedTopics,
        ...(exerciseData && { exerciseData: exerciseData }),
      };

      const topicsRes = await fetch(
        `${BASE_URL}/admin/${courseId}/topics`,
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
      
      // Navigate back to course topics list after short delay
      setTimeout(() => {
        navigate(`/admin/topics/${courseId}`);
      }, 1500);

      try {
        await fetch(`${BASE_URL}/admin/notes/exercises/cleanup`, {
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

  const categoryFormInputClass = "mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35";

  return (
    <div
      className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${
        isDarkMode ? "dark" : "light"
      }`}
    >
      <div
        className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]'
            : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'
        }`}
      />

      <Sidebar
        onToggle={setSidebarCollapsed}
        isCollapsed={sidebarCollapsed}
      />

      <main
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 
          ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} 
          pt-28 pb-12 px-4 sm:px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header styled exactly like the Roadmaps header */}
          <header className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-black/5 dark:border-white/5 gap-4">
            <div>
              <h1 className="mt-8 font-poppins tracking-tight leading-[0.92]">
                <span className="block italic text-4xl sm:text-5xl md:text-6xl brand-heading-primary">
                  UPLOAD TOPICS
                </span>
              </h1>
              <p className="text-xs tracking-widest uppercase text-black/40 dark:text-white/40 mt-4">
                Configure curriculum topics, upload study notes, and MCQs
              </p>
            </div>
            
            <button
              onClick={() => navigate("/admin/courses")}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 px-4 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-white/70 shadow-sm shrink-0 w-auto self-start sm:self-auto transition"
            >
              <FiArrowLeft className="w-3.5 h-3.5" />
              Back to Courses
            </button>
          </header>

          <section className="space-y-6">
            
            {/* Form wrapper in a beautiful premium card */}
            <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-sm">
              
              {!courseId && (
                <div className="mb-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-xs sm:text-sm font-semibold">
                  No active course selected. Please return to the courses list to begin configuring.
                </div>
              )}
              {message && (
                <div className={`mb-4 p-3.5 rounded-xl border font-semibold text-xs sm:text-sm ${message.startsWith("Error") ? "border-red-500/20 bg-red-500/10 text-red-500" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Course Name & Number of Topics inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="admin-micro-label text-black/50 dark:text-white/50">Course Name</label>
                    <input
                      value={courseName || "Loading Course Details..."}
                      className={`${categoryFormInputClass} opacity-60 cursor-not-allowed`}
                      required
                      disabled
                    />
                  </div>
                  <div>
                    <label className="admin-micro-label text-black/50 dark:text-white/50">Number of Topics</label>
                    <input
                      type="number"
                      min="1"
                      value={numTopics}
                      onChange={e => setNumTopics(e.target.value)}
                      placeholder="e.g. 5, 8, 12 topics"
                      className={categoryFormInputClass}
                      required
                    />
                  </div>
                </div>

                {/* Topic Details Section Header */}
                <div className="pt-4 border-t border-black/5 dark:border-white/10">
                  <h3 className="admin-section-heading">Topic Curriculum Details</h3>
                </div>

                {/* Mobile/Tablet Card View */}
                <div className="block lg:hidden space-y-4">
                  {topics.map((topic, i) => (
                    <div key={i} className="rounded-xl border border-black/10 dark:border-white/10 bg-[#f5fbff] dark:bg-[#122b52] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-[#0d2a57] dark:text-[#8fd9ff]">Topic {i + 1}</h4>
                        <button
                          type="button"
                          className="text-xs px-2.5 py-1 rounded-lg bg-green-500/10 text-green-600 dark:text-green-300 font-semibold border border-green-500/20 transition hover:bg-green-500/20"
                          onClick={() => handleMcqToggle(i)}
                        >
                          {topic.mcqFile ? "Change MCQ" : "Add MCQ"}
                        </button>
                      </div>
                      <div>
                        <label className="admin-micro-label text-black/45 dark:text-white/45">Topic Title</label>
                        <input
                          value={topic.title}
                          onChange={e => handleTopicTitleChange(i, e.target.value)}
                          className={categoryFormInputClass}
                          required
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <div>
                          <label className="admin-micro-label text-black/45 dark:text-white/45 block mb-1">Study Notes (.md)</label>
                          <label className="cursor-pointer font-semibold text-[#3C83F6] hover:underline inline-flex items-center gap-1.5 text-xs">
                            <HiOutlineUpload className="inline text-base" />
                            <input
                              type="file"
                              accept=".md"
                              className="hidden"
                              onChange={e => handleFileUpload(i, e.target.files?.[0] || null)}
                            />
                            Upload Notes
                          </label>
                        </div>
                        {topic.status && (
                          <div className="text-xs text-slate-500 max-w-40 truncate" title={topic.status}>
                            {topic.status}
                          </div>
                        )}
                      </div>
                      {mcqInputOpen[i] && (
                        <div className="border-l-4 border-green-500/30 pl-3 bg-green-500/5 dark:bg-green-950/20 rounded-r-xl py-3 space-y-2 mt-2">
                          <label className="admin-micro-label text-green-700 dark:text-green-300 block">
                            MCQ Quiz File (.md)
                          </label>
                          <label className="cursor-pointer font-semibold text-green-600 dark:text-green-400 hover:underline inline-flex items-center gap-1.5 text-xs">
                            <HiOutlineUpload className="inline text-base" />
                            <input
                              type="file"
                              accept=".md"
                              className="hidden"
                              onChange={e => handleMcqFileUpload(i, e.target.files?.[0] || null)}
                            />
                            Upload MCQ File
                          </label>
                          {topic.mcqStatus && (
                            <p className="text-xs text-green-600 dark:text-green-400 truncate max-w-full">
                              {topic.mcqStatus}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {topics.length === 0 && (
                    <div className="text-center py-10 text-slate-400 italic text-xs border border-dashed border-black/10 dark:border-white/10 rounded-xl bg-black/5 dark:bg-white/5">
                      Configure the number of topics above to generate forms.
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block bg-white/60 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100/50 dark:bg-slate-900/30 border-b border-black/10 dark:border-white/10">
                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-black/50 dark:text-white/60 w-[300px]">Topic Title</th>
                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-black/50 dark:text-white/60 w-[180px]">Upload Notes</th>
                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-black/50 dark:text-white/60 w-[240px]">File Status</th>
                        <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-black/50 dark:text-white/60 w-[160px]">Quiz Options</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10 dark:divide-white/10">
                      {topics.map((topic, i) => (
                        <React.Fragment key={i}>
                          <tr className="border-b border-black/10 dark:border-white/10 last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors">
                            <td className="px-4 py-3">
                              <input
                                value={topic.title}
                                onChange={e => handleTopicTitleChange(i, e.target.value)}
                                className={categoryFormInputClass}
                                required
                              />
                            </td>
                            <td className="px-4 py-3">
                              <label className="cursor-pointer font-semibold text-[#3C83F6] hover:underline inline-flex items-center gap-1.5">
                                <HiOutlineUpload className="inline text-lg" />
                                <input
                                  type="file"
                                  accept=".md"
                                  className="hidden"
                                  onChange={e => handleFileUpload(i, e.target.files?.[0] || null)}
                                />
                                Upload .md
                              </label>
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs truncate max-w-[240px]" title={topic.status}>
                              {topic.status || (topic.file ? `Uploaded: ${topic.file.name}` : "--")}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-300 font-semibold transition hover:bg-green-500/20"
                                onClick={() => handleMcqToggle(i)}
                              >
                                {topic.mcqFile ? "Change MCQ" : "Add MCQ"}
                              </button>
                            </td>
                          </tr>
                          {mcqInputOpen[i] && (
                            <tr className="bg-green-500/[0.02]">
                              <td colSpan={4} className="pl-12 border-l-4 border-green-500/30 py-3">
                                <div className="flex flex-col gap-2">
                                  <label className="admin-micro-label text-green-700 dark:text-green-300">
                                    MCQ Quiz Upload (.md File)
                                  </label>
                                  <div className="flex items-center gap-4">
                                    <label className="cursor-pointer font-semibold text-green-600 dark:text-green-400 hover:underline inline-flex items-center gap-1.5 text-xs">
                                      <HiOutlineUpload className="inline text-base" />
                                      <input
                                        type="file"
                                        accept=".md"
                                        className="hidden"
                                        onChange={e => handleMcqFileUpload(i, e.target.files?.[0] || null)}
                                      />
                                      Upload MCQ File
                                    </label>
                                    {topic.mcqStatus && (
                                      <span className="text-xs text-green-600 dark:text-green-400">
                                        {topic.mcqStatus}
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
                          <td colSpan={4} className="text-center py-12 text-slate-400 italic text-sm">
                            Configure the number of topics above to generate forms.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Exercise file upload UI */}
                <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10 space-y-3">
                  <h3 className="admin-section-heading">Course Exercise Syllabus</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <label className="cursor-pointer font-semibold text-[#3C83F6] hover:underline inline-flex items-center gap-2 text-sm sm:text-base">
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
                      <p className="text-xs sm:text-sm text-slate-500 max-w-md truncate" title={exerciseStatus}>
                        {exerciseStatus}
                      </p>
                    )}
                  </div>
                </div>

                {/* Form Submit controls */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-black/5 dark:border-white/10 mt-6">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/courses")}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white rounded-xl px-6 py-2.5 text-sm font-semibold shadow hover:bg-blue-700 transition w-full sm:w-auto disabled:opacity-75"
                    disabled={loading || !courseId}
                  >
                    {loading ? "Uploading files..." : "Save curriculum"}
                  </button>
                </div>
              </form>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}
