import React, { useEffect, useMemo, useState } from "react";
import { FiSearch, FiSliders, FiChevronDown, FiChevronLeft, FiChevronRight, FiMapPin, FiExternalLink, FiX, FiCalendar, FiClock } from "react-icons/fi";
import { BriefcaseBusiness, CalendarDays, AlertCircle } from "lucide-react";
import Sidebar from "../components/Dashboard/Sidebar";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { hiringAPI } from "../services/api";

export default function Jobs() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDarkMode = theme === "dark";

  const [activeTab, setActiveTab] = useState("For You");
  const [activeCategory, setActiveCategory] = useState("Jobs");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Newest");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [recommendationCriteria, setRecommendationCriteria] = useState(null);

  // Filters Modal / Drawer
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [availableFilters, setAvailableFilters] = useState({
    location: [],
    experience: [],
    workMode: [],
    jobType: [],
    companyType: [],
  });
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");
  const [selectedWorkMode, setSelectedWorkMode] = useState("");

  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);

  // Fetch Available Filter options once
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await hiringAPI.getFilters();
        if (res?.data) {
          setAvailableFilters(res.data);
        }
      } catch (err) {
        console.error("Failed to load filters:", err);
      }
    };
    fetchFilters();
  }, []);

  // Fetch Jobs for "For You" and "All Jobs"
  useEffect(() => {
    if (activeTab === "Calendar") return;

    let isCancelled = false;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError("");

        let response;
        if (activeTab === "For You") {
          // Call Personalized recommendation endpoint
          response = await hiringAPI.getRecommendedJobs({
            search: searchQuery,
            location: selectedLocation,
            experience: selectedExperience,
            workMode: selectedWorkMode,
            page,
            limit: 10,
          });
          if (!isCancelled) {
            setRecommendationCriteria(response?.recommendationCriteria || null);
          }
        } else {
          // "All Jobs" Tab
          response = await hiringAPI.getJobs({
            search: searchQuery,
            category: activeCategory,
            location: selectedLocation,
            experience: selectedExperience,
            workMode: selectedWorkMode,
            sort: sortBy === "Newest" ? "newest" : sortBy === "Oldest" ? "oldest" : "deadline",
            page,
            limit: 10,
          });
          if (!isCancelled) {
            setRecommendationCriteria(null);
          }
        }

        if (!isCancelled) {
          setJobs(response?.data || []);
          setTotalPages(response?.pagination?.totalPages || 1);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Failed to fetch jobs:", err);
          setError(err.message || "Failed to load jobs.");
          setJobs([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchJobs();

    return () => {
      isCancelled = true;
    };
  }, [activeTab, searchQuery, activeCategory, sortBy, page, selectedLocation, selectedExperience, selectedWorkMode]);

  // Fetch Calendar Data for Selected Month
  const currentMonthKey = useMemo(() => {
    const y = currentCalendarDate.getFullYear();
    const m = String(currentCalendarDate.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, [currentCalendarDate]);

  useEffect(() => {
    if (activeTab !== "Calendar") return;

    let isCancelled = false;

    const fetchCalendar = async () => {
      try {
        setLoadingCalendar(true);
        const res = await hiringAPI.getCalendar(currentMonthKey);
        if (!isCancelled) {
          setCalendarData(res?.data || {});
        }
      } catch (err) {
        console.error("Failed to fetch calendar jobs:", err);
        if (!isCancelled) {
          setCalendarData({});
        }
      } finally {
        if (!isCancelled) {
          setLoadingCalendar(false);
        }
      }
    };

    fetchCalendar();

    return () => {
      isCancelled = true;
    };
  }, [activeTab, currentMonthKey]);

  // Helper: check if a job is expired
  const isJobExpired = (job) => {
    if (!job?.applicationDeadline) return false;
    const deadline = new Date(job.applicationDeadline);
    const now = new Date();
    // Compare day boundary
    return deadline.setHours(23, 59, 59, 999) < now.getTime();
  };

  // Helper: handle direct application link
  const handleApply = (job, e) => {
    e?.stopPropagation?.();
    if (isJobExpired(job)) {
      alert("This job's application deadline has passed.");
      return;
    }
    if (job?.applicationUrl) {
      window.open(job.applicationUrl, "_blank", "noopener,noreferrer");
    } else {
      alert("Application link is not available for this opportunity.");
    }
  };

  // Calendar month days calculation
  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Empty lead slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null });
    }

    // Actual days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayJobs = calendarData[dateStr] || [];
      days.push({
        day: d,
        dateStr,
        jobs: dayJobs,
      });
    }

    return days;
  }, [currentCalendarDate, calendarData]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div
      className={`min-h-screen font-sans antialiased ${
        isDarkMode
          ? "bg-[#020b23] text-white"
          : "bg-[#bceaff] text-[#00113b]"
      }`}
    >
      <Sidebar />

      <main className="min-h-screen lg:ml-[90px] px-5 sm:px-8 lg:px-12 pt-28 pb-10">
        <div className="max-w-[1250px] mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1
              className={`font-['Press_Start_2P'] text-2xl sm:text-3xl ${
                isDarkMode ? "text-white" : "text-[#00113b]"
              }`}
            >
              Jobs
            </h1>

            <p
              className={`mt-2 text-sm sm:text-base ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Opportunities matched to your career goals.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full mb-6">
            <FiSearch
              className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${
                isDarkMode ? "text-slate-300" : "text-slate-600"
              }`}
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search roles, companies or skills..."
              className={`w-full h-14 pl-14 pr-5 rounded-[18px] border outline-none transition-all ${
                isDarkMode
                  ? "bg-[#0b1934] border-white/15 text-white placeholder:text-slate-300 focus:border-[#a3e635]/60"
                  : "bg-white/70 border-[#003432]/15 text-[#17251a] placeholder:text-slate-600 focus:border-[#a3e635]/70"
              }`}
            />
          </div>

          {/* Main Tabs */}
          <div
            className={`flex items-center gap-7 border-b mb-6 ${
              isDarkMode
                ? "border-white/10"
                : "border-slate-200"
            }`}
          >
            {["For You", "All Jobs", "Calendar"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
                className={`pb-3 text-sm font-semibold transition relative ${
                  activeTab === tab
                    ? isDarkMode
                      ? "text-white"
                      : "text-[#00113b] dark:text-white"
                    : isDarkMode
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}

                {activeTab === tab && (
                  <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#a3e635] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* CALENDAR VIEW */}
          {activeTab === "Calendar" ? (
            <div className="space-y-6">
              {/* Month Selector Bar */}
              <div
                className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border ${
                  isDarkMode ? "bg-[#0b1934] border-white/10" : "bg-white/80 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-6 h-6 text-[#8bcf2c]" />
                  <h2 className="text-lg font-bold">
                    {monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentCalendarDate(
                        new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1)
                      );
                    }}
                    className={`p-2 rounded-lg border text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition ${
                      isDarkMode ? "border-white/10" : "border-slate-200"
                    }`}
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentCalendarDate(new Date())}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition ${
                      isDarkMode ? "border-white/10" : "border-slate-200"
                    }`}
                  >
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentCalendarDate(
                        new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1)
                      );
                    }}
                    className={`p-2 rounded-lg border text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10 transition ${
                      isDarkMode ? "border-white/10" : "border-slate-200"
                    }`}
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid Container */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Monthly Calendar Grid */}
                <div className="lg:col-span-2 space-y-2">
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold py-2 text-slate-500 uppercase tracking-wider">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>

                  {loadingCalendar ? (
                    <div className="py-20 text-center text-sm text-slate-500">Loading deadline calendar...</div>
                  ) : (
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((item, idx) => {
                        if (!item.day) {
                          return (
                            <div
                              key={`empty-${idx}`}
                              className="min-h-[90px] rounded-xl border border-transparent bg-transparent"
                            />
                          );
                        }

                        const hasJobs = item.jobs.length > 0;
                        const isSelected = selectedCalendarDay?.dateStr === item.dateStr;

                        return (
                          <div
                            key={item.dateStr}
                            onClick={() => {
                              if (hasJobs) setSelectedCalendarDay(item);
                            }}
                            className={`min-h-[95px] p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                              hasJobs ? "cursor-pointer" : "cursor-default"
                            } ${
                              isSelected
                                ? "border-[#a3e635] ring-2 ring-[#a3e635]/40 bg-[#a3e635]/10"
                                : hasJobs
                                ? isDarkMode
                                  ? "bg-[#0b1934] border-white/15 hover:border-[#a3e635]/50 shadow-sm"
                                  : "bg-white border-slate-200 hover:border-[#a3e635] shadow-sm"
                                : isDarkMode
                                ? "bg-[#081226]/50 border-white/5 opacity-60"
                                : "bg-white/40 border-slate-200/50 opacity-60"
                            }`}
                          >
                            <span className="text-xs font-bold">{item.day}</span>

                            {hasJobs && (
                              <div className="space-y-1 mt-1 overflow-hidden">
                                {item.jobs.slice(0, 2).map((job) => (
                                  <div
                                    key={job._id || job.JID}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#a3e635]/20 text-[#17251a] dark:text-[#a3e635] truncate"
                                    title={`${job.companyName} - ${job.title}`}
                                  >
                                    {job.companyName}
                                  </div>
                                ))}
                                {item.jobs.length > 2 && (
                                  <span className="text-[9px] text-slate-400 font-bold block">
                                    +{item.jobs.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right 1 Col: Selected Day Deadline Panel */}
                <div
                  className={`rounded-2xl border p-5 h-fit ${
                    isDarkMode ? "bg-[#0b1934] border-white/10" : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/10 dark:border-white/10">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-[#8bcf2c]" />
                      {selectedCalendarDay ? `Deadlines on ${selectedCalendarDay.dateStr}` : "Select a day to view deadlines"}
                    </h3>
                    {selectedCalendarDay && (
                      <button
                        type="button"
                        onClick={() => setSelectedCalendarDay(null)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>

                  {!selectedCalendarDay ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Click any highlighted date on the calendar with upcoming deadlines.
                    </div>
                  ) : selectedCalendarDay.jobs.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No application deadlines on this date.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {selectedCalendarDay.jobs.map((job) => {
                        const expired = isJobExpired(job);
                        return (
                          <div
                            key={job._id || job.JID}
                            className={`p-3.5 rounded-xl border transition ${
                              expired
                                ? "bg-slate-200/50 dark:bg-white/5 border-slate-300 dark:border-white/10 opacity-70"
                                : isDarkMode
                                ? "bg-[#071532] border-white/10 hover:border-[#a3e635]/40"
                                : "bg-slate-50 border-slate-200 hover:border-[#a3e635]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 mb-1.5">
                              {job.companyLogo ? (
                                <img
                                  src={job.companyLogo}
                                  alt="Logo"
                                  className="w-6 h-6 object-contain rounded bg-white p-0.5"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded bg-slate-300 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold">
                                  {job.companyName?.charAt(0) || "🏢"}
                                </div>
                              )}
                              <div>
                                <h4 className="text-xs font-bold truncate max-w-[170px]">{job.title}</h4>
                                <p className="text-[11px] text-slate-500">{job.companyName}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5 dark:border-white/5 text-[10px]">
                              <span className="text-slate-400">{job.location || job.workMode}</span>
                              <button
                                type="button"
                                onClick={(e) => handleApply(job, e)}
                                disabled={expired}
                                className={`px-3 py-1 rounded-lg font-['Press_Start_2P'] text-[8px] transition ${
                                  expired
                                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                                    : "bg-[#b5e959] text-[#00113b] hover:bg-[#a8dc4d]"
                                }`}
                              >
                                {expired ? "EXPIRED" : "APPLY"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Category + Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  {["Jobs", "Internships", "Freelance"].map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setActiveCategory(category);
                        setPage(1);
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                        activeCategory === category
                          ? "bg-[#a3e635] text-[#17251a]"
                          : isDarkMode
                          ? "bg-white/5 text-slate-400 hover:bg-[#a3e635]/15 hover:text-white"
                          : "bg-white border border-slate-200 text-slate-500 hover:bg-[#a3e635]/10"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFiltersModal(!showFiltersModal)}
                    className={`h-9 px-3 rounded-lg flex items-center gap-2 text-xs font-semibold border ${
                      selectedLocation || selectedExperience || selectedWorkMode
                        ? "border-[#a3e635] bg-[#a3e635]/15 text-[#17251a] dark:text-[#a3e635]"
                        : isDarkMode
                        ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <FiSliders className="w-3.5 h-3.5" />
                    Filters {Boolean(selectedLocation || selectedExperience || selectedWorkMode) && "•"}
                  </button>

                  <button
                    onClick={() =>
                      setSortBy(
                        sortBy === "Newest" ? "Oldest" : sortBy === "Oldest" ? "Deadline" : "Newest"
                      )
                    }
                    className={`h-9 px-3 rounded-lg flex items-center gap-2 text-xs font-semibold border ${
                      isDarkMode
                        ? "border-white/10 bg-white/5 text-slate-300"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {sortBy}
                    <FiChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Active Filter Chips bar if any */}
              {showFiltersModal && (
                <div
                  className={`p-4 rounded-2xl border mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 ${
                    isDarkMode ? "bg-[#0b1934] border-white/10" : "bg-white border-slate-200 shadow-sm"
                  }`}
                >
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-400">Location</label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => {
                        setSelectedLocation(e.target.value);
                        setPage(1);
                      }}
                      className="w-full text-xs p-2 rounded-lg border dark:bg-[#071532] dark:border-white/10 outline-none"
                    >
                      <option value="">All Locations</option>
                      {availableFilters.location.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-400">Experience</label>
                    <select
                      value={selectedExperience}
                      onChange={(e) => {
                        setSelectedExperience(e.target.value);
                        setPage(1);
                      }}
                      className="w-full text-xs p-2 rounded-lg border dark:bg-[#071532] dark:border-white/10 outline-none"
                    >
                      <option value="">All Experience Levels</option>
                      {availableFilters.experience.map((exp) => (
                        <option key={exp} value={exp}>
                          {exp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-400">Work Mode</label>
                    <select
                      value={selectedWorkMode}
                      onChange={(e) => {
                        setSelectedWorkMode(e.target.value);
                        setPage(1);
                      }}
                      className="w-full text-xs p-2 rounded-lg border dark:bg-[#071532] dark:border-white/10 outline-none"
                    >
                      <option value="">All Modes</option>
                      {availableFilters.workMode.map((wm) => (
                        <option key={wm} value={wm}>
                          {wm}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Results List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-slate-500">Loading opportunities...</p>
                  </div>
                ) : error ? (
                  <div className="py-12 text-center">
                    <p className="font-semibold text-red-500">{error}</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div
                    className={`rounded-2xl border p-12 text-center ${
                      isDarkMode
                        ? "bg-[#0b1934] border-white/10"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <BriefcaseBusiness className="w-9 h-9 mx-auto mb-3 text-slate-400" />
                    <p className="font-semibold">No jobs found</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {activeTab === "For You"
                        ? "No matching jobs found based on your target role / profile. Try updating your profile or explore All Jobs."
                        : "Try changing your search or category."}
                    </p>
                  </div>
                ) : (
                  jobs.map((job) => {
                    const expired = isJobExpired(job);

                    return (
                      <article
                        key={job._id || job.JID}
                        className={`rounded-2xl border px-6 py-5 transition-all ${
                          expired
                            ? "bg-slate-200/60 dark:bg-[#060e1f] border-slate-300 dark:border-white/5 opacity-75 grayscale-[30%]"
                            : isDarkMode
                            ? "bg-[#0b1934] border-white/10 hover:border-[#a8e63d]/30"
                            : "bg-[#d9e8ef] border-[#c0d5e0] hover:border-[#a8e63d]/50 shadow-sm"
                        }`}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1.1fr_0.8fr_auto] gap-4 lg:gap-6 items-center">
                          {/* Role & Company Logo */}
                          <div className="min-w-0 flex items-center gap-3.5">
                            {job.companyLogo ? (
                              <img
                                src={job.companyLogo}
                                alt={job.companyName}
                                className="w-10 h-10 object-contain rounded-xl bg-white p-1 border border-black/5 dark:border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-300 dark:bg-white/10 flex items-center justify-center font-bold text-sm shrink-0">
                                {job.companyName?.charAt(0) || "🏢"}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h2
                                  className={`text-base sm:text-lg font-bold truncate ${
                                    isDarkMode ? "text-white" : "text-[#17251a]"
                                  }`}
                                >
                                  {job.title}
                                </h2>
                                {expired && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-500/15 text-red-500 shrink-0">
                                    Expired
                                  </span>
                                )}
                              </div>

                              <div
                                className={`mt-0.5 text-xs flex items-center gap-1.5 ${
                                  isDarkMode ? "text-slate-300" : "text-slate-600"
                                }`}
                              >
                                <span>{job.location}</span>
                                {job.experience && (
                                  <>
                                    <span>•</span>
                                    <span>{job.experience}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Company & Tags */}
                          <div>
                            <p
                              className={`text-sm font-bold ${
                                isDarkMode ? "text-white" : "text-[#17251a]"
                              }`}
                            >
                              {job.companyName}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-2">
                              {job.workMode && (
                                <span
                                  className={`px-2 py-1 rounded-md text-[10px] font-semibold ${
                                    isDarkMode
                                      ? "bg-[#a3e635]/15 text-[#a3e635]"
                                      : "bg-[#eaf7d5] text-[#5e8d20]"
                                  }`}
                                >
                                  {job.workMode}
                                </span>
                              )}

                              {job.jobType && (
                                <span
                                  className={`px-2 py-1 rounded-md text-[10px] font-semibold ${
                                    isDarkMode
                                      ? "bg-purple-500/15 text-purple-300"
                                      : "bg-purple-100 text-purple-600"
                                  }`}
                                >
                                  {job.jobType}
                                </span>
                              )}

                              {job.companyType && (
                                <span
                                  className={`px-2 py-1 rounded-md text-[10px] font-semibold ${
                                    isDarkMode
                                      ? "bg-blue-500/15 text-blue-300"
                                      : "bg-blue-100 text-blue-600"
                                  }`}
                                >
                                  {job.companyType}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Salary & Deadline */}
                          <div>
                            <p
                              className={`text-sm sm:text-base font-bold ${
                                isDarkMode ? "text-white" : "text-[#17251a]"
                              }`}
                            >
                              {job.salary || "Undisclosed"}
                            </p>

                            <p className="text-[10px] text-slate-400 mt-1">
                              {job.applicationDeadline
                                ? `Deadline: ${new Date(job.applicationDeadline).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                  })}`
                                : "Estimated Salary/Stipend"}
                            </p>
                          </div>

                          {/* Apply */}
                          <div className="lg:text-right">
                            <button
                              onClick={(e) => handleApply(job, e)}
                              disabled={expired}
                              className={`min-w-[92px] px-5 py-2.5 rounded-xl text-[10px] font-['Press_Start_2P'] transition-all ${
                                expired
                                  ? "bg-slate-300 dark:bg-white/10 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                  : "bg-[#b5e959] text-[#00113b] hover:bg-[#a8dc4d] cursor-pointer shadow-sm active:scale-95"
                              }`}
                            >
                              {expired ? "EXPIRED" : "APPLY"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-bold px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}