import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiSearch, FiX, FiUser, FiLogOut } from 'react-icons/fi';
import { adminNotifications } from '../../data/adminNotificationsData';

const quickActions = [
  { label: 'Create college', path: '/colleges' },
  { label: 'Create student', path: '/students' },
  { label: 'Create Batch', path: '/batches' },
  { label: 'Create Question', path: '/question-bank' },
];

const navigateItems = [
  { label: 'Go to overview', path: '/dashboard' },
  { label: 'Go to colleges', path: '/colleges' },
  { label: 'Go to batches', path: '/batches' },
  { label: 'Go to students', path: '/students' },
  { label: 'Go to question bank', path: '/question-bank' },
  { label: 'Go to analytics', path: '/analytics' },
];

const studentSearchData = [
  { name: 'Alex Johnson', college: 'MIT' },
  { name: 'Sarah Williams', college: 'Stanford University' },
  { name: 'Mike Chen', college: 'MIT' },
  { name: 'Emily Davis', college: 'IIT Delhi' },
  { name: 'Kevin Zhang', college: 'Harvard University' },
];

export default function AdminHeaderControls({ user, logout }) {
  const navigate = useNavigate();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const commandInputRef = useRef(null);

  const query = commandQuery.trim().toLowerCase();

  const filteredQuickActions = useMemo(() => {
    if (!query) return quickActions;
    return quickActions.filter((item) => item.label.toLowerCase().includes(query));
  }, [query]);

  const filteredNavigateItems = useMemo(() => {
    if (!query) return navigateItems;
    return navigateItems.filter((item) => item.label.toLowerCase().includes(query));
  }, [query]);

  const filteredStudentResults = useMemo(() => {
    if (!query) return studentSearchData;
    return studentSearchData.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.college.toLowerCase().includes(query)
    );
  }, [query]);

  useEffect(() => {
    if (isCommandOpen) {
      commandInputRef.current?.focus();
    } else {
      setCommandQuery('');
    }
  }, [isCommandOpen]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
      if (event.key === 'Escape') {
        setIsCommandOpen(false);
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleNavigate = (path) => {
    setIsCommandOpen(false);
    navigate(path);
  };

  const commandModal = isCommandOpen ? (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsCommandOpen(false)} />
      <div className="relative w-full max-w-2xl bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 flex items-center gap-3">
          <FiSearch className="w-4 h-4 text-black/35 dark:text-white/35" />
          <input
            ref={commandInputRef}
            value={commandQuery}
            onChange={(e) => setCommandQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-black/75 dark:text-white/80 placeholder:text-black/30 dark:placeholder:text-white/30"
          />
          {commandQuery && (
            <button
              onClick={() => setCommandQuery('')}
              className="w-7 h-7 rounded-lg border border-black/10 dark:border-white/10 inline-flex items-center justify-center text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Clear search"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsCommandOpen(false)}
            className="w-7 h-7 rounded-lg border border-black/10 dark:border-white/10 inline-flex items-center justify-center text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Close search"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[56vh] overflow-y-auto p-4 space-y-5">
          <div>
            <p className="admin-micro-label text-black/40 dark:text-white/40 mb-2">Quick actions:</p>
            <div className="space-y-1.5">
              {filteredQuickActions.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="admin-micro-label text-black/40 dark:text-white/40 mb-2">Navigate:</p>
            <div className="space-y-1.5">
              {filteredNavigateItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="admin-micro-label text-black/40 dark:text-white/40 mb-2">Search Students:</p>
            <div className="space-y-1.5">
              {filteredStudentResults.map((student) => (
                <button
                  key={student.name}
                  onClick={() => handleNavigate('/students')}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  {student.name} - {student.college}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {typeof document !== 'undefined' && createPortal(commandModal, document.body)}

      <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
        <button
          onClick={() => setIsCommandOpen(true)}
          className="relative hidden md:flex items-center w-64 bg-white/20 dark:bg-black/20 border border-black/5 dark:border-white/5 py-2 pl-10 pr-12 rounded-lg backdrop-blur-md hover:bg-white/30 dark:hover:bg-black/30 transition-colors text-left group"
        >
          <FiSearch className="absolute left-3 w-4 h-4 text-black/40 dark:text-white/40" />
          <span className="text-sm text-black/40 dark:text-white/40">Search...</span>
          <div className="absolute right-3 flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded">
            <span>⌘</span>
            <span>K</span>
          </div>
        </button>

        <div className="relative shrink-0">
          <button
            onClick={() => {
              setIsNotificationsOpen((prev) => !prev);
              setIsProfileOpen(false);
            }}
            className="relative text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <FiBell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-1.5rem))] sm:w-80 bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-sm font-semibold text-black/75 dark:text-white/80">Notifications</p>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="w-7 h-7 rounded-lg border border-black/10 dark:border-white/10 inline-flex items-center justify-center text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Close notifications"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 space-y-1.5">
                {adminNotifications.map((note) => (
                  <div
                    key={note.id}
                    className="px-2 py-2 rounded-xl text-xs text-black/60 dark:text-white/60 bg-black/[0.03] dark:bg-white/[0.04]"
                  >
                    <p className="font-semibold text-black/75 dark:text-white/80">{note.title}</p>
                    <p className="mt-0.5 text-black/55 dark:text-white/60">{note.body}</p>
                    <p className="mt-1 text-[10px] text-black/45 dark:text-white/45">{note.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => {
              setIsProfileOpen((prev) => !prev);
              setIsNotificationsOpen(false);
            }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-sm font-medium tracking-wider shadow-lg border-2 border-white/20 dark:border-black/20"
          >
            {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-[min(13rem,calc(100vw-1.5rem))] sm:w-52 bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-50">
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2"
              >
                <FiUser className="w-4 h-4" />
                Open Profile
              </button>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  if (typeof logout === 'function') logout();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2"
              >
                <FiLogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
