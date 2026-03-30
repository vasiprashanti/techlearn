import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import { FiArrowLeft, FiUsers, FiActivity, FiLayers, FiTrendingUp, FiBarChart2, FiArrowUpRight } from 'react-icons/fi';

const fallbackCollegeMap = {
  'MIT-001': {
    id: 'MIT-001',
    name: 'MIT',
    city: 'Cambridge, MA',
    status: 'Active',
    totalStudents: 4,
    activeStudents: 3,
    activeBatches: 2,
    avgScore: 86,
    submissionRate: 75,
    batches: [
      { name: 'CS-2024A', students: 2, avgScore: 89, status: 'Active' },
      { name: 'CS-2024B', students: 2, avgScore: 84, status: 'Active' },
    ],
  },
};

const statusPillClass = (status) =>
  status === 'Active'
    ? 'bg-[#16a34a] text-white'
    : 'bg-[#dbe7ff] text-[#3c83f6]';

const CollegeDetails = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { collegeId } = useParams();
  const isDarkMode = theme === 'dark';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const college = useMemo(() => {
    const stateCollege = location.state?.college;
    if (stateCollege?.id === collegeId) {
      return {
        ...stateCollege,
        city: stateCollege.city || 'Cambridge, MA',
        activeBatches: stateCollege.totalStudents > 0 ? 2 : 0,
        submissionRate: stateCollege.totalStudents > 0
          ? Math.round((stateCollege.activeStudents / stateCollege.totalStudents) * 100)
          : 0,
        batches: [
          {
            name: 'CS-2024A',
            students: Math.max(1, Math.floor((stateCollege.totalStudents || 2) / 2)),
            avgScore: Math.min(100, (stateCollege.avgScore || 82) + 3),
            status: stateCollege.status || 'Active',
          },
          {
            name: 'CS-2024B',
            students: Math.max(1, (stateCollege.totalStudents || 2) - Math.max(1, Math.floor((stateCollege.totalStudents || 2) / 2))),
            avgScore: Math.max(0, (stateCollege.avgScore || 82) - 2),
            status: stateCollege.status || 'Active',
          },
        ],
      };
    }

    return fallbackCollegeMap[collegeId] || {
      id: collegeId,
      name: collegeId?.split('-')[0] || 'College',
      city: 'Unknown City',
      status: 'Active',
      totalStudents: 0,
      activeStudents: 0,
      activeBatches: 0,
      avgScore: 0,
      submissionRate: 0,
      batches: [],
    };
  }, [location.state, collegeId]);

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

          <section className="space-y-5">
            <button
              onClick={() => navigate('/colleges')}
              className="inline-flex items-center gap-2 text-sm text-black/55 dark:text-white/55 hover:text-black/80 dark:hover:text-white/80 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Colleges
            </button>

            <div className="flex flex-wrap items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3C83F6] to-[#5f98ef] text-white flex items-center justify-center text-3xl font-semibold shadow-md">
                {college.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-black/90 dark:text-white">{college.name}</h2>
                <p className="mt-1 text-lg text-black/55 dark:text-white/55">{college.id} {college.city ? `· ${college.city}` : ''}</p>
              </div>
              <span className={`ml-auto inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${statusPillClass(college.status)}`}>
                {college.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              <div className="bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 min-h-[110px] flex flex-col justify-between">
                <p className="flex items-center gap-2 text-sm leading-snug text-black/55 dark:text-white/55 min-h-[34px]"><FiUsers className="w-4 h-4 shrink-0" />Total Students</p>
                <p className="mt-2 text-3xl font-semibold text-black dark:text-white leading-none">{college.totalStudents}</p>
              </div>
              <div className="bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 min-h-[110px] flex flex-col justify-between">
                <p className="flex items-center gap-2 text-sm leading-snug text-black/55 dark:text-white/55 min-h-[34px]"><FiActivity className="w-4 h-4 shrink-0" />Active Students Today</p>
                <p className="mt-2 text-3xl font-semibold text-black dark:text-white leading-none">{college.activeStudents}</p>
              </div>
              <div className="bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 min-h-[110px] flex flex-col justify-between">
                <p className="flex items-center gap-2 text-sm leading-snug text-black/55 dark:text-white/55 min-h-[34px]"><FiLayers className="w-4 h-4 shrink-0" />Active Batches</p>
                <p className="mt-2 text-3xl font-semibold text-black dark:text-white leading-none">{college.activeBatches}</p>
              </div>
              <div className="bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 min-h-[110px] flex flex-col justify-between">
                <p className="flex items-center gap-2 text-sm leading-snug text-black/55 dark:text-white/55 min-h-[34px]"><FiTrendingUp className="w-4 h-4 shrink-0" />Average Score</p>
                <p className="mt-2 text-3xl font-semibold text-black dark:text-white leading-none">{college.avgScore}%</p>
              </div>
              <div className="bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 min-h-[110px] flex flex-col justify-between">
                <p className="flex items-center gap-2 text-sm leading-snug text-black/55 dark:text-white/55 min-h-[34px]"><FiBarChart2 className="w-4 h-4 shrink-0" />Submission Rate</p>
                <p className="mt-2 text-3xl font-semibold text-black dark:text-white leading-none">{college.submissionRate}%</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="admin-section-heading">Batches</h3>
              <div className="bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-5 gap-3 px-5 py-3 text-sm font-semibold text-black/50 dark:text-white/50 border-b border-black/5 dark:border-white/10">
                  <span>Batch Name</span>
                  <span>Students</span>
                  <span>Avg Score</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>

                {college.batches.length === 0 ? (
                  <div className="px-5 py-7 text-black/45 dark:text-white/45 text-sm">No batches mapped to this college yet.</div>
                ) : (
                  college.batches.map((batch, idx) => (
                    <div key={`${batch.name}-${idx}`} className="grid grid-cols-5 gap-3 px-5 py-4 text-base text-black/80 dark:text-white border-b border-black/5 dark:border-white/10 last:border-b-0">
                      <span className="font-semibold">{batch.name}</span>
                      <span>{batch.students}</span>
                      <span>{batch.avgScore}%</span>
                      <span>
                        <span className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${statusPillClass(batch.status)}`}>
                          {batch.status}
                        </span>
                      </span>
                      <span className="text-right">
                        <button
                          onClick={() => navigate('/batches')}
                          className="inline-flex items-center gap-1.5 text-sm text-[#3C83F6] dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-200 transition-colors"
                        >
                          View Batch
                          <FiArrowUpRight className="w-4 h-4" />
                        </button>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CollegeDetails;



