import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { adminAPI } from "../../services/adminApi";
import { FiSearch, FiUserPlus, FiUserMinus, FiCheckSquare, FiAlertCircle, FiFilter } from "react-icons/fi";

export default function StudentAssignmentPanel({ projectId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batches, setBatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

  const [assignments, setAssignments] = useState([]);
  const [assignmentFeedback, setAssignmentFeedback] = useState(null);
  const [cohortStatusFilter, setCohortStatusFilter] = useState("All");
  const [progressFilter, setProgressFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");
  const [health, setHealth] = useState({ studentsAssigned: 0, studentsStarted: 0, studentsActiveToday: 0, studentsCompleted: 0, averageProgress: 0, averageXp: 0, studentsBehindSchedule: 0 });
  
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);

  useEffect(() => {
    if (projectId) {
      fetchAssignments();
      fetchAssignmentHealth();
      adminAPI.getBatches().then((data) => setBatches(data || [])).catch(() => setBatches([]));
    }
  }, [projectId]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getAssignedStudents(projectId);
      const activeAssignments = (data || []).filter(assignment => assignment.status !== "Archived");
      setAssignments(activeAssignments);
    } catch (err) {
      setError(err.message || "Failed to load assigned students.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentHealth = async () => {
    try {
      const data = await adminAPI.getProjectAssignmentHealth(projectId);
      setHealth((current) => ({ ...current, ...data }));
    } catch (err) {
      console.error("Failed to load project assignment health:", err);
    }
  };

  const runSearch = async (query = searchQuery, batchId = selectedBatchId) => {
    if (!query.trim() && !batchId) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    setError("");
    try {
      const data = await adminAPI.searchStudents(projectId, query.trim(), batchId);
      setSearchResults(data || []);
      setSelectedStudentIds(new Set());
    } catch (err) {
      setError(err.message || "Failed to query students database.");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => runSearch(), 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedBatchId]);

  const handleSearch = async (e) => {
    e.preventDefault();
    runSearch();
  };

  const handleToggleStudent = (studentId) => {
    const next = new Set(selectedStudentIds);
    if (next.has(studentId)) {
      next.delete(studentId);
    } else {
      next.add(studentId);
    }
    setSelectedStudentIds(next);
  };

  const handleToggleAll = () => {
    if (selectedStudentIds.size === searchResults.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(searchResults.map(s => s._id)));
    }
  };

  const handleAssignSelected = async () => {
    if (selectedStudentIds.size === 0) return;

    setError("");
    setSuccess("");
    setAssignmentFeedback(null);

    try {
      const studentIds = Array.from(selectedStudentIds);
      const res = await adminAPI.assignStudents(projectId, studentIds);
      
      if (res.success) {
        setSuccess(res.message);
        setTimeout(() => setSuccess(""), 4000);
        setAssignmentFeedback({
          assigned: res.assigned || [],
          skipped: res.skipped || []
        });

        // Clear search inputs and results
        setSearchQuery("");
        setSearchResults([]);
        setSelectedStudentIds(new Set());

        // Refresh list
        fetchAssignments();
        fetchAssignmentHealth();
      }
    } catch (err) {
      setError(err.message || "Failed to assign students to project.");
    }
  };

  const handleRemoveClick = (studentId, studentName) => {
    setStudentToRemove({ id: studentId, name: studentName });
    setShowRemoveConfirm(true);
  };

  const confirmRemoveStudent = async () => {
    if (!studentToRemove) return;

    setError("");
    setSuccess("");
    try {
      await adminAPI.removeStudent(projectId, studentToRemove.id);
      setSuccess(`${studentToRemove.name} removed from project successfully.`);
      setShowRemoveConfirm(false);
      setStudentToRemove(null);
      fetchAssignments();
      fetchAssignmentHealth();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to remove student.");
      setShowRemoveConfirm(false);
      setStudentToRemove(null);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold";
      case "Completed":
        return "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 font-semibold";
      case "Archived":
        return "bg-slate-100 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400 font-semibold";
      default:
        return "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300 font-semibold";
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const status = assignment.progress_percentage === 0 && assignment.status === "Active" ? "Not Started" : assignment.status;
    const statusMatches = cohortStatusFilter === "All" || status === cohortStatusFilter;
    const batchMatches = batchFilter === "All" || assignment.batch === batchFilter;
    const progress = assignment.progress_percentage || 0;
    const progressMatches = progressFilter === "All" ||
      (progressFilter === "0%" && progress === 0) ||
      (progressFilter === "1-25%" && progress >= 1 && progress <= 25) ||
      (progressFilter === "26-50%" && progress >= 26 && progress <= 50) ||
      (progressFilter === "51-75%" && progress >= 51 && progress <= 75) ||
      (progressFilter === "76%+" && progress >= 76);
    return statusMatches && batchMatches && progressMatches;
  });

  return (
    <div className="space-y-6">
      
      {/* Alert Notifications */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <FiCheckSquare className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {[
          ["Students Assigned", health.studentsAssigned],
          ["Students Started", health.studentsStarted],
          ["Active Today", health.studentsActiveToday],
          ["Completed", health.studentsCompleted],
          ["Average Progress", `${health.averageProgress}%`],
          ["Average XP", health.averageXp],
          ["Behind Schedule", health.studentsBehindSchedule],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/40 bg-white p-3 shadow-[0_4px_18px_rgba(0,0,0,0.015)] dark:border-white/5 dark:bg-[#0f274f]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1.5 text-lg font-bold text-[#0c1833] dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Assignment Feedback Report Summary Modal / Alert */}
      {assignmentFeedback && (
        <div className="bg-slate-50/80 dark:bg-[#0f1f43]/40 border border-black/5 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
            <h5 className="text-xs font-extrabold text-[#0c1833] dark:text-white uppercase tracking-wider">
              Assignment Summary Report
            </h5>
            <button 
              onClick={() => setAssignmentFeedback(null)} 
              className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition"
            >
              Dismiss Report &times;
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Assigned list */}
            <div className="space-y-2">
              <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                Assigned Students ({assignmentFeedback.assigned.length})
              </p>
              {assignmentFeedback.assigned.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic bg-black/5 dark:bg-white/5 p-3 rounded-xl">No students assigned in this run.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {assignmentFeedback.assigned.map(s => (
                    <span key={s.studentId} className="inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold rounded-lg">
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Skipped list */}
            <div className="space-y-2">
              <p className="font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                Skipped Students ({assignmentFeedback.skipped.length})
              </p>
              {assignmentFeedback.skipped.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic bg-black/5 dark:bg-white/5 p-3 rounded-xl">No students skipped.</p>
              ) : (
                <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                  {assignmentFeedback.skipped.map(s => (
                    <div key={s.studentId} className="flex items-center justify-between gap-2 p-2 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 rounded-xl text-[10px]">
                      <span className="font-bold text-slate-800 dark:text-white">{s.name}</span>
                      <span className="text-rose-500/90 font-medium">{s.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Stacked Sections */}
      <div className="space-y-6">
        
        {/* Top Section: Assignment Controls / Search */}
        <div className="bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-2xl p-5 shadow-[0_4px_18px_rgba(0,0,0,0.015)] space-y-4">
          <h4 className="text-xs font-bold text-[#0c1833] dark:text-white uppercase tracking-wider border-b border-black/5 dark:border-white/5 pb-3">
            Assign Students
          </h4>

          {/* Search Input Box */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                }}
                placeholder="Search by name, email, batch, or roll number..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
            <select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} className="rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 outline-none dark:border-white/15 dark:bg-[#0f1f43] dark:text-white">
              <option value="">All batches</option>
              {batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.name}</option>)}
            </select>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
            >
              Search
            </button>
          </form>

          {/* Search Results Display with Multi-Select checkbox list */}
          {searching ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                <span>Results ({searchResults.length})</span>
                <button type="button" onClick={handleToggleAll} className="hover:text-blue-500 text-[10px] font-bold transition">
                  {selectedStudentIds.size === searchResults.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {searchResults.map(student => (
                  <label
                    key={student._id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-black/15 hover:bg-slate-50 dark:hover:bg-black/25 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.has(student._id)}
                      onChange={() => handleToggleStudent(student._id)}
                      className="rounded border-black/10 dark:border-white/20 text-blue-600 focus:ring-blue-500/20"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{student.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{student.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {student.rollNo && (
                          <span className="text-[9px] font-semibold bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">
                            Roll: {student.rollNo}
                          </span>
                        )}
                        {student.batchId?.name && (
                          <span className="text-[9px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 px-1.5 py-0.5 rounded">
                            Batch: {student.batchId.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : searchQuery.trim() && !searching ? (
            <p className="text-center py-6 text-xs text-slate-400 font-medium">
              No matching students found (or they are already assigned).
            </p>
          ) : null}

          {/* Action trigger button */}
          <div className="pt-4 border-t border-black/5 dark:border-white/5 w-full flex justify-end">
            <button
              onClick={handleAssignSelected}
              disabled={selectedStudentIds.size === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <FiUserPlus className="w-4 h-4" />
              Assign {selectedStudentIds.size > 0 ? `(${selectedStudentIds.size})` : "Checked"} Students
            </button>
          </div>
        </div>

        {/* Bottom Section: Assigned Students Table */}
        <div className="bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-2xl p-5 shadow-[0_4px_18px_rgba(0,0,0,0.015)] min-h-[300px]">
          <div className="flex flex-col gap-3 border-b border-black/5 dark:border-white/5 pb-3 mb-4 lg:flex-row lg:items-center lg:justify-between">
            <h4 className="text-xs font-bold text-[#0c1833] dark:text-white uppercase tracking-wider">Assigned Cohort ({filteredAssignments.length})</h4>
            <div className="flex flex-wrap items-center gap-2">
              <FiFilter className="text-slate-400" />
              <select value={cohortStatusFilter} onChange={(e) => setCohortStatusFilter(e.target.value)} className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-600 dark:border-white/15 dark:bg-[#0f1f43] dark:text-white"><option>All</option><option>Not Started</option><option>Active</option><option>Completed</option></select>
              <select value={progressFilter} onChange={(e) => setProgressFilter(e.target.value)} className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-600 dark:border-white/15 dark:bg-[#0f1f43] dark:text-white"><option>All</option><option>0%</option><option>1-25%</option><option>26-50%</option><option>51-75%</option><option>76%+</option></select>
              <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-600 dark:border-white/15 dark:bg-[#0f1f43] dark:text-white"><option>All</option>{[...new Set(assignments.map((assignment) => assignment.batch))].map((batch) => <option key={batch}>{batch}</option>)}</select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">
              No students currently assigned to this project. Use the panel above to assign students.
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 text-left">Student Name</th>
                    <th className="py-3 px-4 text-left">Batch</th>
                    <th className="py-3 px-4 text-center">Current Day</th>
                    <th className="py-3 px-4 text-center">Progress</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-left">Assigned Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment._id} className="border-b border-black/5 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-black/5 transition-colors">
                      <td className="py-4 px-4 text-left">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{assignment.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{assignment.email}</p>
                      </td>
                      <td className="py-4 px-4 text-left text-slate-600 dark:text-slate-300 font-semibold">{assignment.batch}</td>
                      <td className="py-4 px-4 text-center font-bold text-slate-800 dark:text-white">{assignment.current_day}</td>
                      <td className="py-4 px-4 text-center font-bold text-slate-800 dark:text-white">
                        <span className="text-blue-500 font-extrabold">{assignment.progress_percentage}%</span>
                        <p className="mt-1 text-[9px] font-semibold text-slate-400">{assignment.xp_earned || 0} XP</p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] ${getStatusStyle(assignment.status)}`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-left text-slate-400 font-semibold">
                        {new Date(assignment.assigned_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {assignment.status === "Active" ? (
                          <button
                            onClick={() => handleRemoveClick(assignment.studentId, assignment.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition inline-flex items-center justify-center"
                            title="Remove Student"
                          >
                            <FiUserMinus className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Remove Student Confirmation Modal */}
      {showRemoveConfirm && studentToRemove && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => { setShowRemoveConfirm(false); setStudentToRemove(null); }} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden p-6 space-y-4 animate-fadeIn">
            <h2 className="text-lg font-semibold text-rose-500 dark:text-rose-400">Remove Student?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to remove <strong className="text-slate-800 dark:text-white">{studentToRemove.name}</strong> from this project? This will archive their assignment status but preserve completion logs.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
              <button 
                onClick={() => { setShowRemoveConfirm(false); setStudentToRemove(null); }} 
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRemoveStudent} 
                className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white transition shadow-sm"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
