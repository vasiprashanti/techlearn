import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock, Users, Star, BookOpen, ArrowRight, Play,
  CheckCircle, Lock, ChevronLeft
} from "lucide-react";
import ScrollProgress from "../../components/ScrollProgress";
import LoadingScreen from "../../components/LoadingScreen";
import { courseAPI } from "../../services/api";
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Dashboard/Sidebar';

const CourseDetails = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isDarkMode = theme === 'dark';
  const userInitial = user?.firstName?.charAt(0)?.toUpperCase() || 'S';
  const userName = user?.firstName ? user.firstName : 'Student';

  const [activeTab, setActiveTab] = useState("overview");

  // State for backend data
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch course data from backend
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const backendResponse = await courseAPI.getCourse(courseId);

        // Extract course data from response (handle both response.course and direct response)
        const backendCourse = backendResponse.course || backendResponse;

        // Check if we have valid course data
        if (!backendCourse || !backendCourse._id) {
          throw new Error('No valid course data received from backend');
        }
        
        // The course title should be available directly
        const courseTitle = backendCourse.title || 'Untitled Course';

        // Get course-specific duration based on title
        const getCourseDuration = (title) => {
          const titleLower = title.toLowerCase();
          if (titleLower.includes('java')) return '8 weeks';
          if (titleLower.includes('python')) return '6 weeks';
          if (titleLower.includes('data structures')) return '8 weeks';
          if (titleLower.includes('mysql')) return '3 weeks';
          return '6 weeks';
        };

        // Determine course status based on title
        const getCourseStatus = (title) => {
          if (!title) {
            return {
              status: 'coming_soon',
              certificationPrice: null,
              certificationDiscountedPrice: null,
              xpDiscount: null,
              requiredXP: null
            };
          }

          const titleLower = title.toLowerCase();
          if (titleLower.includes('java') || titleLower.includes('python')) {
            return {
              status: 'available',
              certificationPrice: 1499,
              certificationDiscountedPrice: 999,
              xpDiscount: 500,
              requiredXP: 1000
            };
          } else {
            return {
              status: 'coming_soon',
              certificationPrice: null,
              certificationDiscountedPrice: null,
              xpDiscount: null,
              requiredXP: null
            };
          }
        };

        const courseStatus = getCourseStatus(courseTitle);

        // Create enhanced course object with default values for missing fields
        const enhancedCourse = {
          ...backendCourse,
          id: backendCourse._id,
          title: courseTitle,
          longDescription: backendCourse.description || 'Learn programming concepts and build practical skills with this comprehensive course.',
          difficulty: backendCourse.level || 'Beginner',
          duration: getCourseDuration(courseTitle),
          lessons: backendCourse.topics?.length || 0,
          students: Math.floor(Math.random() * 2000) + 1000, 
          rating: (4.5 + Math.random() * 0.5).toFixed(1), 
          status: courseStatus.status,
          certificationPrice: courseStatus.certificationPrice,
          certificationDiscountedPrice: courseStatus.certificationDiscountedPrice,
          xpDiscount: courseStatus.xpDiscount,
          requiredXP: courseStatus.requiredXP,
          instructor: {
            name: 'Prashanti Vasi',
            bio: 'Experienced developer and educator with years of industry experience in software development and teaching.',
            avatar: '/api/placeholder/100/100'
          },
          curriculum: backendCourse.topics?.map((topic, index) => ({
            id: index + 1,
            title: topic.title,
            lessons: Math.floor(Math.random() * 3) + 3, 
            duration: `${Math.floor(Math.random() * 2) + 1}-${Math.floor(Math.random() * 2) + 2} hours`, 
            topics: [topic.title],
            completed: false,
            locked: index > 2, 
            quizId: topic.quizId,
            exerciseId: topic.exerciseId,
            notesId: topic.notesId
          })) || [],
          prerequisites: [
            'Basic computer skills',
            'Text editor knowledge',
            'Understanding of basic programming concepts'
          ],
          learningOutcomes: [
            `Master ${courseTitle} fundamentals`,
            'Build practical projects',
            'Understand core programming concepts',
            'Apply knowledge in real-world scenarios',
            'Gain confidence in programming',
            'Prepare for advanced topics'
          ],
          tags: [courseTitle, 'Programming', 'Beginner-Friendly']
        };

        setCourse(enhancedCourse);
        setError(null);
      } catch (error) {
        console.error('Error fetching course:', error);
        setError(error.message);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  if (loading) {
    return (
      <>
        <ScrollProgress />
        <LoadingScreen showMessage={false} size={48} duration={800} />
      </>
    );
  }

  if (error || !course) {
    return (
      <div className={`flex min-h-full w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
         <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-12 rounded-2xl text-center">
            <h1 className="text-2xl font-light text-black dark:text-white mb-4">{error ? 'Error Loading Course' : 'Course Not Found'}</h1>
            {error && <p className="text-sm text-red-500 mb-6">{error}</p>}
            <button onClick={() => navigate('/learn/courses')} className="text-[10px] uppercase tracking-widest text-[#3C83F6] hover:underline">
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "curriculum", label: "Curriculum" },
    { id: "instructor", label: "Instructor" }
  ];

  const handleStartCourse = () => {
    navigate(`/learn/courses/${courseId}/topics`);
  };

  return (
    <div className={`flex min-h-full w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
      <ScrollProgress />
      
      {/* Unified Background */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />

      {/* Main Sidebar */}
      <Sidebar />

      <main className="flex-1 transition-all duration-700 ease-in-out z-10 pt-8 pb-12 px-6 md:px-12 lg:px-16 overflow-auto">
        <div className="max-w-[1600px] mx-auto space-y-8">
          
          {/* Top Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-black/5 dark:border-white/5 gap-4">
            <div className="flex flex-col items-start gap-4">
              <button 
                onClick={() => navigate('/learn/courses')} 
                className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Courses</span>
              </button>
              <div>
                <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-[#3C83F6] dark:text-white">
                  Course Details.
                </h1>
                <p className="text-xs tracking-widest uppercase text-black/40 dark:text-white/40 mt-2">
                  Explore The Curriculum
                </p>
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
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#3C83F6]/10 text-[#3C83F6] dark:bg-white/10 dark:text-white border border-[#3C83F6]/20 dark:border-white/20">
                                Student
                              </span>
                            </div>
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

          {/* Hero Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 md:p-12 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#3C83F6]/10 to-transparent dark:from-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
            
            <div className="relative z-10 max-w-4xl">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[9px] uppercase tracking-widest px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full text-black/60 dark:text-white/60 font-medium">
                  {course.difficulty}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-black dark:text-white mb-6 leading-tight">
                {course.title}
              </h1>
              
              <p className="text-base md:text-lg text-black/60 dark:text-white/60 mb-10 leading-relaxed font-light max-w-3xl">
                {course.longDescription}
              </p>

              <div className="flex flex-wrap gap-8 text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 mb-10 border-y border-black/5 dark:border-white/5 py-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#3C83F6] dark:text-white" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#3C83F6] dark:text-white" />
                  <span>{course.lessons} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#3C83F6] dark:text-white" />
                  <span>Lifetime access</span>
                </div>
              </div>

              <button
                onClick={handleStartCourse}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black rounded-xl text-[10px] uppercase tracking-widest font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-3 group"
              >
                <Play className="w-4 h-4" />
                <span>Start Learning</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Tabs Section */}
          <div className="mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex gap-8 mb-10 border-b border-black/5 dark:border-white/5 overflow-x-auto pb-px [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 text-[10px] uppercase tracking-widest font-medium transition-all duration-300 border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-[#3C83F6] dark:border-white text-[#3C83F6] dark:text-white"
                      : "border-transparent text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </motion.div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="min-h-[400px]"
            >
              {activeTab === "overview" && (
                <div className="grid md:grid-cols-2 gap-8 md:gap-16">
                  <div className="bg-white/20 dark:bg-black/20 backdrop-blur-md border border-black/5 dark:border-white/5 p-8 rounded-3xl">
                    <h3 className="text-xl font-medium text-black dark:text-white mb-8">
                      What you'll learn
                    </h3>
                    <ul className="space-y-4">
                      {course.learningOutcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-4 text-sm text-black/70 dark:text-white/70 font-light leading-relaxed">
                          <CheckCircle className="w-5 h-5 text-[#3C83F6] dark:text-white flex-shrink-0" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-white/20 dark:bg-black/20 backdrop-blur-md border border-black/5 dark:border-white/5 p-8 rounded-3xl h-fit">
                    <h3 className="text-xl font-medium text-black dark:text-white mb-8">
                      Prerequisites
                    </h3>
                    <ul className="space-y-4">
                      {course.prerequisites.map((prereq, index) => (
                        <li key={index} className="flex items-center gap-4 text-sm text-black/70 dark:text-white/70 font-light">
                          <div className="w-1.5 h-1.5 bg-[#3C83F6] dark:bg-white rounded-full flex-shrink-0" />
                          <span>{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "curriculum" && (
                <div className="space-y-6">
                  {course.curriculum.map((module, index) => (
                    <div
                      key={module.id}
                      className="bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-black/5 dark:border-white/5 transition-all hover:bg-white/60 dark:hover:bg-black/60 group"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center text-[#3C83F6] dark:text-white font-medium text-sm group-hover:scale-105 transition-transform">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-black dark:text-white mb-1">
                              {module.title}
                            </h4>
                            <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40">
                              {module.lessons} lessons • {module.duration}
                            </p>
                          </div>
                        </div>
                        {module.locked ? (
                          <Lock className="w-5 h-5 text-black/20 dark:text-white/20" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-[#3C83F6] dark:text-white" />
                        )}
                      </div>
                      
                      <ul className="space-y-3 ml-14 border-l border-black/5 dark:border-white/10 pl-5">
                        {module.topics.map((topic, topicIndex) => (
                          <li key={topicIndex} className="text-sm text-black/60 dark:text-white/60 font-light relative before:absolute before:-left-[25px] before:top-1/2 before:-translate-y-1/2 before:w-2 before:h-px before:bg-black/10 dark:before:bg-white/20">
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "instructor" && (
                <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-black/5 dark:border-white/5 max-w-3xl">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border-4 border-white dark:border-black/50">
                      <span className="text-3xl font-medium text-white dark:text-black">
                        {course.instructor.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-2xl font-medium text-black dark:text-white mb-3">
                        {course.instructor.name}
                      </h3>
                      <p className="text-sm text-black/60 dark:text-white/60 mb-6 leading-relaxed font-light">
                        {course.instructor.bio}
                      </p>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-6 text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 bg-black/5 dark:bg-white/5 p-4 rounded-xl w-fit">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#3C83F6] dark:text-white" />
                          <span>{course.students} students</span>
                        </div>
                        <div className="w-px h-4 bg-black/10 dark:bg-white/20 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-[#3C83F6] dark:text-white" />
                          <span>{course.rating} rating</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default CourseDetails;