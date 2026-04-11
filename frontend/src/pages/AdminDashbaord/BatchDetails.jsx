import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import { adminAPI, preferRemoteData } from '../../services/adminApi';
import { FiArrowLeft, FiUsers, FiActivity, FiTrendingUp, FiClock, FiBriefcase, FiCalendar, FiBookOpen } from 'react-icons/fi';

const fallbackBatchMap = {};

const scorePillClass = (score) =>
  score >= 80
    ? 'bg-[#16a34a] text-white'
    : 'bg-[#dbe7ff] text-[#3c83f6]';

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

  useEffect(() => {
    setMounted(true);
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

  const activeToday = Math.max(0, Math.floor(batch.students * 0.8));

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      <div
        className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]'
            : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'
        }`}
      />

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main
          onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)}
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } pt-0 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-[1600px] mx-auto space-y-8">
          <header className={`sticky top-0 z-40 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 xl:-mx-16 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 h-16 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between transition-all duration-300 ${isPageScrolled ? "bg-[#daf0fa]/78 dark:bg-[#001233]/76" : "bg-[#daf0fa]/92 dark:bg-[#001233]/90"}`}>
            <div className="flex-1" />
            <AdminHeaderControls user={user} logout={logout} />
          </header>

          <section className="space-y-8">
            <button
              onClick={() => navigate('/batches')}
              className="inline-flex items-center gap-2 text-base text-black/55 dark:text-white/55 hover:text-black/80 dark:hover:text-white/80 transition-colors -ml-1"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Batches
            </button>

            <div className="flex flex-wrap items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3C83F6] to-[#5f98ef] text-white flex items-center justify-center text-2xl font-semibold shadow-sm">
                {batch.name?.charAt(0) || 'B'}
              </div>
              <div>
                <h2 className="text-4xl font-semibold tracking-tight text-black/90 dark:text-white">{batch.name || batch.id}</h2>
                <p className="mt-1 text-sm text-black/55 dark:text-white/55 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5"><FiBriefcase className="w-3.5 h-3.5" />{batch.college}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1.5"><FiCalendar className="w-3.5 h-3.5" />Started: {batch.start}</span>
                  <span>•</span>
                  <span>{batch.students} Students</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-2xl p-5 space-y-3 hover:shadow-md transition-shadow">
                <p className="flex items-center gap-2 text-black/55 dark:text-white/60"><FiUsers className="w-4 h-4" /><span className="text-xs font-medium">Total Students</span></p>
                <p className="text-2xl font-bold text-black dark:text-white leading-none">{batch.students}</p>
              </div>
              <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-2xl p-5 space-y-3 hover:shadow-md transition-shadow">
                <p className="flex items-center gap-2 text-black/55 dark:text-white/60"><FiActivity className="w-4 h-4" /><span className="text-xs font-medium">Active Students Today</span></p>
                <p className="text-2xl font-bold text-black dark:text-white leading-none">{activeToday}</p>
              </div>
              <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-2xl p-5 space-y-3 hover:shadow-md transition-shadow">
                <p className="flex items-center gap-2 text-black/55 dark:text-white/60"><FiTrendingUp className="w-4 h-4" /><span className="text-xs font-medium">Average Score</span></p>
                <p className="text-2xl font-bold text-black dark:text-white leading-none">{batch.avgScore}%</p>
              </div>
              <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-2xl p-5 space-y-3 hover:shadow-md transition-shadow">
                <p className="flex items-center gap-2 text-black/55 dark:text-white/60"><FiClock className="w-4 h-4" /><span className="text-xs font-medium">Average Streak</span></p>
                <p className="text-2xl font-bold text-black dark:text-white leading-none">{batch.avgStreakDays} days</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="admin-section-heading">Attached Tracks</h3>
              {Array.isArray(batch.tracks) && batch.tracks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {batch.tracks.map((track) => (
                    <div key={track.name} className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-2xl p-5 space-y-3">
                      <h4 className="text-base font-bold text-black/85 dark:text-white/85 inline-flex items-center gap-2"><FiBookOpen className="w-4 h-4 text-[#3C83F6] dark:text-[#3C83F6]" />{track.name}</h4>
                      <p className="text-xs text-black/45 dark:text-white/50">{track.questionsAssigned} questions assigned</p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {track.days.length === 0 ? (
                          <p className="text-sm text-black/45 dark:text-white/50">No day assignments yet.</p>
                        ) : (
                          track.days.map((dayItem, index) => (
                            <div key={`${track.name}-${index}`} className="flex items-center gap-2 text-xs">
                              <span className="font-semibold text-[#3C83F6] dark:text-[#3C83F6] w-10 shrink-0">Day {index + 1}</span>
                              <span className="text-black/80 dark:text-white/80 break-words">{dayItem}</span>
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
              <h3 className="admin-section-heading">Students</h3>
              <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-black/5 dark:border-white/10">
                      <th className="text-left text-xs font-semibold text-black/45 dark:text-white/50 px-6 py-4">Student Name</th>
                      <th className="text-left text-xs font-semibold text-black/45 dark:text-white/50 px-6 py-4">Email</th>
                      <th className="text-left text-xs font-semibold text-black/45 dark:text-white/50 px-6 py-4">Score</th>
                      <th className="text-left text-xs font-semibold text-black/45 dark:text-white/50 px-6 py-4">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.studentsTable.map((student, index) => (
                      <tr key={`${student.email}-${index}`} className="border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-black/85 dark:text-white/85">{student.name}</td>
                        <td className="px-6 py-4 text-sm text-black/55 dark:text-white/60">{student.email}</td>
                        <td className="px-6 py-4">
                          <span className={`justify-self-start inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${scorePillClass(student.score)}`}>
                            {student.score}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-black/60 dark:text-white/65"><span className="font-medium text-black/85 dark:text-white/85">{String(student.streak).split('/')[0].trim()}</span> / {String(student.streak).split('/')[1]?.trim() || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default BatchDetails;



