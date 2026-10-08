import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../services/adminApi";
import { useTheme } from "../../context/ThemeContext";
import {
  FiChevronDown,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiBookOpen,
  FiSearch,
  FiCheck,
  FiDollarSign,
  FiLayers,
  FiArchive,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import { prepareBannerImage } from "../../utils/bannerImage";
import { STANDARD_COURSE_SKILLS } from "../../constants/courseSkills";

const INITIAL_FORM = {
  title: "",
  description: "",
  numTopics: 0,
  level: "Beginner",
  deliveryType: "Self-Paced",
  accessType: "Free",
  price: "",
  status: "Draft",
  skills: [],
  programIds: [],
  instructor: "",
  instructorBio: "",
  learningOutcomes: [],
  duration: "",
  schedule: "",
  startDate: "",
};

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const navigate = useNavigate();


  // Filter tabs and status filters
  const [activeTab, setActiveTab] = useState("All"); // All, Self-Paced, Structured, Trainer-Led
  const [statusFilter, setStatusFilter] = useState("All"); // All, Draft, Published, Archived

  // Banner file
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");

  // Skills multi-select states
  const [allAvailableSkills, setAllAvailableSkills] = useState(STANDARD_COURSE_SKILLS);
  const [skillsDropdownOpen, setSkillsDropdownOpen] = useState(false);
  const [isOtherSkillSelected, setIsOtherSkillSelected] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState("");

  // Form states
  const [courseForm, setCourseForm] = useState(INITIAL_FORM);
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

  const isDarkMode = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleCourseSort = (field) => {
    if (courseSortField === field) {
      setCourseSortDirection(courseSortDirection === "asc" ? "desc" : "asc");
    } else {
      setCourseSortField(field);
      setCourseSortDirection("asc");
    }
  };

  const fetchCourses = async () => {
    try {
      setError(null);
      const data = await adminAPI.getCourses();
      const coursesArray = Array.isArray(data.courses) ? data.courses : [];

      const validatedCourses = coursesArray.map((course) => {
        const rawDelivery = course.deliveryType || (course.courseType === "Trainer-led" ? "Trainer-Led" : "Self-Paced");
        const normalizedDelivery =
          rawDelivery === "Trainer-led" ? "Trainer-Led" :
          rawDelivery === "Self-paced" ? "Self-Paced" : rawDelivery;

        return {
          ...course,
          title: String(course.title || "Untitled Course"),
          description: String(course.description || ""),
          level: String(course.level || "Beginner"),
          skills: Array.isArray(course.skills) ? course.skills : [],
          deliveryType: normalizedDelivery,
          courseType: normalizedDelivery === "Trainer-Led" ? "Trainer-led" : "Self-paced",
          accessType: course.accessType || "Free",
          price: Number(course.price) || 0,
          status: course.status || "Draft",
          programIds: Array.isArray(course.programIds) ? course.programIds.map(String) : [],
          topics: Number(course.numTopics || course.topics || course.topicIds?.length) || 0,
          bannerImage: String(course.bannerImage || ""),
          instructor: String(course.instructor || ""),
          instructorBio: String(course.instructorBio || ""),
          learningOutcomes: Array.isArray(course.learningOutcomes) ? course.learningOutcomes : [],
          duration: String(course.duration || ""),
          _id: String(course._id || course.courseId || course.id || ""),
        };
      });

      setCourses(validatedCourses);

      // Aggregate custom skills from existing courses to enrich skill options
      const dynamicSkills = new Set(STANDARD_COURSE_SKILLS.map((s) => s.toLowerCase()));
      const combinedSkills = [...STANDARD_COURSE_SKILLS];
      for (const c of validatedCourses) {
        if (Array.isArray(c.skills)) {
          for (const s of c.skills) {
            const trimmed = String(s).trim();
            if (trimmed && !dynamicSkills.has(trimmed.toLowerCase())) {
              dynamicSkills.add(trimmed.toLowerCase());
              combinedSkills.push(trimmed);
            }
          }
        }
      }
      setAllAvailableSkills(combinedSkills);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(err.message);
      setCourses([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Skill Selection Handlers
  const handleToggleSkill = (skill) => {
    setCourseForm((prev) => {
      const exists = prev.skills.some((s) => s.toLowerCase() === skill.toLowerCase());
      const nextSkills = exists
        ? prev.skills.filter((s) => s.toLowerCase() !== skill.toLowerCase())
        : [...prev.skills, skill];
      return { ...prev, skills: nextSkills };
    });
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) {
      setFormError("Please enter a custom skill name.");
      return;
    }

    const lower = trimmed.toLowerCase();
    const alreadyAvailable = allAvailableSkills.find((s) => s.toLowerCase() === lower);
    const resolvedSkillName = alreadyAvailable || trimmed;

    if (!allAvailableSkills.some((s) => s.toLowerCase() === lower)) {
      setAllAvailableSkills((prev) => [...prev, resolvedSkillName]);
    }

    setCourseForm((prev) => {
      if (prev.skills.some((s) => s.toLowerCase() === lower)) {
        return prev;
      }
      return { ...prev, skills: [...prev.skills, resolvedSkillName] };
    });

    setCustomSkillInput("");
    setFormError("");
  };

  // Banner file handler
  const handleBannerChange = (e) => {
    const file = e.target.files?.[0] || null;
    setBannerFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setBannerPreview(previewUrl);
    } else {
      setBannerPreview("");
    }
  };

  const resetForm = () => {
    setCourseForm(INITIAL_FORM);
    setBannerFile(null);
    setBannerPreview("");
    setFormError("");
    setIsOtherSkillSelected(false);
    setCustomSkillInput("");
    setShowForm(false);
    setEditingCourse(null);
  };

  const handleAddCourseSubmit = async (e) => {
    e.preventDefault();

    // 1. Validation: Title
    const trimmedTitle = courseForm.title.trim();
    if (!trimmedTitle) {
      setFormError("Course title is required.");
      return;
    }
    if (trimmedTitle.length > 120) {
      setFormError("Course title must be at most 120 characters.");
      return;
    }

    // 2. Validation: Description
    if (!courseForm.description.trim()) {
      setFormError("Course description is required.");
      return;
    }

    // 3. Validation: Skills
    let finalSkills = [...courseForm.skills];
    if (isOtherSkillSelected && customSkillInput.trim()) {
      const customTrimmed = customSkillInput.trim();
      const lower = customTrimmed.toLowerCase();
      if (!finalSkills.some((s) => s.toLowerCase() === lower)) {
        finalSkills.push(customTrimmed);
      }
      if (!allAvailableSkills.some((s) => s.toLowerCase() === lower)) {
        setAllAvailableSkills((prev) => [...prev, customTrimmed]);
      }
    } else if (isOtherSkillSelected && !customSkillInput.trim() && finalSkills.length === 0) {
      setFormError("Please enter a custom skill or select at least one skill.");
      return;
    }

    if (finalSkills.length === 0) {
      setFormError("At least one skill is required.");
      return;
    }

    // 4. Validation: Topics count
    const numTopicsVal = Number(courseForm.numTopics) || 0;
    if (numTopicsVal < 0) {
      setFormError("Topics count cannot be negative.");
      return;
    }

    // 5. Validation: Paid pricing
    if (courseForm.accessType === "Paid" && (Number(courseForm.price) <= 0 || isNaN(courseForm.price))) {
      setFormError("Paid courses require a valid price greater than ₹0.");
      return;
    }

    // 6. Validation: Publishing gate
    if (courseForm.status === "Published") {
      setFormError("A course cannot be published with zero actual topics. Please create the course as Draft and add curriculum topics first.");
      return;
    }

    setSaving(true);
    setFormError("");

    const formData = new FormData();
    formData.append("title", trimmedTitle);
    formData.append("description", courseForm.description.trim());
    formData.append("level", courseForm.level);
    formData.append("skills", JSON.stringify(finalSkills));
    formData.append("deliveryType", courseForm.deliveryType);
    formData.append("courseType", courseForm.deliveryType === "Trainer-Led" ? "Trainer-led" : "Self-paced");
    formData.append("accessType", courseForm.accessType);
    formData.append("price", String(courseForm.accessType === "Paid" ? courseForm.price : 0));
    formData.append("status", courseForm.status);
    formData.append("numTopics", String(numTopicsVal));
    formData.append("learningOutcomes", JSON.stringify(courseForm.learningOutcomes || []));

    formData.append("instructor", courseForm.instructor.trim());
    formData.append("instructorBio", courseForm.instructorBio.trim());

    if (courseForm.deliveryType === "Trainer-Led") {
      formData.append("duration", courseForm.duration.trim());
      formData.append("schedule", courseForm.schedule.trim());
      formData.append("startDate", courseForm.startDate.trim());
    } else {
      formData.append("duration", courseForm.duration.trim());
    }

    if (bannerFile) {
      try {
        const preparedBanner = await prepareBannerImage(bannerFile);
        formData.append("bannerFile", preparedBanner);
      } catch (err) {
        setFormError(err.message || "Failed to process banner image.");
        setSaving(false);
        return;
      }
    }

    try {
      const res = editingCourse
        ? await adminAPI.updateCourse(editingCourse._id, formData)
        : await adminAPI.createCourse(formData);
      const newCourseId = res?.data?._id || res?._id || res?.courseId || res?.id;
      const searchParams = new URLSearchParams(window.location.search);
      const returnTo = searchParams.get("returnTo");
      if (returnTo) {
        const targetUrl = newCourseId
          ? `${decodeURIComponent(returnTo)}&newId=${newCourseId}`
          : decodeURIComponent(returnTo);
        navigate(targetUrl);
        return;
      }
      await fetchCourses();
      resetForm();
    } catch (err) {
      console.error("Error creating course:", err);
      setFormError(`Could not create course: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (course) => {
    const courseId = String(course?._id || course?.courseId || course?.id || "");
    if (!courseId) {
      alert("Invalid course ID");
      return;
    }
    setEditingCourse(course);
    setCourseForm({ ...INITIAL_FORM, ...course, title: course.title || "", programIds: [] });
    setBannerPreview(course.bannerImage || "");
    setShowForm(true);
  };

  const handleOpenCourse = (course) => {
    const courseId = String(course?._id || course?.courseId || course?.id || "");
    if (courseId) navigate(`/admin/topics/${courseId}`);
  };

  const handleInlineStatusChange = async (course, status) => {
    const previous = courses;
    setCourses((items) => items.map((item) => item._id === course._id ? { ...item, status } : item));
    try {
      const body = new FormData();
      body.append("status", status);
      await adminAPI.updateCourse(course._id, body);
    } catch (err) {
      setCourses(previous);
      alert(`Could not update status: ${err.message}`);
    }
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
      await fetchCourses();
    } catch (err) {
      console.error("Error deleting course:", err);
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setShowDeleteConfirm(false);
      setCourseToDelete(null);
    }
  };

  // Filtered and Sorted Courses
  const filteredCourses = useMemo(() => {
    return courses
      .filter((course) => {
        // Tab filter (Delivery Type)
        if (activeTab !== "All") {
          const dt = (course.deliveryType || (course.courseType === "Trainer-led" ? "Trainer-Led" : "Self-Paced")).toLowerCase();
          if (dt !== activeTab.toLowerCase()) return false;
        }

        // Status filter
        if (statusFilter !== "All") {
          const s = (course.status || "Draft").toLowerCase();
          if (s !== statusFilter.toLowerCase()) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesTitle = (course.title || "").toLowerCase().includes(query);
          const matchesDesc = (course.description || "").toLowerCase().includes(query);
          const matchesLevel = (course.level || "").toLowerCase().includes(query);
          const matchesSkills = (course.skills || []).some((sk) => sk.toLowerCase().includes(query));
          return matchesTitle || matchesDesc || matchesLevel || matchesSkills;
        }

        return true;
      })
      .sort((a, b) => {
        let aVal = courseSortField === "topics" ? a.topics : a[courseSortField];
        let bVal = courseSortField === "topics" ? b.topics : b[courseSortField];

        if (typeof aVal === "string") {
          return courseSortDirection === "asc"
            ? aVal.localeCompare(bVal, undefined, { sensitivity: "base" })
            : bVal.localeCompare(aVal, undefined, { sensitivity: "base" });
        } else {
          return courseSortDirection === "asc" ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
        }
      });
  }, [courses, activeTab, statusFilter, searchQuery, courseSortField, courseSortDirection]);

  // Statistics for top summary cards
  const stats = useMemo(() => {
    const total = courses.length;
    const published = courses.filter((c) => c.status === "Published").length;
    const drafts = courses.filter((c) => !c.status || c.status === "Draft").length;
    const archived = courses.filter((c) => c.status === "Archived").length;
    const paid = courses.filter((c) => c.accessType === "Paid").length;
    return { total, published, drafts, archived, paid };
  }, [courses]);

  const dropdownOptionClass = "bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white";
  const categoryFormInputClass =
    "course-form-field mt-1 w-full px-3 py-2 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35";

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
              ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]"
              : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]"
          }`}
        />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />
        <main
          className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          } pt-28 pb-12 px-4 sm:px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden`}
        >
          <div className="max-w-4xl mx-auto space-y-8 text-center py-8">
            <h2 className="text-xl font-semibold text-rose-500">Error Loading Courses</h2>
            <p className="mt-2 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
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
      <div
        className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
          isDarkMode
            ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]"
            : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]"
        }`}
      />

      {/* Add Course Modal Popup */}
      {showForm && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={resetForm} />
          <div className="course-form-modal relative w-full max-w-2xl bg-white border border-black/10 dark:bg-[#0a1737] dark:border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-visible">
            <div className="px-5 py-3.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[#3C83F6] dark:text-[#bceaff]">{editingCourse ? "Edit Course" : "Add New Course"}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure course curriculum metadata, pricing, skills and program assignment.
                </p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-medium px-2 py-1 rounded-lg text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCourseSubmit} className="flex min-h-0 flex-1 flex-col overflow-visible">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-visible p-5 space-y-4 minimal-scrollbar">
                {formError && (
                  <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-medium">
                    ⚠️ {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Course Title */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">
                        Course Title*
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {courseForm.title.length}/120
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={120}
                      value={courseForm.title}
                      onChange={(e) => setCourseForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Master Python Programming, DSA with Java"
                      className={categoryFormInputClass}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">
                      Description*
                    </label>
                    <textarea
                      value={courseForm.description}
                      onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed overview of syllabus, target outcomes, and fundamentals..."
                      rows={2}
                      className={`${categoryFormInputClass} resize-none`}
                      required
                    />
                  </div>

                  {/* Skills Multi-Select with Checkboxes & Custom Skill */}
                  <div className="sm:col-span-2">
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                      Skills* (Multi-select)
                    </label>

                    {/* Selected pills preview */}
                    <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                      {courseForm.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3C83F6]/15 text-[#3C83F6] dark:bg-blue-500/20 dark:text-blue-300"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleToggleSkill(skill)}
                            className="hover:opacity-75"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {courseForm.skills.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No skills selected yet. Select below.</span>
                      )}
                    </div>

                    {/* Multi-select dropdown container */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSkillsDropdownOpen(!skillsDropdownOpen)}
                        className={`${categoryFormInputClass} flex items-center justify-between text-left`}
                      >
                        <span className="truncate">
                          {courseForm.skills.length > 0
                            ? `${courseForm.skills.length} skill(s) selected`
                            : "Select skills..."}
                        </span>
                        <FiChevronDown
                          className={`w-4 h-4 transition-transform ${skillsDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {skillsDropdownOpen && (
                        <div
                          className="course-skills-dropdown absolute left-0 right-0 top-full mt-1.5 z-[150] rounded-xl border border-black/10 dark:border-white/15 p-3 shadow-xl max-h-56 overflow-y-auto minimal-scrollbar"
                          style={{
                            backgroundColor: isDarkMode ? "#0f1f43" : "#ffffff",
                            opacity: 1,
                            backdropFilter: "none",
                            WebkitBackdropFilter: "none",
                          }}
                        >
                          <div className="grid grid-cols-2 gap-1.5">
                            {allAvailableSkills.map((skill) => {
                              const checked = courseForm.skills.some(
                                (s) => s.toLowerCase() === skill.toLowerCase()
                              );
                              return (
                                <label
                                  key={skill}
                                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-slate-800 dark:text-white"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleToggleSkill(skill)}
                                    className="rounded border-slate-300 text-[#3C83F6] focus:ring-[#3C83F6]"
                                  />
                                  <span className="truncate">{skill}</span>
                                </label>
                              );
                            })}
                          </div>

                          {/* "Other" Option */}
                          <div className="mt-3 pt-2 border-t border-black/10 dark:border-white/10">
                            <label className="flex items-center gap-2 p-1.5 rounded-lg text-xs font-semibold text-[#3C83F6] dark:text-blue-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isOtherSkillSelected}
                                onChange={(e) => setIsOtherSkillSelected(e.target.checked)}
                                className="rounded border-slate-300 text-[#3C83F6] focus:ring-[#3C83F6]"
                              />
                              <span>Other (Add Custom Skill)</span>
                            </label>

                            {isOtherSkillSelected && (
                              <div className="flex gap-2 mt-2">
                                <input
                                  type="text"
                                  value={customSkillInput}
                                  onChange={(e) => setCustomSkillInput(e.target.value)}
                                  placeholder="e.g. Kotlin, Docker, Cyber Security"
                                  className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071330] text-slate-900 dark:text-white outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddCustomSkill}
                                  className="px-3 py-1 bg-[#3C83F6] text-white text-xs rounded-lg font-medium hover:bg-blue-600 transition"
                                >
                                  Add
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Type */}
                  <div>
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">
                      Delivery Type*
                    </label>
                    <div className="relative">
                      <select
                        value={courseForm.deliveryType}
                        onChange={(e) => setCourseForm((prev) => ({ ...prev, deliveryType: e.target.value }))}
                        className={`${categoryFormInputClass} pr-10 appearance-none`}
                      >
                        <option className={dropdownOptionClass} value="Self-Paced">Self-Paced</option>
                        <option className={dropdownOptionClass} value="Structured">Structured</option>
                        <option className={dropdownOptionClass} value="Trainer-Led">Trainer-Led</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                  </div>

                  {/* Difficulty Level */}
                  <div>
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">
                      Difficulty Level*
                    </label>
                    <div className="relative">
                      <select
                        value={courseForm.level}
                        onChange={(e) => setCourseForm((prev) => ({ ...prev, level: e.target.value }))}
                        className={`${categoryFormInputClass} pr-10 appearance-none`}
                      >
                        <option className={dropdownOptionClass} value="Beginner">Beginner</option>
                        <option className={dropdownOptionClass} value="Basic">Basic</option>
                        <option className={dropdownOptionClass} value="Intermediate">Intermediate</option>
                        <option className={dropdownOptionClass} value="Advanced">Advanced</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                  </div>

                  {/* Access Type (Free vs Paid) */}
                  <div>
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">
                      Access Type*
                    </label>
                    <div className="relative">
                      <select
                        value={courseForm.accessType}
                        onChange={(e) =>
                          setCourseForm((prev) => ({
                            ...prev,
                            accessType: e.target.value,
                            price: e.target.value === "Free" ? "" : (prev.price !== "" ? prev.price : ""),
                          }))
                        }
                        className={`${categoryFormInputClass} pr-10 appearance-none`}
                      >
                        <option className={dropdownOptionClass} value="Free">Free</option>
                        <option className={dropdownOptionClass} value="Paid">Paid</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                  </div>

                  {/* Price (if Paid) */}
                  {courseForm.accessType === "Paid" ? (
                    <div>
                      <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">
                        Price (₹ INR)*
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={courseForm.price}
                        onChange={(e) => setCourseForm((prev) => ({ ...prev, price: e.target.value }))}
                        placeholder="Enter course price"
                        className={categoryFormInputClass}
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">
                        Price
                      </label>
                      <input
                        type="text"
                        value="Free (₹0)"
                        disabled
                        className={`${categoryFormInputClass} bg-black/5 dark:bg-white/5 text-slate-400 cursor-not-allowed`}
                      />
                    </div>
                  )}

                  {/* Course Status Lifecycle */}
                  <div>
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">
                      Course Status*
                    </label>
                    <div className="relative">
                      <select
                        value={courseForm.status}
                        onChange={(e) => setCourseForm((prev) => ({ ...prev, status: e.target.value }))}
                        className={`${categoryFormInputClass} pr-10 appearance-none`}
                      >
                        <option className={dropdownOptionClass} value="Draft">Draft</option>
                        <option className={dropdownOptionClass} value="Published">Published</option>
                        <option className={dropdownOptionClass} value="Archived">Archived</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Note: To publish, course must have actual topics added.
                    </span>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">
                      Course Duration
                    </label>
                    <input
                      type="text"
                      value={courseForm.duration}
                      onChange={(e) => setCourseForm((prev) => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g. 4 Weeks or 30 Hours"
                      className={categoryFormInputClass}
                    />
                  </div>

                  {/* Topics Count */}
                  <div>
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">
                      Planned Topics Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={courseForm.numTopics}
                      onChange={(e) => setCourseForm((prev) => ({ ...prev, numTopics: Math.max(0, Number(e.target.value)) }))}
                      className={categoryFormInputClass}
                    />
                  </div>

                  {/* Trainer Information */}
                  <div>
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">
                      Trainer Name <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      value={courseForm.instructor}
                      maxLength={100}
                      onChange={(e) => setCourseForm((prev) => ({ ...prev, instructor: e.target.value }))}
                      placeholder="Enter trainer name"
                      className={categoryFormInputClass}
                    />
                  </div>
                  <div>
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">
                      Trainer Description <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      value={courseForm.instructorBio}
                      maxLength={100}
                      onChange={(e) => setCourseForm((prev) => ({ ...prev, instructorBio: e.target.value }))}
                      placeholder="Short trainer description"
                      className={categoryFormInputClass}
                    />
                  </div>
                  {courseForm.deliveryType === "Trainer-Led" && (
                    <>
                      <div>
                        <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">
                          Schedule
                        </label>
                        <input
                          value={courseForm.schedule}
                          onChange={(e) => setCourseForm((prev) => ({ ...prev, schedule: e.target.value }))}
                          placeholder="e.g. Mon-Fri, 7 PM - 9 PM"
                          className={categoryFormInputClass}
                        />
                      </div>
                    </>
                  )}

                  <div className="sm:col-span-2">
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">Learning Outcomes</label>
                      <button
                        type="button"
                        onClick={() => setCourseForm((prev) => ({ ...prev, learningOutcomes: [...(prev.learningOutcomes || []), ""] }))}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#3C83F6] hover:bg-[#3C83F6]/10"
                      >
                        <FiPlus className="h-3.5 w-3.5" /> Add Outcome
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(courseForm.learningOutcomes || []).map((outcome, index) => (
                        <div key={`outcome-${index}`} className="flex items-center gap-2">
                          <input
                            value={outcome}
                            maxLength={300}
                            onChange={(e) => setCourseForm((prev) => ({
                              ...prev,
                              learningOutcomes: (prev.learningOutcomes || []).map((value, itemIndex) => itemIndex === index ? e.target.value : value),
                            }))}
                            placeholder="What learners will be able to do after this course"
                            className={categoryFormInputClass}
                          />
                          <button
                            type="button"
                            title="Remove outcome"
                            onClick={() => setCourseForm((prev) => ({ ...prev, learningOutcomes: (prev.learningOutcomes || []).filter((_, itemIndex) => itemIndex !== index) }))}
                            className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-500"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Banner Image Upload */}
                  <div className="sm:col-span-2">
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">
                      Banner Image
                    </label>
                    <div className="mt-1 flex items-center gap-4">
                      {bannerPreview && (
                        <img
                          src={bannerPreview}
                          alt="Banner Preview"
                          className="w-16 h-12 rounded-lg object-cover border border-black/10 dark:border-white/10"
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#3C83F6]/10 file:text-[#3C83F6] hover:file:bg-[#3C83F6]/20 cursor-pointer flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="px-5 py-3.5 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50 dark:bg-black/10 rounded-b-xl">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] disabled:opacity-70 transition-colors"
                >
                  {saving ? "Saving..." : editingCourse ? "Save Changes" : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Course Confirmation Modal */}
      {showDeleteConfirm && courseToDelete && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteConfirm(false);
              setCourseToDelete(null);
            }}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a1737] shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-rose-500">Delete Course Track?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 dark:text-white">&ldquo;{courseToDelete.title}&rdquo;</strong>?
              <br />
              <br />
              <span className="text-xs text-rose-500 font-medium">
                ⚠️ This action is permanent and will remove all associated study notes, exercises, and topics.
              </span>
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCourseToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        } pt-20 sm:pt-24 md:pt-28 pb-12 px-3 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header & Stats Cards */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="admin-page-title text-xl sm:text-2xl md:text-3xl font-bold">Course Management</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
                  Manage curriculum tracks, delivery modes, pricing tiers, and program assignments.
                </p>
              </div>

              <button
                onClick={() => {
                  setCourseForm(INITIAL_FORM);
                  setEditingCourse(null);
                  setBannerPreview("");
                  setShowForm(true);
                }}
                className="dashboard-primary-btn h-9 sm:h-10 px-4 sm:px-5 text-xs sm:text-sm font-semibold shrink-0 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Add New Course
              </button>
            </div>

            {/* Quick Summary Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <FiLayers className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">Total Tracks</span>
                  <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">{stats.total}</span>
                </div>
              </div>

              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <FiCheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">Published</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.published}</span>
                </div>
              </div>

              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <FiClock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">Drafts</span>
                  <span className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">{stats.drafts}</span>
                </div>
              </div>

              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">Paid Tracks</span>
                  <span className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">{stats.paid}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar & Tabs */}
          <section className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              {/* Delivery Type Tabs */}
              <div className="flex border-b border-black/10 dark:border-white/10 gap-2 overflow-x-auto minimal-scrollbar max-w-full pb-0.5">
                {["All", "Self-Paced", "Structured", "Trainer-Led"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab
                        ? "border-[#3C83F6] text-[#3C83F6] dark:text-blue-400"
                        : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Status Filter Pills & Search */}
              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 flex-wrap justify-between sm:justify-end">
                {/* Status Pills */}
                <div className="flex items-center rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 p-0.5 text-xs overflow-x-auto">
                  {["All", "Draft", "Published", "Archived"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1.5 rounded-md transition font-semibold whitespace-nowrap ${
                        statusFilter === st
                          ? "bg-[#3C83F6] text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-56 shrink-0">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title, skills..."
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                  />
                </div>
              </div>
            </div>

            {/* Courses Table / Responsive Cards */}
            {loading ? (
              <div className="text-center py-16 text-slate-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                <p className="mt-2 text-xs font-medium">Loading course registry...</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 px-4 py-12 text-center text-sm text-slate-400">
                No courses match the selected filters. Click &ldquo;Add New Course&rdquo; above to create one.
              </div>
            ) : (
              <div className="overflow-x-auto w-full bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl shadow-xs minimal-scrollbar">
                <table className="w-full min-w-[980px] border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0b1736] shadow-xs">
                    <tr className="border-b border-black/5 dark:border-white/10 select-none">
                      <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-14 whitespace-nowrap">#</th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-black/45 dark:text-white/50 min-w-[220px] cursor-pointer hover:text-blue-500 whitespace-nowrap"
                        onClick={() => toggleCourseSort("title")}
                      >
                        Course Title {courseSortField === "title" && (courseSortDirection === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-28 whitespace-nowrap">Actions</th>
                      <th
                        className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-24 cursor-pointer hover:text-blue-500 whitespace-nowrap"
                        onClick={() => toggleCourseSort("topics")}
                      >
                        Topics {courseSortField === "topics" && (courseSortDirection === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-32 whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-black/45 dark:text-white/50 min-w-[180px] whitespace-nowrap">Skills</th>
                      <th
                        className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-28 cursor-pointer hover:text-blue-500 whitespace-nowrap"
                        onClick={() => toggleCourseSort("level")}
                      >
                        Level {courseSortField === "level" && (courseSortDirection === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-32 whitespace-nowrap">Mode</th>
                      <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-28 whitespace-nowrap">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/10 text-xs">
                    {filteredCourses.map((course, index) => {
                      const isFree = course.accessType === "Free" || Number(course.price) === 0;
                      return (
                        <tr
                          key={course._id}
                          onClick={() => handleOpenCourse(course)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => { if (event.key === "Enter") handleOpenCourse(course); }}
                          className="hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                        >
                          <td className="px-3.5 py-3.5 text-center text-slate-400 dark:text-slate-500 tabular-nums whitespace-nowrap">{index + 1}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-white">
                            <div className="flex items-center gap-2 max-w-[260px]">
                              {course.bannerImage ? (
                                <img
                                  src={course.bannerImage}
                                  alt=""
                                  className="w-8 h-8 rounded-lg object-cover border border-black/5 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                  <FiBookOpen className="w-4 h-4" />
                                </div>
                              )}
                              <span className="truncate" title={course.title}>{course.title}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3.5 text-center whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEdit(course)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/10 transition"
                                title="Edit Course"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(course)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                                title="Delete Course"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-3.5 py-3.5 text-center whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                            {course.topics}
                          </td>
                          <td className="px-3.5 py-3.5 text-center whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
                            <div className="inline-block relative">
                              <select
                                aria-label={`Status for ${course.title}`}
                                value={course.status || "Draft"}
                                onChange={(event) => handleInlineStatusChange(course, event.target.value)}
                                className={`appearance-none pr-6 px-2.5 py-1 rounded-lg text-[11px] font-semibold border outline-none cursor-pointer transition ${
                                  course.status === "Published"
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                    : course.status === "Draft"
                                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                                }`}
                              >
                                <option value="Draft">Draft</option>
                                <option value="Published">Published</option>
                                <option value="Archived">Archived</option>
                              </select>
                              <FiChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60" />
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {course.skills && course.skills.length > 0 ? (
                                course.skills.slice(0, 3).map((sk) => (
                                  <span
                                    key={sk}
                                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                  >
                                    {sk}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">—</span>
                              )}
                              {course.skills && course.skills.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  +{course.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#d6e6f4] dark:bg-[#21446f] text-[#0f2b54] dark:text-blue-200">
                              {course.level || "Beginner"}
                            </span>
                          </td>
                          <td className="px-3.5 py-3.5 text-center whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                            {course.deliveryType || "Self-Paced"}
                          </td>
                          <td className="px-3.5 py-3.5 text-center whitespace-nowrap font-semibold">
                            {isFree ? (
                              <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                            ) : (
                              <span className="text-slate-800 dark:text-white">₹{course.price}</span>
                            )}
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
