import { useEffect, useMemo, useState } from 'react';
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
  Map,
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
    if (!parsedRoadmap.steps.length) {
      setActiveStepId('');
      return;
    }

    setActiveStepId((currentId) => {
      if (parsedRoadmap.steps.some((step) => step.id === currentId)) return currentId;
      return parsedRoadmap.steps[0].id;
    });
  }, [parsedRoadmap.steps]);

  const activeStep = parsedRoadmap.steps.find((step) => step.id === activeStepId) || parsedRoadmap.steps[0];

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

      <div className="space-y-12 pb-10">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="mx-auto max-w-4xl pt-6 text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.35em] text-[#00113b] dark:text-[#8fd9ff]">
            <Map className="h-4 w-4" />
            Roadmap
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#00113b] dark:text-white sm:text-5xl lg:text-6xl">
            {heroTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#00113b]/58 dark:text-white/58 md:text-lg">
            {heroDescription}
          </p>
        </motion.header>

        {loading ? (
          <section className="flex min-h-[360px] items-center justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#86c4ff]/45 bg-white/55 px-5 py-3 text-sm font-medium text-[#00113b] shadow-sm shadow-[#3c83f6]/10 dark:border-[#6fbfff]/24 dark:bg-[#051738]/75 dark:text-[#8fd9ff]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading roadmap content
            </div>
          </section>
        ) : error ? (
          <section className="mx-auto max-w-2xl rounded-[1.4rem] border border-dashed border-[#86c4ff]/55 bg-white/45 p-8 text-center shadow-sm shadow-[#3c83f6]/10 dark:border-[#6fbfff]/30 dark:bg-[#051738]/70">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#8ec8ff] bg-[#e4f4ff] text-[#1266af] dark:border-[#6fbfff] dark:bg-[#14406f] dark:text-[#9cd6ff]">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#00113b] dark:text-[#d3edff]">{statusCopy.title}</h2>
            <p className="mt-3 text-sm leading-7 text-[#00113b]/65 dark:text-[#afcff1]">{statusCopy.description}</p>
          </section>
        ) : (
          <>
            <section className="relative mx-auto max-w-[1120px]">
              <div className="pointer-events-none absolute left-4 top-3 h-[calc(100%-1.5rem)] w-px bg-[#8ec8ff]/55 md:left-1/2 md:-translate-x-1/2 dark:bg-[#28537f]/75" />

              <div className="space-y-10 md:space-y-14">
                {parsedRoadmap.steps.map((step, index) => {
                  const isRight = index % 2 === 1;
                  const isActive = step.id === activeStep?.id;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-80px' }}
                      transition={{ duration: 0.45, delay: Math.min(index * 0.03, 0.18) }}
                      className="relative grid items-start gap-5 pl-12 md:grid-cols-[1fr_72px_1fr] md:gap-0 md:pl-0"
                    >
                      <div className="absolute left-4 top-8 z-10 h-4 w-4 -translate-x-1/2 rounded-full border-[5px] border-white bg-[#0b3ef2] shadow-[0_0_0_1px_rgba(0,17,59,0.08)] md:left-1/2 dark:border-[#06142f] dark:bg-[#79cfff]" />

                      <button
                        type="button"
                        onClick={() => setActiveStepId(step.id)}
                        className={`group relative w-full rounded-[1.05rem] border px-6 py-6 text-left shadow-sm transition duration-300 md:min-h-[112px] ${
                          isRight ? 'md:col-start-3' : 'md:col-start-1'
                        } ${
                          isActive
                            ? 'border-[#0b3ef2]/30 bg-white text-[#00113b] shadow-[0_18px_40px_rgba(60,131,246,0.13)] dark:border-[#78cfff]/28 dark:bg-[#06142f] dark:text-white'
                            : 'border-[#d4ecff] bg-white/72 text-[#00113b] hover:-translate-y-0.5 hover:border-[#9fd2ff] hover:bg-white dark:border-[#16345f] dark:bg-[#06142f]/78 dark:text-[#dff3ff] dark:hover:border-[#34699e] dark:hover:bg-[#071a3d]'
                        }`}
                        aria-expanded={isActive}
                      >
                        <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#0b3ef2] dark:text-[#89d6ff]">
                          {step.label}
                        </span>
                        <span className="mt-3 block pr-10 text-xl font-semibold tracking-tight sm:text-2xl">{step.title}</span>
                        <span className="mt-3 block text-sm leading-6 text-[#00113b]/55 dark:text-white/55">{step.preview}</span>
                        <span className="absolute right-6 top-7 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#00113b]/45 transition group-hover:translate-x-1 group-hover:text-[#0b3ef2] dark:text-white/45 dark:group-hover:text-[#8fd9ff]">
                          <ArrowRight className="h-5 w-5" />
                        </span>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            <AnimatePresence mode="wait">
              {activeStep && (
                <motion.section
                  key={activeStep.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="mx-auto max-w-4xl rounded-[1.35rem] border border-[#d4ecff] bg-white/68 p-6 shadow-[0_18px_45px_rgba(60,131,246,0.12)] dark:border-[#16345f] dark:bg-[#06142f]/82 md:p-8"
                >
                  <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-[#9fd2ff]/45 pb-5 dark:border-[#28537f]/70">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#8ec8ff]/80 bg-[#e4f6ff]/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#00113b] dark:border-[#325f8c] dark:bg-[#09204b] dark:text-[#8fd9ff]">
                      <CheckCircle2 className="h-4 w-4 text-[#0b3ef2] dark:text-[#8fd9ff]" />
                      {activeStep.label}
                    </span>
                    <h2 className="text-xl font-semibold tracking-tight text-[#00113b] dark:text-white md:text-2xl">
                      {activeStep.title}
                    </h2>
                  </div>

                  <div className="roadmap-markdown max-h-[32rem] overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:#7abdf2_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#7abdf2]/70 dark:[&::-webkit-scrollbar-thumb]:bg-[#5e9dd0]/70">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
                      {activeStep.body}
                    </ReactMarkdown>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </UserSidebarLayout>
  );
}
