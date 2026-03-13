import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const ChallengePage = () => {
  const { trackId, dayId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`flex flex-col h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark bg-[#020b23]' : 'light bg-[#daf0fa]'}`}>
      
      <header className="h-16 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-6 bg-white/40 dark:bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-[10px] uppercase tracking-widest text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back to Track
          </button>
          <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10"></div>
          <span className="text-xs font-medium tracking-wide">Day {dayId} Challenge</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-4 py-1.5 border border-black/10 dark:border-white/10 text-[10px] uppercase tracking-widest font-medium">
            00:00:00
          </div>
          <button className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest hover:bg-black/80 dark:hover:bg-white/80 transition-colors">
            Submit Code
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        <div className="w-1/2 h-full overflow-y-auto border-r border-black/5 dark:border-white/5 p-8 lg:p-12 bg-white/20 dark:bg-black/20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[10px] uppercase tracking-widest text-amber-500 font-medium">Medium</span>
              <span className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40">Dynamic Programming</span>
            </div>
            
            <h1 className="text-3xl font-light tracking-tight mb-8">Maximum Subarray Sum</h1>
            
            <div className="space-y-6 text-sm font-light leading-relaxed text-black/80 dark:text-white/80">
              <p>Given an integer array <code className="px-1.5 py-0.5 bg-black/5 dark:bg-white/5 text-black dark:text-white font-mono text-xs">nums</code>, find the subarray with the largest sum, and return its sum.</p>
              
              <div className="p-6 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mt-8">
                <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 mb-3">Example 1</p>
                <div className="font-mono text-xs space-y-2">
                  <p><span className="text-black/50 dark:text-white/50">Input:</span> nums = [-2,1,-3,4,-1,2,1,-5,4]</p>
                  <p><span className="text-black/50 dark:text-white/50">Output:</span> 6</p>
                  <p><span className="text-black/50 dark:text-white/50">Explanation:</span> The subarray [4,-1,2,1] has the largest sum 6.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-1/2 h-full flex flex-col bg-[#0a0a0a]">
          <div className="h-10 border-b border-white/10 flex items-center px-4 bg-[#111]">
            <span className="text-[10px] uppercase tracking-widest text-white/50">main.js</span>
          </div>
          
          <div className="flex-1 p-4 font-mono text-xs text-white/80 overflow-auto leading-relaxed">
            <div className="flex">
              <div className="w-8 text-white/30 text-right pr-4 select-none shrink-0 space-y-1">
                1<br/>2<br/>3<br/>4<br/>5<br/>6<br/>7
              </div>
              <div className="space-y-1 whitespace-pre">
                <span className="text-purple-400">/**</span><br/>
                <span className="text-purple-400"> * @param &#123;number[]&#125; nums</span><br/>
                <span className="text-purple-400"> * @return &#123;number&#125;</span><br/>
                <span className="text-purple-400"> */</span><br/>
                <span className="text-blue-400">var</span> <span className="text-yellow-200">maxSubArray</span> = <span className="text-blue-400">function</span>(nums) &#123;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<br/>
                &#125;;
              </div>
            </div>
          </div>
          
          <div className="h-48 border-t border-white/10 bg-[#111] p-4 flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Console Output</span>
            <div className="flex-1 border border-white/5 bg-black/50 p-3 font-mono text-xs text-white/40">
              Ready to run tests...
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChallengePage;