import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  LayoutGrid
} from 'lucide-react';
import Sidebar from '../../components/Dashboard/Sidebar';
import ScrollProgress from '../../components/ScrollProgress';
import { useTheme } from '../../context/ThemeContext';

const MANIFEST_PATH = '/resources/resume-templates/manifest.json';

const ResumeTemplates = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadTemplates = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(MANIFEST_PATH, { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Resume template manifest not found.');
        }

        const data = await response.json();
        const nextTemplates = Array.isArray(data) ? data : data.templates;

        if (!Array.isArray(nextTemplates)) {
          throw new Error('Resume template manifest is invalid.');
        }

        if (!cancelled) {
          setTemplates(nextTemplates);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setTemplates([]);
          setError(fetchError.message || 'Unable to load resume templates.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased ${isDarkMode ? 'dark' : 'light'}`}>
      <ScrollProgress />

      <div
        className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]'
            : 'bg-gradient-to-br from-[#daf0fa] via-[#c9edff] to-[#daf0fa]'
        }`}
      />

      <Sidebar />

      <main className="relative z-10 flex-1 overflow-y-auto px-5 pb-10 pt-24 lg:ml-64 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-[0_24px_80px_-40px_rgba(37,99,235,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)] md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-100/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-200">
                  <LayoutGrid className="h-4 w-4" />
                  Resume Templates
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-5xl">
                  Browse polished resume layouts.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 md:text-lg">
                  This grid is designed to feel like a document shelf: fast to scan, visually tidy, and still consistent with the existing TechLearn dashboard styling.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/85 px-5 py-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Manifest
                </p>
                <p className="mt-2 break-all text-sm text-slate-700 dark:text-slate-200">
                  {MANIFEST_PATH}
                </p>
              </div>
            </div>
          </section>

          {loading ? (
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/70 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
                >
                  <div className="aspect-[0.75] animate-pulse rounded-[1.2rem] bg-slate-200/80 dark:bg-white/10" />
                  <div className="mt-4 h-4 w-2/3 animate-pulse rounded-full bg-slate-200/80 dark:bg-white/10" />
                  <div className="mt-3 h-3 w-1/3 animate-pulse rounded-full bg-slate-200/80 dark:bg-white/10" />
                </div>
              ))}
            </section>
          ) : templates.length > 0 ? (
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {templates.map((template, index) => {
                const href = template.file || template.url || '#';
                const title = template.title || `Resume Template ${index + 1}`;
                const category = template.category || 'Resume';
                const accent = index % 3 === 0
                  ? 'from-sky-500/15 to-blue-500/5 dark:from-sky-400/15 dark:to-blue-400/5'
                  : index % 3 === 1
                    ? 'from-emerald-500/15 to-teal-500/5 dark:from-emerald-400/15 dark:to-teal-400/5'
                    : 'from-violet-500/15 to-indigo-500/5 dark:from-violet-400/15 dark:to-indigo-400/5';

                return (
                  <article
                    key={template.id || href || title}
                    className="group overflow-hidden rounded-[1.8rem] border border-white/60 bg-white/74 p-4 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.45)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_-40px_rgba(37,99,235,0.4)] dark:border-white/10 dark:bg-white/5"
                  >
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className={`relative block aspect-[0.76] overflow-hidden rounded-[1.3rem] border border-slate-200/70 bg-gradient-to-br ${accent} p-4 dark:border-white/10`}
                    >
                      <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-slate-700 shadow-sm dark:bg-slate-950/80 dark:text-slate-200">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                      <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/70 blur-xl dark:bg-white/10" />
                      <div className="absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-white/50 blur-xl dark:bg-sky-300/10" />

                      <div className="relative flex h-full flex-col rounded-[1rem] border border-white/80 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/80">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white dark:bg-white dark:text-slate-950">
                            PDF
                          </span>
                          <FileText className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="mt-5 space-y-2">
                          <div className="h-3 w-2/3 rounded-full bg-slate-900/85 dark:bg-white/80" />
                          <div className="h-2.5 w-1/2 rounded-full bg-slate-200 dark:bg-white/15" />
                        </div>
                        <div className="mt-6 grid gap-2">
                          <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/10" />
                          <div className="h-2.5 w-[88%] rounded-full bg-slate-100 dark:bg-white/10" />
                          <div className="h-2.5 w-[92%] rounded-full bg-slate-100 dark:bg-white/10" />
                          <div className="h-2.5 w-[70%] rounded-full bg-slate-100 dark:bg-white/10" />
                        </div>
                        <div className="mt-auto pt-6">
                          <div className="h-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5" />
                        </div>
                      </div>
                    </a>

                    <div className="px-1 pb-1 pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                            {title}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {category}
                          </p>
                        </div>
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-300 hover:text-sky-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-sky-300/30 dark:hover:text-sky-200"
                          aria-label={`Open ${title}`}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      </div>

                      {template.description ? (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {template.description}
                        </p>
                      ) : null}

                      <div className="mt-4 flex items-center gap-3">
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-[#1453a6] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#0f448b] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                          Open
                        </a>
                        <a
                          href={href}
                          download
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-sky-300 hover:text-sky-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-sky-300/30 dark:hover:text-sky-200"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : (
            <section className="rounded-[2rem] border border-dashed border-slate-200 bg-white/72 p-8 text-left shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Resume PDFs will appear here
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                {error
                  ? `Create ${MANIFEST_PATH} with your PDF entries and the grid will populate automatically.`
                  : 'Add PDF entries to the manifest and this page will render them in the document grid.'}
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResumeTemplates;
