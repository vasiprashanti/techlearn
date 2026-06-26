import React, { useState, useEffect } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../services/adminApi";
import { useTheme } from "../../context/ThemeContext";
import { FiChevronDown, FiPlus, FiTrash2, FiEdit2, FiBookOpen, FiSearch } from "react-icons/fi";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  // Modal form states
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    numTopics: 0,
    level: "Beginner",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Search & Delete Confirm States
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Theme & layout states
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [courseSortField, setCourseSortField] = useState("title");
  const [courseSortDirection, setCourseSortDirection] = useState("asc");

  const toggleCourseSort = (field) => {
    if (courseSortField === field) {
      setCourseSortDirection(courseSortDirection === "asc" ? "desc" : "asc");
    } else {
      setCourseSortField(field);
      setCourseSortDirection("asc");
    }
  };
  const isDarkMode = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load all courses initially
  useEffect(() => {
    async function fetchCourses() {
      try {
        setError(null);
        const data = await adminAPI.getCourses();
        const coursesArray = Array.isArray(data.courses) ? data.courses : [];

        const validatedCourses = coursesArray.map((course) => ({
          ...course,
          title: String(course.title || "Untitled Course"),
          description: String(course.description || ""),
          level: String(course.level || ""),
          topics: Number(course.numTopics || course.topics) || 0,
          _id: String(course._id || course.courseId || course.id || ""),
        }));

        setCourses(validatedCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError(err.message);
        setCourses([]);
      }
      setLoading(false);
    }
    fetchCourses();
  }, []);

  const handleAddCourseSubmit = async (e) => {
    e.preventDefault();
    if (!courseForm.title.trim()) {
      setFormError("Course title is required.");
      return;
    }

    setSaving(true);
    setFormError("");

    const validatedCourse = {
      title: String(courseForm.title || ""),
      description: String(courseForm.description || ""),
      numTopics: Number(courseForm.numTopics) || 0,
      level: String(courseForm.level || "Beginner"),
    };

    try {
      const responseData = await adminAPI.createCourse(validatedCourse);
      const courseId = String(responseData.courseId || "");

      const newCourse = {
        ...validatedCourse,
        _id: courseId,
        topics: validatedCourse.numTopics,
      };

      setCourses((prevCourses) => [newCourse, ...prevCourses]);
      setShowForm(false);
      setCourseForm({ title: "", description: "", numTopics: 0, level: "Beginner" });
    } catch (err) {
      console.error("Error creating course:", err);
      setFormError(`Could not create course: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (course) => {
    const courseId = String(
      course?._id || course?.courseId || course?.id || ""
    );
    if (!courseId) {
      alert("Invalid course ID");
      return;
    }
    navigate(`/admin/topics/${courseId}`);
  };

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    const courseId = String(courseToDelete._id || courseToDelete.courseId || courseToDelete.id || "");
    try {
      await adminAPI.deleteCourse(courseId);
      setCourses((prevCourses) =>
        prevCourses.filter((c) => {
          const id = String(c._id || c.courseId || c.id || "");
          return id !== courseId;
        })
      );
    } catch (err) {
      console.error("Error deleting course:", err);
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setShowDeleteConfirm(false);
      setCourseToDelete(null);
    }
  };

  const dropdownOptionClass = "bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white";
  const categoryFormInputClass = "mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35";

  if (error) {
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
            <div className="text-center py-8">
              <div className="text-red-500 dark:text-red-400 mb-4">
                <h2 className="text-xl font-semibold">Error Loading Courses</h2>
                <p className="mt-2">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${
        isDarkMode ? "dark" : "light"
      }`}
    >
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />

      {/* Add Course Modal Popup (Question Bank style overlay) */}
      {showForm && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-[#bceaff]">
                Add New Track & Course
              </h2>
              <button onClick={() => setShowForm(false)} className="text-sm text-black/40 dark:text-white/40">Close</button>
            </div>

            <form onSubmit={handleAddCourseSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="admin-micro-label text-black/45 dark:text-white/45">Course Title*</label>
                <input
                  value={courseForm.title}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Python Programming, DSA with Java"
                  className={categoryFormInputClass}
                />
              </div>

              <div>
                <label className="admin-micro-label text-black/45 dark:text-white/45">Description</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Summarize course goals and curriculum syllabus..."
                  rows={3}
                  className={`${categoryFormInputClass} resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Topics Count</label>
                  <input
                    type="number"
                    value={courseForm.numTopics}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, numTopics: Number(e.target.value) }))}
                    className={categoryFormInputClass}
                  />
                </div>

                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Difficulty Level</label>
                  <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-sm transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                    <select
                      value={courseForm.level}
                      onChange={(e) => setCourseForm(prev => ({ ...prev, level: e.target.value }))}
                      className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                    >
                      <option className={dropdownOptionClass} value="Beginner">Beginner</option>
                      <option className={dropdownOptionClass} value="Intermediate">Intermediate</option>
                      <option className={dropdownOptionClass} value="Advanced">Advanced</option>
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                  </div>
                </div>
              </div>

              {formError && (
                <p className="text-sm text-red-500">{formError}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] transition disabled:opacity-70"
                >
                  {saving ? "Creating..." : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Course Confirmation Modal Popup */}
      {showDeleteConfirm && courseToDelete && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => { setShowDeleteConfirm(false); setCourseToDelete(null); }} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden p-6 space-y-4">
            <h2 className="text-lg font-semibold text-rose-500 dark:text-rose-400">
              Delete Course Track?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete the course <strong className="text-slate-800 dark:text-white">&ldquo;{courseToDelete.title}&rdquo;</strong>?
              <br /><br />
              <span className="text-xs text-rose-500 font-medium">⚠️ This action is permanent and will completely erase all study notes, MCQ question databases, and exercise worksheets associated with this track!</span>
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setCourseToDelete(null); }}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white transition shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar
        onToggle={setSidebarCollapsed}
        isCollapsed={sidebarCollapsed}
      />

      <main
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 
          ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} 
          pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}
      >
        <div className="max-w-[1600px] mx-auto space-y-8">
          
          <div>
            <h1 className="admin-page-title">Courses</h1>
          </div>

          <section className="rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl p-4 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-black/10 dark:border-white/10 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#e8eef5] dark:bg-[#1a3a66] flex items-center justify-center">
                  <FiBookOpen className="w-4 h-4 text-[#3C83F6] dark:text-blue-300" />
                </div>
                <div>
                  <h2 className="text-sm md:text-[15px] font-semibold text-[#0b1b38] dark:text-white">Active Tracks & Curriculum</h2>
                  <p className="text-[11px] md:text-xs text-[#5f7592] dark:text-slate-300 truncate">Create course tracks and upload/manage topics inside them.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search courses..."
                    className="w-full h-9 pl-9 pr-4 text-xs rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-black/20 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                  />
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="dashboard-primary-btn w-full sm:w-auto h-9 px-4 text-xs shrink-0"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  Add Course
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-sm font-medium">Loading course registry...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 px-4 py-8 text-center text-sm text-black/40 dark:text-white/40 mt-4">
                No courses created yet. Click "Add Course" above to build your first track.
              </div>
            ) : (
              <div className="overflow-auto max-h-[78vh] rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#0f1f43] backdrop-blur-xl">
                <table className="w-full min-w-[900px] table-fixed">
                  <thead className="border-b-2 border-black/12 dark:border-white/12">
                    <tr className="sticky top-0 bg-white/95 dark:bg-[#13264c]/95 backdrop-blur select-none">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-black/55 dark:text-white/60 w-12">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-black/55 dark:text-white/60 w-[180px] cursor-pointer hover:text-blue-500 transition-colors" onClick={() => toggleCourseSort('title')}>
                        Course Title{courseSortField === 'title' && (courseSortDirection === 'asc' ? ' ▲' : ' ▼')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-black/55 dark:text-white/60 w-24">Actions</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-black/55 dark:text-white/60 w-[240px] cursor-pointer hover:text-blue-500 transition-colors" onClick={() => toggleCourseSort('description')}>
                        Description{courseSortField === 'description' && (courseSortDirection === 'asc' ? ' ▲' : ' ▼')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-black/55 dark:text-white/60 w-32 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => toggleCourseSort('level')}>
                        Level{courseSortField === 'level' && (courseSortDirection === 'asc' ? ' ▲' : ' ▼')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-black/55 dark:text-white/60 w-32 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => toggleCourseSort('topics')}>
                        Total Topics{courseSortField === 'topics' && (courseSortDirection === 'asc' ? ' ▲' : ' ▼')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-black/55 dark:text-white/60 w-44 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => toggleCourseSort('enrolledStudents')}>
                        Total Students Enrolled{courseSortField === 'enrolledStudents' && (courseSortDirection === 'asc' ? ' ▲' : ' ▼')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="border-t border-black/20 dark:border-white/10">
                    {courses.filter((course) => {
                      const query = searchQuery.toLowerCase();
                      return (
                        course.title.toLowerCase().includes(query) ||
                        course.description.toLowerCase().includes(query) ||
                        course.level.toLowerCase().includes(query)
                      );
                    }).sort((a, b) => {
                      let aVal = courseSortField === 'topics' ? a.topics : a[courseSortField];
                      let bVal = courseSortField === 'topics' ? b.topics : b[courseSortField];
                      
                      if (courseSortField === 'enrolledStudents') {
                        aVal = a.enrolledStudents || 0;
                        bVal = b.enrolledStudents || 0;
                      }

                      if (typeof aVal === 'string') {
                        return courseSortDirection === 'asc'
                          ? aVal.localeCompare(bVal, undefined, { sensitivity: 'base' })
                          : bVal.localeCompare(aVal, undefined, { sensitivity: 'base' });
                      } else {
                        return courseSortDirection === 'asc'
                          ? (aVal || 0) - (bVal || 0)
                          : (bVal || 0) - (aVal || 0);
                      }
                    }).map((course, index) => {
                      const truncatedDesc = course.description 
                        ? (course.description.length > 20 ? course.description.substring(0, 20) + "..." : course.description) 
                        : "No description provided.";
                      return (
                        <tr key={course._id} className="border-b border-black/12 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/[0.04]">
                          <td className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-white/60">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white truncate" title={course.title}>
                            {course.title}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleEdit(course)}
                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:text-[#3C83F6] hover:bg-[#3C83F6]/10 text-slate-500 dark:text-slate-400"
                                title="Edit Topics"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(course)}
                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:text-rose-500 hover:bg-rose-500/10 text-slate-500 dark:text-slate-400"
                                title="Delete Course"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-white/60 truncate" title={course.description}>
                            {truncatedDesc}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className="shrink-0 rounded-full bg-[#d6e6f4] dark:bg-[#21446f] px-2.5 py-0.5 text-xs font-semibold text-[#0f2b54] dark:text-blue-200">
                              {course.level || "Beginner"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-white/60">
                            {course.topics}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-white/60">
                            {course.enrolledStudents || 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
