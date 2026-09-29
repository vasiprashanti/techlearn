import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Check, Copy, ExternalLink, Play } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';
import '../../styles/markdown.css';
import { compilerAPI } from '../../services/api';

const cleanHeadingText = (children) => {
  if (typeof children === 'string') return children.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '');
  if (Array.isArray(children)) return children.map(child => typeof child === 'string' ? child.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '') : child);
  return children;
};

const removeRedundantNotesHeading = (markdown = '') => {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const firstContentIndex = lines.findIndex((line) => line.trim());

  if (firstContentIndex === -1) return '';

  const firstLine = lines[firstContentIndex].trim();
  const headingMatch = firstLine.match(/^#{1,6}\s+(.+)$/);
  const headingText = headingMatch?.[1]?.replace(/[`*_~]/g, '').trim() || '';

  if (headingText && /\bnotes?\b/i.test(headingText)) {
    lines.splice(firstContentIndex, 1);
  }

  return lines.join('\n').trim();
};

const getInlineText = (children) => {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children.map((child) => getInlineText(child)).join('');
  }
  if (children && typeof children === 'object' && 'props' in children) {
    return getInlineText(children.props?.children);
  }
  return '';
};

const getCodeText = (children) => {
  const codeNode = Array.isArray(children) ? children[0] : children;
  return getInlineText(codeNode?.props?.children || children);
};

const getCodeLanguage = (children) => {
  const codeNode = Array.isArray(children) ? children[0] : children;
  const className = codeNode?.props?.className || '';
  const match = className.match(/language-(\w+)/);
  return match?.[1]?.toLowerCase() || 'code';
};

const compilerLanguageByMarkdownLanguage = {
  html: 'html',
  htm: 'html',
  python: 'python',
  py: 'python',
  java: 'java',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
};

const getYouTubeEmbedUrl = (href = '') => {
  try {
    const url = new URL(href);
    const videoId = url.hostname.includes('youtu.be')
      ? url.pathname.slice(1)
      : url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : '';
  } catch {
    return '';
  }
};

const isYouTubeUrl = (href = '') => {
  try {
    const hostname = new URL(href).hostname;
    return /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i.test(hostname);
  } catch {
    return false;
  }
};

const createMarkdownComponents = (compact = false) => {
  const headingOneClass = compact
    ? 'text-lg md:text-xl font-medium text-[#001862] dark:text-white mt-8 mb-4 tracking-tight'
    : 'text-2xl md:text-3xl font-medium text-[#001862] dark:text-white mt-12 mb-6 tracking-tight';
  const headingTwoClass = compact
    ? 'text-base md:text-lg font-medium text-[#001862] dark:text-white mt-7 mb-3 tracking-tight'
    : 'text-xl md:text-2xl font-medium text-[#001862] dark:text-white mt-10 mb-4 tracking-tight';
  const headingThreeClass = compact
    ? 'text-sm font-medium text-[#001862] dark:text-white/90 mt-6 mb-3'
    : 'text-lg font-medium text-[#001862] dark:text-white/90 mt-8 mb-4';
  const headingFourClass = compact
    ? 'text-[11px] font-bold text-[#001862] dark:text-white/65 mt-5 mb-2 uppercase tracking-widest'
    : 'text-[13px] font-bold text-[#001862] dark:text-white/65 mt-6 mb-3 uppercase tracking-widest';
  const paragraphClass = compact
    ? 'text-[#001862] dark:text-white leading-6 text-sm mb-4 font-normal'
    : 'text-[#001862] dark:text-white leading-[1.8] text-base md:text-lg mb-6 font-light';
  const listClass = compact
    ? 'list-decimal list-outside ml-5 flex flex-col gap-2 my-5 text-[#001862] dark:text-white text-sm font-normal'
    : 'list-decimal list-outside ml-6 flex flex-col gap-3 my-8 text-[#001862] dark:text-white text-base md:text-lg font-light';
  const listItemClass = compact
    ? 'flex items-start gap-3 text-sm text-[#001862] dark:text-white font-normal'
    : 'flex items-start gap-4 text-base md:text-lg text-[#001862] dark:text-white font-light';
  const listBulletClass = compact
    ? 'w-1.5 h-1.5 rounded-full bg-[#3C83F6] dark:bg-white/50 mt-[0.45rem] shrink-0 shadow-sm'
    : 'w-1.5 h-1.5 rounded-full bg-[#3C83F6] dark:bg-white/50 mt-[0.6rem] shrink-0 shadow-sm';

  return {
    h1: ({children}) => <h2 className={headingOneClass}>{cleanHeadingText(children)}</h2>,
    h2: ({children}) => <h3 className={headingTwoClass}>{cleanHeadingText(children)}</h3>,
    h3: ({children}) => <h4 className={headingThreeClass}>{cleanHeadingText(children)}</h4>,
    h4: ({children}) => <h5 className={headingFourClass}>{cleanHeadingText(children)}</h5>,
    p: ({children}) => <p className={paragraphClass}>{children}</p>,
    strong: ({children}) => <strong className="font-medium text-[#001862] dark:text-white">{children}</strong>,
    a: ({children, href}) => {
      const label = getInlineText(children).trim();
      const isRunCodeLink = href?.startsWith('/compiler') && label.toLowerCase() === 'run code';
      const youtubeEmbedUrl = isYouTubeUrl(href) ? getYouTubeEmbedUrl(href) : '';

      if (isRunCodeLink) {
        return null;
      }

      if (youtubeEmbedUrl) {
        return (
          <span className="my-6 block overflow-hidden rounded-2xl border border-[#001862]/15 bg-black shadow-sm">
            <iframe
              className="aspect-video w-full"
              src={youtubeEmbedUrl}
              title={label || 'YouTube video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </span>
        );
      }

      return (
        <a
          href={href}
          target={href?.startsWith('http') ? '_blank' : undefined}
          rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="font-medium text-[#001862] underline decoration-[#001862]/30 decoration-2 underline-offset-4 transition-all hover:text-[#3C83F6] dark:text-blue-200 dark:decoration-blue-200/35"
        >
          {children}
        </a>
      );
    },
    img: ({src, alt}) => <img src={src} alt={alt || ''} className="my-6 max-h-[480px] w-auto max-w-full rounded-2xl border border-[#001862]/10 object-contain shadow-sm" loading="lazy" />,
    blockquote: ({children}) => (
      <blockquote className={`${compact ? 'my-5 pl-4 py-1.5' : 'my-8 pl-6 py-2'} border-l-4 border-[#3C83F6] bg-gradient-to-r from-[#3C83F6]/5 to-transparent rounded-r-2xl`}>
        <div className={`text-[#001862] dark:text-white/65 italic ${compact ? 'text-sm' : 'text-lg'}`}>{children}</div>
      </blockquote>
    ),
    ul: ({children}) => <ul className={`flex flex-col ${compact ? 'gap-2 my-5' : 'gap-3 my-8'}`}>{children}</ul>,
    ol: ({children}) => <ol className={listClass}>{children}</ol>,
    li: ({children}) => (
      <li className={listItemClass}>
        <div className={listBulletClass} />
        <span className="flex-1">{children}</span>
      </li>
    ),
    code: ({inline, className, children, ...props}) => {
      if (inline) return <code className={`bg-[#001862]/10 dark:bg-white/10 text-[#001862] dark:text-blue-200 px-1.5 py-0.5 rounded-md ${compact ? 'text-[12px]' : 'text-[13px]'} font-mono border border-[#001862]/20 dark:border-white/10`} {...props}>{children}</code>;
      return <code className={className} {...props}>{children}</code>;
    },
    pre: ({children}) => {
      // ReactMarkdown invokes this renderer as the component for each code block.
      // These hooks are intentionally scoped to that individual block.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [hasRun, setHasRun] = useState(false);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [copied, setCopied] = useState(false);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [output, setOutput] = useState('');
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [isRunning, setIsRunning] = useState(false);
      const language = getCodeLanguage(children);
      const codeText = getCodeText(children);
      const compilerLanguage = compilerLanguageByMarkdownLanguage[language];

      const handleCopy = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(codeText);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }
      };

      const handleRun = async () => {
        if (!compilerLanguage) return;
        setHasRun(true);
        setIsRunning(true);
        setOutput('Running code...');
        try {
          const result = await compilerAPI.compileCode({ language: compilerLanguage, source_code: codeText, stdin: '' });
          const actualOutput = [result?.stdout, result?.stderr ? `Error:\n${result.stderr}` : '', result?.compile_output ? `Compilation Output:\n${result.compile_output}` : '']
            .filter(Boolean)
            .join('\n');
          setOutput(actualOutput || 'Code executed successfully (no output).');
        } catch (error) {
          setOutput(`Execution failed: ${error?.message || 'Unknown error'}`);
        } finally {
          setIsRunning(false);
        }
      };

      return (
        <div className={`code-editor-block ${compact ? 'my-6' : 'my-10'} relative overflow-hidden rounded-xl border border-[#d8e0eb] bg-[#f8fafc] shadow-[0_10px_30px_rgba(31,67,115,0.12)] dark:border-[#1e293b] dark:bg-[#0b1220] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]`}>
          <div className="flex min-h-[52px] items-center justify-between border-b border-[#d8e0eb] bg-[#f8fafc] px-3.5 dark:border-[#182235] dark:bg-[#0d1525]">
            <div className="flex items-center gap-2 text-sm font-medium text-[#07143b] dark:text-[#e5e7eb]"><span className="h-2 w-2 rounded-full bg-[#79c143]" />{language === 'c' ? 'C' : language}</div>
            <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md border border-[#d8e0eb] bg-white px-3 py-1.5 text-[13px] font-medium text-[#07143b] transition-colors hover:bg-[#eef5fb] dark:border-[#253247] dark:bg-[#111b2d] dark:text-[#cbd5e1] dark:hover:bg-[#172238]"
            >
              {copied ? <Check className="h-[15px] w-[15px]" /> : <Copy className="h-[15px] w-[15px]" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            {compilerLanguage ? (
              <button type="button" onClick={() => { if (typeof window !== 'undefined') { window.sessionStorage.setItem('techlearn:compiler-draft', JSON.stringify({ language: compilerLanguage, code: codeText })); window.location.assign('/compiler'); } }} className="hidden items-center gap-1.5 rounded-md border border-[#b7c9dc] bg-[#edf6fc] px-3 py-1.5 text-[13px] font-medium text-[#07143b] transition-colors hover:bg-[#e1f0f8] dark:border-[#253247] dark:bg-[#111b2d] dark:text-[#cbd5e1] dark:hover:bg-[#172238] sm:flex"><ExternalLink className="h-[15px] w-[15px]" /> Open in Compiler</button>
            ) : null}
            {compilerLanguage ? (
              <button
                type="button"
                onClick={handleRun}
                className="flex items-center gap-1.5 rounded-md border border-[#72b536] bg-[#72b536] px-3.5 py-1.5 text-[13px] font-semibold text-[#071207] transition-colors hover:border-[#83c947] hover:bg-[#83c947]"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {isRunning ? 'Running' : 'Run'}
              </button>
            ) : null}
            </div>
          </div>
          <pre className={`${compact ? 'text-[12px]' : 'text-[14px]'} m-0 p-0 py-2.5 whitespace-normal break-words font-mono leading-[1.8] !text-black dark:!text-white`}>
            <code className="block !text-black dark:!text-white">
              {codeText.split('\n').map((line, index) => <span key={`${index}-${line}`} className="flex min-h-[1.8em] !text-black dark:!text-white"><span className="mr-4 inline-block w-12 shrink-0 select-none border-r border-[#d8e0eb] pr-3 text-right text-[#8793a6] dark:border-[#182235] dark:text-[#334155]">{index + 1}</span><span className="code-source-text whitespace-pre-wrap break-words pl-4 !text-black dark:!text-white">{line || ' '}</span></span>)}
            </code>
          </pre>
          {hasRun && <div className="border-t border-[#d8e0eb] bg-[#f8fafc] text-black dark:border-[#1e293b] dark:bg-[#0b1220] dark:text-[#dbe4ef]">
            <div className="flex h-[29px] items-center border-b border-[#d8e0eb] bg-[#f8fafc] px-3 dark:border-[#1e293b] dark:bg-[#0d1525]">
              <span className="font-mono text-[12px] font-bold uppercase tracking-[0.7px] text-[#64748b] dark:text-[#94a3b8]">Output</span>
            </div>
            <pre className="m-0 whitespace-pre-wrap break-words px-3 py-[11px] pb-[13px] font-mono text-[14px] leading-[1.8] text-black dark:text-[#dbe4ef]">{output}</pre>
          </div>}
        </div>
      );
    },
    table: ({children}) => <div className="my-8 overflow-x-auto rounded-2xl border border-[#001862]/10 dark:border-white/20"><table className="min-w-full border-collapse text-[#001862] dark:text-white/75">{children}</table></div>,
    th: ({children}) => <th className="border-b border-[#001862]/10 bg-white/35 px-4 py-3 text-left text-sm font-semibold text-[#001862] dark:border-white/20 dark:bg-white/5 dark:text-white">{children}</th>,
    td: ({children}) => <td className="border-b border-[#001862]/10 px-4 py-3 text-sm leading-6 text-[#001862] dark:border-white/10 dark:text-white/75">{children}</td>,
    hr: () => <hr className="my-8 border-0 border-t border-[#001862]/18 dark:border-white/30" />,
  };
};

const MarkdownContent = ({ children, compact = false }) => {
  const cleanedMarkdown = removeRedundantNotesHeading(children);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={createMarkdownComponents(compact)}>
      {cleanedMarkdown}
    </ReactMarkdown>
  );
};

export default MarkdownContent;
