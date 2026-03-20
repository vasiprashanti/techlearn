import { useNavigate } from 'react-router-dom';

const ActiveTrack = ({ track }) => {
  const navigate = useNavigate();
  if (!track) return null;

  const currentDay = track.questions.find(q => q.status === 'active')?.day || track.totalDays;

  return (
    <div className="mt-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-black/5 dark:border-white/5 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-2xl font-light tracking-tight text-black dark:text-white">
              {track.name}
            </h2>
            <span className="px-2 py-1 bg-black/5 dark:bg-white/5 text-black dark:text-white text-[10px] uppercase tracking-widest border border-black/10 dark:border-white/10">
              Active Cohort
            </span>
          </div>
          <p className="text-sm font-light text-black/50 dark:text-white/50">
            {track.description}
          </p>
        </div>
        
        <div className="flex gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] tracking-widest uppercase text-black/40 dark:text-white/40 mb-1">Total Days</span>
            <span className="text-xl font-light text-black dark:text-white">{track.totalDays}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] tracking-widest uppercase text-emerald-500 dark:text-emerald-400 mb-1">Current Day</span>
            <span className="text-xl font-light text-emerald-600 dark:text-emerald-400">{currentDay}</span>
          </div>
        </div>
      </div>

      <div className="relative pl-4 md:pl-8">
        <div className="absolute left-[39px] md:left-[55px] top-8 bottom-8 w-[1px] bg-black/10 dark:bg-white/10 z-0 hidden sm:block"></div>

        <div className="space-y-6 relative z-10">
          {track.questions.map((q) => (
            <div 
              key={q.day}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 border transition-all duration-300 bg-white/40 dark:bg-black/40 backdrop-blur-md
                ${q.status === 'active' 
                  ? 'border-black/20 dark:border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)] scale-[1.01]' 
                  : 'border-black/5 dark:border-white/5'
                }
                ${q.status === 'locked' ? 'opacity-40 grayscale' : ''}
              `}
            >
              <div className="flex items-center gap-6 mb-4 sm:mb-0">
                <div className={`relative w-12 h-12 shrink-0 flex items-center justify-center text-xs font-light tracking-widest uppercase border bg-white dark:bg-[#020b23]
                  ${q.status === 'completed' ? 'border-emerald-500/30 text-emerald-500' : ''}
                  ${q.status === 'active' ? 'border-black dark:border-white text-black dark:text-white ring-4 ring-black/5 dark:ring-white/5' : ''}
                  ${q.status === 'locked' ? 'border-black/10 dark:border-white/10 text-black/30 dark:text-white/30' : ''}
                `}>
                  D{q.day}
                </div>
                
                <div>
                  <h4 className="text-base font-medium text-black dark:text-white mb-1 tracking-wide">
                    {q.title}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40">
                      {q.category}
                    </span>
                    <span className="w-1 h-1 bg-black/10 dark:bg-white/10 rounded-full"></span>
                    <span className={`text-[10px] uppercase tracking-widest
                      ${q.difficulty === 'Easy' ? 'text-emerald-500' : q.difficulty === 'Medium' ? 'text-amber-500' : 'text-rose-500'}
                    `}>
                      {q.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end sm:justify-center shrink-0">
                {q.status === 'completed' && (
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] uppercase tracking-widest text-black/30 dark:text-white/30">Score</span>
                      <span className="text-xs font-medium text-black/60 dark:text-white/60">{q.score}%</span>
                    </div>
                    <span className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-widest border border-emerald-500/20">
                      Completed
                    </span>
                  </div>
                )}
                {q.status === 'active' && (
                  <button 
                    onClick={() => navigate(`/track/${track.id}/day/${q.day}`)}
                    className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest hover:bg-black/80 dark:hover:bg-white/80 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    Solve Now
                  </button>
                )}
                {q.status === 'locked' && (
                  <div className="px-6 py-2 border border-black/10 dark:border-white/10 flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-black/30 dark:text-white/30">Locked</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActiveTrack;