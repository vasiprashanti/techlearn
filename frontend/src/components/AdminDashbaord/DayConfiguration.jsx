import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { adminAPI } from "../../services/adminApi";
import MarkdownContent from "../../pages/Learn/MarkdownContent";
import { FiSave, FiUpload, FiTrash2, FiEdit2, FiCheck, FiX, FiPlus, FiBookOpen, FiDownload, FiChevronDown, FiChevronUp } from "react-icons/fi";

export default function DayConfiguration({ dayId, dayNumber, onSave, onDeleteDay, deletingDay = false }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [topicTitle, setTopicTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [notesMarkdown, setNotesMarkdown] = useState("");

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ task_description: "", xp_value: "" });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTask, setEditingTask] = useState({ task_description: "", xp_value: "" });
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [studentsHaveStarted, setStudentsHaveStarted] = useState(false);
  const [pendingNotesMarkdown, setPendingNotesMarkdown] = useState("");
  const [notesAction, setNotesAction] = useState("");
  const [showNotesConfirm, setShowNotesConfirm] = useState(false);
  const [showDeleteDayConfirm, setShowDeleteDayConfirm] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);

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

  // Task creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    const { task_description, xp_value } = newTask;

    if (!task_description.trim()) {
      setError("Task description is required.");
      return;
    }

    const xpNum = Number(xp_value);
    if (isNaN(xpNum) || xpNum < 0) {
      setError("XP value must be a positive number (>= 0).");
      return;
    }

    setIsSavingTask(true);
    setError("");
    setSuccess("");
    try {
      await adminAPI.createProjectTask({
        project_day_id: dayId,
        task_description: task_description.trim(),
        xp_value: xpNum
      });
      setNewTask({ task_description: "", xp_value: "" });
      setSuccess("Task created successfully!");
      fetchDayData();
      if (onSave) onSave();
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError(err.message || "Failed to create task.");
    } finally {
      setIsSavingTask(false);
    }
  };

  // Task editing triggers
  const startEditTask = (task) => {
    setEditingTaskId(task._id);
    setEditingTask({ task_description: task.task_description, xp_value: task.xp_value });
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditingTask({ task_description: "", xp_value: "" });
  };

  const handleUpdateTask = async (taskId) => {
    const { task_description, xp_value } = editingTask;

    if (!task_description.trim()) {
      setError("Task description is required.");
      return;
    }

    const xpNum = Number(xp_value);
    if (isNaN(xpNum) || xpNum < 0) {
      setError("XP value must be a positive number (>= 0).");
      return;
    }

    setIsSavingTask(true);
    setError("");
    setSuccess("");
    try {
      await adminAPI.updateProjectTask(taskId, {
        task_description: task_description.trim(),
        xp_value: xpNum
      });
      setEditingTaskId(null);
      setSuccess("Task updated successfully!");
      fetchDayData();
      if (onSave) onSave();
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError(err.message || "Failed to update task.");
    } finally {
      setIsSavingTask(false);
    }
  };

  // Task deletion
  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    setError("");
    setSuccess("");
    try {
      await adminAPI.deleteProjectTask(taskToDelete._id);
      setSuccess("Task deleted successfully.");
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
      fetchDayData();
      if (onSave) onSave();
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError(err.message || "Failed to delete task.");
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    }
  };

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

      {/* Main Split Grid */}
      <div className={`grid grid-cols-1 gap-6 ${previewOpen ? "lg:grid-cols-2" : ""}`}>
        
        {/* Left Side: Information, Topic and Markdown Upload */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-2xl p-5 shadow-[0_4px_18px_rgba(0,0,0,0.015)] space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
              <h4 className="text-xs font-bold text-[#0c1833] dark:text-white uppercase tracking-wider">
                Day {dayNumber} Information
              </h4>
            </div>

            <form onSubmit={handleSaveTitle} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Topic Title*
                </label>
                <input
                  type="text"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="e.g. Introduction to Routing"
                  className={inputClass}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSavingTitle}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl text-xs font-bold flex items-center justify-center h-[34px] shadow-sm transition"
                title="Save Title"
              >
                <FiSave className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-3 border-t border-black/5 dark:border-white/5">
              <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Lesson Notes (.md)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer bg-white dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 px-3 py-2 rounded-xl text-xs font-semibold text-blue-500 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5 shadow-sm">
                  <FiUpload className="text-sm" />
                  <input
                    type="file"
                    accept=".md"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  {notesMarkdown ? "Replace Markdown" : "Upload Markdown"}
                </label>
                {notesMarkdown && (
                  <>
                    <button type="button" onClick={handleDownloadNotes} className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-blue-500 shadow-sm transition hover:bg-black/5 dark:border-white/15 dark:bg-[#0f1f43]" title="Download Markdown">
                      <FiDownload className="text-sm" /> Download
                    </button>
                    <button type="button" onClick={handleDeleteNotes} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs font-semibold text-rose-500 transition hover:bg-rose-500/10" title="Delete Markdown">
                      <FiTrash2 className="text-sm" /> Delete
                    </button>
                  </>
                )}
                <span className="text-[10px] text-slate-400 font-medium">
                  {notesMarkdown ? "Markdown stored in database" : "No notes uploaded yet"}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-black/5 dark:border-white/5">
              <button type="button" onClick={() => setShowDeleteDayConfirm(true)} disabled={deletingDay} className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 transition hover:text-rose-600 disabled:opacity-50">
                <FiTrash2 className="w-3.5 h-3.5" />
                {deletingDay ? "Deleting day..." : "Delete Day"}
              </button>
            </div>
          </div>

          {/* Tasks CRUD Panel */}
          <div className="bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-2xl p-5 shadow-[0_4px_18px_rgba(0,0,0,0.015)] space-y-4">
            <h4 className="text-xs font-bold text-[#0c1833] dark:text-white uppercase tracking-wider border-b border-black/5 dark:border-white/5 pb-3">
              Tasks Checklist
            </h4>

            {/* Task Creation Form */}
            <form onSubmit={handleCreateTask} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
              <div className="sm:col-span-2">
                <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Task Description*
                </label>
                <input
                  type="text"
                  value={newTask.task_description}
                  onChange={(e) => setNewTask({ ...newTask, task_description: e.target.value })}
                  placeholder="e.g. Write integration test"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  XP Value*
                </label>
                <input
                  type="number"
                  min="0"
                  value={newTask.xp_value}
                  onChange={(e) => setNewTask({ ...newTask, xp_value: e.target.value })}
                  placeholder="e.g. 50"
                  className={inputClass}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSavingTask}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-xl font-bold text-xs h-[34px] shadow-sm flex items-center justify-center gap-1 transition-all disabled:opacity-50"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>

            {/* Tasks List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400 font-medium">
                  No tasks created for this day.
                </p>
              ) : (
                tasks.map((task, i) => (
                  <div key={task._id} className="bg-slate-50 dark:bg-black/10 border border-black/5 dark:border-white/5 p-3 rounded-xl flex items-center justify-between gap-4">
                    {editingTaskId === task._id ? (
                      <div className="flex-1 grid grid-cols-4 gap-2 items-end">
                        <input
                          type="text"
                          value={editingTask.task_description}
                          onChange={(e) => setEditingTask({ ...editingTask, task_description: e.target.value })}
                          className="col-span-2 px-2 py-1 text-xs border rounded bg-white dark:bg-[#0f1f43] dark:border-white/10 dark:text-white"
                        />
                        <input
                          type="number"
                          min="0"
                          value={editingTask.xp_value}
                          onChange={(e) => setEditingTask({ ...editingTask, xp_value: e.target.value })}
                          className="px-2 py-1 text-xs border rounded bg-white dark:bg-[#0f1f43] dark:border-white/10 dark:text-white"
                        />
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => handleUpdateTask(task._id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-500/10 rounded"
                            title="Save"
                          >
                            <FiCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEditTask}
                            className="p-1.5 text-slate-400 hover:bg-slate-500/10 rounded"
                            title="Cancel"
                          >
                            <FiX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-800 dark:text-white">
                            Task {i + 1}: {task.task_description}
                          </p>
                          <span className="text-[10px] font-semibold text-slate-400">
                            Reward: <strong className="text-blue-500 font-bold">{task.xp_value} XP</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEditTask(task)}
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/5 rounded-lg transition"
                            title="Edit Task"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(task)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 rounded-lg transition"
                            title="Delete Task"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Markdown Preview Panel */}
        {previewOpen && <div className="bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.015)] flex flex-col h-full min-h-[500px]">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3 mb-4">
            <h4 className="text-xs font-bold text-[#0c1833] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <FiBookOpen className="text-blue-500" />
              Markdown Notes Preview
            </h4>
            <button type="button" onClick={() => setPreviewOpen(false)} className="p-1 text-slate-400 transition hover:text-blue-500" title="Collapse preview"><FiChevronUp /></button>
          </div>

          <div className="flex-1 overflow-y-auto border border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-black/10 rounded-xl p-6 prose dark:prose-invert max-w-none max-h-[550px] admin-dashboard-typography">
            {notesMarkdown ? (
              <MarkdownContent>{notesMarkdown}</MarkdownContent>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-20">
                <FiBookOpen className="w-10 h-10 mb-2 opacity-50 text-slate-400" />
                <p className="text-xs font-semibold max-w-[280px]">
                  No markdown notes uploaded for this day. Upload a .md file on the left side to preview the layout.
                </p>
              </div>
            )}
          </div>
        </div>}

      </div>

      {!previewOpen && (
        <button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 transition hover:text-blue-600">
          <FiChevronDown /> Show Markdown Preview
        </button>
      )}

      {/* Delete Task Confirmation Modal */}
      {showDeleteConfirm && taskToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => { setShowDeleteConfirm(false); setTaskToDelete(null); }} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden p-6 space-y-4">
            <h2 className="text-lg font-semibold text-rose-500 dark:text-rose-400">Delete Task?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong className="text-slate-800 dark:text-white">&ldquo;{taskToDelete.task_description}&rdquo;</strong>? This action cannot be undone.
              {studentsHaveStarted && <span className="mt-2 block font-semibold text-amber-600 dark:text-amber-400">This change may affect active students.</span>}
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
              <button 
                onClick={() => { setShowDeleteConfirm(false); setTaskToDelete(null); }} 
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteTask} 
                className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white transition shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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

    </div>
  );
}
