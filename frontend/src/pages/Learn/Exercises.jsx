import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Code, Trophy, ArrowRight } from 'lucide-react';
import { courseAPI } from '../../services/api';
import useInViewport from '../../hooks/useInViewport';
import LoadingScreen from '../../components/Loader/Loader3D';
import Sidebar from '../../components/Dashboard/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const Exercises = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Layout State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const isDarkMode = theme === 'dark';
  const userInitial = user?.firstName?.charAt(0)?.toUpperCase() || 'S';
  const userName = user?.firstName ? user.firstName : 'Student';

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [headingRef, isHeadingInViewport] = useInViewport();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseAPI.getAllCourses();
        setCourses(response || []);
      } catch (error) {
        setCourses([
          { _id: '1', title: 'JavaScript Programming', level: 'Beginner', description: 'Learn the fundamentals of JavaScript' },
          { _id: '2', title: 'Python Programming', level: 'Intermediate', description: 'Level up your Python with focused problems for interviews. Practice arrays, strings, and core logic.' },
          { _id: '3', title: 'C Programming', level: 'Beginner', description: 'Understand C programming basics, pointers, and memory management.' },
          { _id: '4', title: 'Java Programming', level: 'Intermediate', description: 'Sharpen your Java skills with practical object-oriented programming questions.' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const getLanguageIcon = (courseTitle) => {
    if (!courseTitle) return null;
    const titleLower = courseTitle.toLowerCase();
    if (titleLower.includes('java') && !titleLower.includes('javascript')) return '/java.png';
    if (titleLower.includes('python')) return '/python.png';
    if (titleLower.includes('javascript')) return '/js.png';
    if (titleLower.includes('html')) return '/html.png';
    if (titleLower.includes('css')) return '/css.png';
    if (titleLower.includes('c++') || titleLower.includes('c ')) return '/c.png';
    return null; 
  };

  if (loading) {
    return <LoadingScreen showMessage={false} fullScreen={true} size={40} duration={800} />;
  }

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-1000 ${isDarkMode ? "dark" : "light"}`}>
      
      {/* Unified Background */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />

      {/* Sidebar Component */}
      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main className={`flex-1 transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} pt-8 pb-12 px-6 md:px-12 lg:px-16 overflow-auto`}>
        <div className="max-w-[1600px] mx-auto space-y-8">
          
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-black/5 dark:border-white/5 gap-4">
            <motion.div 
              ref={headingRef} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl md:text-5xl font-light tracking-tight text-[#3C83F6] dark:text-white">
                Code Workout.
              </h1>
              <p className="text-[10px] tracking-widest uppercase text-black/50 dark:text-white/50 mt-3 font-semibold">
                Solve real-world problems, earn XP, and grow with every line of code.
              </p>
            </motion.div>

            {/* Header Controls */}
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

          {/* Exercises Luxury Grid */}
          <div className="mb-16 mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.length > 0 ? courses.map((course, index) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  onClick={() => navigate(`/learn/exercises/${course._id}`)}
                  className="group p-8 bg-white/20 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-black/40 border border-black/5 dark:border-white/5 transition-all duration-500 rounded-3xl cursor-pointer flex flex-col justify-between min-h-[280px] relative overflow-hidden shadow-sm"
                >
                  
                  {/* Subtle hover gradient decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3C83F6]/5 to-transparent dark:from-white/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>

                  {/* Top Row: Icon & Level */}
                  <div className="relative z-10 flex items-start justify-between mb-6">
                    <div className="p-3 rounded-2xl bg-white/50 dark:bg-black/50 border border-black/5 dark:border-white/5 shadow-sm group-hover:scale-110 transition-transform duration-500">
                      {getLanguageIcon(course.title) ? (
                        <img src={getLanguageIcon(course.title)} alt="logo" className="w-6 h-6 object-contain" />
                      ) : (
                        <Code className="w-5 h-5 text-[#3C83F6] dark:text-white" />
                      )}
                    </div>
                    <span className="text-[9px] font-medium tracking-widest uppercase px-3 py-1 bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 rounded-full border border-black/5 dark:border-white/5">
                      {course.level || 'All Levels'}
                    </span>
                  </div>

                  {/* Middle Row: Text Content - Flex-1 pushes footer down */}
                  <div className="relative z-10 flex-1 flex flex-col mb-6">
                    <h3 className="text-xl font-medium text-black dark:text-white mb-2 group-hover:text-[#3C83F6] transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm font-light text-black/50 dark:text-white/50 line-clamp-3 leading-relaxed">
                      {course.description || 'Practice coding exercises and improve your skills.'}
                    </p>
                  </div>

                  {/* Bottom Row: Footer Stats & Action */}
                  <div className="relative z-10 mt-auto pt-5 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-5 text-[10px] uppercase tracking-widest font-semibold text-black/40 dark:text-white/40">
                      <div className="flex items-center gap-1.5">
                        <Code className="w-3 h-3 text-[#3C83F6]" /> 
                        <span>10 Qs</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-3 h-3 text-[#3C83F6]" /> 
                        <span>100 XP</span>
                      </div>
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/40 dark:text-white/40 group-hover:bg-gradient-to-br group-hover:from-[#3C83F6] group-hover:to-[#2563eb] dark:group-hover:from-white dark:group-hover:to-gray-200 group-hover:text-white dark:group-hover:text-black transition-all shadow-sm">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                </motion.div>
              )) : (
                <div className="col-span-full text-center py-20 bg-white/40 dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-3xl border-dashed">
                  <Code className="w-12 h-12 text-black/20 dark:text-white/20 mx-auto mb-4" />
                  <h3 className="text-[10px] uppercase tracking-widest font-semibold text-black/40 dark:text-white/40">
                    No exercises found
                  </h3>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Exercises;