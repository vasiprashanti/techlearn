import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { adminAPI } from "../../services/adminApi";
import MarkdownContent from "../../pages/Learn/MarkdownContent";
import { FiSave, FiUpload, FiTrash2, FiBookOpen, FiDownload, FiCheckSquare, FiEye, FiX, FiList } from "react-icons/fi";

const parseTasksFromMarkdown = (markdown) => {
  if (!markdown || typeof markdown !== "string") return [];
  const rawSections = markdown.split(/(?:\r?\n|^)\s*(?:---|[*]{3,}|_{3,})\s*(?:\r?\n|$)/);
  return rawSections
    .map((section) => section.trim())
    .filter((section) => section.length > 0);
};

export default function DayConfiguration({ dayId, dayNumber, onSave, onDeleteDay, deletingDay = false }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [topicTitle, setTopicTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [notesMarkdown, setNotesMarkdown] = useState("");

  const [tasksMarkdown, setTasksMarkdown] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isSavingTask, setIsSavingTask] = useState(false);

  const [studentsHaveStarted, setStudentsHaveStarted] = useState(false);
  const [pendingNotesMarkdown, setPendingNotesMarkdown] = useState("");
  const [notesAction, setNotesAction] = useState("");
  const [showNotesConfirm, setShowNotesConfirm] = useState(false);
  const [showDeleteDayConfirm, setShowDeleteDayConfirm] = useState(false);
  
  // Modal states for View buttons
  const [viewModalType, setViewModalType] = useState(null); // 'notes' | 'tasks' | null

  useEffect(() => {
    if (dayId) {
      fetchDayData();
    }
  }, [dayId]);

  const fetchDayData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminAPI.getProjectDayDetails(dayId);
      if (res.success) {
        setTopicTitle(res.day.topic_title || "");
        setNotesMarkdown(res.day.notes_markdown || "");
        setTasksMarkdown(res.day.tasks_markdown || "");
        setTasks(res.tasks || []);
        setStudentsHaveStarted(Boolean(res.studentsHaveStarted));
      }
    } catch (err) {
      console.error("Fetch Day Error:", err);
      setError(err.message || "Failed to load day configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTitle = async (e) => {
    e.preventDefault();
    if (!topicTitle.trim()) {
      setError("Topic title cannot be empty.");
      return;
    }

    setIsSavingTitle(true);
    setError("");
    setSuccess("");
    try {
      await adminAPI.updateProjectDay(dayId, { topic_title: topicTitle.trim() });
      setSuccess("Topic title updated successfully.");
      if (onSave) onSave();
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError(err.message || "Failed to update topic title.");
    } finally {
      setIsSavingTitle(false);
    }
  };

  const saveNotesMarkdown = async (text, successMessage) => {
    try {
      await adminAPI.updateProjectDay(dayId, { notes_markdown: text });
      setNotesMarkdown(text);
      setSuccess(successMessage);
      if (onSave) onSave();
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError(err.message || "Failed to update markdown notes.");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".md")) {
      setError("Please upload a valid Markdown (.md) file.");
      return;
    }

    setError("");
    setSuccess("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      if (studentsHaveStarted && notesMarkdown) {
        setPendingNotesMarkdown(text);
        setNotesAction("replace");
        setShowNotesConfirm(true);
      } else {
        await saveNotesMarkdown(text, "Markdown notes uploaded successfully!");
      }
    };
    reader.onerror = () => {
      setError("Error reading the file.");
    };
    reader.readAsText(file);
  };

  const handleDeleteNotes = () => {
    if (!notesMarkdown) return;
    setNotesAction("delete");
    setShowNotesConfirm(true);
  };

  const confirmNotesAction = async () => {
    const isDelete = notesAction === "delete";
    await saveNotesMarkdown(isDelete ? "" : pendingNotesMarkdown, isDelete ? "Markdown notes deleted." : "Markdown notes replaced successfully!");
    setPendingNotesMarkdown("");
    setNotesAction("");
    setShowNotesConfirm(false);
  };

  const handleDownloadNotes = () => {
    if (!notesMarkdown) return;
    const blob = new Blob([notesMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `day-${String(dayNumber).padStart(2, "0")}-notes.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  // Day Tasks Markdown Handlers
  const saveTasksMarkdown = async (text, successMsg = "Day tasks updated successfully!") => {
    setIsSavingTask(true);
    setError("");
    setSuccess("");
    try {
      const res = await adminAPI.updateProjectDay(dayId, { tasks_markdown: text });
      setTasksMarkdown(text);
      if (res.tasks) {
        setTasks(res.tasks);
      }
      setSuccess(successMsg);
      if (onSave) onSave();
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError(err.message || "Failed to save tasks markdown.");
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleSaveTasksSubmit = (e) => {
    e.preventDefault();
    saveTasksMarkdown(tasksMarkdown, "Day tasks markdown saved and tasks generated!");
  };

  const handleTaskFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".md")) {
      setError("Please upload a valid Markdown (.md) file.");
      return;
    }

    setError("");
    setSuccess("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      setTasksMarkdown(text);
      await saveTasksMarkdown(text, "Tasks markdown uploaded and tasks generated!");
    };
    reader.onerror = () => {
      setError("Error reading the tasks markdown file.");
    };
    reader.readAsText(file);
  };

  const handleDownloadTasksMarkdown = () => {
    if (!tasksMarkdown) return;
    const blob = new Blob([tasksMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `day-${String(dayNumber).padStart(2, "0")}-tasks.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteTasksMarkdown = async () => {
    if (!tasksMarkdown) return;
    await saveTasksMarkdown("", "Day tasks markdown cleared.");
  };

  const parsedPreviewTasks = parseTasksFromMarkdown(tasksMarkdown);

  const inputClass = "w-full px-3 py-2 text-xs rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
        <span className="text-xs font-semibold">Loading day settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Messages */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3.5 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3.5 rounded-xl text-xs font-semibold">
          {success}
        </div>
      )}

      {/* Main Grid: 2 Side-by-Side Cards with Equal Height */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* Card 1: Day Information */}
        <div className="bg-white dark:bg-[#0f274f] border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full space-y-5">
          <div className="space-y-5 flex-1 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-xs">
                  {dayNumber}
                </div>
                <h4 className="text-xs font-extrabold text-[#0c1833] dark:text-white uppercase tracking-wider">
                  Day {dayNumber} Information
                </h4>
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-black/5 dark:border-white/5">
                General Info
              </span>
            </div>

            {/* Section 1: Topic Title */}
            <form onSubmit={handleSaveTitle} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider block text-[11px]">
                  Topic Title <span className="text-rose-500">*</span>
                </label>
                {topicTitle && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    ✓ Title Set
                  </span>
                )}
              </div>
              <input
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="e.g. Introduction to Routing & Controllers"
                className={`${inputClass} text-xs py-2.5`}
                required
              />
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  💡 Displayed as the primary heading on the student dashboard.
                </p>
                <button
                  type="submit"
                  disabled={isSavingTitle}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-sm transition-all h-[34px] active:scale-95 ml-auto"
                  title="Save Topic Title"
                >
                  <FiSave className="w-3.5 h-3.5" />
                  <span>{isSavingTitle ? "Saving..." : "Save Title"}</span>
                </button>
              </div>
            </form>

            {/* Section 2: Lesson Notes */}
            <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider block text-[11px]">
                  Lesson Notes (.md)
                </label>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${notesMarkdown ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-slate-100 dark:bg-white/5 text-slate-400"}`}>
                  {notesMarkdown ? "Notes Uploaded" : "No File Uploaded"}
                </span>
              </div>
              
              {/* Active Notes File Status Bar */}
              {notesMarkdown ? (
                <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <FiBookOpen className="text-base" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          Day {dayNumber} Lesson Notes
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {notesMarkdown.length} bytes • Markdown ready
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-2 border-t border-blue-500/15">
                    <button
                      type="button"
                      onClick={() => setViewModalType("notes")}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white py-2 text-xs font-bold shadow-sm transition hover:bg-blue-700 active:scale-95"
                    >
                      <FiEye className="text-sm" />
                      <span>View Content</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadNotes}
                      className="inline-flex items-center justify-center p-2 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0f1f43] text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95"
                      title="Download Notes"
                    >
                      <FiDownload className="text-sm" />
                    </button>
                    <label className="cursor-pointer inline-flex items-center justify-center p-2 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0f1f43] text-blue-500 shadow-sm transition hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95" title="Replace File">
                      <FiUpload className="text-sm" />
                      <input type="file" accept=".md" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <button
                      type="button"
                      onClick={handleDeleteNotes}
                      className="inline-flex items-center justify-center p-2 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition shadow-sm active:scale-95"
                      title="Delete Notes"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/70 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl p-4 text-center space-y-3">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    No lesson notes uploaded yet for Day {dayNumber}.
                  </p>
                  <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-white dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-white/10 transition shadow-sm active:scale-95">
                    <FiUpload className="text-sm" />
                    <input type="file" accept=".md" className="hidden" onChange={handleFileUpload} />
                    <span>Upload Notes (.md)</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Day Tasks (Markdown) Workflow Panel */}
        <div className="bg-white dark:bg-[#0f274f] border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full space-y-5">
          <div className="space-y-5 flex-1 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3 shrink-0">
              <h4 className="text-xs font-extrabold text-[#0c1833] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FiCheckSquare className="text-base" />
                </div>
                Day Tasks (Markdown)
              </h4>
              <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold px-3 py-1 rounded-full border border-blue-500/20">
                {parsedPreviewTasks.length} {parsedPreviewTasks.length === 1 ? "Task" : "Tasks"} Created
              </span>
            </div>

            <form onSubmit={handleSaveTasksSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider block text-[11px]">
                    Tasks Markdown Content <span className="text-rose-500">*</span>
                  </label>
                </div>
                <textarea
                  rows="5"
                  value={tasksMarkdown}
                  onChange={(e) => setTasksMarkdown(e.target.value)}
                  placeholder={`Build the login page\n\n---\n\nCreate authentication API\n\n---\n\nConnect frontend and backend`}
                  className={`${inputClass} flex-1 min-h-[140px] resize-y font-mono text-xs leading-relaxed border-black/10 dark:border-white/15`}
                />
                
                {/* Hint Text + Save Button Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink whitespace-nowrap">
                    💡 Separate tasks using <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400 font-bold">---</code> line breaks.
                  </p>
                  <button
                    type="submit"
                    disabled={isSavingTask}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm inline-flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 shrink-0 ml-auto"
                  >
                    <FiSave className="w-3.5 h-3.5" />
                    <span>{isSavingTask ? "Saving..." : "Save Tasks"}</span>
                  </button>
                </div>
              </div>

              {/* Action Toolbar (Mirrors Lesson Notes Structure) */}
              <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider block text-[11px]">
                    Generated Tasks Checklist
                  </label>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${tasksMarkdown ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-slate-100 dark:bg-white/5 text-slate-400"}`}>
                    {tasksMarkdown ? `${parsedPreviewTasks.length} Tasks Ready` : "No Tasks Created"}
                  </span>
                </div>

                {tasksMarkdown ? (
                  <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <FiCheckSquare className="text-base" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            Day {dayNumber} Task Checklist
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {parsedPreviewTasks.length} auto-generated student tasks
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center gap-2 pt-2 border-t border-blue-500/15">
                      <button
                        type="button"
                        onClick={() => setViewModalType("tasks")}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white py-2 text-xs font-bold shadow-sm transition hover:bg-blue-700 active:scale-95"
                      >
                        <FiEye className="text-sm" />
                        <span>View Content</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadTasksMarkdown}
                        className="inline-flex items-center justify-center p-2 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0f1f43] text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95"
                        title="Download Tasks Markdown"
                      >
                        <FiDownload className="text-sm" />
                      </button>
                      <label className="cursor-pointer inline-flex items-center justify-center p-2 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0f1f43] text-blue-500 shadow-sm transition hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95" title="Upload / Replace Tasks (.md)">
                        <FiUpload className="text-sm" />
                        <input type="file" accept=".md" className="hidden" onChange={handleTaskFileUpload} />
                      </label>
                      <button
                        type="button"
                        onClick={handleDeleteTasksMarkdown}
                        className="inline-flex items-center justify-center p-2 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition shadow-sm active:scale-95"
                        title="Clear Tasks Markdown"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50/70 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded-xl p-4 text-center space-y-3">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Write tasks above or upload a markdown file.
                    </p>
                    <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-white dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-white/10 transition shadow-sm active:scale-95">
                      <FiUpload className="text-sm" />
                      <input type="file" accept=".md" className="hidden" onChange={handleTaskFileUpload} />
                      <span>Upload Tasks (.md)</span>
                    </label>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Confirmation Modals */}
      {showNotesConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowNotesConfirm(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 bg-white/95 p-6 shadow-2xl dark:border-white/10 dark:bg-[#0a1737]/95 space-y-4">
            <h2 className="text-lg font-semibold text-amber-600 dark:text-amber-400">{notesAction === "delete" ? "Delete Markdown Notes?" : "Replace Markdown Notes?"}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{studentsHaveStarted ? "This change may affect active students." : "This change cannot be undone."}</p>
            <div className="flex justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
              <button type="button" onClick={() => setShowNotesConfirm(false)} className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-slate-500">Cancel</button>
              <button type="button" onClick={confirmNotesAction} className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-500 text-white">Confirm</button>
            </div>
          </div>
        </div>, document.body
      )}

      {showDeleteDayConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowDeleteDayConfirm(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 bg-white/95 p-6 shadow-2xl dark:border-white/10 dark:bg-[#0a1737]/95 space-y-4">
            <h2 className="text-lg font-semibold text-rose-500">Delete Day {dayNumber}?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">This deletes the day, its markdown notes, and all associated tasks.{studentsHaveStarted && <span className="mt-2 block font-semibold text-amber-600 dark:text-amber-400">This change may affect active students.</span>}</p>
            <div className="flex justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
              <button type="button" onClick={() => setShowDeleteDayConfirm(false)} className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-slate-500">Cancel</button>
              <button type="button" onClick={() => { setShowDeleteDayConfirm(false); onDeleteDay?.(); }} className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-500 text-white">Delete Day</button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Scrollable View Content Popup Modal */}
      {viewModalType && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewModalType(null)} />
          <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0f274f] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 px-6 py-4 bg-slate-50/50 dark:bg-black/20 shrink-0">
              <div className="flex items-center gap-2">
                {viewModalType === "notes" ? (
                  <>
                    <FiBookOpen className="text-blue-500 text-lg" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      Day {dayNumber} Lesson Notes Preview
                    </h3>
                  </>
                ) : (
                  <>
                    <FiCheckSquare className="text-blue-500 text-lg" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      Day {dayNumber} Generated Checklist Preview ({parsedPreviewTasks.length} Tasks)
                    </h3>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewModalType(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Modal Body — Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {viewModalType === "notes" ? (
                <div className="prose dark:prose-invert max-w-none admin-dashboard-typography">
                  <MarkdownContent>{notesMarkdown}</MarkdownContent>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Student Task Checklist
                    </span>
                    <span className="text-xs text-blue-500 font-bold">
                      {parsedPreviewTasks.length} Task{parsedPreviewTasks.length === 1 ? "" : "s"} Total
                    </span>
                  </div>
                  {parsedPreviewTasks.map((taskText, i) => (
                    <div
                      key={i}
                      className="bg-slate-50 dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 p-3.5 rounded-xl flex items-start gap-3 shadow-sm"
                    >
                      <div className="w-4 h-4 rounded border-2 border-slate-400 dark:border-slate-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block whitespace-pre-wrap leading-relaxed">
                          {taskText}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-full shrink-0">
                        Task {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-black/5 dark:border-white/10 px-6 py-3 bg-slate-50/50 dark:bg-black/20 shrink-0">
              <button
                type="button"
                onClick={() => setViewModalType(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
