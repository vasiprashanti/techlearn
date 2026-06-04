import React from 'react';

export const NotesQuestionFormWrapper = ({
  formData,
  onChange,
}) => {
  const textareaClass = 'mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35 transition-all';
  const inputClass = 'mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35 transition-all';

  return (
    <div className="space-y-2">
      <div className="border-t border-black/10 dark:border-white/10 pt-2">
        <h3 className="text-sm font-semibold text-[#3C83F6] dark:text-[#bceaff] uppercase tracking-wider text-xs font-bold">Notes Content</h3>
      </div>
      
      <div>
        <label className="admin-micro-label text-black/45 dark:text-white/45">Markdown Body</label>
        <textarea
          value={formData.markdownBody || ''}
          onChange={(e) => onChange('markdownBody', e.target.value)}
          rows={8}
          placeholder="Type markdown content here..."
          className={`${textareaClass} font-mono`}
        />
      </div>

      <div>
        <label className="admin-micro-label text-black/45 dark:text-white/45">Markdown File URL</label>
        <input
          value={formData.markdownFileUrl || ''}
          onChange={(e) => onChange('markdownFileUrl', e.target.value)}
          placeholder="https://example.com/file.md"
          className={inputClass}
        />
      </div>

      <div>
        <label className="admin-micro-label text-black/45 dark:text-white/45">Notes / Solution Summary</label>
        <textarea
          value={formData.solutionNotes || ''}
          onChange={(e) => onChange('solutionNotes', e.target.value)}
          rows={3}
          placeholder="Add short summary or notes"
          className={textareaClass}
        />
      </div>
    </div>
  );
};

export default NotesQuestionFormWrapper;
