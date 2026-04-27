import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import {
  AlertCircle,
  Loader2,
} from 'lucide-react';
import ScrollProgress from '../../components/ScrollProgress';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';

const ROADMAP_PATH = '/resources/roadmaps/roadmap.md';

const looksLikeHtmlDocument = (content) => {
  if (typeof content !== 'string') return false;
  const sample = content.slice(0, 500).toLowerCase();
  return sample.includes('<!doctype html') || sample.includes('<html') || sample.includes('<head>');
};

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="mt-10 mb-5 text-3xl font-bold tracking-tight text-[#0d2a57] dark:text-[#dff3ff] md:text-4xl">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 mb-4 text-2xl font-semibold tracking-tight text-[#14386f] dark:text-[#c9e9ff] md:text-3xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 mb-3 text-xl font-semibold tracking-tight text-[#1d4b87] dark:text-[#b7ddff]">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-5 text-[15px] leading-8 text-[#2f588c] dark:text-[#afcff1] md:text-base">{children}</p>
  ),
  ul: ({ children }) => <ul className="mb-6 ml-1 space-y-3 text-[#2f588c] dark:text-[#afcff1]">{children}</ul>,
  ol: ({ children }) => (
    <ol className="mb-6 ml-5 list-decimal space-y-3 text-[#2f588c] dark:text-[#afcff1]">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="pl-2 text-[15px] leading-7 marker:text-[#1983d8] dark:marker:text-[#7ac7ff]">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-8 rounded-3xl border border-[#90c8ff] bg-[#e9f6ff] px-6 py-5 text-[#2c578d] shadow-sm dark:border-[#3f74ac] dark:bg-[#10335f] dark:text-[#bee1ff]">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-[#0c73be] underline decoration-[#0c73be]/35 underline-offset-4 transition hover:text-[#085a96] dark:text-[#7ac8ff] dark:decoration-[#7ac8ff]/50 dark:hover:text-[#9edbff]"
    >
      {children}
    </a>
  ),
  code: ({ inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code
          className="rounded-md border border-[#9fd2ff] bg-[#e1f2ff] px-1.5 py-0.5 font-mono text-[13px] text-[#133f73] dark:border-[#3f74ac] dark:bg-[#10335f] dark:text-[#bee1ff]"
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
    <pre className="my-8 overflow-x-auto rounded-3xl border border-[#335e92] bg-[#0b1f3f] p-5 text-sm text-slate-100 shadow-xl shadow-[#0b1f3f]/30 dark:border-[#3f74ac] dark:bg-[#071831]">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-10 border-[#9fd2ff] dark:border-[#3f74ac]" />,
};

export default function Roadmaps() {
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
        title: 'Syncing roadmap',
        description: 'Loading the latest roadmap markdown and preparing the reading stage.',
      };
    }

    if (error) {
      return {
        title: 'Roadmap file not available',
        description: `Add markdown at ${ROADMAP_PATH} and this page will render it automatically.`,
      };
    }

    return {
      title: 'Roadmap ready',
      description: 'Your markdown is now rendered with readability-first structure and visual hierarchy.',
    };
  }, [error, loading]);

  const roadmapMetrics = useMemo(() => {
    if (!markdown) {
      return {
        words: 0,
        sections: 0,
        checkboxes: 0,
      };
    }

    const words = markdown.trim().split(/\s+/).filter(Boolean).length;
    const sections = markdown.split('\n').filter((line) => /^#{1,3}\s/.test(line.trim())).length;
    const checkboxes = markdown.split('\n').filter((line) => /-\s\[[ xX]\]/.test(line.trim())).length;

    return { words, sections, checkboxes };
  }, [markdown]);

  return (
    <UserSidebarLayout maxWidthClass="max-w-[90rem]">
      <ScrollProgress />

      <div className="space-y-6">
        <section className="px-1 py-2">
          <h1 className="dashboard-page-title">
            Roadmap
          </h1>
          <p className="dashboard-page-subtitle max-w-3xl">
            Plan clearly, track faster, and read your roadmap without visual noise.
          </p>
        </section>

        <section>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="dashboard-inner-surface px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4a79ab] dark:text-[#9ed0ff]">Sections</p>
              <p className="mt-2 text-2xl font-bold text-[#0f2d5d] dark:text-[#dff3ff]">{roadmapMetrics.sections}</p>
            </div>
            <div className="dashboard-inner-surface px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4a79ab] dark:text-[#9ed0ff]">Words</p>
              <p className="mt-2 text-2xl font-bold text-[#0f2d5d] dark:text-[#dff3ff]">{roadmapMetrics.words}</p>
            </div>
            <div className="dashboard-inner-surface px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4a79ab] dark:text-[#9ed0ff]">Checkpoints</p>
              <p className="mt-2 text-2xl font-bold text-[#0f2d5d] dark:text-[#dff3ff]">{roadmapMetrics.checkboxes}</p>
            </div>
          </div>

          <article className="dashboard-surface p-6 md:p-8 lg:p-10 xl:flex xl:h-[40rem] xl:flex-col">
            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center xl:flex-1">
                <div className="inline-flex items-center gap-3 rounded-full border border-[#86c4ff]/45 bg-[#dbf1ff] px-5 py-3 text-sm font-medium text-[#2d7fe8] dark:border-[#6fbfff]/35 dark:bg-[#0d366f] dark:text-[#8fd9ff]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading roadmap content
                </div>
              </div>
            ) : error ? (
              <div className="flex min-h-[360px] flex-col items-start justify-center rounded-[1.6rem] border border-dashed border-[#86c4ff]/45 bg-[#e7f6ff] p-8 dark:border-[#6fbfff]/35 dark:bg-[#0d366f]/65 xl:flex-1">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#8ec8ff] bg-[#e4f4ff] text-[#1266af] dark:border-[#6fbfff] dark:bg-[#14406f] dark:text-[#9cd6ff]">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#163f75] dark:text-[#d3edff]">{statusCopy.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#2f588c] dark:text-[#afcff1]">{statusCopy.description}</p>
              </div>
            ) : (
              <div className="markdown-body xl:flex-1 xl:overflow-y-auto xl:pr-2 xl:[scrollbar-width:thin] xl:[scrollbar-color:#7abdf2_transparent] xl:[&::-webkit-scrollbar]:w-1.5 xl:[&::-webkit-scrollbar-track]:bg-transparent xl:[&::-webkit-scrollbar-thumb]:rounded-full xl:[&::-webkit-scrollbar-thumb]:bg-[#7abdf2]/70 dark:xl:[&::-webkit-scrollbar-thumb]:bg-[#5e9dd0]/70">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
                  {markdown}
                </ReactMarkdown>
              </div>
            )}
          </article>
        </section>
      </div>
    </UserSidebarLayout>
  );
}
