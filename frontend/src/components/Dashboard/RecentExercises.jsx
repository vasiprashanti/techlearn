const RecentExercises = ({ exercises = [] }) => {
  const displayedExercises = exercises.slice(0, 3);

  return (
    <div className="mt-8">
      <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-4 mb-6">
        <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50">
          Recent Exercises
        </h3>
        <button className="text-[10px] tracking-widest uppercase text-black dark:text-white hover:opacity-50 transition-opacity">
          View All
        </button>
      </div>
      
      {displayedExercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayedExercises.map((exercise, index) => (
            <div 
              key={exercise.id || index}
              className="group bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-black/5 dark:border-white/5 p-6 transition-all duration-500 hover:bg-white/30 dark:hover:bg-black/30 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] tracking-widest uppercase text-black/40 dark:text-white/40">
                  {exercise.free ? 'Free' : 'Premium'}
                </span>
                <span className="text-[10px] tracking-widest uppercase text-black dark:text-white">
                  {exercise.xp || 0} XP
                </span>
              </div>
              
              <h4 className="text-lg font-light text-black dark:text-white mb-2">
                {exercise.title || 'Untitled'}
              </h4>
              <p className="text-sm text-black/50 dark:text-white/50 flex-grow font-light leading-relaxed mb-8">
                {exercise.description || 'No description available'}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5 mt-auto">
                <span className="text-xs font-light text-black/40 dark:text-white/40">
                  {exercise.count || 0} Tasks
                </span>
                <button className="text-xs uppercase tracking-widest text-black dark:text-white opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                  Start →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 flex flex-col items-center justify-center border border-black/5 dark:border-white/5 bg-white/5 dark:bg-black/5">
          <p className="text-xs tracking-widest uppercase text-black/30 dark:text-white/30">
            No recent activity
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentExercises;