const ProgressBar = ({
  title = "Progress",
  progress = 0,
  subtitle = "tasks",
  loading = false,
  error = null
}) => {
  // Ensure progress is between 0 and 100
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="bg-white/50 dark:bg-gray-800/50 p-6 flex flex-col rounded-xl h-44 text-light-text dark:text-dark-text shadow-md">
      <h3 className="text-lg font-semibold font-poppins text-gray-600 dark:text-gray-400 hover-gradient-text mb-4">
        {title}
      </h3>
      <div className="flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="text-4xl font-bold text-center text-light-text dark:text-dark-text mb-4 animate-pulse">
            ...
          </div>
        ) : error ? (
          <div className="text-4xl font-bold text-center text-red-500 mb-4">
            Error
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold text-center text-light-text dark:text-dark-text mb-4">
              {safeProgress}%
            </div>

            <div className="space-y-2">
              <div className="w-full h-4 bg-blue-900/30 dark:bg-blue-800/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${safeProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-light-text/70 dark:text-dark-text/70">
                <span>0</span>
                <span>{error ? 'Failed to load' : `${subtitle} completed`}</span>
                <span>100</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;