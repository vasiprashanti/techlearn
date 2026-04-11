import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/Dashboard/Sidebar';
import { resourceAPI } from '../../services/api';
import { FiDownload, FiEye, FiFileText, FiVideo, FiLink2 } from 'react-icons/fi';

const typeIconMap = {
  PDF: FiFileText,
  Sheet: FiFileText,
  Video: FiVideo,
  Link: FiLink2,
};

export default function ResourcesTab({ category }) {
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isDarkMode = theme === 'dark';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    resourceAPI
      .getResources(category)
      .then((data) => {
        if (!cancelled) {
          setEntries(Array.isArray(data?.data) ? data.data : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load resources.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  const filteredEntries = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return entries.filter((entry) => !q || String(entry.title || '').toLowerCase().includes(q));
  }, [entries, searchTerm]);

  const openResource = async (resource) => {
    try {
      await resourceAPI.recordResourceView(resource._id || resource.id);
      setEntries((prev) => prev.map((item) => (
        String(item._id || item.id) === String(resource._id || resource.id)
          ? { ...item, views: Number(item.views || 0) + 1 }
          : item
      )));
    } catch {
      // Ignore view tracking failure and still open the resource.
    }

    if (resource.url) {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main className={`flex-1 transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-24 pb-12 px-6 md:px-12 lg:px-16 overflow-auto`}>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-semibold text-[#1a202c] dark:text-white">{category}</h1>
          <p className="mt-1 text-sm text-[#5f7592] dark:text-slate-300">Learning resources uploaded by admins</p>

          <div className="mt-4">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${category.toLowerCase()}...`}
              className="w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 text-sm text-black/80 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 outline-none"
            />
          </div>

          <div className="mt-5 space-y-3">
            {loading && (
              <p className="text-sm text-[#5f7592] dark:text-slate-300">Loading resources...</p>
            )}

            {!loading && error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            {!loading && !error && filteredEntries.length === 0 && (
              <p className="text-sm text-[#5f7592] dark:text-slate-300">No resources found in this category.</p>
            )}

            {!loading && !error && filteredEntries.map((entry) => {
              const TypeIcon = typeIconMap[entry.type] || FiFileText;
              return (
                <article key={entry._id || entry.id} className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0f274f] px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#e8eef5] dark:bg-[#1a3a66] flex items-center justify-center shrink-0">
                      <TypeIcon className="w-3.5 h-3.5 text-[#6e809b] dark:text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm md:text-base text-[#0b1b38] dark:text-white break-words">{entry.title}</h3>
                      <p className="text-[11px] md:text-xs text-[#5f7592] dark:text-slate-300">
                        Uploaded on {String(entry.createdAt || '').slice(0, 10)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#d6e6f4] text-[#0f2b54] dark:bg-[#21446f] dark:text-blue-200">
                      {entry.type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm text-[#5f7592] dark:text-slate-300">
                      <FiEye className="w-3.5 h-3.5" />
                      {entry.views || 0}
                    </span>
                    <button
                      onClick={() => openResource(entry)}
                      className="h-8 w-8 rounded-full inline-flex items-center justify-center border border-transparent text-[#0f1f3d] dark:text-slate-200 transition-all hover:border-[#3C83F6] hover:text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/10"
                      aria-label={`Open ${entry.title}`}
                    >
                      <FiDownload className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
