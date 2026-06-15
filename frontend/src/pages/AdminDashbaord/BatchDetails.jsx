import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import { adminAPI, preferRemoteData } from '../../services/adminApi';
import { FiArrowLeft, FiUsers, FiActivity, FiTrendingUp, FiClock, FiBriefcase, FiCalendar, FiBookOpen, FiPlus, FiSearch, FiChevronDown } from 'react-icons/fi';

const fallbackBatchMap = {};

const scorePillClass = (score) =>
  score >= 80
    ? 'bg-[#16a34a] text-white'
    : 'bg-[#dbe7ff] text-[#3c83f6]';

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

  // States for student management and search
  const [colleges, setColleges] = useState([]);
  const [batches, setBatches] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [tableSearch, setTableSearch] = useState('');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: '', email: '', collegeId: '', batchId: '', track: '', status: 'Active' });
  const [formError, setFormError] = useState('');
  const [isSavingStudent, setIsSavingStudent] = useState(false);

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
      const normalizedTracks = preferRemoteData(remoteTracks, []).map((track) => track.name).filter(Boolean);
      const uniqueTracks = Array.from(new Set(normalizedTracks)).filter((t) => t !== 'General Track');
      setColleges(normalizedColleges);
      setBatches(normalizedBatches);
      setTracks(uniqueTracks);
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
    let cancelled = false;

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

    return () => {
      cancelled = true;
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
    setIsAddFormOpen(true);
  };

  const saveStudent = async () => {
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

  const filteredStudents = useMemo(() => {
    const table = batch.studentsTable || [];
    const isPlaceholder = table.length === 1 && table[0].name === 'No enrolled students' && table[0].email === '-';
    const studentsList = isPlaceholder ? [] : table;
    
    if (!tableSearch) return table;
    const q = tableSearch.toLowerCase();
    return studentsList.filter((s) => 
      (s.name || '').toLowerCase().includes(q) || 
      (s.email || '').toLowerCase().includes(q)
    );
  }, [batch.studentsTable, tableSearch]);

  const activeToday = Math.max(0, Math.floor(batch.students * 0.8));

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
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
                <p className="text-xl font-semibold text-black dark:text-white leading-none">{batch.students}</p>
              </div>
              <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl p-3.5 space-y-2 hover:shadow-md transition-shadow">
                <p className="flex items-center gap-2 text-black/55 dark:text-white/60"><FiActivity className="w-4 h-4" /><span className="text-xs font-medium">Active Students Today</span></p>
                <p className="text-xl font-semibold text-black dark:text-white leading-none">{activeToday}</p>
              </div>
              <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl p-3.5 space-y-2 hover:shadow-md transition-shadow">
                <p className="flex items-center gap-2 text-black/55 dark:text-white/60"><FiTrendingUp className="w-4 h-4" /><span className="text-xs font-medium">Average Score</span></p>
                <p className="text-xl font-semibold text-black dark:text-white leading-none">{batch.avgScore}%</p>
              </div>
              <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl p-3.5 space-y-2 hover:shadow-md transition-shadow">
                <p className="flex items-center gap-2 text-black/55 dark:text-white/60"><FiClock className="w-4 h-4" /><span className="text-xs font-medium">Average Streak</span></p>
                <p className="text-xl font-semibold text-black dark:text-white leading-none">{batch.avgStreakDays} days</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="admin-section-heading">Attached Tracks</h3>
              {Array.isArray(batch.tracks) && batch.tracks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {batch.tracks.map((track) => (
                    <div key={track.name} className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl p-4 space-y-2">
                      <h4 className="text-sm font-bold text-black/85 dark:text-white/85 inline-flex items-center gap-2"><FiBookOpen className="w-4 h-4 text-[#3C83F6] dark:text-[#3C83F6]" />{track.name}</h4>
                      <p className="text-xs text-black/45 dark:text-white/50">{track.questionsAssigned} questions assigned</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {track.days.length === 0 ? (
                          <p className="text-sm text-black/45 dark:text-white/50">No day assignments yet.</p>
                        ) : (
                          track.days.map((dayItem, index) => (
                            <div key={`${track.name}-${index}`} className="flex flex-col gap-1 text-xs border-b border-black/[0.03] dark:border-white/[0.03] py-1.5 last:border-0">
                              <span className="font-semibold text-[#3C83F6] dark:text-[#3C83F6] shrink-0">Day {index + 1}</span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {(dayItem || '').split(', ').map((qTitle, qIdx) => (
                                  <span key={qIdx} className="inline-flex items-center rounded-md bg-slate-50 dark:bg-[#12285a] px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-200 border border-black/5 dark:border-white/5 shadow-sm break-words max-w-full">
                                    {qTitle}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 px-4 py-10 text-center text-sm text-black/40 dark:text-white/40">
                  No tracks are attached to this batch yet.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-1">
                <h3 className="admin-section-heading">Students</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                  <div className="relative w-full sm:w-60 md:w-80">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/35 dark:text-white/35" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="pl-9 pr-3 h-10 text-sm bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30 text-black/80 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 w-full"
                    />
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
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="border-b border-black/5 dark:border-white/10">
                        <th className="text-left text-xs font-semibold text-black/45 dark:text-white/50 px-4 py-3 w-14">#</th>
                        <th className="text-left text-xs font-semibold text-black/45 dark:text-white/50 px-4 py-3">Student Name</th>
                        <th className="text-left text-xs font-semibold text-black/45 dark:text-white/50 px-4 py-3">Email</th>
                        <th className="text-left text-xs font-semibold text-black/45 dark:text-white/50 px-4 py-3">Score</th>
                        <th className="text-left text-xs font-semibold text-black/45 dark:text-white/50 px-4 py-3">Streak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, index) => {
                        const isPlaceholder = student.name === 'No enrolled students' && student.email === '-';
                        return (
                          <tr key={`${student.email}-${index}`} className="border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors">
                            <td className="px-4 py-3 text-xs sm:text-sm font-semibold text-black/45 dark:text-white/50">
                              {isPlaceholder ? '-' : index + 1}
                            </td>
                            <td className="px-4 py-3 text-xs sm:text-sm font-medium text-black/85 dark:text-white/85">{student.name}</td>
                            <td className="px-4 py-3 text-xs sm:text-sm text-black/55 dark:text-white/60">{student.email}</td>
                            <td className="px-4 py-3">
                              {isPlaceholder ? '-' : (
                                <span className={`justify-self-start inline-flex min-w-[42px] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${scorePillClass(student.score)}`}>
                                  {student.score}%
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs sm:text-sm text-black/60 dark:text-white/65">
                              {isPlaceholder ? '-' : (
                                <>
                                  <span className="font-medium text-black/85 dark:text-white/85">{String(student.streak).split('/')[0].trim()}</span> / {String(student.streak).split('/')[1]?.trim() || '-'}
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-sm text-black/40 dark:text-white/40">
                            No students match your search query.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {isAddFormOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsAddFormOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-white">Add Student</h2>
              <button onClick={() => setIsAddFormOpen(false)} className="text-sm text-black/40 dark:text-white/40">Close</button>
            </div>
            <div className="p-6 space-y-4">
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
                <button onClick={saveStudent} disabled={isSavingStudent} className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] disabled:opacity-70">{isSavingStudent ? 'Saving...' : 'Add Student'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDetails;



