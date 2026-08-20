import React, { useMemo, useState } from "react";
import { FiSearch, FiSliders, FiChevronDown, FiMapPin } from "react-icons/fi";
import {
  BriefcaseBusiness,
  CalendarDays,
} from "lucide-react";
import Sidebar from "../components/Dashboard/Sidebar";
import { useTheme } from "../context/ThemeContext";

const mockJobs = [
  {
    id: "1",
    title: "Frontend Developer",
    company: "Razorpay",
    location: "Bengaluru, India",
    experience: "1–3 yrs",
    jobType: "Full-time",
    workMode: "Hybrid",
    salary: "₹10–18 LPA",
    category: "Jobs",
    posted: "2 days ago",
    skills: ["React", "JavaScript", "CSS"],
  },
  {
    id: "2",
    title: "Software Engineer",
    company: "Google",
    location: "Bengaluru, India",
    experience: "0–2 yrs",
    jobType: "Full-time",
    workMode: "Hybrid",
    salary: "₹12–20 LPA",
    category: "Jobs",
    posted: "3 days ago",
    skills: ["Python", "Java", "DSA"],
  },
  {
    id: "3",
    title: "Machine Learning Intern",
    company: "Microsoft",
    location: "Hyderabad, India",
    experience: "Fresher",
    jobType: "Internship",
    workMode: "On-site",
    salary: "₹40K–60K/month",
    category: "Internships",
    posted: "5 days ago",
    skills: ["Python", "Machine Learning", "SQL"],
  },
  {
    id: "4",
    title: "Data Analyst",
    company: "Deloitte",
    location: "Gurugram, India",
    experience: "0–2 yrs",
    jobType: "Full-time",
    workMode: "Hybrid",
    salary: "₹6–10 LPA",
    category: "Jobs",
    posted: "1 week ago",
    skills: ["SQL", "Excel", "Power BI"],
  },
  {
    id: "5",
    title: "UI/UX Designer",
    company: "Infosys",
    location: "Pune, India",
    experience: "1–3 yrs",
    jobType: "Freelance",
    workMode: "Remote",
    salary: "₹50K–80K/project",
    category: "Freelance",
    posted: "1 week ago",
    skills: ["Figma", "UI Design", "UX"],
  },
];

export default function Jobs() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const [activeTab, setActiveTab] = useState("For You");
  const [activeCategory, setActiveCategory] = useState("Jobs");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Newest");

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return mockJobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query) ||
        job.skills.some((skill) =>
          skill.toLowerCase().includes(query)
        );

      const matchesCategory =
        activeCategory === "All" || job.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

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
    onChange={(e) => setSearchQuery(e.target.value)}
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
                onClick={() => setActiveTab(tab)}
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

          {activeTab === "Calendar" ? (
            <div
              className={`rounded-2xl border p-10 text-center ${
                isDarkMode
                  ? "bg-[#0b1934] border-white/10"
                  : "bg-white border-slate-200"
              }`}
            >
              <CalendarDays className="w-10 h-10 mx-auto mb-4 text-[#8bcf2c]" />

              <h2 className="text-lg font-semibold">
                Job Calendar
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Your saved job deadlines and upcoming opportunities
                will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Category + Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

                <div className="flex items-center gap-2 flex-wrap">
                  {["Jobs", "Internships", "Freelance"].map(
                    (category) => (
                      <button
                        key={category}
                        onClick={() =>
                          setActiveCategory(category)
                        }
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
                    )
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className={`h-9 px-3 rounded-lg flex items-center gap-2 text-xs font-semibold border ${
                      isDarkMode
                        ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <FiSliders className="w-3.5 h-3.5" />
                    Filters
                  </button>

                  <button
                    onClick={() =>
                      setSortBy(
                        sortBy === "Newest" ? "Oldest" : "Newest"
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

              {/* Results */}
              <div className="space-y-4">
                {filteredJobs.length === 0 ? (
                  <div
                    className={`rounded-2xl border p-12 text-center ${
                      isDarkMode
                        ? "bg-[#0b1934] border-white/10"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <BriefcaseBusiness className="w-9 h-9 mx-auto mb-3 text-slate-400" />
                    <p className="font-semibold">
                      No jobs found
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Try changing your search or category.
                    </p>
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <article
  key={job.id}
  className={`rounded-2xl border px-6 py-5 transition-all ${
    isDarkMode
      ? "bg-[#0b1934] border-white/10 hover:border-[#a8e63d]/30"
      : "bg-[#d9e8ef] border-[#c0d5e0] hover:border-[#a8e63d]/50 shadow-sm"
  }`}
>
  <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1.1fr_0.8fr_auto] gap-4 lg:gap-6 items-center">

    {/* Job */}
    <div className="min-w-0">
      <h2
        className={`text-base sm:text-lg font-bold ${
          isDarkMode ? "text-white" : "text-[#17251a]"
        }`}
      >
        {job.title}
      </h2>

      <div
  className={`mt-0.5 text-xs ${
    isDarkMode ? "text-slate-300" : "text-slate-600"
  }`}
>
  {job.location}
</div>

     <p className="text-[11px] text-slate-400 mt-0.5">
        {job.experience}
     </p>
    </div>

    {/* Company + Type */}
    <div>
      <p
        className={`text-sm font-bold ${
          isDarkMode ? "text-white" : "text-[#17251a]"
        }`}
      >
        {job.company}
      </p>

      <div className="flex flex-wrap gap-3 mt-2">
        <span
          className={`px-2 py-1 rounded-md text-[10px] font-semibold ${
            isDarkMode
              ? "bg-[#a3e635]/15 text-[#a3e635]"
              : "bg-[#eaf7d5] text-[#5e8d20]"
          }`}
        >
          {job.workMode}
        </span>

        <span
          className={`px-2 py-1 rounded-md text-[10px] font-semibold ${
            isDarkMode
              ? "bg-purple-500/15 text-purple-300"
              : "bg-purple-100 text-purple-600"
          }`}
        >
          {job.jobType}
        </span>
      </div>
    </div>

    {/* Salary */}
    <div>
      <p
        className={`text-sm sm:text-base font-bold ${
          isDarkMode ? "text-white" : "text-[#17251a]"
        }`}
      >
        {job.salary}
      </p>

      <p className="text-[10px] text-slate-400 mt-1">
        Estimated Salary/Stipend
      </p>
    </div>

    {/* Apply */}
    <div className="lg:text-right">
     <button
  className="min-w-[92px] px-5 py-2.5 rounded-xl bg-[#b5e959] text-[#00113b] text-[10px] font-['Press_Start_2P'] hover:bg-[#a8dc4d] transition-colors"
>
  APPLY
</button>
    </div>

  </div>
</article>
                      
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}