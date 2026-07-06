import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import { adminAPI, preferRemoteData } from '../../services/adminApi';
import { FiArrowLeft, FiUsers, FiActivity, FiTrendingUp, FiClock, FiBriefcase, FiCalendar, FiBookOpen, FiPlus, FiSearch, FiChevronDown, FiUserMinus } from 'react-icons/fi';

const fallbackBatchMap = {};

const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';
const studentFormInputClass = 'w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35';

const BatchDetails = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { batchId } = useParams();
  const isDarkMode = theme === 'dark';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [batchDetail, setBatchDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('students');
  const [expandedTracks, setExpandedTracks] = useState({});

  const toggleTrack = (trackId) => {
    setExpandedTracks((prev) => ({
      ...prev,
      [trackId]: !prev[trackId],
    }));
  };

  // States for student management and search
  const [colleges, setColleges] = useState([]);
  const [batches, setBatches] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedAttachedCourseId, setSelectedAttachedCourseId] = useState('');
  const [isSavingAttachedCourse, setIsSavingAttachedCourse] = useState(false);
  const [attachedCourseError, setAttachedCourseError] = useState('');
  const [attachedCourseMessage, setAttachedCourseMessage] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('All Status');
  const [studentSortOrder, setStudentSortOrder] = useState('rank-asc');
  const [reportStatusFilter, setReportStatusFilter] = useState('All');
  const [reportSortOrder, setReportSortOrder] = useState('default');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [studentMode, setStudentMode] = useState('existing');
  const [existingStudentResults, setExistingStudentResults] = useState([]);
  const [existingStudentQuery, setExistingStudentQuery] = useState('');
  const [existingStudentCollegeId, setExistingStudentCollegeId] = useState('');
  const [existingStudentStatus, setExistingStudentStatus] = useState('');
  const [existingStudentSort, setExistingStudentSort] = useState('name-asc');
  const [isSearchingExistingStudents, setIsSearchingExistingStudents] = useState(false);
  const [existingStudentSearchTotal, setExistingStudentSearchTotal] = useState(0);
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState('');
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: '', email: '', collegeId: '', batchId: '', track: '', status: 'Active' });
  const [formError, setFormError] = useState('');
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [isRemovingStudent, setIsRemovingStudent] = useState(false);
  const [activeScoreTooltip, setActiveScoreTooltip] = useState(null);
  const [activeDayScoreTooltip, setActiveDayScoreTooltip] = useState(null);

  const [selectedChallengeScore, setSelectedChallengeScore] = useState(null);

  const [reviewSubmission, setReviewSubmission] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [activeReviewProblemIdx, setActiveReviewProblemIdx] = useState(null);

  const handleReviewSubmission = async (submissionId, studentName) => {
    try {
      setActiveReviewProblemIdx(null);
      setReviewLoading(true);
      if (!submissionId) {
        setReviewSubmission({ student: studentName, isChallenge: true, problems: [], loading: false });
        return;
      }
      setReviewSubmission({ id: submissionId, student: studentName, loading: true });
      const response = await adminAPI.getSubmission(submissionId);
      if (response?.success && response?.data) {
        setReviewSubmission(response.data);
      } else {
        setReviewSubmission({ student: studentName, isChallenge: true, problems: [], loading: false });
      }
    } catch (err) {
      console.error(err);
      setReviewSubmission({ student: studentName, isChallenge: true, problems: [], loading: false });
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    
    // Load metadata when page mounts
    Promise.all([
      adminAPI.getColleges().catch(() => []),
      adminAPI.getBatches().catch(() => []),
      adminAPI.getTrackTemplates().catch(() => []),
      adminAPI.getCourses().catch(() => ({ courses: [] })),
    ]).then(([remoteColleges, remoteBatches, remoteTracks, remoteCourses]) => {
      const normalizedColleges = preferRemoteData(remoteColleges, []).map((college) => ({ id: college.id || college._id, name: college.name || 'Untitled College' }));
      const normalizedBatches = preferRemoteData(remoteBatches, []).map((b) => ({ id: b.id || b._id, name: b.name || b.id || 'Untitled Batch', college: b.college || '' }));
      const normalizedTracks = preferRemoteData(remoteTracks, []).map((track) => track.name).filter(Boolean);
      const normalizedCourses = (Array.isArray(remoteCourses?.courses) ? remoteCourses.courses : [])
        .map((course) => ({
          id: String(course._id || course.courseId || course.id || ''),
          title: String(course.title || 'Untitled Course'),
          description: String(course.description || ''),
          numTopics: Number(course.numTopics || course.topicIds?.length || 0),
        }))
        .filter((course) => course.id);
      const uniqueTracks = Array.from(new Set(normalizedTracks)).filter((t) => t !== 'General Track');
      setColleges(normalizedColleges);
      setBatches(normalizedBatches);
      setTracks(uniqueTracks);
      setCourses(normalizedCourses);
    }).catch(() => {});
  }, []);

  const batch = useMemo(() => {
    if (batchDetail) {
      return batchDetail;
    }

    const stateBatch = location.state?.batch;
    const base = stateBatch?.id === batchId
      ? { ...stateBatch }
      : {
      id: batchId,
      name: 'Batch',
      college: 'Unknown College',
      status: 'Active',
      start: 'TBD',
      students: 0,
      avgScore: 0,
      avgStreakDays: 0,
      tracks: [],
      studentsTable: [],
      };

    return {
      ...base,
      tracks: Array.isArray(base.tracks) ? base.tracks : [],
      studentsTable: base.studentsTable && base.studentsTable.length ? base.studentsTable : [
        { name: 'No enrolled students', email: '-', score: 0, streak: '-' },
      ],
    };
  }, [batchDetail, location.state, batchId]);

  useEffect(() => {
    setSelectedAttachedCourseId(batch?.attachedCourse?.id ? String(batch.attachedCourse.id) : '');
  }, [batch?.attachedCourse?.id]);

  useEffect(() => {
    let cancelled = false;

    const fetchBatch = () => {
      adminAPI
        .getBatch(batchId)
        .then((remoteBatch) => {
          if (!cancelled) {
            setBatchDetail(preferRemoteData(remoteBatch, null));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setBatchDetail(null);
          }
        });
    };

    fetchBatch();
    const interval = setInterval(fetchBatch, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [batchId]);

  const filteredBatchOptions = useMemo(() => {
    if (!studentForm.collegeId) return batches;
    const selectedCollege = colleges.find((college) => college.id === studentForm.collegeId);
    if (!selectedCollege) return batches;
    return batches.filter((b) => b.college === selectedCollege.name);
  }, [studentForm.collegeId, batches, colleges]);

  const openAddStudent = () => {
    setFormError('');
    const currentBatchCollegeName = batch.college;
    const matchingCollege = colleges.find((college) => college.name === currentBatchCollegeName);
    
    setStudentForm({
      name: '',
      email: '',
      collegeId: matchingCollege?.id || '',
      batchId: batch.id || batchId || '',
      track: batch.tracks?.[0]?.name || tracks?.[0] || '',
      status: 'Active'
    });
    setStudentMode('existing');
    setSelectedExistingStudentId('');
    setExistingStudentResults([]);
    setExistingStudentQuery('');
    setExistingStudentSearchTotal(0);
    setExistingStudentStatus('');
    setExistingStudentSort('name-asc');
    setExistingStudentCollegeId('');
    setIsAddFormOpen(true);
  };

  useEffect(() => {
    if (!isAddFormOpen || studentMode !== 'existing') return undefined;

    const query = existingStudentQuery.trim();
    if (query.length < 2) {
      setExistingStudentResults([]);
      setExistingStudentSearchTotal(0);
      setIsSearchingExistingStudents(false);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearchingExistingStudents(true);
      try {
        const result = await adminAPI.searchExistingStudents({
          q: query,
          collegeId: existingStudentCollegeId,
          excludeBatchId: batch.id || batchId,
          status: existingStudentStatus,
          sort: existingStudentSort,
          limit: 20,
        });
        if (!cancelled) {
          setExistingStudentResults(result?.items || []);
          setExistingStudentSearchTotal(result?.total || 0);
        }
      } catch (error) {
        if (!cancelled) {
          setExistingStudentResults([]);
          setExistingStudentSearchTotal(0);
          setFormError(error.message || 'Unable to search existing students.');
        }
      } finally {
        if (!cancelled) setIsSearchingExistingStudents(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isAddFormOpen, studentMode, existingStudentQuery, existingStudentCollegeId, existingStudentStatus, existingStudentSort, batch.id, batchId]);

  const saveStudent = async () => {
    if (studentMode === 'existing') {
      const selectedStudent = existingStudentResults.find((student) => String(student.id || student._id) === String(selectedExistingStudentId));
      if (!selectedStudent) return setFormError('Select an existing student.');

      setFormError('');
      setIsSavingStudent(true);
      try {
        await adminAPI.updateStudent(selectedStudent.id || selectedStudent._id, {
          name: selectedStudent.name,
          email: selectedStudent.email,
          collegeId: studentForm.collegeId,
          batchId: studentForm.batchId,
          primaryTrack: studentForm.track || selectedStudent.track || 'General Track',
          programSelection: selectedStudent.programSelection || 'Placement Sprint',
          status: studentForm.status || selectedStudent.status || 'Active',
        });
        const remoteBatch = await adminAPI.getBatch(batchId);
        setBatchDetail(preferRemoteData(remoteBatch, null));
        setIsAddFormOpen(false);
      } catch (error) {
        setFormError(error.message || 'Failed to add existing student to this batch');
      } finally {
        setIsSavingStudent(false);
      }
      return;
    }

    if (!studentForm.name.trim()) return setFormError('Name is required');
    if (!studentForm.email.trim()) return setFormError('Email is required');
    if (!studentForm.collegeId) return setFormError('College is required');
    if (!studentForm.batchId) return setFormError('Batch is required');

    setFormError('');
    setIsSavingStudent(true);
    try {
      const payload = {
        name: studentForm.name.trim(),
        email: studentForm.email.trim().toLowerCase(),
        collegeId: studentForm.collegeId,
        batchId: studentForm.batchId,
        primaryTrack: studentForm.track.trim() || 'General Track',
        status: studentForm.status,
      };
      await adminAPI.createStudent(payload);
      
      const remoteBatch = await adminAPI.getBatch(batchId);
      setBatchDetail(preferRemoteData(remoteBatch, null));
      setIsAddFormOpen(false);
    } catch (error) {
      setFormError(error.message || 'Failed to save student');
    } finally {
      setIsSavingStudent(false);
    }
  };

  const removeStudentFromBatch = async () => {
    if (!studentToRemove?.id) return;

    setFormError('');
    setIsRemovingStudent(true);
    try {
      await adminAPI.removeStudentFromBatch(studentToRemove.id, batch.id || batchId);
      const remoteBatch = await adminAPI.getBatch(batchId);
      setBatchDetail(preferRemoteData(remoteBatch, null));
      setStudentToRemove(null);
    } catch (error) {
      setFormError(error.message || 'Failed to remove student from batch.');
    } finally {
      setIsRemovingStudent(false);
    }
  };

  const updateAttachedCourse = async (nextCourseId = selectedAttachedCourseId) => {
    setAttachedCourseError('');
    setAttachedCourseMessage('');
    setIsSavingAttachedCourse(true);
    try {
      await adminAPI.updateBatch(batch.id || batchId, {
        name: batch.name,
        status: batch.status,
        startDate: batch.startDateValue,
        expiryDate: batch.expiryDateValue,
        batchSize: batch.batchSize,
        programSelection: batch.programSelection || 'Placement Sprint',
        assignedTrackTemplateIds: batch.assignedTrackTemplateIds || [],
        attachedCourse: nextCourseId || null,
      });
      const remoteBatch = await adminAPI.getBatch(batchId);
      setBatchDetail(preferRemoteData(remoteBatch, null));
      setAttachedCourseMessage(nextCourseId ? 'Course attached to this batch.' : 'Course removed from this batch.');
    } catch (error) {
      setAttachedCourseError(error.message || 'Failed to update attached course.');
    } finally {
      setIsSavingAttachedCourse(false);
    }
  };

  const filteredStudents = useMemo(() => {
    const table = batch.studentsTable || [];
    const isPlaceholder = table.length === 1 && table[0].name === 'No enrolled students' && table[0].email === '-';
    const studentsList = isPlaceholder ? [] : table;

    const q = tableSearch.trim().toLowerCase();
    return studentsList
      .filter((student) => {
        const matchesSearch = !q ||
          (student.name || '').toLowerCase().includes(q) ||
          (student.email || '').toLowerCase().includes(q);
        const matchesStatus = studentStatusFilter === 'All Status' || student.status === studentStatusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((left, right) => {
        if (studentSortOrder === 'name-asc') {
          return (left.name || '').localeCompare(right.name || '', undefined, { sensitivity: 'base' });
        }
        if (studentSortOrder === 'name-desc') {
          return (right.name || '').localeCompare(left.name || '', undefined, { sensitivity: 'base' });
        }
        if (studentSortOrder === 'score-desc') {
          const getVal = (s) => {
            if (!s.todayScore || s.todayScore === '—') return -1;
            const [num, den] = s.todayScore.split('/').map(Number);
            return den ? num / den : num || 0;
          };
          return getVal(right) - getVal(left);
        }
        if (studentSortOrder === 'score-asc') {
          const getVal = (s) => {
            if (!s.todayScore || s.todayScore === '—') return 9999;
            const [num, den] = s.todayScore.split('/').map(Number);
            return den ? num / den : num || 0;
          };
          return getVal(left) - getVal(right);
        }
        if (studentSortOrder === 'xp-desc') {
          return (right.totalXp || 0) - (left.totalXp || 0);
        }
        if (studentSortOrder === 'xp-asc') {
          return (left.totalXp || 0) - (right.totalXp || 0);
        }
        if (studentSortOrder === 'rank-asc') {
          const getRank = (s) => {
            if (!s.leaderboardRank || s.leaderboardRank === '—') return 999999;
            return Number(s.leaderboardRank) || 999999;
          };
          return getRank(left) - getRank(right);
        }
        return 0;
      });
  }, [batch.studentsTable, tableSearch, studentStatusFilter, studentSortOrder]);

  const maxTrackDays = batch.maxTrackDays || 30;

  const getFormattedDayHeader = useCallback((dayNum) => {
    if (!batch.startDateValue) return `Day ${dayNum}`;
    const startDate = new Date(batch.startDateValue);
    const targetDate = new Date(startDate.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000);
    const options = { day: 'numeric', month: 'short' };
    return `Day ${dayNum} - ${targetDate.toLocaleDateString('en-US', options)}`;
  }, [batch.startDateValue]);

  const getAttemptedCountForDay = useCallback((dayNum, historyKey = 'dayWiseHistoryTasks') => {
    const table = batch.studentsTable || [];
    const isPlaceholder = table.length === 1 && table[0].name === 'No enrolled students' && table[0].email === '-';
    if (isPlaceholder) return 0;
    return table.filter(student => {
      const score = student[historyKey]?.[dayNum];
      return score && score !== 'NIL' && score !== 'NA' && score !== '—';
    }).length;
  }, [batch.studentsTable]);

  const getAverageScoreForDay = useCallback((dayNum, historyKey = 'dayWiseHistoryTasks') => {
    const table = batch.studentsTable || [];
    const isPlaceholder = table.length === 1 && table[0].name === 'No enrolled students' && table[0].email === '-';
    if (isPlaceholder) return '—';
    const scores = [];
    let maxDen = 0;
    table.forEach(student => {
      const score = student[historyKey]?.[dayNum];
      if (score && score !== 'NIL' && score !== 'NA' && score !== '—') {
        const parts = score.split('/');
        if (parts.length === 2) {
          scores.push(parseFloat(parts[0]));
          const den = parseInt(parts[1], 10);
          if (den > maxDen) maxDen = den;
        }
      }
    });
    if (scores.length === 0) return '—';
    const sum = scores.reduce((s, v) => s + v, 0);
    const avgVal = sum / scores.length;
    const avg = avgVal % 1 === 0 ? avgVal.toString() : avgVal.toFixed(1);
    return `${avg}/${maxDen}`;
  }, [batch.studentsTable]);

  const filteredReportStudents = useMemo(() => {
    const table = batch.studentsTable || [];
    const isPlaceholder = table.length === 1 && table[0].name === 'No enrolled students' && table[0].email === '-';
    const studentsList = isPlaceholder ? [] : table;

    let list = [...studentsList];
    
    // 1. Search Filter
    const q = tableSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(student => 
        (student.name || '').toLowerCase().includes(q) ||
        (student.email || '').toLowerCase().includes(q)
      );
    }
    
    // 2. Status Filter
    const today = batchDetail?.dayNumber || 1;
    if (reportStatusFilter === 'Attempted Today') {
      list = list.filter(student => {
        const scoreT = student.dayWiseHistoryTasks?.[today];
        const scoreC = student.dayWiseHistoryChallenges?.[today];
        const attemptedT = scoreT && scoreT !== 'NIL' && scoreT !== 'NA' && scoreT !== '—';
        const attemptedC = scoreC && scoreC !== 'NIL' && scoreC !== 'NA' && scoreC !== '—';
        return attemptedT || attemptedC;
      });
    } else if (reportStatusFilter === 'Not Attempted Today') {
      list = list.filter(student => {
        const scoreT = student.dayWiseHistoryTasks?.[today];
        const scoreC = student.dayWiseHistoryChallenges?.[today];
        const attemptedT = scoreT && scoreT !== 'NIL' && scoreT !== 'NA' && scoreT !== '—';
        const attemptedC = scoreC && scoreC !== 'NIL' && scoreC !== 'NA' && scoreC !== '—';
        return !attemptedT && !attemptedC;
      });
    } else if (reportStatusFilter === 'Completed') {
      list = list.filter(student => student.status === 'Completed');
    } else if (reportStatusFilter === 'In Progress') {
      list = list.filter(student => student.status === 'In Progress');
    } else if (reportStatusFilter === 'Not Started') {
      list = list.filter(student => student.status === 'Not Started' || student.status === 'Absent');
    }
    
    // 3. Sorting
    if (reportSortOrder !== 'default') {
      list.sort((a, b) => {
        const getAvg = (student, key) => {
          let scoreSum = 0;
          let count = 0;
          Object.keys(student[key] || {}).forEach(k => {
            const val = student[key][k];
            if (val && val !== 'NIL' && val !== 'NA' && val !== '—') {
              const parts = val.split('/');
              if (parts.length === 2) {
                scoreSum += parseFloat(parts[0]) / parseFloat(parts[1]);
                count++;
              }
            }
          });
          return count > 0 ? scoreSum / count : 0;
        };

        if (reportSortOrder === 'tasks-low-to-high') {
          return getAvg(a, 'dayWiseHistoryTasks') - getAvg(b, 'dayWiseHistoryTasks');
        } else if (reportSortOrder === 'tasks-high-to-low') {
          return getAvg(b, 'dayWiseHistoryTasks') - getAvg(a, 'dayWiseHistoryTasks');
        } else if (reportSortOrder === 'challenge-low-to-high') {
          return getAvg(a, 'dayWiseHistoryChallenges') - getAvg(b, 'dayWiseHistoryChallenges');
        } else if (reportSortOrder === 'challenge-high-to-low') {
          return getAvg(b, 'dayWiseHistoryChallenges') - getAvg(a, 'dayWiseHistoryChallenges');
        }
        return 0;
      });
    }
    
    return list;
  }, [batch.studentsTable, tableSearch, reportStatusFilter, reportSortOrder, batchDetail]);

  const formatScore = (student) => {
    if (student.todayScore !== 'View Scores') return student.todayScore || '—';
    return Object.values(student.todayScoresDetail || {})
      .filter((score) => score && score !== '—')
      .join(' · ') || '—';
  };

  const formatLastAttempt = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const formatEmail = (email) => {
    if (!email) return '—';
    const [username, domain] = email.split('@');
    if (!domain) return email;
    if (username.length > 8) {
      return `${username.substring(0, 8)}...@${domain}`;
    }
    return email;
  };

  const statusPillClass = (status) => {
    if (status === 'Completed') return 'bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/20';
    if (status === 'In Progress') return 'bg-[#3c83f6]/10 text-[#3c83f6] border border-[#3c83f6]/20';
    if (status === 'Not Started') return 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50';
    if (status === 'Absent') return 'bg-[#ef4444]/10 text-[#ef4444] dark:bg-[#ef4444]/15 dark:text-[#ef4444] border border-[#ef4444]/20';
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50';
  };

  const renderDaySections = (dayItem) => {
    if (typeof dayItem === 'string') {
      return (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {(dayItem || '').split(', ').map((qTitle, qIdx) => (
            <span key={qIdx} className="inline-flex items-center rounded-md bg-slate-50 dark:bg-[#12285a] px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-200 border border-black/5 dark:border-white/5 shadow-sm break-words max-w-full">
              {qTitle}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {dayItem.mcq && dayItem.mcq.length > 0 && (
          <div className="space-y-1">
            <span className="block text-[9px] font-bold text-[#3C83F6] dark:text-[#5f98ef] uppercase tracking-wider">Quiz / MCQ</span>
            <div className="flex flex-wrap gap-1">
              {dayItem.mcq.map((title, idx) => (
                <span key={idx} className="inline-flex items-center rounded bg-slate-100 dark:bg-[#18326a] px-1.5 py-0.5 text-[9px] font-medium text-slate-700 dark:text-slate-200 shadow-sm border border-black/5 dark:border-white/5">
                  {title}
                </span>
              ))}
            </div>
          </div>
        )}
        {dayItem.coding && dayItem.coding.length > 0 && (
          <div className="space-y-1">
            <span className="block text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Coding</span>
            <div className="flex flex-wrap gap-1">
              {dayItem.coding.map((title, idx) => (
                <span key={idx} className="inline-flex items-center rounded bg-emerald-50 dark:bg-[#0c3c25] px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-500/10 dark:border-emerald-500/10">
                  {title}
                </span>
              ))}
            </div>
          </div>
        )}
        {dayItem.sql && dayItem.sql.length > 0 && (
          <div className="space-y-1">
            <span className="block text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">SQL</span>
            <div className="flex flex-wrap gap-1">
              {dayItem.sql.map((title, idx) => (
                <span key={idx} className="inline-flex items-center rounded bg-amber-50 dark:bg-[#432d0f] px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:text-amber-300 shadow-sm border border-amber-500/10 dark:border-amber-500/10">
                  {title}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      <style>{`
        .no-scrollbar-custom::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar-custom {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
      <div
        className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]'
            : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'
        }`}
      />

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main
          onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)}
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-[1600px] mx-auto space-y-8">


          <section className="space-y-8">
            <button
              onClick={() => navigate('/batches')}
              className="inline-flex items-center gap-2 text-base text-black/55 dark:text-white/55 hover:text-black/80 dark:hover:text-white/80 transition-colors -ml-1"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Batches
            </button>

            <div className="flex flex-wrap items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3C83F6] to-[#5f98ef] text-white flex items-center justify-center text-xl font-semibold shadow-sm">
                {batch.name?.charAt(0) || 'B'}
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black/90 dark:text-white">{batch.name || batch.id}</h2>
                <p className="mt-0.5 text-xs sm:text-sm text-black/55 dark:text-white/55 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5"><FiBriefcase className="w-3.5 h-3.5" />{batch.college}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1.5"><FiCalendar className="w-3.5 h-3.5" />Started: {batch.start}</span>
                  <span>•</span>
                  <span>{batch.students} Students</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl p-3.5 space-y-2 hover:shadow-md transition-shadow">
                <p className="flex items-center gap-2 text-black/55 dark:text-white/60"><FiUsers className="w-4 h-4" /><span className="text-xs font-medium">Total Students</span></p>
                <p className="text-xl font-semibold text-black dark:text-white leading-none">{batch.totalStudents ?? batch.students ?? 0}</p>
              </div>
              <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl p-3.5 space-y-2 hover:shadow-md transition-shadow">
                <p className="flex items-center gap-2 text-black/55 dark:text-white/60"><FiActivity className="w-4 h-4" /><span className="text-xs font-medium">Active Students Today</span></p>
                <p className="text-xl font-semibold text-black dark:text-white leading-none">{batch.activeStudentsToday ?? 0}</p>
              </div>
              <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl p-3.5 space-y-2 hover:shadow-md transition-shadow">
                <p className="flex items-center gap-2 text-black/55 dark:text-white/60"><FiTrendingUp className="w-4 h-4" /><span className="text-xs font-medium">Inactive Students Today</span></p>
                <p className="text-xl font-semibold text-black dark:text-white leading-none">{batch.inactiveStudentsToday ?? 0}</p>
              </div>
              <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl p-3.5 space-y-2 hover:shadow-md transition-shadow">
                <p className="flex items-center gap-2 text-black/55 dark:text-white/60"><FiBookOpen className="w-4 h-4" /><span className="text-xs font-medium">Current Active Track</span></p>
                <div className="text-[12px] md:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug break-words">
                  {batch.currentActiveTrack || batch.assignedTrack || 'None'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
            <div className="space-y-3">
              <h3 className="admin-section-heading">Attached Tracks</h3>
              {Array.isArray(batch.tracks) && batch.tracks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  {batch.tracks.map((track, trackIdx) => {
                    const trackId = track.id || track._id || `track-${trackIdx}`;
                    const isExpanded = !!expandedTracks[trackId];
                    return (
                      <div key={trackId} className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl overflow-hidden shadow-sm hover:shadow transition-all duration-300 col-span-1">
                        <button
                          onClick={() => toggleTrack(trackId)}
                          className="w-full flex items-center justify-between px-3 py-2 text-left focus:outline-none hover:bg-slate-50/50 dark:hover:bg-white/[0.02] min-w-0"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="text-[#3C83F6] dark:text-[#3C83F6] font-bold text-[10px] select-none shrink-0">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate flex-1 min-w-0" title={track.name}>{track.name}</span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium shrink-0">({track.questionsAssigned})</span>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 border-t border-black/5 dark:border-white/5 bg-slate-50/[0.15] dark:bg-[#0c1836]/10">
                            <div className="flex flex-col gap-2 mt-2 max-h-64 overflow-y-auto pr-1 no-scrollbar-custom">
                              {track.days.length === 0 ? (
                                <p className="text-xs text-black/45 dark:text-white/50 py-2">No day assignments yet.</p>
                              ) : (
                                track.days.map((dayItem, index) => {
                                  const dayNum = typeof dayItem === 'object' ? dayItem.dayNumber : index + 1;
                                  return (
                                    <div key={`${trackId}-${index}`} className="bg-white dark:bg-[#122247]/30 rounded-xl p-2.5 border border-black/5 dark:border-white/10 space-y-1.5 shadow-sm min-h-[100px] max-h-32 overflow-y-auto pr-1 flex flex-col scrollbar-thin shrink-0">
                                      <span className="font-bold text-xs text-slate-700 dark:text-slate-300">Day {dayNum}</span>
                                      {renderDaySections(dayItem)}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 px-4 py-8 text-center text-xs sm:text-sm text-black/40 dark:text-white/40">
                  No tracks are attached to this batch yet.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="admin-section-heading">Attached Courses</h3>
              <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl p-4 shadow-sm space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#3C83F6]/10 dark:bg-[#3C83F6]/15 text-[#3C83F6] flex items-center justify-center shrink-0">
                    <FiBookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                      {batch.attachedCourse?.title || 'No course attached'}
                    </p>
                    <p className="mt-1 text-xs text-black/50 dark:text-white/50 leading-relaxed">
                      {batch.attachedCourse
                        ? `${batch.attachedCourse.numTopics || 0} topics available for day-wise notes.`
                        : 'Attach a Placement Sprint course so Today’s Notes can open the correct topic for each batch day.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
                  <div className="relative">
                    <select
                      value={selectedAttachedCourseId}
                      onChange={(e) => {
                        setSelectedAttachedCourseId(e.target.value);
                        setAttachedCourseError('');
                        setAttachedCourseMessage('');
                      }}
                      className="appearance-none w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#12285a] px-3 pr-9 text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30"
                    >
                      <option className={dropdownOptionClass} value="">No course attached</option>
                      {courses.map((course) => (
                        <option key={course.id} className={dropdownOptionClass} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                  </div>
                  <button
                    type="button"
                    onClick={() => updateAttachedCourse()}
                    disabled={isSavingAttachedCourse}
                    className="h-11 px-4 rounded-xl bg-[#061846] text-white text-sm font-semibold hover:bg-[#0b2465] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSavingAttachedCourse ? 'Saving...' : batch.attachedCourse ? 'Change Course' : 'Attach Course'}
                  </button>
                </div>

                {batch.attachedCourse && (
                  <button
                    type="button"
                    onClick={() => updateAttachedCourse('')}
                    disabled={isSavingAttachedCourse}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 disabled:opacity-60"
                  >
                    Remove attached course
                  </button>
                )}
                {attachedCourseMessage && <p className="text-xs font-medium text-emerald-500">{attachedCourseMessage}</p>}
                {attachedCourseError && <p className="text-xs font-medium text-rose-500">{attachedCourseError}</p>}
              </div>
            </div>
            </div>

            <div className="space-y-4">
              <div className="flex border-b border-black/10 dark:border-white/10 mt-2">
                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'students' ? 'border-[#3C83F6] text-[#3C83F6] dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  Students Table
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'reports' ? 'border-[#3C83F6] text-[#3C83F6] dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  Day Wise Reports
                </button>
              </div>

              {activeTab === 'students' ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between lg:justify-start lg:gap-12 gap-3 mt-1">
                    <h3 className="admin-section-heading whitespace-nowrap shrink-0">Students List</h3>
                    <div className="flex flex-row items-center justify-between md:justify-end gap-2.5 w-full md:w-auto lg:flex-1 shrink-0">
                      <div className="relative w-36 sm:w-44 md:w-48 lg:w-auto lg:flex-1">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/35 dark:text-white/35" />
                        <input
                           type="text"
                           placeholder="Search students..."
                           value={tableSearch}
                           onChange={(e) => setTableSearch(e.target.value)}
                           className="pl-9 pr-3 h-10 text-sm bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30 text-black/80 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 w-full"
                        />
                      </div>
                      <div className="relative w-28 sm:w-32">
                        <select
                           value={studentStatusFilter}
                           onChange={(e) => setStudentStatusFilter(e.target.value)}
                           className="appearance-none w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 pr-8 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30"
                        >
                           <option className={dropdownOptionClass} value="All Status">All Status</option>
                           <option className={dropdownOptionClass} value="Active">Active</option>
                           <option className={dropdownOptionClass} value="Not Started">Not Started</option>
                          <option className={dropdownOptionClass} value="In Progress">In Progress</option>
                          <option className={dropdownOptionClass} value="Completed">Completed</option>
                          <option className={dropdownOptionClass} value="Not Attempted">Not Attempted</option>
                          <option className={dropdownOptionClass} value="Absent">Absent</option>
                        </select>
                        <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                      </div>
                      <div className="relative w-32 sm:w-36 md:w-40">
                        <select
                           value={studentSortOrder}
                           onChange={(e) => setStudentSortOrder(e.target.value)}
                           className="appearance-none w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 pr-8 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30"
                        >
                          <option className={dropdownOptionClass} value="name-asc">Name: A to Z</option>
                          <option className={dropdownOptionClass} value="name-desc">Name: Z to A</option>
                          <option className={dropdownOptionClass} value="score-desc">Highest Score</option>
                          <option className={dropdownOptionClass} value="score-asc">Lowest Score</option>
                          <option className={dropdownOptionClass} value="xp-desc">Highest XP</option>
                          <option className={dropdownOptionClass} value="xp-asc">Lowest XP</option>
                          <option className={dropdownOptionClass} value="rank-asc">Leaderboard Rank</option>
                        </select>
                        <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                      </div>
                      <button
                        onClick={openAddStudent}
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#3C83F6] border border-[#3C83F6]/20 text-white hover:bg-[#2f73e0] text-sm font-semibold whitespace-nowrap"
                      >
                        <FiPlus className="w-3.5 h-3.5" />
                        Add Student
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1400px] table-auto">
                        <thead>
                          <tr className="border-b border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30">
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2 py-2 w-8 whitespace-nowrap">#</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2 py-2 w-32 whitespace-nowrap">Student Name</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2.5 py-2 whitespace-nowrap">Student Email</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2.5 py-2 whitespace-nowrap text-blue-600 dark:text-blue-300">Today's Challenge Score</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2.5 py-2 whitespace-nowrap text-blue-600 dark:text-blue-300">Today's Challenge XP</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2.5 py-2 whitespace-nowrap text-emerald-600 dark:text-emerald-300">Today's Task Score</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2.5 py-2 whitespace-nowrap text-emerald-600 dark:text-emerald-300">Today's Task XP</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2.5 py-2 whitespace-nowrap font-bold">Total XP</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2.5 py-2 whitespace-nowrap">Leaderboard Rank</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2.5 py-2 whitespace-nowrap">Last Attempt Date/Time</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2.5 py-2 whitespace-nowrap">Status</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2.5 py-2 whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student, index) => {
                            const isPlaceholder = student.name === 'No enrolled students' && student.email === '-';
                            return (
                              <tr key={`${student.email}-${index}`} className="border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors">
                                <td className="px-2 py-2 text-center text-[11px] sm:text-xs font-semibold text-black/45 dark:text-white/50 whitespace-nowrap">
                                  {isPlaceholder ? '-' : index + 1}
                                </td>
                                {isPlaceholder ? (
                                  <td colSpan={12} className="px-2 py-2 text-[11px] sm:text-xs font-medium text-black/45 dark:text-white/50 text-center whitespace-nowrap">
                                    No enrolled students
                                  </td>
                                ) : (
                                  <>
                                    <td className="px-2 py-2 text-center text-[11px] sm:text-xs font-medium text-black/85 dark:text-white/85 whitespace-nowrap max-w-[120px] truncate" title={student.name}>
                                      {student.name}
                                    </td>
                                    <td className="px-2.5 py-2 text-center text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                      {formatEmail(student.email)}
                                    </td>
                                    <td className="px-2.5 py-2 text-center whitespace-nowrap relative">
                                      {student.todayChallengeSubmissionId ? (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedChallengeScore({
                                            studentName: student.name,
                                            email: student.email,
                                            submissionId: student.todayChallengeSubmissionId,
                                            scoresDetail: student.todayChallengeScoresDetail,
                                          })}
                                          className="text-[11px] sm:text-xs font-semibold text-blue-600 hover:text-blue-700 underline dark:text-blue-300 dark:hover:text-blue-200"
                                        >
                                          View score
                                        </button>
                                      ) : (
                                        <span className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500">—</span>
                                      )}
                                    </td>
                                    <td className="px-2.5 py-2 text-center whitespace-nowrap">
                                      <span className="text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-300">
                                        {student.todayChallengeXp ? `+${student.todayChallengeXp} XP` : '—'}
                                      </span>
                                    </td>
                                    <td className="px-2.5 py-2 text-center whitespace-nowrap relative">
                                      {student.todayScore === 'View Scores' ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => setActiveScoreTooltip(activeScoreTooltip === `${student.email}-task` ? null : `${student.email}-task`)}
                                            className="text-[11px] sm:text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline dark:text-emerald-300 dark:hover:text-emerald-200"
                                          >
                                            View score
                                          </button>
                                          {activeScoreTooltip === `${student.email}-task` && (
                                            <div className={`absolute z-[100] ${index === 0 ? 'top-full mt-1' : 'bottom-full mb-1'} right-1/2 translate-x-1/2 bg-white dark:bg-[#0b1329] border border-black/10 dark:border-white/10 p-2.5 rounded-lg shadow-xl text-left min-w-[130px]`}>
                                              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 border-b border-black/5 dark:border-white/5 pb-1">Scores breakdown</div>
                                              {Object.entries(student.todayScoresDetail || {}).map(([key, scoreVal]) => {
                                                if (!scoreVal || scoreVal === '—') return null;
                                                const label = key === 'mcq' ? 'MCQ' : key === 'sql' ? 'SQL' : 'Coding';
                                                return (
                                                  <div key={key} className="flex justify-between gap-4 text-[11px] font-semibold py-0.5 text-slate-700 dark:text-slate-300">
                                                    <span>{label}</span>
                                                    <span>{scoreVal}</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                                          {student.todayScore || '—'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-2.5 py-2 text-center whitespace-nowrap">
                                      <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                                        {student.todayTaskXp ? `+${student.todayTaskXp} XP` : '—'}
                                      </span>
                                    </td>
                                    <td className="px-2.5 py-2 text-center text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                      {student.totalXp || 0} XP
                                    </td>
                                    <td className="px-2.5 py-2 text-center text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                      {student.leaderboardRank && student.leaderboardRank !== '—' && student.leaderboardRank !== '-' ? `#${student.leaderboardRank}` : '—'}
                                    </td>
                                    <td className="px-2.5 py-2 text-center text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                      {formatLastAttempt(student.lastAttemptAt)}
                                    </td>
                                    <td className="px-2.5 py-2 text-center whitespace-nowrap">
                                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusPillClass(student.status)}`}>
                                        {student.status || 'Not Started'}
                                      </span>
                                    </td>
                                    <td className="px-2.5 py-2 text-center whitespace-nowrap">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormError('');
                                          setStudentToRemove(student);
                                        }}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/15 bg-red-500/5 text-red-600 transition-colors hover:bg-red-500 hover:text-white dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-500 dark:hover:text-white"
                                        aria-label={`Remove ${student.name} from batch`}
                                        title="Remove from batch"
                                      >
                                        <FiUserMinus className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                          {filteredStudents.length === 0 && (
                            <tr>
                              <td colSpan={13} className="px-6 py-10 text-center text-sm text-black/40 dark:text-white/40">
                                No students match your search query.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between lg:justify-start lg:gap-12 gap-3 mt-1">
                    <h3 className="admin-section-heading">Day Wise Reports Matrix</h3>
                    <div className="flex flex-row items-center justify-between md:justify-end gap-2.5 w-full md:w-auto lg:flex-1 shrink-0">
                      <div className="relative w-36 sm:w-44 md:w-48 lg:w-56">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/35 dark:text-white/35" />
                        <input
                          type="text"
                          placeholder="Search students..."
                          value={tableSearch}
                          onChange={(e) => setTableSearch(e.target.value)}
                          className="pl-9 pr-3 h-10 text-sm bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30 text-black/80 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 w-full"
                        />
                      </div>
                      <div className="relative w-28 sm:w-32">
                        <select
                          value={reportStatusFilter}
                          onChange={(e) => setReportStatusFilter(e.target.value)}
                          className="appearance-none w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 pr-8 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30"
                        >
                          <option className={dropdownOptionClass} value="All">All Status</option>
                          <option className={dropdownOptionClass} value="Attempted Today">Attempted Today</option>
                          <option className={dropdownOptionClass} value="Not Attempted Today">Not Attempted Today</option>
                          <option className={dropdownOptionClass} value="Completed">Completed</option>
                          <option className={dropdownOptionClass} value="In Progress">In Progress</option>
                          <option className={dropdownOptionClass} value="Not Started">Not Started</option>
                        </select>
                        <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                      </div>
                      <div className="relative w-40 sm:w-48 md:w-56">
                        <select
                          value={reportSortOrder}
                          onChange={(e) => setReportSortOrder(e.target.value)}
                          className="appearance-none w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 pr-8 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30"
                        >
                          <option className={dropdownOptionClass} value="default">Default Sort</option>
                          <option className={dropdownOptionClass} value="tasks-low-to-high">Daily Tasks: Low to High</option>
                          <option className={dropdownOptionClass} value="tasks-high-to-low">Daily Tasks: High to Low</option>
                          <option className={dropdownOptionClass} value="challenge-low-to-high">Daily Challenges: Low to High</option>
                          <option className={dropdownOptionClass} value="challenge-high-to-low">Daily Challenges: High to Low</option>
                        </select>
                        <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* 1. Day-wise Summary Table */}
                    <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                      <div className="px-4 py-3 border-b border-black/5 dark:border-white/5 bg-slate-50/20 dark:bg-slate-900/10">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Day-wise Summary</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] table-auto border-collapse">
                          <thead>
                            <tr className="border-b border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30">
                              <th className="sticky left-0 bg-slate-50 dark:bg-slate-900/30 z-20 text-left text-[10px] sm:text-xs font-bold text-[#3C83F6] px-2.5 py-2 w-[220px] min-w-[220px] border-r border-black/5 dark:border-white/5">
                                Metric
                              </th>
                              {Array.from({ length: maxTrackDays }).map((_, index) => (
                                <th key={index} className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2 py-2 whitespace-nowrap">
                                  {getFormattedDayHeader(index + 1)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {/* Daily Tasks Metrics */}
                            <tr className="border-b border-black/5 dark:border-white/10 hover:bg-black/[0.01] dark:hover:bg-white/[0.02]">
                              <td className="sticky left-0 bg-white dark:bg-[#0f1f43] z-10 px-2.5 py-2 text-left text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 border-r border-black/5 dark:border-white/5 w-[220px] min-w-[220px]">
                                Attempted (Daily Tasks)
                              </td>
                              {Array.from({ length: maxTrackDays }).map((_, index) => {
                                const dayNum = index + 1;
                                const count = getAttemptedCountForDay(dayNum, 'dayWiseHistoryTasks');
                                return (
                                  <td key={index} className="px-2 py-2 text-center text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                    {count}
                                  </td>
                                );
                              })}
                            </tr>
                            <tr className="border-b border-black/5 dark:border-white/10 hover:bg-black/[0.01] dark:hover:bg-white/[0.02]">
                              <td className="sticky left-0 bg-white dark:bg-[#0f1f43] z-10 px-2.5 py-2 text-left text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 border-r border-black/5 dark:border-white/5 w-[220px] min-w-[220px]">
                                Average Score (Daily Tasks)
                              </td>
                              {Array.from({ length: maxTrackDays }).map((_, index) => {
                                const dayNum = index + 1;
                                const avg = getAverageScoreForDay(dayNum, 'dayWiseHistoryTasks');
                                return (
                                  <td key={index} className="px-2 py-2 text-center text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                    {avg}
                                  </td>
                                );
                              })}
                            </tr>
                            {/* Daily Challenges Metrics */}
                            <tr className="border-b border-black/5 dark:border-white/10 hover:bg-black/[0.01] dark:hover:bg-white/[0.02]">
                              <td className="sticky left-0 bg-white dark:bg-[#0f1f43] z-10 px-2.5 py-2 text-left text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-300 border-r border-black/5 dark:border-white/5 w-[220px] min-w-[220px]">
                                Attempted (Daily Challenges)
                              </td>
                              {Array.from({ length: maxTrackDays }).map((_, index) => {
                                const dayNum = index + 1;
                                const count = getAttemptedCountForDay(dayNum, 'dayWiseHistoryChallenges');
                                return (
                                  <td key={index} className="px-2 py-2 text-center text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-300 whitespace-nowrap">
                                    {count}
                                  </td>
                                );
                              })}
                            </tr>
                            <tr className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02]">
                              <td className="sticky left-0 bg-white dark:bg-[#0f1f43] z-10 px-2.5 py-2 text-left text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-300 border-r border-black/5 dark:border-white/5 w-[220px] min-w-[220px]">
                                Average Score (Daily Challenges)
                              </td>
                              {Array.from({ length: maxTrackDays }).map((_, index) => {
                                const dayNum = index + 1;
                                const avg = getAverageScoreForDay(dayNum, 'dayWiseHistoryChallenges');
                                return (
                                  <td key={index} className="px-2 py-2 text-center text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-300 whitespace-nowrap">
                                    {avg}
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 2. Student-wise Report Table */}
                    <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                      <div className="px-4 py-3 border-b border-black/5 dark:border-white/5 bg-slate-50/20 dark:bg-slate-900/10">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Student-wise Report</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] table-auto border-collapse">
                          <thead>
                            <tr className="border-b border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30">
                              <th className="sticky left-0 bg-slate-50 dark:bg-slate-900/30 z-30 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-0 py-2 whitespace-nowrap" style={{width: '2rem', minWidth: '2rem'}}>#</th>
                              <th className="sticky bg-slate-50 dark:bg-slate-900/30 z-30 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-3 py-2 min-w-[130px] border-r border-black/5 dark:border-white/5 whitespace-nowrap shadow-[8px_0_12px_-12px_rgba(15,23,42,0.5)]" style={{left: '2rem'}}>Student Name</th>
                              <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2 py-2 whitespace-nowrap">Track Type</th>
                              {Array.from({ length: maxTrackDays }).map((_, index) => (
                                <th key={index} className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2 py-2 whitespace-nowrap">
                                  {getFormattedDayHeader(index + 1)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredReportStudents.map((student, index) => {
                              const isPlaceholder = student.name === 'No enrolled students' && student.email === '-';
                              return (
                                <tr key={`${student.email}-${index}`} className="border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors">
                                  {isPlaceholder ? (
                                    <td colSpan={maxTrackDays + 3} className="px-2 py-2 text-[11px] sm:text-xs font-medium text-black/45 dark:text-white/50 text-center">
                                      No enrolled students
                                    </td>
                                  ) : (
                                    <>
                                  <td className="sticky z-20 bg-white dark:bg-[#0f1f43] text-center text-[11px] sm:text-xs font-semibold text-black/40 dark:text-white/40 whitespace-nowrap px-0" style={{left: 0, width: '2rem', minWidth: '2rem'}}>
                                    {index + 1}
                                  </td>
                                  <td className="sticky z-20 bg-white dark:bg-[#0f1f43] px-3 py-2 text-left text-[11px] sm:text-xs font-medium text-[#000]/85 dark:text-white/85 whitespace-nowrap border-r border-black/5 dark:border-white/5 overflow-hidden text-ellipsis shadow-[8px_0_12px_-12px_rgba(15,23,42,0.5)]" style={{left: '2rem', maxWidth: '130px'}} title={student.name}>
                                        {student.name}
                                      </td>
                                      <td className="px-4 py-2 text-center text-[11px] sm:text-xs font-semibold whitespace-nowrap">
                                        <div className="text-slate-500 dark:text-slate-400">Daily Tasks</div>
                                        <div className="text-blue-600 dark:text-blue-400 mt-2">Daily Challenge</div>
                                      </td>
                                      {Array.from({ length: maxTrackDays }).map((_, dIndex) => {
                                        const dayNum = dIndex + 1;
                                        const scoreTasks = student.dayWiseHistoryTasks?.[dayNum] || 'NA';
                                        const scoreChallenge = student.dayWiseHistoryChallenges?.[dayNum] || 'NA';
                                        
                                        let classT = "text-slate-500 dark:text-slate-400";
                                        if (scoreTasks === 'NIL') classT = "text-amber-500 dark:text-amber-400 font-semibold";
                                        else if (scoreTasks === 'NA') classT = "text-slate-300 dark:text-slate-650";
                                        else classT = "text-emerald-600 dark:text-emerald-400 font-semibold";

                                        let classC = "text-slate-550 dark:text-slate-450";
                                        if (scoreChallenge === 'NIL') classC = "text-amber-500 dark:text-amber-400 font-semibold";
                                        else if (scoreChallenge === 'NA') classC = "text-slate-300 dark:text-slate-650";
                                        else classC = "text-blue-600 dark:text-blue-400 font-semibold";

                                        return (
                                          <td key={dIndex} className="px-2 py-2 text-center text-[11px] sm:text-xs whitespace-nowrap relative">
                                            <div>
                                              {scoreTasks === 'View Scores' ? (
                                                <>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const key = `${student.email}-${dayNum}`;
                                                      setActiveDayScoreTooltip(activeDayScoreTooltip === key ? null : key);
                                                    }}
                                                    className="text-[11px] sm:text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline dark:text-emerald-300 dark:hover:text-emerald-200"
                                                  >
                                                    View score
                                                  </button>
                                                  {activeDayScoreTooltip === `${student.email}-${dayNum}` && (
                                                    <div className={`absolute z-[100] ${index === 0 ? 'top-full mt-1' : 'bottom-full mb-1'} right-1/2 translate-x-1/2 bg-white dark:bg-[#0b1329] border border-black/10 dark:border-white/10 p-2.5 rounded-lg shadow-xl text-left min-w-[130px]`}>
                                                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 border-b border-black/5 dark:border-white/5 pb-1">Scores breakdown</div>
                                                      {Object.entries(student.dayWiseHistoryTasksDetail?.[dayNum] || {}).map(([key, scoreVal]) => {
                                                        if (!scoreVal || scoreVal === '—') return null;
                                                        const label = key === 'mcq' ? 'MCQ' : key === 'sql' ? 'SQL' : 'Coding';
                                                        return (
                                                          <div key={key} className="flex justify-between gap-4 text-[11px] font-semibold py-0.5 text-slate-700 dark:text-slate-300">
                                                            <span>{label}</span>
                                                            <span>{scoreVal}</span>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}
                                                </>
                                              ) : (
                                                <span className={classT}>{scoreTasks}</span>
                                              )}
                                            </div>
                                            <div className={`${classC} mt-2`}>
                                              {student.dayWiseHistoryChallengesSubmissionIds?.[dayNum] ? (
                                                <button
                                                  type="button"
                                                  onClick={() => setSelectedChallengeScore({
                                                    studentName: student.name,
                                                    email: student.email,
                                                    submissionId: student.dayWiseHistoryChallengesSubmissionIds?.[dayNum],
                                                    scoresDetail: student.dayWiseHistoryChallengesDetail?.[dayNum],
                                                  })}
                                                  className="text-[11px] sm:text-xs font-semibold text-blue-600 hover:text-blue-700 underline dark:text-blue-300 dark:hover:text-blue-200"
                                                >
                                                  View score
                                                </button>
                                              ) : (
                                                <span className="text-slate-300 dark:text-slate-650">—</span>
                                              )}
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                            {filteredReportStudents.length === 0 && (
                              <tr>
                                <td colSpan={maxTrackDays + 2} className="px-6 py-10 text-center text-sm text-black/40 dark:text-white/40">
                                  No students match your search query.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      {studentToRemove && (
        <div className="fixed inset-0 z-[132] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => !isRemovingStudent && setStudentToRemove(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10">
              <h3 className="text-base font-semibold text-black/80 dark:text-white">Remove Student From Batch</h3>
              <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                Remove <span className="font-semibold text-black/80 dark:text-white">{studentToRemove.name}</span> from {batch.name}? Their profile and progress will stay intact.
              </p>
              {formError && <p className="mt-2 text-xs text-red-500">{formError}</p>}
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setStudentToRemove(null)}
                disabled={isRemovingStudent}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={removeStudentFromBatch}
                disabled={isRemovingStudent}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-red-500/30 bg-red-500 text-white hover:bg-red-600 disabled:opacity-70 transition-colors"
              >
                {isRemovingStudent ? 'Removing...' : 'Remove Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddFormOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsAddFormOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-white">Add Student</h2>
              <button onClick={() => setIsAddFormOpen(false)} className="text-sm text-black/40 dark:text-white/40">Close</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="inline-flex rounded-xl border border-black/10 dark:border-white/10 p-1 bg-black/[0.03] dark:bg-white/5">
                <button onClick={() => setStudentMode('existing')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${studentMode === 'existing' ? 'bg-white dark:bg-[#18365f] text-[#3C83F6] dark:text-white shadow-sm' : 'text-black/55 dark:text-white/60'}`}>Existing student</button>
                <button onClick={() => setStudentMode('new')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${studentMode === 'new' ? 'bg-white dark:bg-[#18365f] text-[#3C83F6] dark:text-white shadow-sm' : 'text-black/55 dark:text-white/60'}`}>New student</button>
              </div>
              {studentMode === 'existing' ? (
                <div className="space-y-3">
                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Find existing student*</label>
                    <div className="relative mt-1">
                      <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/45" />
                      <input
                        value={existingStudentQuery}
                        onChange={(e) => {
                          setExistingStudentQuery(e.target.value);
                          setSelectedExistingStudentId('');
                        }}
                        placeholder="Search name, email, or roll number"
                        className={`pl-9 ${studentFormInputClass}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="relative">
                      <select
                        value={existingStudentCollegeId}
                        onChange={(e) => {
                          setExistingStudentCollegeId(e.target.value);
                          setSelectedExistingStudentId('');
                        }}
                        className="appearance-none w-full px-3 py-2 pr-8 text-xs rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white outline-none"
                      >
                        <option className={dropdownOptionClass} value="">All Colleges</option>
                        {colleges.map((college) => <option className={dropdownOptionClass} key={college.id} value={college.id}>{college.name}</option>)}
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                    </div>
                    <div className="relative">
                      <select
                        value={existingStudentStatus}
                        onChange={(e) => {
                          setExistingStudentStatus(e.target.value);
                          setSelectedExistingStudentId('');
                        }}
                        className="appearance-none w-full px-3 py-2 pr-8 text-xs rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white outline-none"
                      >
                        <option className={dropdownOptionClass} value="">All Students</option>
                        <option className={dropdownOptionClass} value="Active">Active</option>
                        <option className={dropdownOptionClass} value="Inactive">Inactive</option>
                        <option className={dropdownOptionClass} value="Suspended">Suspended</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                    </div>
                    <div className="relative">
                      <select
                        value={existingStudentSort}
                        onChange={(e) => setExistingStudentSort(e.target.value)}
                        className="appearance-none w-full px-3 py-2 pr-8 text-xs rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white outline-none"
                      >
                        <option className={dropdownOptionClass} value="name-asc">Name A-Z</option>
                        <option className={dropdownOptionClass} value="name-desc">Name Z-A</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                    </div>
                  </div>

                  <div className="min-h-[128px] max-h-56 overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 bg-white/55 dark:bg-[#0f1f43]/70 divide-y divide-black/5 dark:divide-white/10">
                    {existingStudentQuery.trim().length < 2 ? (
                      <p className="px-3 py-8 text-center text-xs text-black/45 dark:text-white/45">Type at least two characters to search students.</p>
                    ) : isSearchingExistingStudents ? (
                      <p className="px-3 py-8 text-center text-xs text-black/45 dark:text-white/45">Searching students...</p>
                    ) : existingStudentResults.length === 0 ? (
                      <p className="px-3 py-8 text-center text-xs text-black/45 dark:text-white/45">No matching students outside this batch.</p>
                    ) : (
                      existingStudentResults.map((student) => {
                        const studentId = student.id || student._id;
                        const isSelected = String(studentId) === String(selectedExistingStudentId);
                        return (
                          <button
                            type="button"
                            key={studentId}
                            onClick={() => {
                              setSelectedExistingStudentId(studentId);
                              setStudentForm((prev) => ({ ...prev, track: student.track || prev.track, status: student.status || prev.status }));
                            }}
                            className={`w-full px-3 py-2.5 text-left transition-colors ${
                              isSelected
                                ? 'bg-[#001b4a] text-white dark:bg-[#7fb1ff] dark:text-[#06183d]'
                                : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className={`text-sm font-medium truncate ${isSelected ? 'text-white dark:text-[#06183d]' : 'text-slate-800 dark:text-white'}`}>{student.name}</p>
                                <p className={`mt-0.5 text-xs truncate ${isSelected ? 'text-white/75 dark:text-[#06183d]/75' : 'text-black/50 dark:text-white/55'}`}>{student.email}{student.rollNo ? ` · ${student.rollNo}` : ''}</p>
                              </div>
                              <div className="flex max-w-[42%] shrink-0 flex-col items-end gap-1">
                                {isSelected && (
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#001b4a] dark:bg-[#06183d] dark:text-white">
                                    Selected
                                  </span>
                                )}
                                <span className={`max-w-full truncate rounded-full px-2 py-0.5 text-[10px] ${
                                  isSelected
                                    ? 'bg-white/15 text-white dark:bg-[#06183d]/10 dark:text-[#06183d]'
                                    : 'bg-black/[0.05] text-black/55 dark:bg-white/[0.08] dark:text-white/60'
                                }`}>{student.batch}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                  {existingStudentQuery.trim().length >= 2 && !isSearchingExistingStudents && existingStudentSearchTotal > existingStudentResults.length && (
                    <p className="text-xs text-black/45 dark:text-white/45">Showing the first {existingStudentResults.length} of {existingStudentSearchTotal} matching students. Refine the search to narrow it down.</p>
                  )}
                  <p className="text-xs text-black/45 dark:text-white/45">The student will be moved to this batch. Their existing profile and progress stay intact.</p>
                </div>
              ) : (
                <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Name*</label>
                  <input value={studentForm.name} onChange={(e) => setStudentForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Student name" className={`mt-1 ${studentFormInputClass}`} />
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Email*</label>
                  <input type="email" value={studentForm.email} onChange={(e) => setStudentForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Student email" className={`mt-1 ${studentFormInputClass}`} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">College*</label>
                  <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                    <select value={studentForm.collegeId} onChange={(e) => setStudentForm((prev) => ({ ...prev, collegeId: e.target.value, batchId: '' }))} className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none">
                      <option className={dropdownOptionClass} value="">Select college</option>
                      {colleges.map((college) => <option className={dropdownOptionClass} key={college.id} value={college.id}>{college.name}</option>)}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                  </div>
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Batch*</label>
                  <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                    <select value={studentForm.batchId} onChange={(e) => setStudentForm((prev) => ({ ...prev, batchId: e.target.value }))} className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none">
                      <option className={dropdownOptionClass} value="">Select batch</option>
                      {filteredBatchOptions.map((b) => <option className={dropdownOptionClass} key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                  </div>
                </div>
              </div>
                </>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Track*</label>
                  <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                    <select
                      value={studentForm.track}
                      onChange={(e) => setStudentForm((prev) => ({ ...prev, track: e.target.value }))}
                      className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                    >
                      <option className={dropdownOptionClass} value="">Select track</option>
                      {tracks.map((trackName) => (
                        <option className={dropdownOptionClass} key={trackName} value={trackName}>
                          {trackName}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                  </div>
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Status</label>
                  <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                    <select value={studentForm.status} onChange={(e) => setStudentForm((prev) => ({ ...prev, status: e.target.value }))} className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none">
                      <option className={dropdownOptionClass} value="Active">Active</option>
                      <option className={dropdownOptionClass} value="Inactive">Inactive</option>
                      <option className={dropdownOptionClass} value="Suspended">Suspended</option>
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                  </div>
                </div>
              </div>
              {formError && <p className="text-xs text-red-500">{formError}</p>}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button onClick={() => setIsAddFormOpen(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5">Cancel</button>
                <button onClick={saveStudent} disabled={isSavingStudent} className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] disabled:opacity-70">{isSavingStudent ? 'Saving...' : studentMode === 'existing' ? 'Add to Batch' : 'Add Student'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reviewSubmission && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setReviewSubmission(null)} />
          <div className="relative w-full max-w-3xl bg-white dark:bg-[#0a1737] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#3C83F6] dark:text-white">Review Submission</h2>
                <p className="text-xs text-black/45 dark:text-white/40 mt-0.5">{reviewSubmission.student} • {reviewSubmission.email || reviewSubmission.batch}</p>
              </div>
              <button onClick={() => setReviewSubmission(null)} className="text-sm text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70">Close</button>
            </div>
            
            {reviewSubmission.loading ? (
              <div className="p-12 text-center text-sm text-gray-500">Loading details...</div>
            ) : (
              <>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white/60 dark:bg-white/5">
                    <p className="text-xs text-black/45 dark:text-white/40 uppercase font-semibold">Assessment</p>
                    <p className="text-sm mt-1 text-black/75 dark:text-white/80">
                      {reviewSubmission.isChallenge 
                        ? `${reviewSubmission.challengeTitle || "Daily Challenge"} ${reviewSubmission.dayNumber ? `(Day ${reviewSubmission.dayNumber})` : ""}`
                        : (reviewSubmission.question || "_")
                      }
                    </p>
                  </div>
                  <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white/60 dark:bg-white/5">
                    <p className="text-xs text-black/45 dark:text-white/40 uppercase font-semibold">Submitted At</p>
                    <p className="text-sm mt-1 text-black/75 dark:text-white/80">
                      {(() => {
                        if (reviewSubmission.isChallenge && reviewSubmission.startedAt && reviewSubmission.submittedAt) {
                          const started = new Date(reviewSubmission.startedAt);
                          const submitted = new Date(reviewSubmission.submittedAt);
                          const elapsedSec = Math.max(0, Math.floor((submitted.getTime() - started.getTime()) / 1000));
                          const mins = Math.floor(elapsedSec / 60);
                          const secs = elapsedSec % 60;
                          return `${mins}m ${secs}s after start`;
                        }
                        return reviewSubmission.when && !isNaN(new Date(reviewSubmission.when).getTime())
                          ? new Date(reviewSubmission.when).toLocaleString()
                          : "_";
                      })()}
                    </p>
                  </div>
                </div>

                {reviewSubmission.isChallenge ? (
                  <div className="px-6 pb-6 max-h-[400px] overflow-y-auto space-y-4">
                    <p className="text-xs text-black/45 dark:text-white/40 uppercase font-semibold mb-2">Student Solutions</p>
                    {(!reviewSubmission.problems || reviewSubmission.problems.length === 0) ? (
                      <div className="text-center py-10 border border-dashed border-black/10 dark:border-white/10 rounded-xl bg-black/5 dark:bg-black/25">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No attempts to review.</p>
                      </div>
                    ) : (
                      reviewSubmission.problems.map((prob, idx) => {
                        const isExpanded = activeReviewProblemIdx === idx;
                        const statusLabel = prob.submitted 
                          ? "Submitted" 
                          : (prob.hasRun ? "Not submitted (State after final run)" : "User did not attempt it");

                        return (
                          <div key={idx} className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden bg-white/60 dark:bg-white/5">
                            <button
                              type="button"
                              onClick={() => setActiveReviewProblemIdx(isExpanded ? null : idx)}
                              className="w-full text-left px-4 py-3 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5 transition-all hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                            >
                              <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{prob.title}</p>
                                <p className="text-[11px] font-medium text-slate-500 mt-0.5">{statusLabel}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">{prob.language || 'python'}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">Score: {prob.score}</span>
                                <span className="text-xs text-slate-400 font-bold ml-1">{isExpanded ? "▲" : "▼"}</span>
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="p-4 bg-white/40 dark:bg-black/15">
                                {prob.hasRun || prob.submitted ? (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Compiler State:</p>
                                    <pre className="text-xs font-mono bg-black/5 dark:bg-black/35 p-3 rounded-lg overflow-x-auto max-h-[220px] text-gray-800 dark:text-emerald-400 whitespace-pre-wrap">{prob.code}</pre>
                                  </div>
                                ) : (
                                  <p className="text-xs italic text-gray-500 py-2">User did not attempt it</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  reviewSubmission.code && (
                    <div className="px-6 pb-6">
                      <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white/60 dark:bg-white/5">
                        <p className="text-xs text-black/45 dark:text-white/40 uppercase font-semibold mb-2">Submitted Code</p>
                        <pre className="text-xs font-mono bg-black/5 dark:bg-black/35 p-3 rounded-lg overflow-x-auto max-h-[300px] text-gray-800 dark:text-emerald-400 whitespace-pre-wrap">{reviewSubmission.code}</pre>
                      </div>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>
      )}

      {selectedChallengeScore && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setSelectedChallengeScore(null)} />
          <div className="relative w-full max-w-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Scores Breakdown</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{selectedChallengeScore.studentName} ({selectedChallengeScore.email})</p>
              </div>
              <button onClick={() => setSelectedChallengeScore(null)} className="text-sm font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Close</button>
            </div>

            <div className="p-6 space-y-6 bg-white dark:bg-slate-900">
              {/* MCQ Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-850 pb-1">MCQ Section</h3>
                {selectedChallengeScore.scoresDetail?.mcq ? (
                  Object.entries(selectedChallengeScore.scoresDetail.mcq).map(([key, scoreVal]) => {
                    if (scoreVal === '—' || scoreVal === undefined || scoreVal === null) return null;
                    const labelMap = {
                      java: 'Java MCQ',
                      dsa: 'DSA MCQ',
                      sql: 'SQL MCQ',
                      aptitude: 'Aptitude MCQ',
                      technical: 'Technical MCQ'
                    };
                    const label = labelMap[key] || `${key.toUpperCase()} MCQ`;
                    return (
                      <div key={key} className="flex justify-between items-center text-sm font-semibold py-1 text-slate-800 dark:text-slate-200">
                        <span>{label}</span>
                        <span className="font-bold text-[#3C83F6] dark:text-blue-400">{scoreVal}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs italic text-slate-400">No MCQ questions assigned/attempted.</p>
                )}
                {selectedChallengeScore.scoresDetail?.mcq && Object.values(selectedChallengeScore.scoresDetail.mcq).every(v => v === '—') && (
                  <p className="text-xs italic text-slate-400">No MCQ questions assigned/attempted.</p>
                )}
              </div>

              {/* Coding Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-850 pb-1">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Coding Section</h3>
                </div>
                {selectedChallengeScore.scoresDetail?.coding ? (
                  Object.entries(selectedChallengeScore.scoresDetail.coding).map(([key, scoreVal]) => {
                    if (scoreVal === '—' || scoreVal === undefined || scoreVal === null) return null;
                    const labelMap = {
                      java: 'Java Coding',
                      dsa: 'DSA Coding',
                      sql: 'SQL Coding',
                      aptitude: 'Aptitude Coding',
                      technical: 'Technical Coding'
                    };
                    const label = labelMap[key] || `${key.toUpperCase()} Coding`;
                    const hasSubmission = scoreVal && !scoreVal.startsWith('—');
                    return (
                      <div key={key} className="flex justify-between items-center text-sm font-semibold py-1 text-slate-800 dark:text-slate-200">
                        <span>{label}</span>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-[#3C83F6] dark:text-blue-400">{scoreVal}</span>
                          {hasSubmission && (
                            <button
                              type="button"
                              onClick={() => {
                                handleReviewSubmission(selectedChallengeScore.submissionId, selectedChallengeScore.studentName);
                                setSelectedChallengeScore(null);
                              }}
                              className="text-[11px] font-bold text-[#3C83F6] hover:underline dark:text-blue-400"
                            >
                              Review Code
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs italic text-slate-400">No coding questions assigned/attempted.</p>
                )}
                {selectedChallengeScore.scoresDetail?.coding && Object.values(selectedChallengeScore.scoresDetail.coding).every(v => v === '—') && (
                  <p className="text-xs italic text-slate-400">No coding questions assigned/attempted.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDetails;



