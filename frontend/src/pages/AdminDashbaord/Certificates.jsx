import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import LoadingScreen from '../../components/Loader/Loader3D';
import { FiSearch, FiTrash2, FiPlus } from 'react-icons/fi';

const searchRoutes = [
  { id: 'dashboard', title: 'Dashboard', category: 'Overview' },
  { id: 'analytics', title: 'Analytics', category: 'Overview' },
  { id: 'system-health', title: 'System Health', category: 'Overview' },
  { id: 'colleges', title: 'Colleges', category: 'Organization' },
  { id: 'batches', title: 'Batches', category: 'Organization' },
  { id: 'students', title: 'Students', category: 'Organization' },
  { id: 'question-bank', title: 'Question Bank', category: 'Learning' },
  { id: 'track-templates', title: 'Track Templates', category: 'Learning' },
  { id: 'resources', title: 'Resources', category: 'Learning' },
  { id: 'certificates', title: 'Certificates', category: 'Learning' },
  { id: 'submission-monitor', title: 'Submission Monitor', category: 'Operations' },
  { id: 'notifications', title: 'Notifications', category: 'Operations' },
  { id: 'audit-logs', title: 'Audit Logs', category: 'Operations' },
  { id: 'reports', title: 'Reports', category: 'Operations' },
];

const issuedCerts = [
  { id: 'CERT-001', student: 'Alex Johnson', course: 'React Fundamentals', score: 92, date: '2024-12-15' },
  { id: 'CERT-002', student: 'Sarah Williams', course: 'Python for Data Science', score: 88, date: '2024-12-18' },
  { id: 'CERT-003', student: 'Mike Chen', course: 'SQL Mastery', score: 95, date: '2024-12-20' },
  { id: 'CERT-004', student: 'Emily Davis', course: 'React Fundamentals', score: 85, date: '2025-01-05' },
  { id: 'CERT-005', student: 'James Wilson', course: 'Node.js Backend', score: 78, date: '2025-01-10' },
];

const finalTests = [
  { id: 'TEST-001', title: 'React Final Assessment', course: 'React Fundamentals', passing: 80, attempts: 14 },
  { id: 'TEST-002', title: 'Python Final Exam', course: 'Python for Data Science', passing: 75, attempts: 9 },
  { id: 'TEST-003', title: 'SQL Mastery Test', course: 'SQL Mastery', passing: 85, attempts: 6 },
];

const templates = [
  { id: 'TPL-001', name: 'Standard Certificate', courses: 5, lastUpdated: '2024-11-01' },
  { id: 'TPL-002', name: 'Honours Certificate', courses: 2, lastUpdated: '2024-11-15' },
  { id: 'TPL-003', name: 'Completion Badge', courses: 8, lastUpdated: '2024-12-01' },
];

const scorePillClass = (score) =>
  score >= 80
    ? 'bg-[#16a34a] text-white'
    : 'bg-[#dbe7ff] text-[#3c83f6]';

const tabs = ['Issued Certificates', 'Final Tests', 'Templates'];

