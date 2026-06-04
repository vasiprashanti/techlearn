const QuestionBankState = ({ title, message, actionLabel, onAction, tone = 'neutral' }) => {
  const toneClass =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200'
      : tone === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200'
        : 'border-black/10 bg-white/70 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300';

  return (
    <div className={`rounded-2xl border px-5 py-8 text-center ${toneClass}`} role="status" aria-live="polite">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed">{message}</p>
      {actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#3c83f6] px-4 text-sm font-semibold text-white hover:bg-[#2563eb] transition-colors"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};

export default QuestionBankState;
