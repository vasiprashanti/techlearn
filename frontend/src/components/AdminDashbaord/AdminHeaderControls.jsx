import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiMoon, FiSearch, FiSun, FiX } from 'react-icons/fi';
import { adminAPI, preferRemoteData } from '../../services/adminApi';
import { emptyNotifications } from '../../data/adminEmptyStates';
import { useTheme } from '../../context/ThemeContext';

const quickActions = [
  { label: 'Create college', path: '/colleges' },
  { label: 'Create student', path: '/students' },
  { label: 'Create Batch', path: '/batches' },
  { label: 'Create Question', path: '/question-bank' },
  { label: 'Create Coding Round', path: '/admin/codingroundupload' },
];

const navigateItems = [
  { label: 'Go to overview', path: '/dashboard' },
  { label: 'Go to colleges', path: '/colleges' },
  { label: 'Go to batches', path: '/batches' },
  { label: 'Go to students', path: '/students' },
  { label: 'Go to question bank', path: '/question-bank' },
  { label: 'Go to coding rounds', path: '/admin/codingroundupload' },
  { label: 'Go to analytics', path: '/analytics' },
];

export default function AdminHeaderControls({ user, logout }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationEntries, setNotificationEntries] = useState(emptyNotifications);
  const [studentSearchData, setStudentSearchData] = useState([]);
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
        (student.name || '').toLowerCase().includes(query) ||
        (student.college || '').toLowerCase().includes(query)
    );
  }, [query, studentSearchData]);

  useEffect(() => {
    let cancelled = false;

    adminAPI
      .getNotifications()
      .then((remoteNotifications) => {
        if (!cancelled) {
          setNotificationEntries(preferRemoteData(remoteNotifications, emptyNotifications));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotificationEntries(emptyNotifications);
        }
      });

    adminAPI
      .getStudents()
      .then((remoteStudents) => {
        if (!cancelled) {
          setStudentSearchData(
            preferRemoteData(remoteStudents, []).slice(0, 8).map((student) => ({
              name: student.name || 'Unnamed Student',
              college: student.college || 'Unknown College',
            }))
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStudentSearchData([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
      <div className="relative w-full max-w-2xl bg-[#f8fcff]/95 dark:bg-black/40 border border-white/35 dark:border-white/5 rounded-[1.75rem] shadow-2xl overflow-hidden backdrop-blur-xl">
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
                  className="w-full text-left px-3 py-2 rounded-xl text-sm text-black/75 dark:text-white/80 hover:bg-white/60 dark:hover:bg-[#122449] transition-colors"
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
                  className="w-full text-left px-3 py-2 rounded-xl text-sm text-black/75 dark:text-white/80 hover:bg-white/60 dark:hover:bg-[#122449] transition-colors"
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
                  className="w-full text-left px-3 py-2 rounded-xl text-sm text-black/75 dark:text-white/80 hover:bg-white/60 dark:hover:bg-[#122449] transition-colors"
                >
                  {student.name} - {student.college}
                </button>
              ))}
              {filteredStudentResults.length === 0 && (
                <div className="px-3 py-2 rounded-xl text-sm text-black/45 dark:text-white/45 border border-dashed border-black/10 dark:border-white/10">
                  No students available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {typeof document !== 'undefined' && createPortal(commandModal, document.body)}

      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
        <button
          onClick={() => setIsCommandOpen(true)}
          className="relative inline-flex items-center justify-center sm:justify-start h-9 w-9 sm:w-40 md:w-48 lg:w-[15.5rem] bg-white/65 dark:bg-black/40 border border-white/35 dark:border-white/5 py-2 sm:pl-9 sm:pr-10 rounded-xl backdrop-blur-md hover:bg-white/80 dark:hover:bg-[#122449] transition-colors text-left group"
        >
          <FiSearch className="sm:absolute sm:left-3 w-3.5 h-3.5 text-black/45 dark:text-white/45" />
          <span className="hidden sm:inline text-xs text-black/45 dark:text-white/45">Search...</span>
          <div className="hidden lg:flex absolute right-2.5 items-center gap-1 text-[9px] font-medium text-black/45 dark:text-white/45 border border-black/10 dark:border-white/12 px-1.5 py-0.5 rounded">
            <span>⌘</span>
            <span>K</span>
          </div>
        </button>

        <div className="relative shrink-0">
          <button
            onClick={() => {
              setIsNotificationsOpen((prev) => !prev);
            }}
            className="relative w-9 h-9 inline-flex items-center justify-center text-black/60 dark:text-white/65 hover:text-black dark:hover:text-white rounded-xl border border-white/35 dark:border-white/5 bg-white/65 dark:bg-black/40 hover:bg-white/80 dark:hover:bg-[#122449] transition-colors"
          >
            <FiBell className="w-4 h-4" />
            {notificationEntries.length > 0 && (
              <span className="absolute top-[9px] right-[9px] w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-1.5rem))] sm:w-80 bg-[#f8fcff]/95 dark:bg-black/40 border border-white/35 dark:border-white/5 rounded-[1.75rem] shadow-2xl p-3 z-50 backdrop-blur-xl">
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
                {notificationEntries.map((note) => (
                  <div
                    key={note.id}
                    className="px-2 py-2 rounded-xl text-xs text-black/60 dark:text-white/60 bg-black/[0.03] dark:bg-white/[0.04]"
                  >
                    <p className="font-semibold text-black/75 dark:text-white/80">{note.title}</p>
                    <p className="mt-0.5 text-black/55 dark:text-white/60">{note.body}</p>
                    <p className="mt-1 text-[10px] text-black/45 dark:text-white/45">{note.date}</p>
                  </div>
                ))}
                {notificationEntries.length === 0 && (
                  <div className="px-2 py-6 rounded-xl text-xs text-center text-black/45 dark:text-white/45 border border-dashed border-black/10 dark:border-white/10">
                    No notifications yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="shrink-0 w-9 h-9 rounded-xl border border-white/35 dark:border-white/5 bg-white/65 dark:bg-black/40 hover:bg-white/80 dark:hover:bg-[#122449] inline-flex items-center justify-center text-black/60 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
          aria-label="Toggle dark mode"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
        </button>
      </div>
    </>
  );
}
