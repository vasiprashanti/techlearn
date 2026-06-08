import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import ScrollProgress from '../../components/ScrollProgress';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { resourceAPI } from '../../services/api';

const ROADMAP_PATH = '/resources/roadmaps/roadmap.md';

const looksLikeHtmlDocument = (content) => {
  if (typeof content !== 'string') return false;
  const sample = content.slice(0, 500).toLowerCase();
  return sample.includes('<!doctype html') || sample.includes('<html') || sample.includes('<head>');
};

const stripMarkdown = (value = '') =>
  value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/[`*_~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const getStepMeta = (heading, index) => {
  const cleanHeading = stripMarkdown(heading);
  const match = cleanHeading.match(/^(day|phase|week|module|track|step)\s*([0-9a-z]+)\s*:?\s*(.*)$/i);

  if (match) {
    return {
      label: `${match[1].toUpperCase()} ${match[2].toUpperCase()}`,
      title: match[3]?.trim() || cleanHeading,
    };
  }

  return {
    label: `STEP ${index + 1}`,
    title: cleanHeading || `Roadmap step ${index + 1}`,
  };
};

const getPreview = (body) => {
  const preview = stripMarkdown(
    body
      .split('\n')
      .filter((line) => line.trim() && !/^#{1,6}\s/.test(line.trim()))
      .slice(0, 3)
      .join(' ')
  );

  if (!preview) return 'Open this milestone to view the assigned roadmap details.';
  return preview.length > 125 ? `${preview.slice(0, 122)}...` : preview;
};

const parseRoadmapMarkdown = (markdown) => {
  const content = typeof markdown === 'string' ? markdown.replace(/\r\n/g, '\n').trim() : '';

  if (!content) {
    return {
      title: '',
      intro: '',
      steps: [],
    };
  }

  const lines = content.split('\n');
  const introLines = [];
  const sections = [];
  let title = '';
  let currentSection = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      const isTimelineHeading =
        level <= 2 || /^(day|phase|week|module|track|step)\s*[0-9a-z]+/i.test(stripMarkdown(headingText));

      if (level === 1 && !title && !currentSection && sections.length === 0) {
        title = stripMarkdown(headingText);
        return;
      }

      if (isTimelineHeading) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          heading: headingText,
          body: '',
        };
        return;
      }
    }

    if (currentSection) {
      currentSection.body += `${line}\n`;
    } else if (trimmed) {
      introLines.push(line);
    }
  });

  if (currentSection) sections.push(currentSection);

  if (!sections.length) {
    sections.push({
      heading: title || 'Roadmap Details',
      body: content,
    });
  }

  const steps = sections.map((section, index) => {
    const meta = getStepMeta(section.heading, index);
    const body = section.body.trim();

    return {
      id: `${meta.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`,
      label: meta.label,
      title: meta.title,
      preview: getPreview(body),
      body: body || `## ${meta.title}`,
    };
  });

  return {
    title,
    intro: stripMarkdown(introLines.join(' ')),
    steps,
  };
};

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="mt-6 mb-4 text-2xl font-semibold tracking-tight text-[#00113b] dark:text-[#dff3ff] md:text-3xl">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 mb-3 text-xl font-semibold tracking-tight text-[#00113b] dark:text-[#c9e9ff] md:text-2xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-5 mb-2 text-lg font-semibold tracking-tight text-[#00113b]/90 dark:text-[#b7ddff]">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-[15px] leading-7 text-[#00113b]/72 dark:text-[#afcff1] md:text-base">{children}</p>
  ),
  ul: ({ children }) => <ul className="mb-5 space-y-2 text-[#00113b]/72 dark:text-[#afcff1]">{children}</ul>,
  ol: ({ children }) => (
    <ol className="mb-5 ml-5 list-decimal space-y-2 text-[#00113b]/72 dark:text-[#afcff1]">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="pl-2 text-[15px] leading-7 marker:text-[#0b3ef2] dark:marker:text-[#7ac7ff]">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-6 rounded-2xl border border-[#8ec8ff]/70 bg-[#e4f6ff]/80 px-5 py-4 text-[#00113b]/76 dark:border-[#3f74ac] dark:bg-[#09204b] dark:text-[#bee1ff]">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-[#0b3ef2] underline decoration-[#0b3ef2]/30 underline-offset-4 transition hover:text-[#00113b] dark:text-[#7ac8ff] dark:decoration-[#7ac8ff]/45 dark:hover:text-[#9edbff]"
    >
      {children}
    </a>
  ),
  code: ({ inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code
          className="rounded-md border border-[#9fd2ff] bg-[#e1f2ff] px-1.5 py-0.5 font-mono text-[13px] text-[#00113b] dark:border-[#3f74ac] dark:bg-[#10335f] dark:text-[#bee1ff]"
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
    <pre className="my-6 overflow-x-auto rounded-2xl border border-[#335e92] bg-[#0b1f3f] p-5 text-sm text-slate-100 shadow-xl shadow-[#0b1f3f]/25 dark:border-[#3f74ac] dark:bg-[#071831]">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-8 border-[#9fd2ff] dark:border-[#3f74ac]" />,
};

export default function Roadmaps() {
  const [markdown, setMarkdown] = useState('');
  const [roadmapTitle, setRoadmapTitle] = useState('Roadmap');
  const [roadmapDescription, setRoadmapDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStepId, setActiveStepId] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadRoadmap = async () => {
      try {
        setLoading(true);
        setError('');

        const hasToken = Boolean(localStorage.getItem('token') || localStorage.getItem('authToken'));
        if (hasToken) {
          try {
            const assignedRoadmapPayload = await resourceAPI.getCurrentRoadmap();
            const assignedRoadmap = assignedRoadmapPayload?.data || assignedRoadmapPayload;
            if (assignedRoadmap?.markdownBody && !cancelled) {
              setMarkdown(assignedRoadmap.markdownBody);
              setRoadmapTitle(assignedRoadmap.title || 'Roadmap');
              setRoadmapDescription(assignedRoadmap.description || '');
              return;
            }
          } catch {
            // Fall back to the default markdown file below.
          }
        }

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
          setRoadmapTitle('Roadmap');
          setRoadmapDescription('');
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

  const parsedRoadmap = useMemo(() => parseRoadmapMarkdown(markdown), [markdown]);

  useEffect(() => {
    if (!activeStepId) return;
    if (!parsedRoadmap.steps.some((step) => step.id === activeStepId)) {
      setActiveStepId('');
    }
  }, [activeStepId, parsedRoadmap.steps]);

  useEffect(() => {
    if (!activeStepId) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Hide navbar when drawer is open
    window.dispatchEvent(new CustomEvent('techlearn:hide-navbar', { detail: { hide: true } }));

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setActiveStepId('');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      // Restore navbar when drawer closes
      window.dispatchEvent(new CustomEvent('techlearn:hide-navbar', { detail: { hide: false } }));
    };
  }, [activeStepId]);

  const activeStep = parsedRoadmap.steps.find((step) => step.id === activeStepId);

  const heroTitle = roadmapTitle !== 'Roadmap' ? roadmapTitle : parsedRoadmap.title || 'Roadmap';
  const heroDescription =
    roadmapDescription ||
    parsedRoadmap.intro ||
    'Follow the assigned batch or track roadmap, and open any milestone for details.';

  const statusCopy = useMemo(() => {
    if (loading) {
      return {
        title: 'Syncing roadmap',
        description: 'Loading the latest batch or track roadmap.',
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
      description: 'Your assigned roadmap is ready.',
    };
  }, [error, loading]);

  return (
    <UserSidebarLayout maxWidthClass="max-w-[1180px]">
      <ScrollProgress />

      <div className="space-y-8 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="mx-auto max-w-4xl pt-2 text-center md:pt-4"
        >
          <h1 className="font-press-start leading-normal">
            <span className="block text-xl sm:text-2xl md:text-3xl brand-heading-primary">
              {heroTitle.toUpperCase()}
            </span>
          </h1>
        </motion.div>

        {loading ? (
          <section className="flex min-h-[360px] items-center justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#86c4ff]/45 bg-white/40 px-5 py-3 text-sm font-medium text-[#00113b] shadow-sm shadow-[#3c83f6]/10 backdrop-blur-xl dark:border-[#6fbfff]/24 dark:bg-[#051738]/75 dark:text-[#8fd9ff]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading roadmap content
            </div>
          </section>
        ) : error ? (
          <section className="dashboard-surface dashboard-surface-strong mx-auto max-w-2xl border-dashed p-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#8ec8ff] bg-[#e4f4ff] text-[#1266af] dark:border-[#6fbfff] dark:bg-[#14406f] dark:text-[#9cd6ff]">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#00113b] dark:text-[#d3edff]">{statusCopy.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[#00113b]/65 dark:text-[#afcff1]">{statusCopy.description}</p>
          </section>
        ) : (
          <>
            <section className="relative mx-auto max-w-[520px] md:max-w-[1040px]">
              <div className="pointer-events-none absolute left-1/2 top-3 hidden h-[calc(100%-1.5rem)] w-px -translate-x-1/2 bg-[#86c4ff]/45 md:block dark:bg-[#28537f]/75" />

              <div className="space-y-6 md:space-y-8">
                {parsedRoadmap.steps.map((step, index) => {
                  const isRight = index % 2 === 1;
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-80px' }}
                      transition={{ duration: 0.45, delay: Math.min(index * 0.03, 0.18) }}
                      className="relative grid items-start gap-3 md:grid-cols-[1fr_60px_1fr] md:gap-0"
                    >
                      <div className="absolute left-1/2 top-6 z-10 hidden h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[4px] border-[#e0f5ff] bg-[#0000a8] shadow-[0_0_0_1px_rgba(0,17,59,0.08)] md:block dark:border-[#06142f] dark:bg-[#79cfff]" />

                      <button
                        type="button"
                        onClick={() => setActiveStepId(step.id)}
                        className={`dashboard-surface group relative w-full rounded-2xl px-5 py-5 text-left text-[#00113b] transition duration-300 hover:-translate-y-1 hover:border-[#3C83F6]/55 hover:bg-white/55 hover:shadow-lg dark:text-[#dff3ff] dark:hover:border-[#34699e] dark:hover:bg-[#071a3d] md:min-h-[96px] ${
                          isRight ? 'md:col-start-3' : 'md:col-start-1'
                        }`}
                        aria-expanded={step.id === activeStepId}
                      >
                        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#0000a8] dark:text-[#89d6ff]">
                          {step.label}
                        </span>
                        <span className="mt-2 block pr-9 text-lg font-semibold tracking-tight sm:text-xl">{step.title}</span>
                        <span className="absolute right-5 top-5 inline-flex h-7 w-7 items-center justify-center rounded-full text-[#00113b]/45 transition group-hover:translate-x-1 group-hover:text-[#0000a8] dark:text-white/45 dark:group-hover:text-[#8fd9ff]">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {createPortal(
              <AnimatePresence mode="wait">
                {activeStep && (
                  <motion.div
                    key="roadmap-detail-drawer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[2000] flex justify-end bg-[#00113b]/55 backdrop-blur-[1px]"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="roadmap-detail-title"
                  >
                    <button
                      type="button"
                      aria-label="Close roadmap details"
                      onClick={() => setActiveStepId('')}
                      className="absolute inset-0 cursor-default"
                    />

                    <motion.aside
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="relative z-10 h-full w-full max-w-[560px] overflow-y-auto bg-gradient-to-br from-[#bceaff] via-[#d9f3ff] to-[#bceaff] px-7 py-8 text-[#00113b] shadow-[-22px_0_60px_rgba(0,17,59,0.22)] [scrollbar-width:thin] [scrollbar-color:#7abdf2_transparent] dark:bg-none dark:bg-[#06142f] dark:text-white md:px-10 md:py-10"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveStepId('')}
                        className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#00113b] transition hover:bg-[#00113b]/8 dark:text-white dark:hover:bg-white/10"
                        aria-label="Close roadmap details"
                      >
                        <X className="h-6 w-6" />
                      </button>

                      <div className="pr-12">
                        <span className="mb-5 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.15em] text-[#0000a8] dark:text-[#8fd9ff]">
                          <CheckCircle2 className="h-4 w-4" />
                          {activeStep.label}
                        </span>
                        <h2 id="roadmap-detail-title" className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                          {activeStep.title}
                        </h2>
                      </div>

                      <div className="roadmap-markdown mt-10">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
                          {activeStep.body}
                        </ReactMarkdown>
                      </div>
                    </motion.aside>
                  </motion.div>
                )}
              </AnimatePresence>,
              document.body
            )}
          </>
        )}
      </div>
    </UserSidebarLayout>
  );
}
