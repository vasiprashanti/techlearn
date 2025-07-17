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
    <div className="glass-panel p-6 flex flex-col items-center rounded-xl h-full min-h-[300px] text-light-text dark:text-dark-text">
      <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-300 bg-clip-text text-transparent mb-4">
        {title}
      </h3>
      
      {/* Donut chart container */}
      <div className="relative w-64 h-64 my-2 flex items-center justify-center">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center text-red-500 text-2xl">
            Error
          </div>
        ) : (
          <>
            <svg className="w-full h-full" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                strokeWidth="12"
                className="stroke-blue-900/30 dark:stroke-blue-800/40"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 100 100)"
                className="stroke-emerald-500 transition-all duration-1000"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            {/* Center percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-light-text dark:text-dark-text">
                {safeProgress}%
              </span>
            </div>
          </>
        )}
      </div>
      
      <p className="text-md text-light-text/70 dark:text-dark-text/70 text-center mt-2">
        {error ? 'Failed to load progress' : subtitle}
      </p>
    </div>
  );
};

export default ProgressDonut;