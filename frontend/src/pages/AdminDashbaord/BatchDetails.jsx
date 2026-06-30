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
  const [trackTemplates, setTrackTemplates] = useState([]);
  const [placementCourse, setPlacementCourse] = useState(null);
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
  const [isTrackFormOpen, setIsTrackFormOpen] = useState(false);
  const [trackForm, setTrackForm] = useState({
    assignedTrackTemplateId: '',
    startDate: '',
    endDate: '',
  });
  const [trackFormError, setTrackFormError] = useState('');
  const [isSavingTrack, setIsSavingTrack] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load metadata when page mounts
    Promise.all([
      adminAPI.getColleges().catch(() => []),
      adminAPI.getBatches().catch(() => []),
      adminAPI.getTrackTemplates().catch(() => []),
    ]).then(([remoteColleges, remoteBatches, remoteTracks]) => {
      const normalizedColleges = preferRemoteData(remoteColleges, []).map((college) => ({ id: college.id || college._id, name: college.name || 'Untitled College' }));
      const normalizedBatches = preferRemoteData(remoteBatches, []).map((b) => ({ id: b.id || b._id, name: b.name || b.id || 'Untitled Batch', college: b.college || '' }));
      const normalizedTrackTemplates = preferRemoteData(remoteTracks, [])
        .map((track) => ({ ...track, id: String(track.id || track._id) }))
        .filter((track) => track.id && track.name);
      const normalizedTracks = normalizedTrackTemplates.map((track) => track.name).filter(Boolean);
      const uniqueTracks = Array.from(new Set(normalizedTracks)).filter((t) => t !== 'General Track');
      setColleges(normalizedColleges);
      setBatches(normalizedBatches);
      setTrackTemplates(normalizedTrackTemplates);
      setTracks(uniqueTracks);
    }).catch(() => {});

    adminAPI.getCourses()
      .then((coursesResponse) => {
        const courses = preferRemoteData(coursesResponse?.courses || coursesResponse, []);
        const course = courses.find((item) => /placement\s*sprint/i.test(item.title || ''))
          || courses.find((item) => /placement/i.test(item.title || ''));
        setPlacementCourse(course || null);
      })
      .catch(() => setPlacementCourse(null));
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

  const openTrackForm = () => {
    const assignedIds = Array.isArray(batch.assignedTrackTemplateIds)
      ? batch.assignedTrackTemplateIds.map(String)
      : (batch.assignedTrackTemplateId ? [String(batch.assignedTrackTemplateId)] : []);
    setTrackForm({
      assignedTrackTemplateId: assignedIds[0] || '',
      startDate: batch.startDateValue || '',
      endDate: batch.expiryDateValue || '',
    });
    setTrackFormError('');
    setIsTrackFormOpen(true);
  };

  const saveTrackAssignment = async (confirmTrackReplacement = false) => {
    if (!trackForm.assignedTrackTemplateId) {
      setTrackFormError('Select a track template.');
      return;
    }

    setTrackFormError('');
    setIsSavingTrack(true);
    try {
      const selectedTemplate = trackTemplates.find((template) => String(template.id) === String(trackForm.assignedTrackTemplateId));
      await adminAPI.updateBatch(batch.id || batchId, {
        collegeId: batch.collegeId,
        name: batch.name,
        startDate: trackForm.startDate || batch.startDateValue,
        expiryDate: trackForm.endDate || batch.expiryDateValue,
        releaseTime: batch.releaseTime || '00:00',
        status: batch.status || 'Active',
        assignedTrack: selectedTemplate?.name || batch.assignedTrack || '',
        assignedTrackTemplateId: trackForm.assignedTrackTemplateId,
        assignedTrackTemplateIds: [trackForm.assignedTrackTemplateId],
        batchSize: batch.batchSize,
        confirmTrackReplacement,
      });
      const remoteBatch = await adminAPI.getBatch(batchId);
      setBatchDetail(preferRemoteData(remoteBatch, null));
      setIsTrackFormOpen(false);
    } catch (error) {
      if (error.message?.includes('Confirm replacing') && !confirmTrackReplacement) {
        const confirmed = window.confirm('This batch already has an active track. The existing active track will become Draft and the new track will become Active for all students. Continue?');
        if (confirmed) {
          await saveTrackAssignment(true);
          return;
        }
      }
      setTrackFormError(error.message || 'Failed to update active track.');
    } finally {
      setIsSavingTrack(false);
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

  const getAttemptedCountForDay = useCallback((dayNum) => {
    const table = batch.studentsTable || [];
    const isPlaceholder = table.length === 1 && table[0].name === 'No enrolled students' && table[0].email === '-';
    if (isPlaceholder) return 0;
    return table.filter(student => {
      const score = student.dayWiseHistory?.[dayNum];
      return score && score !== 'NIL' && score !== 'NA' && score !== '—';
    }).length;
  }, [batch.studentsTable]);

  const getAverageScoreForDay = useCallback((dayNum) => {
    const table = batch.studentsTable || [];
    const isPlaceholder = table.length === 1 && table[0].name === 'No enrolled students' && table[0].email === '-';
    if (isPlaceholder) return '—';
    const scores = [];
    let maxDen = 0;
    table.forEach(student => {
      const score = student.dayWiseHistory?.[dayNum];
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
    const avg = (sum / scores.length).toFixed(1);
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
        const score = student.dayWiseHistory?.[today];
        return score && score !== 'NIL' && score !== 'NA' && score !== '—';
      });
    } else if (reportStatusFilter === 'Not Attempted Today') {
      list = list.filter(student => {
        const score = student.dayWiseHistory?.[today];
        return !score || score === 'NIL' || score === 'NA' || score === '—';
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
        let scoreA = 0;
        let countA = 0;
        Object.keys(a.dayWiseHistory || {}).forEach(k => {
          const val = a.dayWiseHistory[k];
          if (val && val !== 'NIL' && val !== 'NA' && val !== '—') {
            const parts = val.split('/');
            if (parts.length === 2) {
              scoreA += parseFloat(parts[0]) / parseFloat(parts[1]);
              countA++;
            }
          }
        });
        
        let scoreB = 0;
        let countB = 0;
        Object.keys(b.dayWiseHistory || {}).forEach(k => {
          const val = b.dayWiseHistory[k];
          if (val && val !== 'NIL' && val !== 'NA' && val !== '—') {
            const parts = val.split('/');
            if (parts.length === 2) {
              scoreB += parseFloat(parts[0]) / parseFloat(parts[1]);
              countB++;
            }
          }
        });
        
        const avgA = countA > 0 ? scoreA / countA : 0;
        const avgB = countB > 0 ? scoreB / countB : 0;
        
        if (reportSortOrder === 'low-to-high') {
          return avgA - avgB;
        } else {
          return avgB - avgA;
        }
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
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={openTrackForm}
                    className="text-left text-[12px] md:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug break-words hover:text-[#3C83F6] dark:hover:text-[#8fd9ff] transition-colors"
                    title="Edit active track"
                  >
                    {batch.currentActiveTrack || batch.assignedTrack || 'None'}
                  </button>
                  <button
                    type="button"
                    onClick={openTrackForm}
                    className="shrink-0 rounded-lg border border-[#3C83F6]/20 px-2 py-1 text-[10px] font-semibold text-[#3C83F6] hover:bg-[#3C83F6]/10 dark:text-[#8fd9ff]"
                  >
                    Edit
                  </button>
                </div>
                {placementCourse && (
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/topics/${placementCourse._id || placementCourse.id}`)}
                    className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#3C83F6] hover:underline dark:text-[#8fd9ff]"
                  >
                    <FiBookOpen className="h-3 w-3" />
                    Open Course
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="admin-section-heading">Attached Tracks</h3>
              {Array.isArray(batch.tracks) && batch.tracks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-start">
                  {batch.tracks.map((track, trackIdx) => {
                    const trackId = track.id || track._id || `track-${trackIdx}`;
                    const isExpanded = !!expandedTracks[trackId];
                    return (
                      <div key={trackId} className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl overflow-hidden shadow-sm hover:shadow transition-all duration-300 col-span-1">
                        <button
                          onClick={() => toggleTrack(trackId)}
                          className="w-full flex items-center justify-between px-3 py-2 text-left focus:outline-none hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[#3C83F6] dark:text-[#3C83F6] font-bold text-[10px] select-none">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{track.name}</span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">({track.questionsAssigned} questions)</span>
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
                      <table className="w-full min-w-[1200px] table-auto">
                        <thead>
                          <tr className="border-b border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30">
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2 py-2 w-8 whitespace-nowrap">#</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2 py-2 w-32 whitespace-nowrap">Student Name</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2.5 py-2 whitespace-nowrap">Student Email</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2.5 py-2 whitespace-nowrap">Today's Score</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2.5 py-2 whitespace-nowrap">Today's XP</th>
                            <th className="text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2.5 py-2 whitespace-nowrap">Total XP</th>
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
                                  <td colSpan={9} className="px-2 py-2 text-[11px] sm:text-xs font-medium text-black/45 dark:text-white/50 text-center whitespace-nowrap">
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
                                    <td className="px-2.5 py-2 text-center whitespace-nowrap">
                                      <span className="text-[11px] sm:text-xs font-semibold text-[#0b1b38] dark:text-[#bceaff]">
                                        {formatScore(student)}
                                      </span>
                                    </td>
                                    <td className="px-2.5 py-2 text-center text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                      {(student.status === 'Completed' || student.status === 'In Progress') ? `+${student.todayXp || 0} XP` : '—'}
                                    </td>
                                    <td className="px-2.5 py-2 text-center text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
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
                              <td colSpan={10} className="px-6 py-10 text-center text-sm text-black/40 dark:text-white/40">
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
                      <div className="relative w-32 sm:w-36 md:w-40">
                        <select
                          value={reportSortOrder}
                          onChange={(e) => setReportSortOrder(e.target.value)}
                          className="appearance-none w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 pr-8 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30"
                        >
                          <option className={dropdownOptionClass} value="default">Default Sort</option>
                          <option className={dropdownOptionClass} value="low-to-high">Score: Low to High</option>
                          <option className={dropdownOptionClass} value="high-to-low">Score: High to Low</option>
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
                        <table className="w-full min-w-[800px] table-auto border-collapse">
                          <thead>
                            <tr className="border-b border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30">
                              <th className="sticky left-0 bg-slate-50 dark:bg-slate-900/30 z-20 text-left text-[10px] sm:text-xs font-bold text-[#3C83F6] px-2.5 py-2 w-[168px] min-w-[168px] border-r border-black/5 dark:border-white/5">
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
                            <tr className="border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-black/[0.01] dark:hover:bg-white/[0.02]">
                              <td className="sticky left-0 bg-white dark:bg-[#0f1f43] z-10 px-2.5 py-2 text-left text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 border-r border-black/5 dark:border-white/5 w-[168px] min-w-[168px]">
                                Attempted Students
                              </td>
                              {Array.from({ length: maxTrackDays }).map((_, index) => {
                                const dayNum = index + 1;
                                const count = getAttemptedCountForDay(dayNum);
                                return (
                                  <td key={index} className="px-2 py-2 text-center text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                    {count}
                                  </td>
                                );
                              })}
                            </tr>
                            <tr className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02]">
                              <td className="sticky left-0 bg-white dark:bg-[#0f1f43] z-10 px-2.5 py-2 text-left text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 border-r border-black/5 dark:border-white/5 w-[168px] min-w-[168px]">
                                Average Score
                              </td>
                              {Array.from({ length: maxTrackDays }).map((_, index) => {
                                const dayNum = index + 1;
                                const avg = getAverageScoreForDay(dayNum);
                                return (
                                  <td key={index} className="px-2 py-2 text-center text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
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
                        <table className="w-full min-w-[800px] table-auto border-collapse">
                          <thead>
                            <tr className="border-b border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30">
                              <th className="sticky left-0 bg-slate-50 dark:bg-slate-900/30 z-30 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-1 py-2 w-6 whitespace-nowrap shadow-[6px_0_10px_-10px_rgba(15,23,42,0.45)]">#</th>
                              <th className="sticky left-6 bg-slate-50 dark:bg-slate-900/30 z-30 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 px-2 py-2 w-36 min-w-[125px] border-r border-black/5 dark:border-white/5 whitespace-nowrap shadow-[8px_0_12px_-12px_rgba(15,23,42,0.5)]">Student Name</th>
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
                                  <td className="sticky left-0 bg-white dark:bg-[#0f1f43] z-20 px-1 py-2 text-center text-[11px] sm:text-xs font-semibold text-black/45 dark:text-white/50 whitespace-nowrap shadow-[6px_0_10px_-10px_rgba(15,23,42,0.45)]">
                                    {isPlaceholder ? '-' : index + 1}
                                  </td>
                                  {isPlaceholder ? (
                                    <td colSpan={maxTrackDays + 1} className="px-2 py-2 text-[11px] sm:text-xs font-medium text-black/45 dark:text-white/50 text-center">
                                      No enrolled students
                                    </td>
                                  ) : (
                                    <>
                                      <td className="sticky left-6 bg-white dark:bg-[#0f1f43] z-20 px-2 py-2 text-left text-[11px] sm:text-xs font-medium text-[#000]/85 dark:text-white/85 whitespace-nowrap border-r border-black/5 dark:border-white/5 overflow-hidden text-ellipsis max-w-[125px] shadow-[8px_0_12px_-12px_rgba(15,23,42,0.5)]" title={student.name}>
                                        {student.name}
                                      </td>
                                      {Array.from({ length: maxTrackDays }).map((_, dIndex) => {
                                        const dayNum = dIndex + 1;
                                        const score = student.dayWiseHistory?.[dayNum] || 'NA';
                                        
                                        let scoreClass = "text-slate-500 dark:text-slate-400";
                                        if (score === 'NIL') scoreClass = "text-amber-500 dark:text-amber-400 font-semibold";
                                        else if (score === 'NA') scoreClass = "text-slate-300 dark:text-slate-600";
                                        else scoreClass = "text-[#3C83F6] dark:text-blue-400 font-semibold";

                                        return (
                                          <td key={dIndex} className="px-2 py-2 text-center text-[11px] sm:text-xs whitespace-nowrap">
                                            <span className={scoreClass}>
                                              {score}
                                            </span>
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

      {isTrackFormOpen && (
        <div className="fixed inset-0 z-[131] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => !isSavingTrack && setIsTrackFormOpen(false)} />
          <div className="relative w-full max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-white">Edit Active Track</h2>
                <p className="mt-1 text-xs text-black/45 dark:text-white/45">Updates apply to all students in this batch.</p>
              </div>
              <button onClick={() => setIsTrackFormOpen(false)} disabled={isSavingTrack} className="text-sm text-black/40 dark:text-white/40 disabled:opacity-60">Close</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="admin-micro-label text-black/45 dark:text-white/45">Track Template*</label>
                <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                  <select
                    value={trackForm.assignedTrackTemplateId}
                    onChange={(e) => setTrackForm((prev) => ({ ...prev, assignedTrackTemplateId: e.target.value }))}
                    className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                  >
                    <option className={dropdownOptionClass} value="">Select track template</option>
                    {trackTemplates.map((template) => (
                      <option className={dropdownOptionClass} key={template.id} value={template.id}>
                        {template.name} {template.trackType ? `(${template.trackType})` : ''}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Start Date*</label>
                  <input
                    type="date"
                    value={trackForm.startDate}
                    onChange={(e) => setTrackForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    className={`mt-1 ${studentFormInputClass}`}
                  />
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">End Date*</label>
                  <input
                    type="date"
                    value={trackForm.endDate}
                    onChange={(e) => setTrackForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    className={`mt-1 ${studentFormInputClass}`}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#3C83F6]/15 bg-[#3C83F6]/5 px-3 py-2 text-xs leading-relaxed text-black/55 dark:text-white/60">
                If another active track already exists, it will be moved to Draft and this track will become Active for the full batch.
              </div>

              {trackFormError && <p className="text-xs text-red-500">{trackFormError}</p>}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTrackFormOpen(false)}
                  disabled={isSavingTrack}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveTrackAssignment(false)}
                  disabled={isSavingTrack}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] disabled:opacity-70"
                >
                  {isSavingTrack ? 'Saving...' : 'Save Track'}
                </button>
              </div>
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
    </div>
  );
};

export default BatchDetails;



