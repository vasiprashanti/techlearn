import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
} from 'lucide-react';
import ScrollProgress from '../../components/ScrollProgress';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';

const MANIFEST_PATH = '/resources/resume-templates/manifest.json';

const getTemplateFormat = (href, template) => {
  if (template?.format) return String(template.format).toUpperCase();
  if (!href || href === '#') return 'FILE';

  const cleanHref = href.split('?')[0].split('#')[0];
  const extension = cleanHref.includes('.') ? cleanHref.split('.').pop() : '';
  return extension ? extension.toUpperCase() : 'FILE';
};

const hasValidLink = (href) => Boolean(href && href !== '#');

const ResumeTemplates = () => {
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
    <UserSidebarLayout maxWidthClass="max-w-7xl">
      <ScrollProgress />
      <div className="space-y-6">
          <section className="px-1 py-2">
            <h1 className="dashboard-page-title">
              Resume Templates
            </h1>
            <p className="dashboard-page-subtitle max-w-2xl">
              Browse polished resume layouts.
            </p>
          </section>

          {loading ? (
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="dashboard-surface overflow-hidden p-4"
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
                const isLinkValid = hasValidLink(href);
                const title = template.title || `Resume Template ${index + 1}`;
                const category = template.category || 'Resume';
                const format = getTemplateFormat(href, template);
                const accent = index % 3 === 0
                  ? 'from-sky-500/15 to-blue-500/5 dark:from-sky-400/15 dark:to-blue-400/5'
                  : index % 3 === 1
                    ? 'from-emerald-500/15 to-teal-500/5 dark:from-emerald-400/15 dark:to-teal-400/5'
                    : 'from-violet-500/15 to-indigo-500/5 dark:from-violet-400/15 dark:to-indigo-400/5';

                return (
                  <article
                    key={template.id || href || title}
                    className="dashboard-surface group flex h-full flex-col overflow-hidden p-4 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_-40px_rgba(37,99,235,0.35)]"
                  >
                    <a
                      href={isLinkValid ? href : undefined}
                      target={isLinkValid ? '_blank' : undefined}
                      rel={isLinkValid ? 'noreferrer' : undefined}
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
                            {format}
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

                    <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-h-[4.4rem] flex-1">
                          <h2 className="text-base font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                            {title}
                          </h2>
                          <p className="mt-1 text-sm text-[#5f82ac] dark:text-[#81bde6]">
                            {category}
                          </p>
                        </div>
                        <a
                          href={isLinkValid ? href : undefined}
                          target={isLinkValid ? '_blank' : undefined}
                          rel={isLinkValid ? 'noreferrer' : undefined}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#86c4ff]/45 bg-[#f5fbff] text-[#4c6f9a] transition hover:border-[#5da8f0] hover:text-[#2d7fe8] dark:border-[#6fbfff]/35 dark:bg-[#0a2f6f]/55 dark:text-[#7fb8e2] dark:hover:border-[#8fd9ff]/60 dark:hover:text-[#a8e6ff]"
                          aria-label={`Open ${title}`}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      </div>

                      {template.description ? (
                        <p className="mt-3 min-h-[3.2rem] line-clamp-2 text-sm leading-6 text-[#3d618e] dark:text-[#7fb8e2]">
                          {template.description}
                        </p>
                      ) : <div className="mt-3 min-h-[3.2rem]" />}

                      <div className="mt-auto flex items-center gap-3 pt-4">
                        <a
                          href={isLinkValid ? href : undefined}
                          target={isLinkValid ? '_blank' : undefined}
                          rel={isLinkValid ? 'noreferrer' : undefined}
                          className="dashboard-primary-btn rounded-full px-4 py-2 text-xs tracking-[0.18em]"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                          Open
                        </a>
                        <a
                          href={isLinkValid ? href : undefined}
                          download={isLinkValid ? '' : undefined}
                          className="dashboard-secondary-btn rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em]"
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
            <section className="dashboard-surface rounded-[2rem] border-dashed p-8 text-left shadow-sm">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2d7fe8] text-white dark:bg-[#8fd9ff] dark:text-[#0a2f6f]">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[#0d2a57] dark:text-[#8fd9ff]">
                Resume PDFs will appear here
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#4c6f9a] dark:text-[#7fb8e2]">
                {error
                  ? `Create ${MANIFEST_PATH} with your PDF entries and the grid will populate automatically.`
                  : 'Add PDF entries to the manifest and this page will render them in the document grid.'}
              </p>
            </section>
          )}
      </div>
    </UserSidebarLayout>
  );
};

export default ResumeTemplates;
