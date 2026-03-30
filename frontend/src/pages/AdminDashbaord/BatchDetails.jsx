import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import { FiArrowLeft, FiUsers, FiActivity, FiTrendingUp, FiClock, FiBriefcase, FiCalendar, FiBookOpen } from 'react-icons/fi';

const fallbackBatchMap = {
  'CS-2024A': {
    id: 'CS-2024A',
    college: 'MIT',
    status: 'Active',
    start: 'Jun 1, 2024',
    students: 2,
    avgScore: 89,
    avgStreakDays: 13,
    tracks: [
      {
        name: 'DSA Track',
        questionsAssigned: 4,
        days: ['Two Sum', 'Reverse Linked List', 'Binary Tree Level Order Traversal', 'Maximum Subarray Sum'],
      },
      {
        name: 'Core Track',
        questionsAssigned: 1,
        days: ['DataFrame Manipulation'],
      },
      {
        name: 'SQL Track',
        questionsAssigned: 1,
        days: ['SQL Join Operations'],
      },
    ],
    studentsTable: [
      { name: 'Alex Johnson', email: 'alex@mit.edu', score: 92, streak: '15 / 183' },
      { name: 'Lisa Anderson', email: 'lisa@mit.edu', score: 85, streak: '10 / 183' },
    ],
  },
  'CS-2024B': {
    id: 'CS-2024B',
    college: 'MIT',
    status: 'Active',
    start: 'Jul 15, 2024',
    students: 2,
    avgScore: 84,
    avgStreakDays: 11,
    tracks: [
      {
        name: 'Frontend Track',
        questionsAssigned: 3,
        days: ['HTML Semantic Layout', 'CSS Flex and Grid', 'Responsive Navbar Build'],
      },
      {
        name: 'JavaScript Core',
        questionsAssigned: 2,
        days: ['Array Methods Practice', 'Async Fetch and Render'],
      },
      {
        name: 'Project Track',
        questionsAssigned: 1,
        days: ['Landing Page Sprint'],
      },
    ],
    studentsTable: [
      { name: 'Maya Lee', email: 'maya@mit.edu', score: 88, streak: '12 / 150' },
      { name: 'Noah Miller', email: 'noah@mit.edu', score: 80, streak: '8 / 150' },
    ],
  },
  'DS-2024A': {
    id: 'DS-2024A',
    college: 'Stanford University',
    status: 'Active',
    start: 'Jun 15, 2024',
    students: 3,
    avgScore: 83,
    avgStreakDays: 10,
    tracks: [
      {
        name: 'Python Foundations',
        questionsAssigned: 3,
        days: ['Loops and Conditions', 'Dictionaries and Sets', 'Functions and Scope'],
      },
      {
        name: 'Data Handling',
        questionsAssigned: 2,
        days: ['Pandas Basics', 'Data Cleaning Tasks'],
      },
      {
        name: 'Visualization Track',
        questionsAssigned: 1,
        days: ['Matplotlib Quick Charts'],
      },
    ],
    studentsTable: [
      { name: 'Ethan Park', email: 'ethan@stanford.edu', score: 86, streak: '9 / 144' },
      { name: 'Sophie Kim', email: 'sophie@stanford.edu', score: 82, streak: '7 / 144' },
      { name: 'Arjun Nair', email: 'arjun@stanford.edu', score: 81, streak: '6 / 144' },
    ],
  },
  'WD-2024A': {
    id: 'WD-2024A',
    college: 'IIT Delhi',
    status: 'Active',
    start: 'Aug 1, 2024',
    students: 1,
    avgScore: 79,
    avgStreakDays: 8,
    tracks: [
      {
        name: 'Web Basics',
        questionsAssigned: 2,
        days: ['Structure a Portfolio Page', 'CSS Components Styling'],
      },
      {
        name: 'Backend Intro',
        questionsAssigned: 1,
        days: ['Express Route Setup'],
      },
      {
        name: 'Deployment Track',
        questionsAssigned: 1,
        days: ['Deploy with Vercel'],
      },
    ],
    studentsTable: [
      { name: 'Priya Singh', email: 'priya@iitd.ac.in', score: 79, streak: '6 / 120' },
    ],
  },
  'WD-2024B': {
    id: 'WD-2024B',
    college: 'IIT Delhi',
    status: 'Upcoming',
    start: 'Sep 1, 2024',
    students: 1,
    avgScore: 0,
    avgStreakDays: 0,
    tracks: [
      {
        name: 'Database Track',
        questionsAssigned: 2,
        days: ['SQL Schema Design', 'Normalization Practice'],
      },
      {
        name: 'API Track',
        questionsAssigned: 1,
        days: ['REST Endpoint Draft'],
      },
      {
        name: 'Testing Track',
        questionsAssigned: 1,
        days: ['Write Integration Tests'],
      },
    ],
    studentsTable: [
      { name: 'Rohan Verma', email: 'rohan@iitd.ac.in', score: 0, streak: '0 / 0' },
    ],
  },
  'ML-2024A': {
    id: 'ML-2024A',
    college: 'Harvard University',
    status: 'Completed',
    start: 'Jun 1, 2024',
    students: 2,
    avgScore: 91,
    avgStreakDays: 16,
    tracks: [
      {
        name: 'ML Fundamentals',
        questionsAssigned: 3,
        days: ['Linear Regression', 'Logistic Classification', 'Model Evaluation'],
      },
      {
        name: 'Feature Engineering',
        questionsAssigned: 2,
        days: ['Missing Value Strategy', 'Encoding Categorical Data'],
      },
      {
        name: 'Capstone Track',
        questionsAssigned: 1,
        days: ['Mini Prediction System'],
      },
    ],
    studentsTable: [
      { name: 'Emma Clark', email: 'emma@harvard.edu', score: 94, streak: '18 / 183' },
      { name: 'Daniel Scott', email: 'daniel@harvard.edu', score: 88, streak: '14 / 183' },
    ],
  },
  'DSA-2024C': {
    id: 'DSA-2024C',
    college: 'IIT Delhi',
    status: 'Active',
    start: 'Oct 1, 2024',
    students: 1,
    avgScore: 89,
    avgStreakDays: 12,
    tracks: [
      {
        name: 'DSA Sprint',
        questionsAssigned: 4,
        days: ['Stack and Queue Drills', 'Linked List Challenges', 'Graph Traversal Basics', 'Sliding Window Patterns'],
      },
      {
        name: 'Contest Prep',
        questionsAssigned: 1,
        days: ['Timed Problem Set'],
      },
      {
        name: 'Revision Track',
        questionsAssigned: 1,
        days: ['Daily Mixed Practice'],
      },
    ],
    studentsTable: [
      { name: 'Karan Mehta', email: 'karan@iitd.ac.in', score: 89, streak: '12 / 160' },
    ],
  },
};

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const batch = useMemo(() => {
    const stateBatch = location.state?.batch;
    const fallbackBatch = fallbackBatchMap[batchId];
    const base = stateBatch?.id === batchId
      ? { ...fallbackBatch, ...stateBatch }
      : fallbackBatch || {
      id: batchId,
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
      tracks: base.tracks && base.tracks.length ? base.tracks : [
        {
          name: 'Core Track',
          questionsAssigned: 0,
          days: [],
        },
      ],
      studentsTable: base.studentsTable && base.studentsTable.length ? base.studentsTable : [
        { name: 'No enrolled students', email: '-', score: 0, streak: '-' },
      ],
    };
  }, [location.state, batchId]);

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
                {batch.id?.charAt(0) || 'B'}
              </div>
              <div>
                <h2 className="text-4xl font-semibold tracking-tight text-black/90 dark:text-white">{batch.id}</h2>
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



