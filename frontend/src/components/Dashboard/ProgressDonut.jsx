const ProgressDonut = ({ 
  title = "Progress", 
  progress = 0, 
  subtitle = "goals",
  loading = false,
  error = null
}) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 flex flex-col items-center justify-center h-full min-h-[320px]">
      <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50 mb-8 w-full text-left">
        {title}
      </h3>
      
      <div className="relative w-40 h-40 flex items-center justify-center">
        {loading ? (
          <div className="w-8 h-8 border border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full animate-spin"></div>
        ) : error ? (
          <div className="text-xs uppercase tracking-widest text-red-500">Error</div>
        ) : (
          <>
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r={radius}
                strokeWidth="2"
                className="stroke-black/10 dark:stroke-white/10"
                fill="none"
              />
              <circle
                cx="100"
                cy="100"
                r={radius}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="stroke-black dark:stroke-white transition-all duration-1000 ease-out"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-light tracking-tighter text-black dark:text-white">
                {safeProgress}%
              </span>
            </div>
          </>
        )}
      </div>
      
      <p className="text-xs tracking-widest uppercase text-black/40 dark:text-white/40 mt-8 w-full text-right">
        {error ? 'Data Error' : subtitle}
      </p>
    </div>
  );
};

export default ProgressDonut;