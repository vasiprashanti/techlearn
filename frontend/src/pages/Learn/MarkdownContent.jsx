import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import '../../styles/markdown.css';

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
    ? 'text-[#001862] dark:text-white/75 leading-6 text-sm mb-4 font-normal'
    : 'text-[#001862] dark:text-white/75 leading-[1.8] text-base md:text-lg mb-6 font-light';
  const listClass = compact
    ? 'list-decimal list-outside ml-5 flex flex-col gap-2 my-5 text-[#001862] dark:text-white/75 text-sm font-normal'
    : 'list-decimal list-outside ml-6 flex flex-col gap-3 my-8 text-[#001862] dark:text-white/75 text-base md:text-lg font-light';
  const listItemClass = compact
    ? 'flex items-start gap-3 text-sm text-[#001862] dark:text-white/75 font-normal'
    : 'flex items-start gap-4 text-base md:text-lg text-[#001862] dark:text-white/75 font-light';
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

      if (isRunCodeLink) {
        return (
          <a
            href={href}
            className="inline-flex items-center rounded-md border border-[#001862]/20 bg-white/70 px-3 py-2 font-press-start text-[8px] uppercase tracking-normal text-lavender no-underline shadow-sm transition hover:border-[#001862]/40 hover:bg-white"
          >
            {children}
          </a>
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
    pre: ({children}) => (
      <div className={`${compact ? 'my-6' : 'my-10'} relative group`}>
        <div className="absolute -inset-1 bg-gradient-to-r from-[#3C83F6]/20 to-[#2563eb]/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition duration-500"></div>
        <pre className={`relative bg-[#0a1128] dark:bg-black/80 border border-black/10 dark:border-white/10 rounded-2xl ${compact ? 'p-4 text-[12px]' : 'p-6 md:p-8 text-[13px]'} overflow-x-auto leading-relaxed font-mono text-slate-300 shadow-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
          {children}
        </pre>
      </div>
    ),
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
