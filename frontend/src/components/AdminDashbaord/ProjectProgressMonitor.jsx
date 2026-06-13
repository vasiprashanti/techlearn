import React, { useState, useEffect } from "react";
import { adminAPI } from "../../services/adminApi";
import { FiUsers, FiClock, FiSearch, FiCalendar, FiVideo, FiActivity, FiBook } from "react-icons/fi";

export default function ProjectProgressMonitor({ projectId }) {
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (projectId) {
      fetchProgress();
    }
  }, [projectId]);

  const fetchProgress = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminAPI.getProjectProgress(projectId);
      setProgressData(data || []);
    } catch (err) {
      console.error("Fetch Progress Error:", err);
      setError(err.message || "Failed to load project progress records.");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = progressData.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.batch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      case "Current":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse";
      case "Locked":
      default:
        return "bg-slate-500/5 text-slate-400 border border-black/5 dark:border-white/5";
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
      case "Current":
        return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
      case "Locked":
      default:
        return "bg-slate-400 dark:bg-slate-600";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
        <span className="text-xs font-semibold">Loading progress records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-6 rounded-2xl text-xs font-semibold max-w-xl mx-auto text-center space-y-2">
        <p className="text-sm font-bold">Error Loading Progress</p>
        <p>{error}</p>
        <button onClick={fetchProgress} className="mt-2 bg-rose-500 text-white px-3 py-1.5 rounded-xl hover:bg-rose-600 transition">
          Retry
        </button>
      </div>
    );
  }

  // Graceful empty states if no tasks exist in progress records (all students have totalDays = 0)
  const isProjectEmpty = progressData.length > 0 && progressData[0].totalDays === 0;

  return (
    <div className="space-y-6">
      
      {/* Top Filter Row */}
      <div className="bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 p-4 rounded-2xl shadow-[0_4px_18px_rgba(0,0,0,0.015)]">
        {/* Search Input */}
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name or batch..."
            className="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Main Stacked View */}
      {progressData.length === 0 ? (
        <div className="bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-2xl p-16 text-center text-slate-400 shadow-[0_4px_24px_rgba(0,0,0,0.015)] space-y-2">
          <FiUsers className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-bold text-slate-700 dark:text-white">No Assigned Students</p>
          <p className="text-xs max-w-sm mx-auto text-slate-400">
            There are currently no students assigned to this project. Navigate to the **Students** tab above to assign students.
          </p>
        </div>
      ) : isProjectEmpty ? (
        <div className="bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-2xl p-16 text-center text-slate-400 shadow-[0_4px_24px_rgba(0,0,0,0.015)] space-y-2">
          <FiBook className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-bold text-slate-700 dark:text-white">No Days Formulated</p>
          <p className="text-xs max-w-sm mx-auto text-slate-400">
            This project has no active duration days configured yet. Configure days under the **Days & Tasks** tab first.
          </p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-2xl p-12 text-center text-slate-400 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
          <p className="text-xs font-semibold">No progress records matches your query &ldquo;{searchQuery}&rdquo;</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredData.map((student) => (
            <div
              key={student.studentId}
              className="bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-2xl p-5 shadow-[0_4px_18px_rgba(0,0,0,0.015)] space-y-4 hover:shadow-md hover:border-blue-500/25 transition-all"
            >
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
                    {student.name}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Batch: {student.batch}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold">
                    {student.xp} XP
                  </span>
                  <div className="text-[10px] font-bold text-slate-400 mt-1">
                    Progress: <span className="text-blue-500">{student.progressPercentage}%</span>
                  </div>
                </div>
              </div>

              {/* Status and Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <FiActivity className="text-blue-500" />
                    Day Tracker
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 font-extrabold">
                    Day {student.currentDay}/{student.totalDays}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-black/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${student.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Day Pills horizontal map */}
              <div className="space-y-2">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Timeline Map
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {student.dayStatuses.map((day) => (
                    <div
                      key={day.dayNumber}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold ${getStatusBadge(
                        day.status
                      )}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${getStatusDot(day.status)}`} />
                      <span>
                        Day {day.dayNumber}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
