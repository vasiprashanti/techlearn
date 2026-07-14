import React, { useState, useEffect } from 'react';
import { 
  FiX, FiAward, FiActivity, FiTarget, FiTrendingUp, FiCalendar, 
  FiClock, FiCode, FiCheckCircle, FiAlertCircle, FiEdit2, FiSave, FiRefreshCw, FiEye
} from 'react-icons/fi';
import { adminAPI } from '../../services/adminApi';

const formatDateValue = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function StudentReportModal({ studentId, batchId, studentBasic, onClose, isOpen, context }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [studentDetails, setStudentDetails] = useState(null);
  const [batchStudentData, setBatchStudentData] = useState(null);
  const [batchRank, setBatchRank] = useState('_');
  const [submissions, setSubmissions] = useState([]);
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);
  const [editScore, setEditScore] = useState('');
  const [editXp, setEditXp] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewingCodeSub, setViewingCodeSub] = useState(null);
  const [selectedMcqDay, setSelectedMcqDay] = useState(null);
  const [selectedPerformanceDay, setSelectedPerformanceDay] = useState(null);
  const [batchTracks, setBatchTracks] = useState([]);

  useEffect(() => {
    if (!isOpen || !studentId) return;

    async function loadData() {
      setLoading(true);
      setError('');
      try {
        // Fetch basic student info
        const studentRes = await adminAPI.getStudent(studentId);
        setStudentDetails(studentRes);

        // Fetch submissions
        try {
          const subs = await adminAPI.getStudentSubmissions(studentId);
          const submissionsList = Array.isArray(subs) ? subs : (subs?.submissions || []);
          setSubmissions(submissionsList);
        } catch (subErr) {
          console.error("Failed to load student submissions", subErr);
        }

        // Fetch batch details to extract rich metrics
        const bId = batchId || studentRes?.batchId || studentBasic?.batchId;
        if (bId) {
          try {
            const batchRes = await adminAPI.getBatch(bId);
            const tracksData = batchRes?.tracks || batchRes?.data?.tracks || [];
            setBatchTracks(tracksData);
            const table = batchRes?.studentsTable || [];
            const match = table.find(s => String(s.id || s._id) === String(studentId));
            if (match) {
              setBatchStudentData(match);
            }
            // Sort batch table by totalXp to find student rank in batch
            const sortedTable = [...table].sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0));
            const idxInBatch = sortedTable.findIndex(s => String(s.id || s._id) === String(studentId));
            if (idxInBatch !== -1) {
              setBatchRank(idxInBatch + 1);
            }
          } catch (batchErr) {
            console.error("Failed to load batch data for student", batchErr);
          }
        }
      } catch (err) {
        console.error("Error loading student report details", err);
        setError("Failed to load student report details.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen, studentId, batchId, studentBasic]);

  if (!isOpen) return null;

  const handleScoreEdit = (sub) => {
    setEditingSubmissionId(sub.id || sub._id);
    setEditScore(sub.xpEarned || sub.score || 0);
    setEditXp(sub.xpEarned || sub.score || 0);
  };

  const handleSaveScore = async (subId) => {
    setActionLoading(true);
    try {
      await adminAPI.updateSubmissionScore(subId, {
        newScore: Number(editScore),
        newXp: Number(editXp),
      });
      // Update local state
      setSubmissions(prev => prev.map(s => {
        if ((s.id || s._id) === subId) {
          return { ...s, xpEarned: Number(editXp), score: Number(editScore), status: Number(editScore) >= 100 ? 'Passed' : 'Partial Pass' };
        }
        return s;
      }));
      setEditingSubmissionId(null);
    } catch (err) {
      alert("Failed to update score: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetSubmission = async (subId) => {
    if (!window.confirm("Are you sure you want to reset this submission to allow re-attempt?")) return;
    setActionLoading(true);
    try {
      await adminAPI.updateSubmissionScore(subId, { action: "reset" });
      setSubmissions(prev => prev.map(s => {
        if ((s.id || s._id) === subId) {
          return { ...s, status: 'Pending', xpEarned: 0, score: 0 };
        }
        return s;
      }));
      alert("Submission reset successfully!");
    } catch (err) {
      alert("Failed to reset submission: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const name = studentDetails?.name || studentBasic?.name || 'Loading Student...';
  const email = studentDetails?.email || studentBasic?.email || '';
  const college = studentDetails?.college || studentDetails?.collegeId?.name || studentBasic?.college || 'Not Assigned';
  const batch = studentDetails?.batch || studentDetails?.batchId?.name || studentBasic?.batch || 'Not Assigned';
  const streak = studentDetails?.streak || studentBasic?.streak || 0;
  const status = studentDetails?.status || studentBasic?.status || 'Active';
  const accuracy = studentDetails?.accuracy || studentBasic?.accuracy || 0;
  const rank = context === 'batch'
    ? (batchRank !== '_' ? batchRank : '_')
    : (batchStudentData?.leaderboardRank || '_');
  const totalXp = batchStudentData?.totalXp || studentBasic?.score || 0;
  const track = studentDetails?.track || studentBasic?.track || 'General Track';

  // Compute strong & weak topics from dayWiseHistoryTasksDetail
  const strongTopics = [];
  const weakTopics = [];
  if (batchStudentData?.dayWiseHistoryTasksDetail) {
    Object.entries(batchStudentData.dayWiseHistoryTasksDetail).forEach(([day, detail]) => {
      if (detail && typeof detail === 'object') {
        const mcqScore = parseFloat(detail.mcq) || 0;
        if (mcqScore >= 0.75) {
          strongTopics.push(`Day ${day} MCQ`);
        } else if (mcqScore > 0 && mcqScore < 0.5) {
          weakTopics.push(`Day ${day} MCQ`);
        }
        if (detail.coding === 'Passed' || detail.coding === '100') {
          strongTopics.push(`Day ${day} Coding`);
        } else if (detail.coding === 'Failed' || detail.coding === '0') {
          weakTopics.push(`Day ${day} Coding`);
        }
      }
    });
  }

  const getChallengeMcqStats = (dayNum) => {
    const challengeDetail = batchStudentData?.dayWiseHistoryChallengesDetail?.[dayNum];
    if (!challengeDetail || !challengeDetail.mcq) return '—';
    
    let totalEarned = 0;
    let totalMax = 0;
    let hasMcq = false;
    
    Object.values(challengeDetail.mcq).forEach(val => {
      if (val && val !== '—') {
        const parts = val.split('/');
        totalEarned += parseFloat(parts[0]) || 0;
        totalMax += parseFloat(parts[1]) || 0;
        hasMcq = true;
      }
    });
    
    return hasMcq ? `${totalEarned}/${totalMax}` : '—';
  };

  const getMcqTitlesForDay = (trackType, dayNum) => {
    const track = batchTracks.find(t => {
      if (trackType === "Daily Task") {
        return t.name?.toLowerCase().includes("task") || t.id?.toLowerCase().includes("task");
      } else {
        return t.name?.toLowerCase().includes("challenge") || t.id?.toLowerCase().includes("challenge");
      }
    });
    return track?.days?.find(d => Number(d.dayNumber) === Number(dayNum))?.mcq || [];
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center px-4 font-sans text-slate-900 dark:text-slate-100">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a1737] shadow-2xl overflow-hidden flex flex-col">
        {/* Top Accent line */}
        <div className="h-1.5 w-full bg-blue-500" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 dark:bg-white/5 flex items-center justify-center text-xl font-bold text-blue-600 dark:text-[#8fd9ff] border border-blue-500/25 dark:border-white/15 select-none shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">{name}</h2>
              <p className="text-xs text-slate-500 dark:text-white/60 truncate mt-0.5">{email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-white/60 dark:hover:text-white text-lg w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <FiX />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading student registry report...</p>
          </div>
        ) : (
          <div className="flex flex-col p-6 space-y-5">
            
            {/* College, Batch, Track Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5">
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-white/45">College</span>
                <span className="block mt-0.5 font-semibold text-xs truncate">{college}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-white/45">Batch</span>
                <span className="block mt-0.5 font-semibold text-xs truncate">{batch}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-white/45">Selected Track</span>
                <span className="block mt-0.5 font-bold text-xs text-blue-600 dark:text-blue-400 truncate">{track}</span>
              </div>
            </div>

            {/* Quick KPI stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-3">
                <FiAward className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/45">Rank</span>
                  <span className="block font-extrabold text-sm text-blue-700 dark:text-blue-300">#{rank}</span>
                </div>
              </div>
              <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-3">
                <FiTrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/45">Total XP</span>
                  <span className="block font-extrabold text-sm text-blue-700 dark:text-blue-300">{totalXp} XP</span>
                </div>
              </div>
              <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-3">
                <FiTarget className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/45">Accuracy</span>
                  <span className="block font-extrabold text-sm text-blue-700 dark:text-blue-300">{accuracy}%</span>
                </div>
              </div>
              <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-3">
                <FiActivity className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/45">Streak</span>
                  <span className="block font-extrabold text-sm text-blue-700 dark:text-blue-300">{streak} Days</span>
                </div>
              </div>
            </div>

            {/* Sub-tabs selection row */}
            <div className="flex border-b border-black/10 dark:border-white/10 overflow-x-auto minimal-scrollbar">
              {['Overview', 'Today\'s Submissions', 'Coding Submissions', 'MCQ Summary', 'Daily Performance'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content screens */}
            <div className="flex-1">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'Overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Enrollment Info</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs py-1 border-b border-black/5 dark:border-white/5">
                          <span className="text-slate-400">Program Selection:</span>
                          <span className="font-semibold">{studentDetails?.programSelection || 'Placement Sprint'}</span>
                        </div>
                        <div className="flex justify-between text-xs py-1 border-b border-black/5 dark:border-white/5">
                          <span className="text-slate-400">Joined Date:</span>
                          <span className="font-semibold">{formatDateValue(studentDetails?.joined || studentDetails?.createdAt)}</span>
                        </div>
                        <div className="flex justify-between text-xs py-1 border-b border-black/5 dark:border-white/5">
                          <span className="text-slate-400">Last Active:</span>
                          <span className="font-semibold">{formatDateValue(studentDetails?.lastActive || studentDetails?.lastActiveAt)}</span>
                        </div>
                        <div className="flex justify-between text-xs py-1 border-b border-black/5 dark:border-white/5">
                          <span className="text-slate-400">Status Badge:</span>
                          <span className="font-semibold">{status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Learning Insights</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-black/5 dark:border-white/10 p-3 rounded-xl bg-slate-50/50 dark:bg-white/5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Strong Topics</span>
                          <div className="mt-2 space-y-1">
                            {strongTopics.slice(0, 3).map((t, i) => (
                              <span key={i} className="inline-flex rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] px-2 py-0.5 mr-1 mb-1 font-semibold">{t}</span>
                            ))}
                            {strongTopics.length === 0 && <span className="text-xs italic text-slate-400">No data computed yet</span>}
                          </div>
                        </div>
                        <div className="border border-black/5 dark:border-white/10 p-3 rounded-xl bg-slate-50/50 dark:bg-white/5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Needs Improvement</span>
                          <div className="mt-2 space-y-1">
                            {weakTopics.slice(0, 3).map((t, i) => (
                              <span key={i} className="inline-flex rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 text-[10px] px-2 py-0.5 mr-1 mb-1 font-semibold">{t}</span>
                            ))}
                            {weakTopics.length === 0 && <span className="text-xs italic text-slate-400">Good progress overall</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TODAY'S SUBMISSIONS */}
              {activeTab === 'Today\'s Submissions' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-black/5 dark:border-white/10 p-5 rounded-xl bg-slate-50/50 dark:bg-white/5 space-y-4">
                      <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Daily Tasks Score Details</h4>
                      {batchStudentData?.todayScoresDetail ? (
                        <div className="space-y-2 text-xs">
                          {Object.entries(batchStudentData.todayScoresDetail).map(([key, val]) => {
                            if (!val || val === '—') return null;
                            const label = key === 'mcq' ? 'MCQ Tasks' : key === 'sql' ? 'SQL Tasks' : 'Coding Tasks';
                            if (key === 'coding') {
                              const parts = val.split('/');
                              const accuracy = parts[0] === '—' ? 0 : parseInt(parts[0], 10);
                              const maxAccuracy = parseInt(parts[1], 10) || 100;
                              const passedCount = accuracy >= 100 ? 1 : 0;
                              const totalCount = 1;
                              return (
                                <div key={key} className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                                  <span>{label}:</span>
                                  <span className="font-bold">
                                    {passedCount}/{totalCount} (Score: {accuracy}/{maxAccuracy})
                                  </span>
                                </div>
                              );
                            } else {
                              const parts = val.split('/');
                              const correct = parts[0] === '—' ? 0 : parseInt(parts[0], 10);
                              const total = parseInt(parts[1], 10) || 0;
                              return (
                                <div key={key} className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                                  <span>{label}:</span>
                                  <span className="font-bold">
                                    {correct}/{total} (Score: {correct}/{total})
                                  </span>
                                </div>
                              );
                            }
                          })}
                          {Object.values(batchStudentData.todayScoresDetail).every(v => !v || v === '—') && (
                            <p className="text-xs italic text-slate-400 text-center py-4">No tasks assigned or attempted today.</p>
                          )}
                          <div className="flex justify-between pt-2 border-t border-black/10 dark:border-white/10 mt-2">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">Total Tasks XP Gained Today:</span>
                            <span className="font-extrabold text-blue-600 dark:text-blue-400">+{batchStudentData.todayTaskXp || 0} XP</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs italic text-slate-400 text-center py-6">No tasks recorded today.</p>
                      )}
                    </div>

                    <div className="border border-black/5 dark:border-white/10 p-5 rounded-xl bg-slate-50/50 dark:bg-white/5 space-y-4">
                      <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Today's Challenges Score Details</h4>
                      {batchStudentData?.todayChallengeScoresDetail ? (
                        <div className="space-y-2 text-xs">
                          {(() => {
                            const detailsList = [];
                            const detailObj = batchStudentData.todayChallengeScoresDetail || {};
                            Object.entries(detailObj).forEach(([subType, sections]) => {
                              if (sections && typeof sections === 'object') {
                                Object.entries(sections).forEach(([section, val]) => {
                                  if (!val || val === '—') return;
                                  const parts = val.split('/');
                                  const earned = parts[0] === '—' ? 0 : parseFloat(parts[0]);
                                  const max = parseFloat(parts[1]) || 0;
                                  
                                  let label = '';
                                  if (subType === 'mcq') {
                                    const labelMap = {
                                      java: 'Java MCQ',
                                      dsa: 'DSA MCQ',
                                      sql: 'SQL MCQ',
                                      aptitude: 'Aptitude MCQ',
                                      technical: 'Technical MCQ'
                                    };
                                    label = labelMap[section] || `${section.toUpperCase()} MCQ`;
                                  } else {
                                    const labelMap = {
                                      java: 'Java Coding',
                                      dsa: 'DSA Coding',
                                      sql: 'SQL Coding',
                                      aptitude: 'Aptitude Coding',
                                      technical: 'Technical Coding'
                                    };
                                    label = labelMap[section] || `${section.toUpperCase()} Coding`;
                                  }

                                  if (subType === 'coding') {
                                    const totalQuestions = 1;
                                    const correctQuestions = earned >= max ? 1 : 0;
                                    detailsList.push(
                                      <div key={`${subType}-${section}`} className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                                        <span>{label}:</span>
                                        <span className="font-bold">
                                          {correctQuestions}/{totalQuestions} (Score: {earned}/{max})
                                        </span>
                                      </div>
                                    );
                                  } else {
                                    detailsList.push(
                                      <div key={`${subType}-${section}`} className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                                        <span>{label}:</span>
                                        <span className="font-bold">
                                          {earned}/{max} (Score: {earned}/{max})
                                        </span>
                                      </div>
                                    );
                                  }
                                });
                              }
                            });
                            return detailsList.length > 0 ? detailsList : <p className="text-xs italic text-slate-400 text-center py-4">No challenges assigned or attempted today.</p>;
                          })()}
                          <div className="flex justify-between pt-2 border-t border-black/10 dark:border-white/10 mt-2">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">Total Challenge XP Gained Today:</span>
                            <span className="font-extrabold text-blue-600 dark:text-blue-400">+{batchStudentData.todayChallengeXp || 0} XP</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs italic text-slate-400 text-center py-6">No challenges completed today.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CODING SUBMISSIONS WITH MANUAL SCORING */}
              {activeTab === 'Coding Submissions' && (
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Manual Grading & Submissions</h3>
                  <div className="border border-black/5 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-slate-900/30 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-white/5 border-b border-black/5 dark:border-white/10">
                          <th className="p-3">Question</th>
                          <th className="p-3">Track</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-center">XP</th>
                          <th className="p-3 text-center">Time</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.filter(s => s.lang === 'Code' || s.language || s.submittedCode).map((sub, index) => {
                          const id = sub.id || sub._id;
                          const isEditing = editingSubmissionId === id;
                          return (
                            <tr key={id} className="border-b border-black/5 dark:border-white/10 last:border-0 hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                              <td className="p-3 font-semibold text-slate-800 dark:text-white truncate max-w-[180px]">{sub.question || 'Coding Challenge'}</td>
                              <td className="p-3 text-slate-500 dark:text-slate-400">{sub.track || 'Practice'}</td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  sub.status === 'Passed' || sub.status === 'Accepted' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-slate-500/10 text-slate-650 dark:text-slate-400'
                                }`}>{sub.status}</span>
                              </td>
                              <td className="p-3 text-center font-bold">
                                {isEditing ? (
                                  <div className="flex items-center gap-1 justify-center">
                                    <input 
                                      type="number" 
                                      value={editXp} 
                                      onChange={(e) => setEditXp(e.target.value)}
                                      className="w-12 px-1 py-0.5 border border-black/10 dark:border-white/20 bg-transparent text-center text-xs" 
                                    />
                                    <span>XP</span>
                                  </div>
                                ) : (
                                  <span>{sub.xpEarned || sub.score || 0} XP</span>
                                )}
                              </td>
                              <td className="p-3 text-center text-slate-400">{formatDateValue(sub.when || sub.submittedAt)}</td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {isEditing ? (
                                    <>
                                      <button 
                                        onClick={() => handleSaveScore(id)}
                                        disabled={actionLoading}
                                        className="text-emerald-500 hover:text-emerald-600 p-1"
                                      >
                                        <FiSave className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => setEditingSubmissionId(null)}
                                        className="text-slate-400 hover:text-slate-500 p-1"
                                      >
                                        <FiX className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                       <button 
                                         onClick={() => setViewingCodeSub(sub)}
                                         className="text-slate-500 hover:text-slate-700 p-1"
                                         title="View submission"
                                       >
                                         <FiEye className="w-3.5 h-3.5" />
                                       </button>
                                       <button 
                                         onClick={() => handleScoreEdit(sub)}
                                         className="text-blue-500 hover:text-blue-600 p-1"
                                         title="Override score"
                                       >
                                         <FiEdit2 className="w-3.5 h-3.5" />
                                       </button>
                                       <button 
                                         onClick={() => handleResetSubmission(id)}
                                         className="text-red-500 hover:text-red-600 p-1"
                                         title="Re-open submission"
                                       >
                                         <FiRefreshCw className="w-3.5 h-3.5" />
                                       </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {submissions.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-400 italic">No coding submissions found for this student.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: MCQ SUMMARY */}
              {activeTab === 'MCQ Summary' && (
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">MCQ Practice Metrics</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(() => {
                      const daysWithMcq = [];
                      if (batchStudentData?.dayWiseHistoryTasksDetail) {
                        Object.entries(batchStudentData.dayWiseHistoryTasksDetail).forEach(([day, detail]) => {
                          const hasTaskMcq = detail?.mcq && detail.mcq !== '—';
                          const hasChallengeMcq = getChallengeMcqStats(day) !== '—';
                          if (hasTaskMcq || hasChallengeMcq) {
                            daysWithMcq.push({ day, detail });
                          }
                        });
                      }
                      
                      return daysWithMcq.length > 0 ? (
                        daysWithMcq.map(({ day, detail }) => (
                          <div 
                            key={day} 
                            onClick={() => setSelectedMcqDay(day)}
                            className="cursor-pointer border border-black/5 dark:border-white/10 p-4 rounded-xl bg-slate-50/50 dark:bg-white/5 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all flex flex-col gap-2 text-xs"
                          >
                            <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-1.5 font-bold text-slate-800 dark:text-slate-200">
                              <span>Day {day}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Daily Tasks:</span>
                              <span className="font-extrabold text-blue-600 dark:text-blue-400">{detail.mcq || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Daily Challenge:</span>
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{getChallengeMcqStats(day)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="col-span-full text-center py-8 text-slate-400 italic text-xs">No MCQ performance data recorded.</p>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 5: DAILY PERFORMANCE MATRIX */}
              {activeTab === 'Daily Performance' && (
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Daily Progression Matrix</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Click on any day card to view the tasks & challenges scores detail for that day.</p>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {Array.from({ length: 30 }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const scoreStr = batchStudentData?.dayWiseHistoryTasks?.[dayNum];
                      let colorClass = 'bg-slate-100 hover:bg-slate-200 text-slate-400 dark:bg-white/5 cursor-pointer'; // Default / click handler active
                      
                      if (scoreStr && scoreStr !== '—' && scoreStr !== 'NIL' && scoreStr !== 'NA') {
                        if (scoreStr.includes('/')) {
                          const [num, den] = scoreStr.split('/').map(Number);
                          const ratio = num / den;
                          if (ratio >= 0.8) colorClass = 'bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer';
                          else if (ratio >= 0.5) colorClass = 'bg-blue-500/20 hover:bg-blue-500/35 text-[#3C83F6] border border-blue-500/25 font-bold cursor-pointer';
                          else colorClass = 'bg-slate-200 hover:bg-slate-300 text-slate-600 dark:bg-white/10 dark:text-slate-350 border border-slate-300/30 cursor-pointer';
                        } else {
                          colorClass = 'bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer';
                        }
                      }
                      
                      return (
                        <div 
                          key={dayNum} 
                          onClick={() => setSelectedPerformanceDay(dayNum)}
                          className={`p-2.5 rounded-lg flex flex-col items-center justify-center gap-1 text-center transition-all ${colorClass}`}
                        >
                          <span className="text-[10px] uppercase font-bold">Day {dayNum}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {viewingCodeSub && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setViewingCodeSub(null)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Submission Code Review</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{viewingCodeSub.question || 'Coding Submission'}</p>
              </div>
              <button onClick={() => setViewingCodeSub(null)} className="text-sm font-semibold text-slate-400 hover:text-slate-600">Close</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-slate-50 dark:bg-slate-950/30">
                <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Submitted Code ({viewingCodeSub.language || viewingCodeSub.lang || 'Code'})</p>
                <pre className="text-xs font-mono bg-black/5 dark:bg-black/50 p-3 rounded-lg overflow-x-auto max-h-[400px] text-gray-800 dark:text-emerald-400 whitespace-pre-wrap">
                  {viewingCodeSub.submittedCode || viewingCodeSub.submittedSql || viewingCodeSub.code || 'No code submitted.'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedMcqDay && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" onClick={() => setSelectedMcqDay(null)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">MCQ Performance - Day {selectedMcqDay}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{name}</p>
              </div>
              <button onClick={() => setSelectedMcqDay(null)} className="text-sm font-semibold text-slate-400 hover:text-slate-600">Close</button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
              {/* Daily Tasks MCQ */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1">
                  Daily Tasks MCQ ({batchStudentData?.dayWiseHistoryTasksDetail?.[selectedMcqDay]?.mcq || '—'})
                </h3>
                {(() => {
                  const titles = getMcqTitlesForDay("Daily Task", selectedMcqDay);
                  const taskMcq = batchStudentData?.dayWiseHistoryTasksDetail?.[selectedMcqDay]?.mcq || '—';
                  if (titles.length === 0) return <p className="text-xs italic text-slate-400">No daily task MCQs completed or assigned on this day.</p>;
                  
                  const parts = taskMcq.split('/');
                  const attempted = parts[0] !== '—';
                  const correctCount = attempted ? parseInt(parts[0], 10) || 0 : 0;
                  
                  return (
                    <div className="space-y-2">
                      {titles.map((title, idx) => {
                        let statusTag = "Not attempted";
                        let tagClass = "bg-slate-100 text-slate-650 dark:bg-white/5 dark:text-slate-400";
                        
                        if (attempted) {
                          if (idx < correctCount) {
                            statusTag = "Correct";
                            tagClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
                          } else {
                            statusTag = "Incorrect";
                            tagClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
                          }
                        }
                        
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                            <span className="font-semibold text-slate-700 dark:text-slate-350">{title}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tagClass}`}>{statusTag}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Daily Challenge MCQ */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1">
                  Daily Challenge MCQ ({getChallengeMcqStats(selectedMcqDay)})
                </h3>
                {(() => {
                  const titles = getMcqTitlesForDay("Daily Challenge", selectedMcqDay);
                  const challengeMcq = getChallengeMcqStats(selectedMcqDay);
                  if (titles.length === 0) return <p className="text-xs italic text-slate-400">No daily challenge MCQs completed or assigned on this day.</p>;
                  
                  const parts = challengeMcq.split('/');
                  const attempted = parts[0] !== '—';
                  const correctCount = attempted ? parseInt(parts[0], 10) || 0 : 0;
                  
                  return (
                    <div className="space-y-2">
                      {titles.map((title, idx) => {
                        let statusTag = "Not attempted";
                        let tagClass = "bg-slate-100 text-slate-650 dark:bg-white/5 dark:text-slate-400";
                        
                        if (attempted) {
                          if (idx < correctCount) {
                            statusTag = "Correct";
                            tagClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
                          } else {
                            statusTag = "Incorrect";
                            tagClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
                          }
                        }
                        
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                            <span className="font-semibold text-slate-700 dark:text-slate-350">{title}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tagClass}`}>{statusTag}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPerformanceDay && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" onClick={() => setSelectedPerformanceDay(null)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Scores Breakdown - Day {selectedPerformanceDay}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{name}</p>
              </div>
              <button onClick={() => setSelectedPerformanceDay(null)} className="text-sm font-semibold text-slate-400 hover:text-slate-600">Close</button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Daily Tasks Card */}
                <div className="border border-black/5 dark:border-white/10 p-5 rounded-xl bg-slate-50/50 dark:bg-white/5 space-y-4">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Daily Tasks Score Details</h4>
                  {batchStudentData?.dayWiseHistoryTasksDetail?.[selectedPerformanceDay] ? (
                    <div className="space-y-2 text-xs">
                      {Object.entries(batchStudentData.dayWiseHistoryTasksDetail[selectedPerformanceDay]).map(([key, val]) => {
                        if (!val || val === '—') return null;
                        const label = key === 'mcq' ? 'MCQ Tasks' : key === 'sql' ? 'SQL Tasks' : 'Coding Tasks';
                        if (key === 'coding') {
                          const parts = val.split('/');
                          const accuracy = parts[0] === '—' ? 0 : parseInt(parts[0], 10);
                          const maxAccuracy = parseInt(parts[1], 10) || 100;
                          const passedCount = accuracy >= 100 ? 1 : 0;
                          const totalCount = 1;
                          return (
                            <div key={key} className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                              <span>{label}:</span>
                              <span className="font-bold">
                                {passedCount}/{totalCount} (Score: {accuracy}/{maxAccuracy})
                              </span>
                            </div>
                          );
                        } else {
                          const parts = val.split('/');
                          const correct = parts[0] === '—' ? 0 : parseInt(parts[0], 10);
                          const total = parseInt(parts[1], 10) || 0;
                          return (
                            <div key={key} className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                              <span>{label}:</span>
                              <span className="font-bold">
                                {correct}/{total} (Score: {correct}/{total})
                              </span>
                            </div>
                          );
                        }
                      })}
                      {Object.values(batchStudentData.dayWiseHistoryTasksDetail[selectedPerformanceDay]).every(v => !v || v === '—') && (
                        <p className="text-xs italic text-slate-400 text-center py-4">No tasks assigned or attempted this day.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400 text-center py-6">No tasks recorded this day.</p>
                  )}
                </div>

                {/* Daily Challenges Card */}
                <div className="border border-black/5 dark:border-white/10 p-5 rounded-xl bg-slate-50/50 dark:bg-white/5 space-y-4">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Daily Challenges Score Details</h4>
                  {batchStudentData?.dayWiseHistoryChallengesDetail?.[selectedPerformanceDay] ? (
                    <div className="space-y-2 text-xs">
                      {(() => {
                        const detailsList = [];
                        const challengeDetail = batchStudentData.dayWiseHistoryChallengesDetail[selectedPerformanceDay] || {};
                        Object.entries(challengeDetail).forEach(([subType, sections]) => {
                          if (sections && typeof sections === 'object') {
                            Object.entries(sections).forEach(([section, val]) => {
                              if (!val || val === '—') return;
                              const parts = val.split('/');
                              const earned = parts[0] === '—' ? 0 : parseFloat(parts[0]);
                              const max = parseFloat(parts[1]) || 0;
                              
                              let label = '';
                              if (subType === 'mcq') {
                                const labelMap = {
                                  java: 'Java MCQ',
                                  dsa: 'DSA MCQ',
                                  sql: 'SQL MCQ',
                                  aptitude: 'Aptitude MCQ',
                                  technical: 'Technical MCQ'
                                };
                                label = labelMap[section] || `${section.toUpperCase()} MCQ`;
                              } else {
                                const labelMap = {
                                  java: 'Java Coding',
                                  dsa: 'DSA Coding',
                                  sql: 'SQL Coding',
                                  aptitude: 'Aptitude Coding',
                                  technical: 'Technical Coding'
                                };
                                label = labelMap[section] || `${section.toUpperCase()} Coding`;
                              }

                              if (subType === 'coding') {
                                const totalQuestions = 1;
                                const correctQuestions = earned >= max ? 1 : 0;
                                detailsList.push(
                                  <div key={`${subType}-${section}`} className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                                    <span>{label}:</span>
                                    <span className="font-bold">
                                      {correctQuestions}/{totalQuestions} (Score: {earned}/{max})
                                    </span>
                                  </div>
                                );
                              } else {
                                detailsList.push(
                                  <div key={`${subType}-${section}`} className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                                    <span>{label}:</span>
                                    <span className="font-bold">
                                      {earned}/{max} (Score: {earned}/{max})
                                    </span>
                                  </div>
                                );
                              }
                            });
                          }
                        });
                        return detailsList.length > 0 ? detailsList : <p className="text-xs italic text-slate-400 text-center py-4">No challenges assigned or attempted this day.</p>;
                      })()}
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400 text-center py-6">No challenges completed this day.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
