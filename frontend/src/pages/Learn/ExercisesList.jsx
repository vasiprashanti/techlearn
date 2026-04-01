import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Code, Trophy, Clock, ArrowLeft, Star, ChevronRight } from 'lucide-react';
import { courseAPI, exerciseAPI, progressAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useAuthModalContext } from '../../context/AuthModalContext';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/Dashboard/Sidebar';
import LoadingScreen from '../../components/LoadingScreen';
import AccessPopup from '../../utils/accessPopup';

export default function ExercisesList() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const { openLogin } = useAuthModalContext();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [course, setCourse] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAccessPopup, setShowAccessPopup] = useState(false);

  const isDarkMode = theme === 'dark';
  const userInitial = user?.firstName?.charAt(0)?.toUpperCase() || 'S';
  const userName = user?.firstName ? user.firstName : 'Student';

  const transformExerciseData = (backendExercises, completedExerciseIds = []) => {
    return backendExercises.map((exercise, index) => {
      const id = exercise._id || exercise.exerciseId;
      return {
        id,
        exerciseId: exercise.exerciseId,
        title: exercise.title || exercise.question || '',
        difficulty: 'Easy', 
        estimatedTime: '15 min', 
        xp: 10, 
        completed: completedExerciseIds.includes(id),
        locked: index >= 4,
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseResponse = await courseAPI.getCourse(courseId);
        setCourse(courseResponse);

        const exerciseResponse = await exerciseAPI.getExercises(courseId);
        let backendExercises = exerciseResponse.exercises || exerciseResponse;

        let completedExerciseIds = [];
        if (isAuthenticated) {
          try {
            const progressResponse = await progressAPI.getUserProgress();
            completedExerciseIds = progressResponse.completedExercises || [];
          } catch (e) {}
        }
        setExercises(transformExerciseData(backendExercises, completedExerciseIds));
      } catch (error) {
        setCourse({ title: 'Course Exercises', description: 'Practice your coding skills' });
        setExercises([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, isAuthenticated]);

  const handleExerciseClick = (exercise) => {
    if (exercise.locked && (!isAuthenticated || !user?.isClubMember)) {
      if (!isAuthenticated) openLogin();
      else setShowAccessPopup(true);
      return;
    }
    navigate(`/learn/exercises/${courseId}/${exercise.id}`);
  };

  if (loading) return <LoadingScreen showMessage={false} size={48} duration={800} />;

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main className={`flex-1 transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} pt-8 pb-12 px-6 md:px-12 lg:px-16 overflow-auto`}>
        <div className="max-w-[1200px] mx-auto space-y-6">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-black/5 dark:border-white/5 gap-4">
            <div>
              <button onClick={() => navigate('/learn/exercises')} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-black/40 dark:text-white/40 hover:text-[#3C83F6] dark:hover:text-blue-400 transition-colors mb-4">
                <ArrowLeft className="w-4 h-4" /> Back to Categories
              </button>
              <h1 className="text-3xl md:text-5xl font-light tracking-tight text-[#3C83F6] dark:text-white">
                {course?.title || 'Course Exercises'}
              </h1>
              <div className="flex items-center gap-6 mt-6">
                <span className="text-[9px] uppercase tracking-widest px-3 py-1 bg-[#3C83F6]/10 text-[#3C83F6] rounded-full font-medium border border-[#3C83F6]/20">
                  Beginner Friendly
                </span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-black/50 dark:text-white/50 flex items-center gap-1.5"><Code className="w-3 h-3 text-[#3C83F6]"/> {exercises.length} Qs</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-black/50 dark:text-white/50 flex items-center gap-1.5"><Trophy className="w-3 h-3 text-[#3C83F6]"/> {exercises.reduce((s, e) => s + e.xp, 0)} XP</span>
              </div>
            </div>

            <div className="flex items-center gap-6 self-end md:self-auto relative z-50">
              <button onClick={toggleTheme} className="text-[10px] tracking-widest uppercase text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors">
                {isDarkMode ? "Light" : "Dark"}
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-sm font-medium tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-white/20 dark:border-black/20"
                >
                  {userInitial}
                </button>
                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-4 border-b border-black/5 dark:border-white/5 bg-gradient-to-br from-[#3C83F6]/5 to-[#2563eb]/5 dark:from-white/5 dark:to-gray-200/5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-lg font-medium tracking-wider shadow-md">
                            {userInitial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-black dark:text-white truncate">
                              {userName}
                            </h3>
                            <p className="text-xs text-black/60 dark:text-white/60 truncate">
                              {user?.email || 'student@techlearn.com'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <button onClick={() => { setProfileDropdownOpen(false); navigate('/profile'); }} className="w-full px-4 py-3 text-left text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-3 group">
                          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#3C83F6]/10 group-hover:text-[#3C83F6] dark:group-hover:bg-white/10 dark:group-hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </div>
                          <div>
                            <div className="font-medium">My Profile</div>
                            <div className="text-[10px] text-black/50 dark:text-white/50">Manage your account</div>
                          </div>
                        </button>
                        <div className="mx-4 my-2 h-px bg-black/10 dark:bg-white/10"></div>
                        <button onClick={() => { setProfileDropdownOpen(false); logout(); }} className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 group">
                          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          </div>
                          <div>
                            <div className="font-medium">Log Out</div>
                            <div className="text-[10px] text-red-500/70 dark:text-red-400/70">Sign out securely</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Exercise List */}
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 md:p-8">
            <h3 className="text-[10px] tracking-widest uppercase font-semibold text-black/50 dark:text-white/50 mb-6">
              Challenges List
            </h3>
            <div className="flex flex-col gap-3">
              {exercises.map((exercise) => (
                <div 
                  key={exercise.id} 
                  onClick={() => handleExerciseClick(exercise)}
                  className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group
                    ${exercise.completed 
                      ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' 
                      : 'bg-white/20 dark:bg-white/[0.03] border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors
                      ${exercise.completed ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 border-black/5 dark:border-white/5 group-hover:bg-[#3C83F6]/10 group-hover:text-[#3C83F6]'}`}>
                      <Code className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-black dark:text-white group-hover:text-[#3C83F6] transition-colors line-clamp-1">
                        {exercise.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border rounded-full font-medium
                          ${exercise.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/5' : 
                            exercise.difficulty === 'Medium' ? 'border-amber-500/20 text-amber-600 bg-amber-500/5' : 
                            'border-rose-500/20 text-rose-600 bg-rose-500/5'}`}>
                          {exercise.difficulty}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-black/40 dark:text-white/40 flex items-center gap-1">
                          <Trophy className="text-[#3C83F6] w-3 h-3" /> {exercise.xp} XP
                        </span>
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-black/40 dark:text-white/40 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#3C83F6]" /> {exercise.estimatedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-3 md:gap-5 shrink-0">
                    {exercise.completed ? (
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><Star className="w-3 h-3 fill-current"/> Completed</span>
                    ) : exercise.locked ? (
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-black/30 dark:text-white/30">Locked (Club Only)</span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest font-semibold text-[#3C83F6] dark:text-white group-hover:text-[#3C83F6] transition-colors">Solve</span>
                    )}
                    <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-[#3C83F6] group-hover:to-[#2563eb] dark:group-hover:from-white dark:group-hover:to-gray-200 group-hover:text-white dark:group-hover:text-black transition-all">
                      <ChevronRight className="w-4 h-4 text-black/40 dark:text-white/40 group-hover:text-white dark:group-hover:text-black" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <AccessPopup open={showAccessPopup} onClose={() => setShowAccessPopup(false)} />
        </div>
      </main>
    </div>
  );
}