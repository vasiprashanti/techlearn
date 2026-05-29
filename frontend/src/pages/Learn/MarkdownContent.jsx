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

const markdownComponents = {
  h1: ({children}) => <h2 className="text-2xl md:text-3xl font-medium text-black dark:text-white mt-12 mb-6 tracking-tight">{cleanHeadingText(children)}</h2>,
  h2: ({children}) => <h3 className="text-xl md:text-2xl font-medium text-black dark:text-white mt-10 mb-4 tracking-tight">{cleanHeadingText(children)}</h3>,
  h3: ({children}) => <h4 className="text-lg font-medium text-black/90 dark:text-white/90 mt-8 mb-4">{cleanHeadingText(children)}</h4>,
  h4: ({children}) => <h5 className="text-[13px] font-bold text-black/60 dark:text-white/60 mt-6 mb-3 uppercase tracking-widest">{cleanHeadingText(children)}</h5>,
  p: ({children}) => <p className="text-black/75 dark:text-white/75 leading-[1.8] text-base md:text-lg mb-6 font-light">{children}</p>,
  strong: ({children}) => <strong className="font-medium text-black dark:text-white">{children}</strong>,
  a: ({children, href}) => <a href={href} className="text-[#3C83F6] hover:underline decoration-2 underline-offset-4 transition-all">{children}</a>,
  blockquote: ({children}) => (
    <blockquote className="my-8 pl-6 py-2 border-l-4 border-[#3C83F6] bg-gradient-to-r from-[#3C83F6]/5 to-transparent rounded-r-2xl">
      <div className="text-black/60 dark:text-white/60 italic text-lg">{children}</div>
    </blockquote>
  ),
  ul: ({children}) => <ul className="flex flex-col gap-3 my-8">{children}</ul>,
  ol: ({children}) => <ol className="list-decimal list-outside ml-6 flex flex-col gap-3 my-8 text-black/75 dark:text-white/75 text-base md:text-lg font-light">{children}</ol>,
  li: ({children}) => (
    <li className="flex items-start gap-4 text-base md:text-lg text-black/75 dark:text-white/75 font-light">
      <div className="w-1.5 h-1.5 rounded-full bg-[#3C83F6] dark:bg-white/50 mt-[0.6rem] shrink-0 shadow-sm" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  code: ({inline, className, children, ...props}) => {
    if (inline) return <code className="bg-[#3C83F6]/10 dark:bg-white/10 text-[#3C83F6] dark:text-blue-200 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-[#3C83F6]/20 dark:border-white/10" {...props}>{children}</code>;
    return <code className={className} {...props}>{children}</code>;
  },
  pre: ({children}) => (
    <div className="my-10 relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-[#3C83F6]/20 to-[#2563eb]/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition duration-500"></div>
      <pre className="relative bg-[#0a1128] dark:bg-black/80 border border-black/10 dark:border-white/10 rounded-2xl p-6 md:p-8 overflow-x-auto text-[13px] leading-relaxed font-mono text-slate-300 shadow-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {children}
      </pre>
    </div>
  ),
};

const MarkdownContent = ({ children }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
    {children}
  </ReactMarkdown>
);

export default MarkdownContent;
