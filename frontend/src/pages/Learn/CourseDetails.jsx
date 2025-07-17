import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock, Users, Star, BookOpen, ArrowRight, Play,
  CheckCircle, Lock, Award, Calendar
} from "lucide-react";
import ScrollProgress from "../../components/ScrollProgress";
import LoadingScreen from "../../components/LoadingScreen";
import useInViewport from "../../hooks/useInViewport";
import { courseAPI, dataAdapters } from "../../services/api";

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [titleRef, isTitleInViewport] = useInViewport();
  const [whatYouLearnRef, isWhatYouLearnInViewport] = useInViewport();
  const [prerequisitesRef, isPrerequisitesInViewport] = useInViewport();
  const [instructorRef, isInstructorInViewport] = useInViewport();

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
        console.log('Course details from backend:', backendResponse);

        // Extract course data from response (handle both response.course and direct response)
        const backendCourse = backendResponse.course || backendResponse;
        console.log('Backend course after extraction:', backendCourse);

        // Check if we have valid course data
        if (!backendCourse || !backendCourse._id) {
          throw new Error('No valid course data received from backend');
        }
        
        console.log('Extracted course data:', backendCourse);

        // The course title should be available directly
        const courseTitle = backendCourse.title || 'Untitled Course';
        
        console.log('Resolved course title:', courseTitle);

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
          students: Math.floor(Math.random() * 2000) + 1000, // Random between 1000-3000
          rating: (4.5 + Math.random() * 0.5).toFixed(1), // Random between 4.5-5.0
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
            lessons: Math.floor(Math.random() * 3) + 3, // Random between 3-5 lessons
            duration: `${Math.floor(Math.random() * 2) + 1}-${Math.floor(Math.random() * 2) + 2} hours`, // Random duration
            topics: [topic.title],
            completed: false,
            locked: index > 2, // First 3 topics unlocked
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

  // Loading state
  if (loading) {
    return (
      <>
        <ScrollProgress />
        <LoadingScreen
          showMessage={false}
          size={48}
          duration={800}
        />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Course</h1>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/learn/courses')}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  // Course not found state
  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Course Not Found</h1>
          <button
            onClick={() => navigate('/learn/courses')}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "curriculum", label: "Curriculum" },
    { id: "instructor", label: "Instructor" }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const handleStartCourse = () => {
    // Navigate to course topics page
    navigate(`/learn/courses/${courseId}/topics`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <ScrollProgress />
      
      {/* Hero Section */}
      <div className="relative z-10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/20 pt-20">
        <div className="container px-6 py-16 mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(course.difficulty)}`}>
                    {course.difficulty}
                  </span>
                </div>

                <h1
                  ref={titleRef}
                  className={`Marquee-title-no-border ${isTitleInViewport ? 'in-viewport' : ''} mb-6`}
                >
                  {course.title}
                </h1>
                
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                  {course.longDescription}
                </p>

                {/* Course Stats */}
                <div className="flex flex-wrap gap-6 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    <span>{course.lessons} lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>{course.students} students</span>
                  </div>

                </div>
              </motion.div>
            </div>

            {/* Enrollment Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 dark:border-gray-700/20 sticky top-24"
            >
              {course.status === 'coming_soon' ? (
                <motion.button
                  disabled
                  className="w-full h-14 bg-gray-400 text-white border-none rounded-lg cursor-not-allowed inline-flex items-center justify-center gap-2 transition-all duration-300 font-sans mb-6 opacity-60"
                >
                  <Clock className="w-5 h-5" />
                  <span>Coming Soon</span>
                </motion.button>
              ) : (
                <>
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Mobile and desktop access</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Community support</span>
                    </div>
                  </div>

                  <motion.button
                    onClick={handleStartCourse}
                    whileHover={{
                      x: 2,
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white border-none rounded-lg cursor-pointer inline-flex items-center justify-center gap-2 transition-all duration-300 font-sans"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Learning</span>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </motion.button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container px-6 py-16 mx-auto max-w-7xl">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex gap-2 sm:gap-4 mb-12 border-b border-gray-200 dark:border-gray-700 overflow-x-auto"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-6 py-3 font-medium transition-all duration-300 border-b-2 whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
        >
          {activeTab === "overview" && (
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3
                  ref={whatYouLearnRef}
                  className={`font-poppins text-2xl font-medium mb-6 hover-gradient-text ${isWhatYouLearnInViewport ? 'in-viewport' : ''}`}
                >
                  What you'll learn
                </h3>
                <ul className="space-y-3">
                  {course.learningOutcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3
                  ref={prerequisitesRef}
                  className={`font-poppins text-2xl font-medium mb-6 hover-gradient-text ${isPrerequisitesInViewport ? 'in-viewport' : ''}`}
                >
                  Prerequisites
                </h3>
                <ul className="space-y-3">
                  {course.prerequisites.map((prereq, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "curriculum" && (
            <div className="space-y-4">
              {course.curriculum.map((module, index) => (
                <div
                  key={module.id}
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-gray-700/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-poppins font-medium text-gray-900 dark:text-white">
                          {module.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {module.lessons} lessons • {module.duration}
                        </p>
                      </div>
                    </div>
                    {module.locked ? (
                      <Lock className="w-5 h-5 text-gray-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <ul className="space-y-2 ml-12">
                    {module.topics.map((topic, topicIndex) => (
                      <li key={topicIndex} className="text-gray-600 dark:text-gray-400 text-sm">
                        • {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {activeTab === "instructor" && (
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-xl p-4 sm:p-6 md:p-8 border border-white/20 dark:border-gray-700/20">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {course.instructor.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3
                    ref={instructorRef}
                    className={`font-poppins text-xl sm:text-2xl font-medium mb-2 hover-gradient-text ${isInstructorInViewport ? 'in-viewport' : ''}`}
                  >
                    {course.instructor.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
                    {course.instructor.bio}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.students} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
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
  );
};

export default CourseDetails;