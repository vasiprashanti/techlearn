import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import LoadingScreen from "../../components/LoadingScreen";
import CourseCard from "../../components/CourseCard";
import { courseAPI, dataAdapters } from "../../services/api";
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Dashboard/Sidebar';

export default function AllCourses() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isDarkMode = theme === 'dark';
  const userInitial = user?.firstName?.charAt(0)?.toUpperCase() || 'S';
  const userName = user?.firstName ? user.firstName : 'Student';

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const backendCourses = await courseAPI.getAllCourses();
        const adaptedCourses = backendCourses.map(course => dataAdapters.adaptCourse(course));
        setCourses(adaptedCourses);
      } catch (error) {
        setError(error.message);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filters = [
    { id: "all", label: "All Courses" },
    { id: "beginner", label: "Beginner" },
    { id: "intermediate", label: "Intermediate" },
    { id: "advanced", label: "Advanced" },
    { id: "available", label: "Available" }
  ];

  const filteredCourses = courses.filter(course => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "available") return course.status === "available";
    return course.difficulty?.toLowerCase() === selectedFilter;
  });

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
      {/* Unified Background */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main className={`flex-1 transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} pt-8 pb-12 px-6 md:px-12 lg:px-16 overflow-auto`}>
        <div className="max-w-[1600px] mx-auto space-y-6">
          
          {/* Header */}
          <header className="flex items-center justify-between pb-6 border-b border-black/5 dark:border-white/5 gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <button onClick={() => navigate('/learn/courses')} className="flex items-center gap-1 text-[8px] sm:text-[9px] md:text-[10px] font-medium text-black/40 dark:text-white/40 hover:text-[#3C83F6] dark:hover:text-white transition-colors uppercase tracking-widest whitespace-nowrap flex-shrink-0">
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Back</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-4xl font-normal tracking-tight text-[#3C83F6] dark:text-white truncate">
                  Course Catalog.
                </h1>
                <p className="hidden sm:block text-[9px] md:text-xs tracking-widest uppercase text-black/40 dark:text-white/40 mt-2 truncate">
                  Browse our complete collection of tracks
                </p>
              </div>
            </div>

            {/* Right Side Header Controls */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-6 flex-shrink-0 relative z-50">
              <button onClick={toggleTheme} className="text-[10px] tracking-widest uppercase text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors whitespace-nowrap">
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

          {/* Luxury Filters */}
          <div className="flex flex-wrap gap-3 my-8">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-5 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-medium transition-all duration-300 flex items-center gap-2 ${
                  selectedFilter === filter.id
                    ? "bg-[#3C83F6] dark:bg-white text-white dark:text-black shadow-lg"
                    : "bg-white/40 dark:bg-black/40 border border-black/5 dark:border-white/5 text-black/50 dark:text-white/50 hover:bg-white/60 dark:hover:bg-black/60 hover:text-black dark:hover:text-white"
                }`}
              >
                <Filter className="w-3 h-3" />
                {filter.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} onClick={() => navigate(`/learn/courses/${course.id}`)} />
            ))}
          </div>

          {filteredCourses.length === 0 && (
             <div className="py-20 flex flex-col items-center justify-center border border-black/5 dark:border-white/5 rounded-2xl border-dashed bg-white/20 dark:bg-black/20">
                <p className="text-xs tracking-widest uppercase text-black/30 dark:text-white/30">
                  No courses found in this category
                </p>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}