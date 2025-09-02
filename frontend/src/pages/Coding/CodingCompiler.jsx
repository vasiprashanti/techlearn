if (isRoundComplete) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-white/20 dark:bg-gray-900/40 p-6 border-t border-gray-300 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">
           Round Complete!
        </h1>
        <div className="w-full max-w-3xl bg-white/30 dark:bg-gray-900/50 p-6 rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700 backdrop-blur-md">
          <h2 className="text-xl font-semibold mb-6 dark:text-white text-gray-800">
            Results Summary
          </h2>
          <div className="grid gap-4">
            {results.length > 0 ? (
              results.map((res, idx) => {
                const score = res.score || 0;
                const total = res.total || 0;
                const percentage =
                  total > 0 ? Math.round((score / total) * 100) : 0;

                return (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-gray-100/80 dark:bg-gray-800/70 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <p className="font-semibold text-lg dark:text-white mb-2">
                      {res.problem || `Problem ${idx + 1}`}
                    </p>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-700 dark:text-gray-300">
                        Score: <span className="font-bold">{score}</span> /{" "}
                        {total}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {percentage}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-gradient-to-r from-indigo-500 to-blue-400 dark:from-indigo-400 dark:to-blue-300 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                No results available
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
