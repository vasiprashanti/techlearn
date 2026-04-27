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

const CourseDetails = () => {
  const { theme } = useTheme();
  const { courseId } = useParams();
  const navigate = useNavigate();

  const isDarkMode = theme === 'dark';

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
          <div className="dashboard-surface p-12 text-center">
            <h1 className="dashboard-page-title mb-4">{error ? 'Error Loading Course' : 'Course Not Found'}</h1>
            {error && <p className="text-sm text-red-500 mb-6">{error}</p>}
            <button onClick={() => navigate('/learn')} className="text-[10px] uppercase tracking-widest text-[#3C83F6] hover:underline">
              Back to Learn
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

      <main className="flex-1 transition-all duration-700 ease-in-out z-10 pt-24 md:pt-28 pb-12 px-6 md:px-12 lg:px-16 overflow-auto">
        <div className="max-w-[1600px] mx-auto space-y-8">
          
          {/* Top Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-black/5 dark:border-white/5 gap-4">
            <div className="flex flex-col items-start gap-4">
              <button 
                onClick={() => navigate('/learn')} 
                className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-[#4d6f9c] hover:text-[#2d7fe8] dark:text-[#7fb9e6] dark:hover:text-[#96ddff] transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Learn</span>
              </button>
              <div>
                <h1 className="dashboard-page-title">
                  Course Details
                </h1>
                <p className="dashboard-page-subtitle mt-2">
                  Explore the curriculum
                </p>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="dashboard-surface p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#3C83F6]/10 to-transparent dark:from-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
            
            <div className="relative z-10 max-w-4xl">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[9px] uppercase tracking-widest px-3 py-1 bg-[#dff1ff] dark:bg-[#0d366f] rounded-full text-[#4f719c] dark:text-[#8ac7f3] border border-[#9fd3ff]/60 dark:border-[#79c5ff]/40 font-medium">
                  {course.difficulty}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[#0d2a57] dark:text-[#8fd9ff] mb-6 leading-tight">
                {course.title}
              </h1>
              
              <p className="text-base md:text-lg text-[#4c6f9a] dark:text-[#7fb8e2] mb-10 leading-relaxed font-light max-w-3xl">
                {course.longDescription}
              </p>

              <div className="flex flex-wrap gap-8 text-[10px] uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6] mb-10 border-y border-[#9fcfff]/45 dark:border-[#6bb8ec]/35 py-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#4f7fb7] dark:text-[#7cc3ee]" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#4f7fb7] dark:text-[#7cc3ee]" />
                  <span>{course.lessons} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#4f7fb7] dark:text-[#7cc3ee]" />
                  <span>Lifetime access</span>
                </div>
              </div>

              <button
                onClick={handleStartCourse}
                className="dashboard-primary-btn w-full sm:w-auto px-8 py-4 flex items-center justify-center gap-3 group"
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
              className="flex gap-8 mb-10 border-b border-[#9fcfff]/45 dark:border-[#6bb8ec]/35 overflow-x-auto pb-px [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 text-[10px] uppercase tracking-widest font-medium transition-all duration-300 border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-[#3C83F6] dark:border-[#8fd9ff] text-[#2d7fe8] dark:text-[#8fd9ff]"
                      : "border-transparent text-[#4d6f9c] dark:text-[#7fb9e6] hover:text-[#2d7fe8] dark:hover:text-[#96ddff]"
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
                  <div className="dashboard-surface p-8">
                    <h3 className="text-xl font-medium text-[#0d2a57] dark:text-[#8fd9ff] mb-8">
                      What you'll learn
                    </h3>
                    <ul className="space-y-4">
                      {course.learningOutcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-4 text-sm text-[#4c6f9a] dark:text-[#7fb8e2] font-light leading-relaxed">
                          <CheckCircle className="w-5 h-5 text-[#4f7fb7] dark:text-[#7cc3ee] flex-shrink-0" />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="dashboard-surface p-8 h-fit">
                    <h3 className="text-xl font-medium text-[#0d2a57] dark:text-[#8fd9ff] mb-8">
                      Prerequisites
                    </h3>
                    <ul className="space-y-4">
                      {course.prerequisites.map((prereq, index) => (
                        <li key={index} className="flex items-center gap-4 text-sm text-[#4c6f9a] dark:text-[#7fb8e2] font-light">
                          <div className="w-1.5 h-1.5 bg-[#4f7fb7] dark:bg-[#7cc3ee] rounded-full flex-shrink-0" />
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
                      className="dashboard-surface rounded-2xl p-6 md:p-8 transition-all hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 bg-[#dbf1ff] dark:bg-[#0d366f] rounded-xl border border-[#9fd3ff]/60 dark:border-[#79c5ff]/40 flex items-center justify-center text-[#3C83F6] dark:text-[#8fd9ff] font-medium text-sm group-hover:scale-105 transition-transform">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-[#0d2a57] dark:text-[#8fd9ff] mb-1">
                              {module.title}
                            </h4>
                            <p className="text-[10px] uppercase tracking-widest text-[#4d6f9c] dark:text-[#7fb9e6]">
                              {module.lessons} lessons • {module.duration}
                            </p>
                          </div>
                        </div>
                        {module.locked ? (
                          <Lock className="w-5 h-5 text-[#6f8fb8] dark:text-[#6fbfff]" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-[#4f7fb7] dark:text-[#7cc3ee]" />
                        )}
                      </div>
                      
                      <ul className="space-y-3 ml-14 border-l border-[#9fcfff]/45 dark:border-[#6bb8ec]/35 pl-5">
                        {module.topics.map((topic, topicIndex) => (
                          <li key={topicIndex} className="text-sm text-[#4c6f9a] dark:text-[#7fb8e2] font-light relative before:absolute before:-left-[25px] before:top-1/2 before:-translate-y-1/2 before:w-2 before:h-px before:bg-[#9fcfff]/60 dark:before:bg-[#6bb8ec]/55">
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "instructor" && (
                <div className="dashboard-surface p-8 md:p-12 max-w-3xl">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border-4 border-[#d9efff] dark:border-[#0d366f]">
                      <span className="text-3xl font-medium text-[#082a5d]">
                        {course.instructor.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-2xl font-medium text-[#0d2a57] dark:text-[#8fd9ff] mb-3">
                        {course.instructor.name}
                      </h3>
                      <p className="text-sm text-[#4c6f9a] dark:text-[#7fb8e2] mb-6 leading-relaxed font-light">
                        {course.instructor.bio}
                      </p>
                      <div className="dashboard-inner-surface flex flex-wrap justify-center sm:justify-start gap-6 text-[10px] uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6] p-4 rounded-xl w-fit">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#4f7fb7] dark:text-[#7cc3ee]" />
                          <span>{course.students} students</span>
                        </div>
                        <div className="w-px h-4 bg-[#9fcfff]/60 dark:bg-[#6bb8ec]/55 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-[#4f7fb7] dark:text-[#7cc3ee]" />
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
