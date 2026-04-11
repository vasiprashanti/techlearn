import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Code, Trophy, ArrowRight } from 'lucide-react';
import { courseAPI } from '../../services/api';
import useInViewport from '../../hooks/useInViewport';
import LoadingScreen from '../../components/Loader/Loader3D';
import Sidebar from '../../components/Dashboard/Sidebar';
import { useTheme } from '../../context/ThemeContext';

const Exercises = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // Layout State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const isDarkMode = theme === 'dark';

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

      <main className={`flex-1 transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} pt-24 pb-12 px-6 md:px-12 lg:px-16 overflow-auto`}>
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