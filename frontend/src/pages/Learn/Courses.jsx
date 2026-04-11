import React, { useState, useEffect, useRef } from 'react';
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Clock, Calendar, ArrowRight, Code } from "lucide-react";
import ScrollProgress from "../../components/ScrollProgress";
import LoadingScreen from "../../components/LoadingScreen";
import { courseAPI, dataAdapters } from "../../services/api";
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/Dashboard/Sidebar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "../../components/ui/carousel";

export default function Courses() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // Layout State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const liveBatchesSectionRef = useRef(null);
  
  const isDarkMode = theme === 'dark';

  // Data State
  const [coursesData, setCoursesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback mock data
  const mockCoursesData = [
    { id: "java", title: "Java Programming", description: "Master Java programming and object-oriented concepts", status: "available" },
    { id: "python", title: "Python Programming", description: "Learn Python programming from basics to advanced concepts", status: "available" },
    { id: "dsa", title: "Data Structures & Algorithms", description: "Master DSA concepts for coding interviews and problem solving", status: "available" },
    { id: "mysql", title: "MySQL Database", description: "Learn database design, queries, and management with MySQL", status: "available" }
  ];

  // Live Batches data
  const liveBatches = [
    { id: "python-programming", title: "Python Programming", instructor: "Prashanti Vasi", duration: "2 weeks", schedule: "Mon-Sat", time: "11:30 AM - 12:30 PM", startDate: "In Progress", level: "Beginner" },
    { id: "dsa-with-java", title: "DSA with Java", instructor: "Prashanti Vasi", duration: "3 weeks", schedule: "Mon-Sat", time: "10:00 AM - 11:00 AM", startDate: "In Progress", level: "Intermediate" },
    { id: "dsa-with-python", title: "DSA with Python", instructor: "Prashanti Vasi", duration: "3 weeks", schedule: "Mon-Sat", time: "10:00 AM - 11:00 AM", startDate: "In Progress", level: "Intermediate" },
    { id: "web-development", title: "Web Development", instructor: "Jyotsna", duration: "3 weeks", schedule: "Mon-Sat", time: "6:00 PM - 7:00 PM", startDate: "In Progress", level: "Beginner" },
    { id: "java-core", title: "Java (Core)", instructor: "Prashanti Vasi", duration: "TBD", schedule: "Mon-Sat", time: "(Not listed)", startDate: "In Progress", level: "Intermediate" }
  ];

  // Fetch courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        console.log('🚀 Fetching courses directly...');
        const backendCourses = await courseAPI.getAllCourses();
        console.log('✅ Backend courses received:', backendCourses);

        // Adapt backend data to frontend format and show only first 4 courses
        const adaptedCourses = backendCourses.map(course => dataAdapters.adaptCourse(course));
        setCoursesData(adaptedCourses.slice(0, 4));
        setError(null);
      } catch (error) {
        console.error('❌ Error fetching courses:', error);
        setError(error.message);
        // Fallback to mock data if backend fails
        setCoursesData(mockCoursesData);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle scroll restoration when returning from batch details
  useEffect(() => {
    const shouldScrollToLiveBatches = sessionStorage.getItem('returnToLiveBatches');

    if (shouldScrollToLiveBatches === 'true' && !loading && liveBatchesSectionRef.current) {
      sessionStorage.removeItem('returnToLiveBatches');

      const scrollTimer = setTimeout(() => {
        const element = liveBatchesSectionRef.current;
        if (element) {
          const elementTop = element.offsetTop - 100;
          window.scrollTo({
            top: elementTop,
            behavior: 'smooth'
          });
        }
      }, 800);

      return () => clearTimeout(scrollTimer);
    }
  }, [loading]);

  const handleCourseClick = (courseId) => {
    navigate(`/learn/courses/${courseId}`);
  };

  const handleWhatsAppClick = (courseTitle) => {
    const message = `Hi! I'm interested in the ${courseTitle} course. Can you provide more details?`;
    const whatsappUrl = `https://wa.me/919676663136?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <>
        <ScrollProgress />
        <LoadingScreen showMessage={false} size={48} duration={800} />
      </>
    );
  }

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
      <ScrollProgress />
      
      {/* Unified Background */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />

      {/* Sidebar */}
      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main className={`flex-1 transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} pt-24 pb-12 px-6 md:px-12 lg:px-16 overflow-auto`}>
        <div className="max-w-[1600px] mx-auto space-y-8">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-black/5 dark:border-white/5 gap-4">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-[#3C83F6] dark:text-white">
                Courses.
              </h1>
              <p className="text-xs tracking-widest uppercase text-black/40 dark:text-white/40 mt-2">
                Discover our comprehensive learning programs
              </p>
            </motion.div>

          </header>

          {/* Top Course Cards Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mb-16 mt-6">
            {error && !loading && (
              <div className="text-left py-4 mb-6">
                <p className="text-sm text-red-500 dark:text-red-400">Failed to load courses: {error}. Showing fallback data.</p>
              </div>
            )}

            {!loading && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {coursesData.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    onClick={() => handleCourseClick(course.id)}
                    className="group p-8 bg-white/20 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-black/40 border border-black/5 dark:border-white/5 transition-all duration-500 rounded-2xl cursor-pointer flex flex-col justify-between min-h-[240px] relative overflow-hidden"
                  >
                    {/* Subtle hover gradient decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3C83F6]/5 to-transparent dark:from-white/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>

                    <div className="relative z-10 flex items-start justify-between mb-6">
                      <div className="p-3 rounded-xl bg-white/50 dark:bg-black/50 border border-black/5 dark:border-white/5 shadow-sm group-hover:scale-110 transition-transform duration-500">
                        <Code className="w-5 h-5 text-[#3C83F6] dark:text-white" />
                      </div>
                    </div>
                    
                    <div className="relative z-10 mt-auto">
                      <h3 className="text-xl font-medium text-black dark:text-white group-hover:text-[#3C83F6] transition-colors mb-3">
                        {course.title}
                      </h3>
                      <p className="text-sm text-black/50 dark:text-white/50 leading-relaxed line-clamp-2 font-light">
                        {course.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="flex justify-start mt-8">
              <button 
                onClick={() => navigate('/learn/courses/all')} 
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black rounded-xl text-[10px] uppercase tracking-widest font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] group"
              >
                <span>View All Courses</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Live Batches Section */}
          <motion.div
            ref={liveBatchesSectionRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <h2 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50 font-semibold">
                  Live Batches
                </h2>
                <div className="h-[1px] flex-1 bg-black/5 dark:bg-white/5"></div>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black/40 dark:bg-white/40 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-black/50 dark:bg-white/50"></span>
                </span>
              </div>
            </div>

            <div className="relative px-2 mb-8">
              <Carousel
                opts={{ align: "start", loop: true, dragFree: true, slidesToScroll: 1 }}
                className="w-full max-w-full"
              >
                <CarouselContent className="-ml-2 py-4">
                  {liveBatches.map((batch, index) => (
                    <CarouselItem
                      key={batch.id}
                      className="md:basis-1/2 lg:basis-1/3 xl:basis-1/3 px-3"
                    >
                      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 flex flex-col h-full hover:bg-white/60 dark:hover:bg-black/60 transition-all duration-300 rounded-2xl group min-h-[240px]">
                        
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-[9px] uppercase tracking-widest px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full text-black/60 dark:text-white/60 font-medium">
                            {batch.level}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 group-hover:text-black dark:group-hover:text-white transition-colors">
                            By {batch.instructor}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-medium text-black dark:text-white group-hover:text-[#3C83F6] transition-colors mb-6">
                          {batch.title}
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-y-5 gap-x-4 mb-8 border-t border-black/5 dark:border-white/5 pt-5">
                          <div className="flex items-start gap-2.5">
                            <Clock className="w-4 h-4 text-black/40 dark:text-white/40 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-black dark:text-white">{batch.time}</span>
                              <span className="text-[10px] text-black/50 dark:text-white/50 mt-0.5">{batch.duration}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <Calendar className="w-4 h-4 text-black/40 dark:text-white/40 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-black dark:text-white">{batch.schedule}</span>
                              <span className="text-[10px] text-black/50 dark:text-white/50 mt-0.5">Recurring</span>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleWhatsAppClick(batch.title)}
                          className="mt-auto w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black rounded-xl text-[10px] uppercase tracking-widest font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02]"
                        >
                          Enroll Now <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}