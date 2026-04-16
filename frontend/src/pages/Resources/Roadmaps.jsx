import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import {
  AlertCircle,
  ArrowUpRight,
  BookMarked,
  FileText,
  RefreshCw
} from 'lucide-react';
import Sidebar from '../../components/Dashboard/Sidebar';
import ScrollProgress from '../../components/ScrollProgress';
import { useTheme } from '../../context/ThemeContext';

const ROADMAP_PATH = '/resources/roadmaps/roadmap.md';

const looksLikeHtmlDocument = (content) => {
  if (typeof content !== 'string') return false;
  const sample = content.slice(0, 500).toLowerCase();
  return sample.includes('<!doctype html') || sample.includes('<html') || sample.includes('<head>');
};

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="mt-10 mb-5 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-4xl">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 mb-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 mb-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-5 text-[15px] leading-8 text-slate-700 dark:text-slate-300 md:text-base">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-6 ml-1 space-y-3 text-slate-700 dark:text-slate-300">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-6 ml-5 list-decimal space-y-3 text-slate-700 dark:text-slate-300">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="pl-2 text-[15px] leading-7 marker:text-[#3C83F6] dark:marker:text-sky-300">
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-8 rounded-3xl border border-sky-200/70 bg-sky-50/80 px-6 py-5 text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-[#2563eb] underline decoration-[#2563eb]/30 underline-offset-4 transition hover:text-[#1d4ed8] dark:text-sky-300 dark:decoration-sky-300/30 dark:hover:text-sky-200"
    >
      {children}
    </a>
  ),
  code: ({ inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code
          className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-8 overflow-x-auto rounded-3xl border border-slate-900/10 bg-slate-950 p-5 text-sm text-slate-100 shadow-xl shadow-slate-950/10 dark:border-white/10">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-10 border-slate-200 dark:border-white/10" />
};

const Roadmaps = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadRoadmap = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(ROADMAP_PATH, { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Roadmap markdown is not available yet.');
        }

        const content = await response.text();

        if (looksLikeHtmlDocument(content)) {
          throw new Error('Roadmap markdown file is missing or being served as HTML fallback.');
        }

        if (!cancelled) {
          setMarkdown(content);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setMarkdown('');
          setError(fetchError.message || 'Unable to load roadmap.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRoadmap();

    return () => {
      cancelled = true;
    };
  }, []);

  const statusCopy = useMemo(() => {
    if (loading) {
      return {
        title: 'Loading roadmap',
        description: 'Preparing the latest markdown content for reading.'
      };
    }

    if (error) {
      return {
        title: 'Roadmap not uploaded yet',
        description: `Add a markdown file at ${ROADMAP_PATH} and this page will render it automatically.`
      };
    }

    return {
      title: 'Markdown-powered roadmap',
      description: 'Uploaded roadmap content is rendered in a clean, reading-first layout.'
    };
  }, [error, loading]);

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
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-[0_24px_80px_-40px_rgba(37,99,235,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)] md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-100/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-200">
                  <BookMarked className="h-4 w-4" />
                  Roadmaps
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-5xl">
                  Clear, readable learning plans.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 md:text-lg">
                  This page is built to feel like a focused notes view: soft framing, generous spacing, and markdown rendered with strong hierarchy.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:max-w-sm md:grid-cols-1">
                <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/85 px-5 py-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Source
                  </p>
                  <p className="mt-2 break-all text-sm text-slate-700 dark:text-slate-200">
                    {ROADMAP_PATH}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/85 px-5 py-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Status
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                    {statusCopy.title}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
            <article className="rounded-[2rem] border border-white/60 bg-white/82 p-6 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-[#081223]/80 md:p-8 lg:p-10">
              {loading ? (
                <div className="flex min-h-[320px] items-center justify-center">
                  <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading roadmap content
                  </div>
                </div>
              ) : error ? (
                <div className="flex min-h-[320px] flex-col items-start justify-center rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/70 p-8 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {statusCopy.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {statusCopy.description}
                  </p>
                </div>
              ) : (
                <div className="markdown-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={markdownComponents}
                  >
                    {markdown}
                  </ReactMarkdown>
                </div>
              )}
            </article>

            <aside className="space-y-4">
              <div className="rounded-[1.75rem] border border-white/60 bg-white/72 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-200">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                  Reading-first layout
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Wide enough for comfortable reading, but constrained enough to keep long markdown easy to scan on desktop and mobile.
                </p>
              </div>

              <a
                href={ROADMAP_PATH}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:border-sky-300/30"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Open Source File
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                    View raw markdown
                  </p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-slate-400 transition group-hover:text-sky-600 dark:group-hover:text-sky-300" />
              </a>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Roadmaps;
