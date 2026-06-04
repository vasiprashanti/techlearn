const AdminPageLoader = ({
  message = 'Loading...',
  showMessage = true,
  fullScreen = false,
  size = 36,
  className = '',
}) => {
  const containerClass = fullScreen
    ? 'min-h-screen w-full'
    : 'w-full min-h-[220px]';

  return (
    <div
      className={`flex items-center justify-center ${containerClass} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <div
          className="rounded-full border-[3px] border-[#bceaff]/35 border-t-[#3C83F6] dark:border-white/15 dark:border-t-[#7dd3fc] animate-spin"
          style={{ width: size, height: size }}
        />
        {showMessage ? (
          <p className="text-sm font-medium text-black/55 dark:text-white/60">{message}</p>
        ) : null}
      </div>
    </div>
  );
};

export default AdminPageLoader;