export default function Certificates() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Issued Certificates');
  const [revokedIds, setRevokedIds] = useState([]);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [testQuestions, setTestQuestions] = useState([
    { id: 'tq-1', question: 'What is a React component?', answer: 'A reusable piece of UI' },
    { id: 'tq-2', question: 'What is JSX?', answer: 'JavaScript XML syntax extension' },
  ]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [passingPercentage, setPassingPercentage] = useState('70');
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false);
  const searchInputRef = useRef(null);
  const isDarkMode = theme === 'dark';

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(prev => !prev); }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
    else setSearchQuery('');
  }, [isSearchOpen]);

  const filteredRoutes = searchRoutes.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRouteSelect = (id) => { setIsSearchOpen(false); navigate('/' + id); };

  const confirmRevoke = () => {
    if (!revokeTarget) return;
    setRevokedIds((prev) => (prev.includes(revokeTarget.id) ? prev : [...prev, revokeTarget.id]));
    setRevokeTarget(null);
  };

  const addTestQuestion = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setTestQuestions((prev) => [
      ...prev,
      {
        id: `tq-${Date.now()}`,
        question: newQuestion.trim(),
        answer: newAnswer.trim(),
      },
    ]);
    setNewQuestion('');
    setNewAnswer('');
  };

  const removeTestQuestion = (id) => {
    setTestQuestions((prev) => prev.filter((item) => item.id !== id));
  };

  const ProfileDropdown = () => (
    <>
      <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
      <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-black/5 dark:border-white/5 bg-gradient-to-br from-[#3C83F6]/5 to-[#2563eb]/5 dark:from-white/5 dark:to-gray-200/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-lg font-medium tracking-wider shadow-md">
              {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-black dark:text-white truncate">{user?.firstName || user?.email || 'Admin User'}</h3>
              <p className="text-xs text-black/60 dark:text-white/60 truncate">{user?.email || 'admin@techlearn.com'}</p>
              <div className="mt-1"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#3C83F6]/10 text-[#3C83F6] dark:bg-white/10 dark:text-white border border-[#3C83F6]/20 dark:border-white/20">Administrator</span></div>
            </div>
          </div>
        </div>
        <div className="py-2">
          <button onClick={() => setProfileDropdownOpen(false)} className="w-full px-4 py-3 text-left text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#3C83F6]/10 group-hover:text-[#3C83F6] dark:group-hover:bg-white/10 dark:group-hover:text-white transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
            <div><div className="font-medium">Profile Settings</div><div className="text-[10px] text-black/50 dark:text-white/50">Manage your account</div></div>
          </button>
          <div className="mx-4 my-2 h-px bg-black/10 dark:bg-white/10" />
          <button onClick={() => { setProfileDropdownOpen(false); logout(); }} className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></div>
            <div><div className="font-medium">Log Out</div><div className="text-[10px] text-red-500/70 dark:text-red-400/70">Sign out of your account</div></div>
          </button>
        </div>
        <div className="px-4 py-2 bg-black/[0.025] dark:bg-white/[0.025] border-t border-black/5 dark:border-white/5">
          <p className="text-[9px] text-black/40 dark:text-white/40 text-center">TechLearn Admin Panel v2.0</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white/90 dark:bg-[#020b23]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/5">
              <FiSearch className="w-5 h-5 text-black/40 dark:text-white/40 mr-4 shrink-0" />
              <input ref={searchInputRef} type="text" placeholder="Search pages, tracks, or settings..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-lg text-[#3C83F6] dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" />
              <div className="flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 shrink-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setIsSearchOpen(false)}><span>ESC</span></div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredRoutes.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-black/40 dark:text-white/40">No results found for &ldquo;{searchQuery}&rdquo;</div>
              ) : filteredRoutes.map(route => (
                <button key={route.id} onClick={() => handleRouteSelect(route.id)} className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group text-left">
                  <div>
                    <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{route.title}</h4>

                  </div>
                  <span className="text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform">›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {revokeTarget && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setRevokeTarget(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f274f] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#0f1f3d] dark:text-white">Revoke Certificate?</h3>
            <p className="mt-2 text-sm text-[#5f7592] dark:text-slate-300">
              Do you really want to revoke the certificate for <span className="font-semibold text-[#0f1f3d] dark:text-white">{revokeTarget.student}</span>?
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setRevokeTarget(null)}
                className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium text-[#0f1f3d] dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={confirmRevoke}
                className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main
          onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)} className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[1400px] mx-auto space-y-5">

            <header className={`sticky top-0 z-40 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 xl:-mx-16 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 h-16 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between transition-all duration-300 ${isPageScrolled ? "bg-[#daf0fa]/78 dark:bg-[#001233]/76" : "bg-[#daf0fa]/92 dark:bg-[#001233]/90"}`}>
              <div>
                <h1 className="admin-page-title">Certificates</h1>

              </div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/45 dark:bg-[#0f274f]/70 border border-black/10 dark:border-white/10 w-fit">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-transparent border-2 border-[#3C83F6] text-[#0f1f3d] dark:text-white'
                      : 'text-[#5f7592] dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'Issued Certificates' && (
              <div className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0f274f]">
                <div className="overflow-x-auto">
                  <div className="min-w-[920px]">
                    <div className="grid grid-cols-[1.2fr_1.8fr_0.75fr_0.95fr_0.9fr_0.65fr] items-center px-5 py-3 border-b border-black/10 dark:border-white/10">
                      {['Student Name', 'Course', 'Score', 'Date', 'Certificate ID', 'Actions'].map(h => (
                        <span key={h} className="text-xs md:text-sm font-semibold text-[#5f7592] dark:text-slate-300">{h}</span>
                      ))}
                    </div>

                    {issuedCerts.map((cert, i) => {
                      const revoked = revokedIds.includes(cert.id);
                      return (
                        <div key={cert.id} className={`grid grid-cols-[1.2fr_1.8fr_0.75fr_0.95fr_0.9fr_0.65fr] items-center px-5 py-2.5 ${i < issuedCerts.length - 1 ? 'border-b border-black/10 dark:border-white/10' : ''}`}>
                          <span className="text-sm md:text-base font-medium text-[#0f1f3d] dark:text-white">{cert.student}</span>
                          <span className="text-sm md:text-base font-medium text-[#0f1f3d] dark:text-white">{cert.course}</span>
                          <span className={`justify-self-start inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${scorePillClass(cert.score)}`}>
                            {cert.score}%
                          </span>
                          <span className="text-sm md:text-base font-medium text-[#0f1f3d] dark:text-white whitespace-nowrap">{cert.date}</span>
                          <span className="text-xs md:text-sm font-mono text-[#0f1f3d] dark:text-white">{cert.id}</span>
                          <button
                            onClick={() => {
                              if (revoked) {
                                setRevokedIds((prev) => prev.filter((id) => id !== cert.id));
                              } else {
                                setRevokeTarget(cert);
                              }
                            }}
                            className={`text-sm md:text-base font-semibold ${revoked ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'} hover:opacity-80`}
                          >
                            {revoked ? 'Restore' : 'Revoke'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Final Tests' && (
              <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0f274f] p-4">
                <h3 className="text-xl font-semibold text-[#0f1f3d] dark:text-white">Test Questions</h3>

                <div className="mt-3 space-y-2.5">
                  {testQuestions.map((item) => (
                    <article key={item.id} className="rounded-xl bg-[#e9eff5] dark:bg-[#17345f] px-4 py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-medium text-[#0f1f3d] dark:text-white">{item.question}</p>
                        <p className="mt-0.5 text-sm text-[#5f7592] dark:text-slate-300">Answer: {item.answer}</p>
                      </div>
                      <button onClick={() => removeTestQuestion(item.id)} className="text-[#0f1f3d] dark:text-white/90 hover:text-red-500" aria-label="Delete test question">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </article>
                  ))}
                </div>

                <div className="mt-4 h-px bg-black/10 dark:bg-white/10" />

                <div className="mt-4 space-y-2.5">
                  <input
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Question text"
                    className="w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-[#e9eff5] dark:bg-[#17345f] px-3.5 text-sm text-[#0f1f3d] dark:text-white placeholder:text-[#6e809b] dark:placeholder:text-slate-300"
                  />
                  <input
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="Correct answer"
                    className="w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-[#e9eff5] dark:bg-[#17345f] px-3.5 text-sm text-[#0f1f3d] dark:text-white placeholder:text-[#6e809b] dark:placeholder:text-slate-300"
                  />
                  <button
                    onClick={addTestQuestion}
                    className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-[#e9eff5] dark:bg-[#17345f] text-[#0f1f3d] dark:text-white text-sm font-semibold inline-flex items-center gap-2"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>

                <div className="mt-5 h-px bg-black/10 dark:bg-white/10" />

                <div className="mt-4 flex items-center gap-4">
                  <label className="text-base font-semibold text-[#0f1f3d] dark:text-white">Passing Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={passingPercentage}
                    onChange={(e) => setPassingPercentage(e.target.value)}
                    className="w-28 h-10 rounded-xl border border-black/10 dark:border-white/10 bg-[#e9eff5] dark:bg-[#17345f] px-3 text-base text-[#0f1f3d] dark:text-white"
                  />
                </div>

                <div className="mt-4 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTimeLimitEnabled((prev) => !prev)}
                    aria-pressed={timeLimitEnabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${timeLimitEnabled ? 'bg-[#3C83F6]' : 'bg-[#d5deea] dark:bg-[#27446d]'}`}
                    aria-label="Toggle time limit"
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${timeLimitEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                  <span className="text-base font-medium text-[#0f1f3d] dark:text-white">Enable Time Limit</span>
                </div>

                <button className="mt-5 h-10 px-5 rounded-xl bg-[#3C83F6] hover:bg-[#2563eb] text-white text-base font-semibold">
                  Save Test
                </button>
              </section>
            )}

            {activeTab === 'Templates' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: 'Classic', title: 'Classic Template' },
                  { key: 'Modern', title: 'Modern Template' },
                  { key: 'Minimal', title: 'Minimal Template' },
                ].map((tpl) => (
                  <article key={tpl.key} className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0f274f] p-4">
                    <div className="h-28 rounded-xl bg-[#e2e8ef] dark:bg-[#17345f] flex items-center justify-center">
                      <span className="text-3xl font-semibold text-[#b4bfcc] dark:text-slate-400">{tpl.key}</span>
                    </div>
                    <div className="mt-4 text-center">
                      <h4 className="text-xl font-medium text-[#0f1f3d] dark:text-white">{tpl.title}</h4>
                      <p className="mt-1.5 text-sm text-[#5f7592] dark:text-slate-300">Certificate design template</p>
                    </div>
                  </article>
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}



