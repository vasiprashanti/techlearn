import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Search, ChevronDown } from "lucide-react";
import "./hiringPage.css";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { hiringAPI } from "../services/api";

export default function Jobs() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDarkMode = theme === "dark";
  const isAuthenticated = Boolean(user);

  // Navigation & Category State: Guests start on "all", authenticated users start on "for-you"
  const [viewMode, setViewMode] = useState("list"); // "list" | "calendar"
  const [activeTab, setActiveTab] = useState(isAuthenticated ? "for-you" : "all"); // "for-you" | "all"
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Applied Filters State (active filters affecting list and calendar)
  const [appliedSortBy, setAppliedSortBy] = useState("newest"); // "newest", "salary", "company"
  const [appliedRoles, setAppliedRoles] = useState([]);
  const [appliedExperience, setAppliedExperience] = useState([]);
  const [appliedJobTypes, setAppliedJobTypes] = useState([]);
  const [appliedWorkModes, setAppliedWorkModes] = useState([]);
  const [appliedCompanies, setAppliedCompanies] = useState([]);

  // Staged / Draft Filters State (used inside Drawer until 'Apply' is clicked)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [stagedSortBy, setStagedSortBy] = useState("newest");
  const [stagedRoles, setStagedRoles] = useState([]);
  const [stagedExperience, setStagedExperience] = useState([]);
  const [stagedJobTypes, setStagedJobTypes] = useState([]);
  const [stagedWorkModes, setStagedWorkModes] = useState([]);
  const [stagedCompanies, setStagedCompanies] = useState([]);
  const [stagedCalendarMonth, setStagedCalendarMonth] = useState(new Date().getMonth());

  // Filter Options
  const [availableFilters, setAvailableFilters] = useState({
    location: [],
    experience: [],
    workMode: [],
    jobType: [],
    companyType: [],
    roles: [
      "Frontend Developer",
      "Full Stack Developer",
      "Backend Engineer",
      "Data Analyst",
      "Software Engineer",
      "AI Engineer",
      "UI Developer",
    ],
    companies: ["Google", "Razorpay", "Microsoft", "Atlassian", "Startup Labs", "TCS", "Amazon"],
  });

  // Calendar & Deadline State
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth()); // 0-indexed month
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarData, setCalendarData] = useState({});
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [deadlineDrawerOpen, setDeadlineDrawerOpen] = useState(false);
  const [selectedDeadlineDate, setSelectedDeadlineDate] = useState("");
  const [selectedDeadlineJobs, setSelectedDeadlineJobs] = useState([]);

  // Fetch filter metadata
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await hiringAPI.getFilters();
        if (res?.data) {
          setAvailableFilters((prev) => ({
            ...prev,
            ...res.data,
          }));
        }
      } catch (err) {
        console.error("Failed to load filters:", err);
      }
    };
    fetchFilters();
  }, []);

  // Fetch Jobs from backend API
  useEffect(() => {
    // In calendar mode we still need the recommended jobs for "for-you" filtering
    if (viewMode !== "list" && !(viewMode === "calendar" && activeTab === "for-you")) return;

    let isCancelled = false;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError("");

        let categoryParam = "";
        let jobTypeParam = "";
        if (appliedJobTypes.length === 1) {
          const type = appliedJobTypes[0].toLowerCase();
          if (type.includes("intern")) categoryParam = "internships";
          else if (type.includes("freelance")) categoryParam = "freelance";
          else categoryParam = "";
          jobTypeParam = appliedJobTypes[0];
        }

        let response;
        if (activeTab === "for-you") {
          if (!isAuthenticated) {
            setJobs([]);
            setLoading(false);
            return;
          }
          response = await hiringAPI.getRecommendedJobs({
            search: searchQuery,
            jobType: jobTypeParam,
            workMode: appliedWorkModes[0] || "",
            experience: appliedExperience[0] || "",
            page,
            limit: 50,
          });
        } else {
          response = await hiringAPI.getJobs({
            search: searchQuery,
            category: categoryParam,
            jobType: categoryParam ? "" : jobTypeParam,
            workMode: appliedWorkModes[0] || "",
            experience: appliedExperience[0] || "",
            sort: appliedSortBy === "newest" ? "newest" : appliedSortBy === "salary" ? "salary" : appliedSortBy === "company" ? "company" : "newest",
            page,
            limit: 50,
          });
        }

        if (!isCancelled) {
          let fetchedJobs = response?.data || [];

          // Never show expired opportunities
          fetchedJobs = fetchedJobs.filter((job) => !isJobExpired(job));

          // Sound matching logic across all filter criteria
          if (appliedRoles.length > 0) {
            fetchedJobs = fetchedJobs.filter((job) =>
              appliedRoles.some(
                (r) =>
                  job.title?.toLowerCase().includes(r.toLowerCase()) ||
                  job.roleId?.roleName?.toLowerCase().includes(r.toLowerCase())
              )
            );
          }

          if (appliedCompanies.length > 0) {
            fetchedJobs = fetchedJobs.filter((job) =>
              appliedCompanies.some((c) =>
                job.companyName?.toLowerCase().includes(c.toLowerCase())
              )
            );
          }

          if (appliedWorkModes.length > 0) {
            fetchedJobs = fetchedJobs.filter((job) =>
              appliedWorkModes.some(
                (m) => job.workMode?.toLowerCase() === m.toLowerCase()
              )
            );
          }

          if (appliedExperience.length > 0) {
            fetchedJobs = fetchedJobs.filter((job) =>
              appliedExperience.some((exp) => {
                const jobExp = (job.experience || "").toLowerCase();
                const filterExp = exp.toLowerCase();
                if (filterExp === "fresher") return jobExp.includes("fresher") || jobExp.includes("0");
                if (filterExp === "0-1") return jobExp.includes("0") || jobExp.includes("1");
                if (filterExp === "1-3") return jobExp.includes("1") || jobExp.includes("2") || jobExp.includes("3");
                return jobExp.includes(filterExp);
              })
            );
          }

          if (appliedJobTypes.length > 0) {
            fetchedJobs = fetchedJobs.filter((job) =>
              appliedJobTypes.some(
                (t) => job.jobType?.toLowerCase() === t.toLowerCase()
              )
            );
          }

          // Client-side sorting enhancement
          if (appliedSortBy === "salary") {
            fetchedJobs.sort((a, b) => {
              const parseSalary = (val) => {
                const match = String(val || "").match(/\d+/);
                return match ? parseInt(match[0], 10) : 0;
              };
              return parseSalary(b.salary) - parseSalary(a.salary);
            });
          } else if (appliedSortBy === "company") {
            fetchedJobs.sort((a, b) =>
              (a.companyName || "").localeCompare(b.companyName || "")
            );
          }

          setJobs(fetchedJobs);
          setTotalPages(response?.pagination?.totalPages || 1);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Failed to fetch jobs:", err);
          setError(err.message || "Failed to load jobs.");
          setJobs([]);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchJobs();

    return () => {
      isCancelled = true;
    };
  }, [
    viewMode,
    activeTab,
    searchQuery,
    appliedSortBy,
    page,
    appliedRoles,
    appliedExperience,
    appliedJobTypes,
    appliedWorkModes,
    appliedCompanies,
  ]);

  // Calendar Month Format Key
  const calendarMonthKey = useMemo(() => {
    return `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}`;
  }, [calendarYear, calendarMonth]);

  // Fetch Calendar Data
  useEffect(() => {
    if (viewMode !== "calendar") return;

    let isCancelled = false;

    const fetchCalendar = async () => {
      try {
        setLoadingCalendar(true);
        const res = await hiringAPI.getCalendar(calendarMonthKey);
        if (!isCancelled) {
          setCalendarData(res?.data || {});
        }
      } catch (err) {
        console.error("Failed to fetch calendar jobs:", err);
        if (!isCancelled) setCalendarData({});
      } finally {
        if (!isCancelled) setLoadingCalendar(false);
      }
    };

    fetchCalendar();

    return () => {
      isCancelled = true;
    };
  }, [viewMode, calendarMonthKey]);

  // Tag Styling Helper matching jobs.html
  const getTagClass = (tag = "") => {
    const value = tag.toLowerCase().trim();
    if (value === "remote") return "bg-[#d9f4a7] text-[#080830]";
    if (value === "hybrid") return "bg-[#dceeff] text-[#080830]";
    if (value === "on-site" || value === "onsite") return "bg-[#ffe3bf] text-[#080830]";
    if (value === "full-time" || value === "full time") return "bg-[#e8ddff] text-[#080830]";
    if (value === "internship") return "bg-[#f8dce8] text-[#080830]";
    if (value === "freelance") return "bg-[#e7eaec] text-[#080830]";
    return "bg-[#e7eaec] text-[#080830]";
  };

  // Check if job has expired
  const isJobExpired = (job) => {
    if (!job?.applicationDeadline) return false;
    const deadline = new Date(job.applicationDeadline);
    const now = new Date();
    return deadline.setHours(23, 59, 59, 999) < now.getTime();
  };

  // Apply Handler
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

  // Calendar Grid Calculation
  const calendarGridData = useMemo(() => {
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
    const totalDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null });
    }

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      let dayJobs = calendarData[dateStr] || [];

      if (appliedJobTypes.length > 0) {
        dayJobs = dayJobs.filter((job) =>
          appliedJobTypes.some(
            (t) => job.jobType?.toLowerCase() === t.toLowerCase()
          )
        );
      }

      if (appliedRoles.length > 0) {
        dayJobs = dayJobs.filter((job) =>
          appliedRoles.some(
            (r) =>
              job.title?.toLowerCase().includes(r.toLowerCase()) ||
              job.roleId?.roleName?.toLowerCase().includes(r.toLowerCase())
          )
        );
      }

      if (appliedCompanies.length > 0) {
        dayJobs = dayJobs.filter((job) =>
          appliedCompanies.some((c) =>
            job.companyName?.toLowerCase().includes(c.toLowerCase())
          )
        );
      }

      if (appliedWorkModes.length > 0) {
        dayJobs = dayJobs.filter((job) =>
          appliedWorkModes.some(
            (m) => job.workMode?.toLowerCase() === m.toLowerCase()
          )
        );
      }

      if (appliedExperience.length > 0) {
        dayJobs = dayJobs.filter((job) =>
          appliedExperience.some((exp) => {
            const jobExp = (job.experience || "").toLowerCase();
            const filterExp = exp.toLowerCase();
            if (filterExp === "fresher") return jobExp.includes("fresher") || jobExp.includes("0");
            if (filterExp === "0-1") return jobExp.includes("0") || jobExp.includes("1");
            if (filterExp === "1-3") return jobExp.includes("1") || jobExp.includes("2") || jobExp.includes("3");
            return jobExp.includes(filterExp);
          })
        );
      }

      // Filter out expired jobs from the calendar
      const now = new Date();
      dayJobs = dayJobs.filter((job) => {
        if (!job?.applicationDeadline) return true;
        const deadline = new Date(job.applicationDeadline);
        return deadline.setHours(23, 59, 59, 999) >= now.getTime();
      });

      // When in "for-you" tab, only show recommended jobs
      if (activeTab === "for-you") {
        const recommendedIds = new Set(jobs.map((j) => String(j._id || j.JID)));
        dayJobs = dayJobs.filter((job) =>
          recommendedIds.has(String(job._id || job.JID))
        );
      }

      days.push({
        day: d,
        dateStr,
        jobs: dayJobs,
      });
    }

    return days;
  }, [calendarYear, calendarMonth, calendarData, appliedJobTypes, appliedRoles, appliedCompanies, appliedWorkModes, appliedExperience, activeTab, jobs]);

  // Open Deadline Drawer for a Specific Date
  const openDeadlineDrawer = (dateStr, dayJobs) => {
    setSelectedDeadlineDate(dateStr);
    setSelectedDeadlineJobs(dayJobs);
    setDeadlineDrawerOpen(true);
  };

  // Open Filter Drawer - synchronizes staged state with currently applied state
  const handleOpenFilterDrawer = () => {
    setStagedSortBy(appliedSortBy);
    setStagedRoles([...appliedRoles]);
    setStagedExperience([...appliedExperience]);
    setStagedJobTypes([...appliedJobTypes]);
    setStagedWorkModes([...appliedWorkModes]);
    setStagedCompanies([...appliedCompanies]);
    setStagedCalendarMonth(calendarMonth);
    setFilterDrawerOpen(true);
  };

  // Apply Staged Filters
  const handleApplyFilters = () => {
    setAppliedSortBy(stagedSortBy);
    setAppliedRoles([...stagedRoles]);
    setAppliedExperience([...stagedExperience]);
    setAppliedJobTypes([...stagedJobTypes]);
    setAppliedWorkModes([...stagedWorkModes]);
    setAppliedCompanies([...stagedCompanies]);
    setCalendarMonth(stagedCalendarMonth);
    setPage(1);
    setFilterDrawerOpen(false);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setStagedSortBy("newest");
    setStagedRoles([]);
    setStagedExperience([]);
    setStagedJobTypes([]);
    setStagedWorkModes([]);
    setStagedCompanies([]);
    setStagedCalendarMonth(new Date().getMonth());

    setAppliedSortBy("newest");
    setAppliedRoles([]);
    setAppliedExperience([]);
    setAppliedJobTypes([]);
    setAppliedWorkModes([]);
    setAppliedCompanies([]);
    setPage(1);
    setFilterDrawerOpen(false);
  };

  const closeAllDrawers = () => {
    setFilterDrawerOpen(false);
    setDeadlineDrawerOpen(false);
  };

  const hasActiveFilters = Boolean(
    appliedRoles.length ||
    appliedExperience.length ||
    appliedJobTypes.length ||
    appliedWorkModes.length ||
    appliedCompanies.length ||
    appliedSortBy !== "newest"
  );

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div
      className={`hiring-page-container ${!isDarkMode ? "light-mode" : ""}`}
    >
      <main className="page">
        {/* =========================
             HERO HEADER
        ========================= */}
        <header className="hiring-header">
          <div className="eyebrow">
            TECHLEARN
          </div>

          <h1 className="hiring-title">
            HIRING
          </h1>

          <p className="hiring-subtitle">
            Discover opportunities worth applying for.
          </p>

          {/* SEARCH */}
          <div className="search-wrapper">
            <span className="search-icon" aria-hidden="true">
              <Search className="w-4 h-4" />
            </span>

            <input
              type="text"
              className="search-input"
              id="searchInput"
              placeholder="Search jobs, companies, roles..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </header>

        {/* =========================
             LIST / CALENDAR SWITCH
        ========================= */}
        <div className="text-center">
          <div className="content-switch">
            <button
              type="button"
              className={`switch-button ${viewMode === "list" ? "active" : ""}`}
              onClick={() => {
                setViewMode("list");
              }}
            >
              LIST
            </button>

            <button
              type="button"
              className={`switch-button ${viewMode === "calendar" ? "active" : ""}`}
              onClick={() => {
                setViewMode("calendar");
              }}
            >
              CALENDAR
            </button>
          </div>
        </div>

        {/* =========================
             CONTROLS ROW (All, For You, Filters)
        ========================= */}
        <div className="controls-row">
          <div className="filters">
            <button
              type="button"
              className={`filter-button ${activeTab === "all" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("all");
                setPage(1);
              }}
            >
              ALL
            </button>
            <button
              type="button"
              className={`filter-button ${activeTab === "for-you" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("for-you");
                setPage(1);
              }}
            >
              FOR YOU
            </button>
            <button
              type="button"
              onClick={handleOpenFilterDrawer}
              className={`filter-button flex items-center gap-1.5 ${hasActiveFilters ? "active" : ""}`}
            >
              <span>FILTERS</span>
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-current inline-block"></span>}
            </button>
          </div>
        </div>

        {/* VIEW: FOR YOU & ALL HIRING */}
        {viewMode === "list" && (
          <section id="jobsView" className="mt-8">
              {loading ? (
                <div className="text-center py-[70px] text-slate-500">
                  <p className="text-[14px]">Loading opportunities...</p>
                </div>
              ) : error ? (
                <div className="text-center py-[70px] text-red-500">
                  <p className="text-[14px] font-semibold">{error}</p>
                </div>
              ) : jobs.length === 0 ? (
                /* EMPTY STATE */
                <div className="text-center py-[70px] text-slate-500">
                  <h3
                    className={`text-[16px] font-bold mb-[7px] ${
                      isDarkMode ? "text-white" : "text-[#00113b]"
                    }`}
                  >
                    {!isAuthenticated && activeTab === "for-you"
                      ? "Personalized For You"
                      : "No matching jobs"}
                  </h3>
                  <p className="text-[12px] max-w-md mx-auto mb-4">
                    {!isAuthenticated && activeTab === "for-you"
                      ? "Log in or sign up to get personalized job opportunities tailored to your skills, target roles, and college stream!"
                      : activeTab === "for-you"
                      ? "No recommendations found. Try updating your profile or explore All Jobs."
                      : "Try changing your search or filters."}
                  </p>
                  {!isAuthenticated && activeTab === "for-you" && (
                    <Link
                      to="/signup"
                      className="inline-block px-5 py-2.5 rounded-[8px] font-['Press_Start_2P'] text-[8px] bg-[#b2e96a] text-[#0a1128] font-bold shadow-md hover:bg-[#a6e257] transition-all"
                    >
                      Sign In to Personalize
                    </Link>
                  )}
                </div>
              ) : (
                /* JOB ROWS CONTAINER */
                <div className="flex flex-col gap-[9px]">
                  {/* For guests, only show first 12 jobs; remaining are locked */}
                  {(isAuthenticated ? jobs : jobs.slice(0, 12)).map((job) => {
                    const expired = isJobExpired(job);
                    const tags = [job.workMode, job.jobType].filter(Boolean);

                    return (
                      <div
                        key={job._id || job.JID || job.id}
                        className={`grid grid-cols-1 md:grid-cols-[minmax(190px,1.1fr)_minmax(280px,1.6fr)_minmax(150px,0.75fr)_105px] items-center min-h-[108px] px-[22px] py-[18px] rounded-[14px] border transition-all duration-200 gap-4 md:gap-0 ${
                          expired
                            ? isDarkMode
                              ? "bg-[#060d1f] border-white/5 opacity-60 grayscale-[40%]"
                              : "bg-white/30 border-[#00113b]/10 opacity-60"
                            : isDarkMode
                            ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-[1px]"
                            : "bg-white/60 border-white/80 hover:bg-white hover:border-[#00113b]/20 hover:-translate-y-[1px] shadow-sm hover:shadow-md"
                        }`}
                      >
                        {/* COLUMN 1: ROLE */}
                        <div className="min-w-0 pr-2">
                          <div
                            className={`text-[15px] font-bold mb-[6px] leading-[1.35] truncate ${
                              isDarkMode ? "text-white" : "text-[#00113b]"
                            }`}
                          >
                            {job.title}
                          </div>
                          <div
                            className={`text-[11px] mb-[5px] truncate ${
                              isDarkMode ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            {job.location || "Location not specified"}
                          </div>
                          <div
                            className={`text-[10px] ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {job.experience || "Fresher"}
                          </div>
                        </div>

                        {/* COLUMN 2: COMPANY & TAGS */}
                        <div className="min-w-0 pr-2">
                          <div
                            className={`text-[15px] font-bold mb-[9px] leading-[1.35] truncate ${
                              isDarkMode ? "text-white" : "text-[#00113b]"
                            }`}
                          >
                            {job.companyName || job.company}
                          </div>
                          <div className="flex flex-wrap gap-[5px]">
                            {tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center px-[8px] py-[5px] rounded-[6px] text-[9px] font-bold whitespace-nowrap ${getTagClass(
                                  tag
                                )}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* COLUMN 3: SALARY */}
                        <div>
                          <div
                            className={`text-[16px] font-bold leading-[1.4] ${
                              isDarkMode ? "text-white" : "text-[#00113b]"
                            }`}
                          >
                            {job.salary || "Undisclosed"}
                          </div>
                          <span
                            className={`block text-[9px] font-medium mt-[3px] ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Estimated Salary/Stipend
                          </span>
                        </div>

                        {/* COLUMN 4: APPLY BUTTON */}
                        <div>
                          <button
                            onClick={(e) => handleApply(job, e)}
                            disabled={expired}
                            className={`inline-flex items-center justify-center w-full font-['Press_Start_2P'] text-[8px] leading-[1.5] border-none py-[13px] px-[10px] rounded-[8px] transition-all ${
                              expired
                                ? "bg-slate-300 dark:bg-white/10 text-slate-500 cursor-not-allowed"
                                : "bg-[#b2e96a] text-[#0a1128] hover:-translate-y-[2px] hover:shadow-[0_5px_0_rgba(0,17,59,0.15)] active:translate-y-0 active:shadow-none cursor-pointer"
                            }`}
                          >
                            {expired ? "EXPIRED" : "APPLY"}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* GUEST LOCKED OVERLAY / BANNER */}
                  {!isAuthenticated && jobs.length > 0 && (
                    <div className="mt-4 flex flex-col gap-[9px] relative">
                      {/* Blurred teaser rows */}
                      {[1, 2, 3].map((placeholderIdx) => (
                        <div
                          key={`locked-${placeholderIdx}`}
                          className={`relative select-none pointer-events-none filter blur-[4px] opacity-40 grid grid-cols-1 md:grid-cols-[minmax(190px,1.1fr)_minmax(280px,1.6fr)_minmax(150px,0.75fr)_105px] items-center min-h-[108px] px-[22px] py-[18px] rounded-[14px] border ${
                            isDarkMode
                              ? "bg-white/5 border-white/10"
                              : "bg-white/60 border-white/80"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="h-4 bg-slate-400/40 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-400/30 rounded w-1/2"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-4 bg-slate-400/40 rounded w-1/3"></div>
                            <div className="flex gap-2">
                              <div className="h-4 bg-slate-400/30 rounded w-12"></div>
                              <div className="h-4 bg-slate-400/30 rounded w-16"></div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="h-4 bg-slate-400/40 rounded w-20"></div>
                            <div className="h-3 bg-slate-400/20 rounded w-28"></div>
                          </div>
                          <div>
                            <div className="h-9 bg-[#b2e96a]/40 rounded-lg"></div>
                          </div>
                        </div>
                      ))}

                      {/* Locked CTA Overlay */}
                      <div className="my-6 p-8 rounded-[16px] text-center border relative overflow-hidden backdrop-blur-md bg-gradient-to-b from-white/80 to-white/95 dark:from-[#0b1934]/90 dark:to-[#020b23]/95 border-[#00113b]/15 dark:border-white/15 shadow-xl">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#b2e96a]/20 text-[#00113b] dark:text-[#b2e96a] mb-4 border border-[#b2e96a]/40">
                          <Lock className="w-6 h-6" />
                        </div>
                        <h3
                          className={`font-['Press_Start_2P'] text-[13px] sm:text-[15px] mb-3 leading-relaxed ${
                            isDarkMode ? "text-white" : "text-[#00113b]"
                          }`}
                        >
                          Unlock All Opportunities
                        </h3>
                        <p
                          className={`max-w-md mx-auto text-[13px] mb-6 ${
                            isDarkMode ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          You are viewing a preview of 12 jobs. Create a free account or log in to explore all hiring opportunities, deadline calendar, and personalized recommendations!
                        </p>
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                          <Link
                            to="/signup"
                            className="px-6 py-3 rounded-[10px] font-['Press_Start_2P'] text-[9px] bg-[#b2e96a] text-[#0a1128] font-bold hover:bg-[#a6e257] transition-all shadow-md active:scale-95"
                          >
                            Sign Up Free
                          </Link>
                          <Link
                            to="/signup"
                            className={`px-6 py-3 rounded-[10px] font-['Press_Start_2P'] text-[9px] border font-bold transition-all active:scale-95 ${
                              isDarkMode
                                ? "border-white/20 text-white hover:bg-white/10"
                                : "border-[#00113b]/20 text-[#00113b] hover:bg-[#00113b]/5"
                            }`}
                          >
                            Log In
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* VIEW: CALENDAR */}
          {viewMode === "calendar" && (
            <section id="calendarView" className="mt-8">
              {/* CALENDAR GRID */}
              <div className="grid grid-cols-7 gap-[6px]">
                {weekdays.map((day) => (
                  <div
                    key={day}
                    className={`text-center text-[10px] font-bold py-[7px] ${
                      isDarkMode ? "text-slate-400" : "text-[#00113b]/70"
                    }`}
                  >
                    {day}
                  </div>
                ))}

                {loadingCalendar ? (
                  <div className="col-span-7 py-20 text-center text-sm text-slate-500">
                    Loading calendar deadlines...
                  </div>
                ) : (
                  calendarGridData.map((cell, idx) => {
                    if (!cell.day) {
                      return (
                        <div
                          key={`empty-${idx}`}
                          className="min-h-[96px] bg-transparent border border-transparent rounded-[10px]"
                        />
                      );
                    }

                    const hasJobs = cell.jobs.length > 0;

                    return (
                      <div
                        key={cell.dateStr}
                        onClick={() => {
                          if (hasJobs) openDeadlineDrawer(cell.dateStr, cell.jobs);
                        }}
                        className={`min-h-[96px] rounded-[10px] p-[9px] relative transition-all border ${
                          hasJobs ? "cursor-pointer" : "cursor-default"
                        } ${
                          isDarkMode
                            ? "bg-white/5 border-white/5"
                            : "bg-white/60 border-white/80"
                        }`}
                      >
                        <div
                          className={`text-[11px] font-bold ${
                            isDarkMode ? "text-white" : "text-[#00113b]"
                          }`}
                        >
                          {cell.day}
                        </div>

                        {cell.jobs.slice(0, 2).map((job, jIdx) => (
                          <div
                            key={jIdx}
                            className="mt-[7px] p-[5px] rounded-[6px] bg-[#b2e96a]/75 border border-[#9ed644]/40 overflow-hidden shadow-xs"
                          >
                            <span className="block text-[8px] font-extrabold whitespace-nowrap overflow-hidden text-ellipsis text-[#00113b]">
                              {job.companyName || job.company}
                            </span>
                            <span className="block text-[7.5px] text-[#00113b]/80 whitespace-nowrap overflow-hidden text-ellipsis mt-[1px]">
                              {job.title}
                            </span>
                          </div>
                        ))}

                        {hasJobs && (
                          <span className="absolute bottom-[7px] right-[7px] w-[6px] h-[6px] rounded-full bg-[#00113b] dark:bg-[#b2e96a] shadow-xs" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}
      </main>

      {/* OVERLAY */}
      <div
        onClick={closeAllDrawers}
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-[150] transition-opacity duration-250 ${
          filterDrawerOpen || deadlineDrawerOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      />

      {/* FILTER DRAWER */}
      <aside
        style={{ backgroundColor: "var(--page-bg)" }}
        className={`fixed right-0 top-0 bottom-0 w-[390px] max-w-[90%] z-[160] transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${
          isDarkMode ? "text-white" : "text-[#00113b]"
        } ${filterDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-[22px] flex justify-between items-center border-b border-black/10 dark:border-white/10">
          <h3 className="font-['Press_Start_2P'] text-[11px] leading-[1.6]">Filters</h3>
          <button
            onClick={() => setFilterDrawerOpen(false)}
            className="w-[32px] h-[32px] border-none bg-white/60 dark:bg-white/10 text-[#00113b] dark:text-white rounded-[7px] text-[18px] cursor-pointer flex items-center justify-center shadow-xs"
          >
            ×
          </button>
        </div>

        <div className="p-[22px] overflow-y-auto flex-1 space-y-[27px]">
          {/* SORT BY SECTION */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[1px] font-bold mb-[11px]">Sort by</h4>
            <div className="space-y-[8px]">
              {[
                { id: "newest", label: "Newest" },
                { id: "salary", label: "Highest salary" },
                { id: "company", label: "Company A–Z" },
              ].map((sortOption) => (
                <label key={sortOption.id} className="flex items-center gap-[9px] py-[4px] text-[12px] text-[#00113b]/80 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="sortBy"
                    value={sortOption.id}
                    checked={stagedSortBy === sortOption.id}
                    onChange={(e) => setStagedSortBy(e.target.value)}
                    className="accent-[#00113b] dark:accent-[#b2e96a]"
                  />
                  {sortOption.label}
                </label>
              ))}
            </div>
          </div>

          {/* CALENDAR MONTH SECTION */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[1px] font-bold mb-[11px]">Month & Year</h4>
            <div className="relative w-full">
              <select
                value={stagedCalendarMonth}
                onChange={(e) => setStagedCalendarMonth(parseInt(e.target.value, 10))}
                className={`w-full ${
                  isDarkMode
                    ? "h-[34px] pl-[14px] pr-[36px] rounded-[9999px] text-[11px] font-semibold cursor-pointer border border-white/20 bg-[#112347] text-white hover:bg-[#162d59] appearance-none outline-none transition-colors"
                    : "tool-select w-full pr-[36px] appearance-none"
                }`}
              >
                <option value={0} className={isDarkMode ? "bg-[#0b1934] text-white" : ""}>Jan {calendarYear}</option>
                <option value={1} className={isDarkMode ? "bg-[#0b1934] text-white" : ""}>Feb {calendarYear}</option>
                <option value={2} className={isDarkMode ? "bg-[#0b1934] text-white" : ""}>Mar {calendarYear}</option>
                <option value={3} className={isDarkMode ? "bg-[#0b1934] text-white" : ""}>Apr {calendarYear}</option>
                <option value={4} className={isDarkMode ? "bg-[#0b1934] text-white" : ""}>May {calendarYear}</option>
                <option value={5} className={isDarkMode ? "bg-[#0b1934] text-white" : ""}>Jun {calendarYear}</option>
                <option value={6} className={isDarkMode ? "bg-[#0b1934] text-white" : ""}>Jul {calendarYear}</option>
                <option value={7} className={isDarkMode ? "bg-[#0b1934] text-white" : ""}>Aug {calendarYear}</option>
                <option value={8} className={isDarkMode ? "bg-[#0b1934] text-white" : ""}>Sep {calendarYear}</option>
                <option value={9} className={isDarkMode ? "bg-[#0b1934] text-white" : ""}>Oct {calendarYear}</option>
                <option value={10} className={isDarkMode ? "bg-[#0b1934] text-white" : ""}>Nov {calendarYear}</option>
                <option value={11} className={isDarkMode ? "bg-[#0b1934] text-white" : ""}>Dec {calendarYear}</option>
              </select>
              <div className="absolute right-[14px] top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-300">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* ROLE SECTION */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[1px] font-bold mb-[11px]">Role</h4>
            {availableFilters.roles.map((r) => (
              <label key={r} className="flex items-center gap-[9px] py-[7px] text-[12px] text-[#00113b]/80 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stagedRoles.includes(r)}
                  onChange={(e) => {
                    if (e.target.checked) setStagedRoles([...stagedRoles, r]);
                    else setStagedRoles(stagedRoles.filter((item) => item !== r));
                  }}
                  className="accent-[#00113b] dark:accent-[#b2e96a]"
                />
                {r}
              </label>
            ))}
          </div>

          {/* EXPERIENCE SECTION */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[1px] font-bold mb-[11px]">Experience</h4>
            {[
              { id: "Fresher", label: "Fresher" },
              { id: "0-1", label: "0–1 years" },
              { id: "1-3", label: "1–3 years" },
            ].map((exp) => (
              <label key={exp.id} className="flex items-center gap-[9px] py-[7px] text-[12px] text-[#00113b]/80 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stagedExperience.includes(exp.id)}
                  onChange={(e) => {
                    if (e.target.checked) setStagedExperience([...stagedExperience, exp.id]);
                    else setStagedExperience(stagedExperience.filter((item) => item !== exp.id));
                  }}
                  className="accent-[#00113b] dark:accent-[#b2e96a]"
                />
                {exp.label}
              </label>
            ))}
          </div>

          {/* JOB TYPE SECTION */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[1px] font-bold mb-[11px]">Job type</h4>
            {["Full-time", "Internship", "Freelance"].map((jt) => (
              <label key={jt} className="flex items-center gap-[9px] py-[7px] text-[12px] text-[#00113b]/80 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stagedJobTypes.includes(jt)}
                  onChange={(e) => {
                    if (e.target.checked) setStagedJobTypes([...stagedJobTypes, jt]);
                    else setStagedJobTypes(stagedJobTypes.filter((item) => item !== jt));
                  }}
                  className="accent-[#00113b] dark:accent-[#b2e96a]"
                />
                {jt}
              </label>
            ))}
          </div>

          {/* WORK MODE SECTION */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[1px] font-bold mb-[11px]">Work mode</h4>
            {["Remote", "Hybrid", "On-site"].map((wm) => (
              <label key={wm} className="flex items-center gap-[9px] py-[7px] text-[12px] text-[#00113b]/80 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stagedWorkModes.includes(wm)}
                  onChange={(e) => {
                    if (e.target.checked) setStagedWorkModes([...stagedWorkModes, wm]);
                    else setStagedWorkModes(stagedWorkModes.filter((item) => item !== wm));
                  }}
                  className="accent-[#00113b] dark:accent-[#b2e96a]"
                />
                {wm}
              </label>
            ))}
          </div>

          {/* COMPANY SECTION */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[1px] font-bold mb-[11px]">Company</h4>
            {availableFilters.companies.map((comp) => (
              <label key={comp} className="flex items-center gap-[9px] py-[7px] text-[12px] text-[#00113b]/80 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stagedCompanies.includes(comp)}
                  onChange={(e) => {
                    if (e.target.checked) setStagedCompanies([...stagedCompanies, comp]);
                    else setStagedCompanies(stagedCompanies.filter((item) => item !== comp));
                  }}
                  className="accent-[#00113b] dark:accent-[#b2e96a]"
                />
                {comp}
              </label>
            ))}
          </div>
        </div>

        <div className="p-[16px_22px] border-t border-black/10 dark:border-white/10 flex gap-[8px]">
          <button
            onClick={handleClearFilters}
            className="flex-1 h-[42px] rounded-[8px] text-[11px] font-bold cursor-pointer bg-white/70 dark:bg-transparent border border-black/15 dark:border-white/10 text-[#00113b] dark:text-white hover:bg-white"
          >
            Clear
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex-1 h-[42px] rounded-[8px] text-[11px] font-bold cursor-pointer bg-[#b2e96a] text-[#0a1128] border border-[#b2e96a]/50 shadow-md hover:bg-[#a6e257] active:scale-[0.98] transition-all"
          >
            Apply filters
          </button>
        </div>
      </aside>

      {/* DEADLINE DRAWER */}
      <aside
        style={{ backgroundColor: "var(--page-bg)" }}
        className={`fixed right-0 top-0 bottom-0 w-[410px] max-w-[92%] z-[160] transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${
          isDarkMode ? "text-white" : "text-[#00113b]"
        } ${deadlineDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-[22px] flex justify-between items-center border-b border-black/10 dark:border-white/10">
          <h3 className="font-['Press_Start_2P'] text-[11px] leading-[1.6]">
            {selectedDeadlineDate
              ? new Date(selectedDeadlineDate + "T00:00:00").toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Job deadlines"}
          </h3>
          <button
            onClick={() => setDeadlineDrawerOpen(false)}
            className="w-[32px] h-[32px] border-none bg-white/60 dark:bg-white/10 text-[#00113b] dark:text-white rounded-[7px] text-[18px] cursor-pointer flex items-center justify-center shadow-xs"
          >
            ×
          </button>
        </div>

        <div className="p-[20px] overflow-y-auto flex-1 space-y-[9px]">
          {selectedDeadlineJobs.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500">
              No deadlines on this date.
            </div>
          ) : (
            selectedDeadlineJobs.map((job, idx) => (
              <div
                key={job._id || job.JID || idx}
                className="bg-white/80 dark:bg-white/5 border border-white/90 dark:border-white/10 rounded-[12px] p-[16px] shadow-sm"
              >
                <div className="text-[12px] font-bold text-[#00113b] dark:text-white mb-[5px]">
                  {job.companyName || job.company}
                </div>
                <div className="text-[15px] font-bold text-[#00113b] dark:text-white mb-[8px]">
                  {job.title}
                </div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 mb-[13px]">
                  {job.location || "India"} · {job.experience || "Fresher"}
                  <br />
                  Deadline:{" "}
                  {new Date(selectedDeadlineDate + "T00:00:00").toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <button
                  onClick={(e) => handleApply(job, e)}
                  className="inline-flex items-center justify-center w-full h-[38px] bg-[#b5e959] text-[#00113b] font-['Press_Start_2P'] text-[7px] rounded-[7px] cursor-pointer hover:opacity-90 shadow-sm"
                >
                  APPLY
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
