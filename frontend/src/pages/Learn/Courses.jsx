import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Clock, Calendar, MessageCircle, Dot, ArrowRight } from "lucide-react";
import ScrollProgress from "../../components/ScrollProgress";
import LoadingScreen from "../../components/LoadingScreen";
import CourseCard from "../../components/CourseCard";

import useInViewport from "../../hooks/useInViewport";
import { courseAPI, dataAdapters, apiStatus } from "../../services/api";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../components/ui/carousel";

const Courses = () => {
  const navigate = useNavigate();
  const [coursesHeadingRef, isCoursesHeadingInViewport] = useInViewport();
  const [liveBatchesHeadingRef, isLiveBatchesHeadingInViewport] = useInViewport();
  const liveBatchesSectionRef = useRef(null);

  // State for courses data
  const [coursesData, setCoursesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, []);

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

  // Fallback mock data (in case backend is not available)
  const mockCoursesData = [
    {
      id: "java",
      title: "Java Programming",
      description: "Master Java programming and object-oriented concepts",
      gradient: "from-blue-500 via-cyan-400 to-teal-400",
      icon: "☕",
      image: "/java.png",
      status: "available",
      price: "Free",
      certificationPrice: 1499,
      certificationDiscountedPrice: 999,
      xpDiscount: 500,
      requiredXP: 1000
    },
    {
      id: "python",
      title: "Python Programming",
      description: "Learn Python programming from basics to advanced concepts",
      gradient: "from-blue-500 via-cyan-400 to-teal-400",
      icon: "🐍",
      image: "/python.png",
      status: "available",
      price: "Free",
      certificationPrice: 1499,
      certificationDiscountedPrice: 999,
      xpDiscount: 500,
      requiredXP: 1000
    },
    {
      id: "dsa",
      title: "Data Structures & Algorithms",
      description: "Master DSA concepts for coding interviews and problem solving",
      gradient: "from-blue-500 via-cyan-400 to-teal-400",
      icon: "🧠",
      image: "/dsa.png",
      status: "coming_soon",
      price: "Coming Soon"
    },
    {
      id: "mysql",
      title: "MySQL Database",
      description: "Learn database design, queries, and management with MySQL",
      gradient: "from-blue-500 via-cyan-400 to-teal-400",
      icon: "🗄️",
      image: "/mysql.png",
      status: "coming_soon",
      price: "Coming Soon"
    }
  ];

  // Live Batches data
  const liveBatches = [
    {
      id: "python-programming",
      title: "Python Programming",
      instructor: "Prashanti Vasi",
      duration: "2 weeks",
      schedule: "Mon-Sat",
      time: "11:30 AM - 12:30 PM",
      startDate: "In Progress",
      price: "₹4000",
      description: "Master Python fundamentals with live interactive classes. Learn programming concepts and build practical skills.",
      level: "Beginner"
    },
    {
      id: "dsa-with-java",
      title: "DSA with Java",
      instructor: "Prashanti Vasi",
      duration: "3 weeks",
      schedule: "Mon-Sat",
      time: "10:00 AM - 11:00 AM",
      startDate: "In Progress",
      price: "₹6000",
      description: "Deep dive into Data Structures and Algorithms using Java. Build problem-solving skills with real-world projects.",
      level: "Intermediate"
    },
    {
      id: "dsa-with-python",
      title: "DSA with Python",
      instructor: "Prashanti Vasi",
      duration: "3 weeks",
      schedule: "Mon-Sat",
      time: "10:00 AM - 11:00 AM",
      startDate: "In Progress",
      price: "₹6000",
      description: "Master Data Structures and Algorithms with Python. Learn efficient coding patterns and optimization techniques.",
      level: "Intermediate"
    },
    {
      id: "web-development",
      title: "Web Development",
      instructor: "Jyotsna",
      duration: "3 weeks",
      schedule: "Mon-Sat",
      time: "6:00 PM - 7:00 PM",
      startDate: "In Progress",
      price: "₹4000",
      description: "Learn modern web development from scratch. Build responsive websites and web applications.",
      level: "Beginner"
    },
    {
      id: "java-core",
      title: "Java (Core)",
      instructor: "Prashanti Vasi",
      duration: "TBD",
      schedule: "Mon-Sat",
      time: "(Not listed)",
      startDate: "In Progress",
      price: "₹6000",
      description: "Master Java programming fundamentals. Learn object-oriented programming and build robust applications.",
      level: "Intermediate"
    }
  ];

  const handleCourseClick = (courseId) => {
    // Allow navigation to all course details pages
    navigate(`/learn/courses/${courseId}`);
  };

  const handleWhatsAppClick = (courseTitle) => {
    const message = `Hi! I'm interested in the ${courseTitle} course. Can you provide more details?`;
    const whatsappUrl = `https://wa.me/919676663136?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

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

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#daf0fa] dark:bg-[#020b23]">
      <ScrollProgress />

      {/* Header Section */}
      <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
      <div className="relative z-10 pt-24 pb-16">
        <div className="container px-8 mx-auto max-w-7xl">
          {/* Courses Heading - Match Live Batches structure */}
          <div className="flex items-center gap-3 mb-12">
            <h2
              ref={coursesHeadingRef}
              className={`font-poppins text-5xl font-medium brand-heading-primary ${isCoursesHeadingInViewport ? 'in-viewport' : ''} uppercase tracking-wider`}
            >
              Courses
            </h2>
          </div>
          <p className="text-lg text-blue-600 dark:text-blue-400 font-medium mb-12">
            Discover our comprehensive learning programs
          </p>

          {/* Course Cards Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-20"
          >


            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400 mb-4">
                  Failed to load courses: {error}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Showing fallback data instead.
                </p>
              </div>
            )}

            {/* Courses Grid */}
            {!loading && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {coursesData.map((course, index) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    index={index}
                    onClick={() => handleCourseClick(course.id)}
                  />
                ))}
              </div>
            )}

            {/* View All Courses Button */}
            <div className="flex justify-center mt-12 mb-8 md:mb-0">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                whileHover={{
                  x: 2,
                  transition: { duration: 0.2, ease: "easeOut" }
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/learn/courses/all')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white border-none px-4 py-2 text-base rounded-lg cursor-pointer inline-flex items-center gap-2 transition-all duration-300 font-sans"
              >
                <span>View All Courses</span>
                <motion.div
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.button>
            </div>
          </motion.div>



          {/* Live Batches Section */}
          <motion.div
            ref={liveBatchesSectionRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pb-16 pt-8 md:pt-0"
          >
            <div className="flex items-center gap-3 mb-12">
              <h2
                ref={liveBatchesHeadingRef}
                className={`font-poppins text-3xl font-medium brand-heading-primary ${isLiveBatchesHeadingInViewport ? 'in-viewport' : ''} uppercase tracking-wider`}
              >
                LIVE BATCHES
              </h2>
              <span className="relative">
                <Dot
                  className="w-7 h-7 text-red-500"
                  style={{ filter: "drop-shadow(0 0 6px #f00)" }}
                />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 bg-red-500 rounded-full opacity-80 animate-pulse"></span>
              </span>
            </div>

            {/* Netflix-style carousel for cards */}
            <div className="relative px-2 mb-8">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                  dragFree: true,
                  slidesToScroll: 1
                }}
                className="w-full max-w-full"
              >
                <CarouselContent className="py-2">
                  {liveBatches.map((batch, index) => (
                    <CarouselItem
                      key={batch.id}
                      className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4 px-2"
                    >
                      <LiveBatchCard
                        batch={batch}
                        index={index}
                        onWhatsAppClick={() => handleWhatsAppClick(batch.title)}
                        onGetStarted={() => {
                          sessionStorage.setItem('returnToLiveBatches', 'true');
                          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                          setTimeout(() => navigate(`/learn/batches/${batch.id}`), 100);
                        }}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="z-20 -left-5 bg-white/90 dark:bg-gray-800/90 backdrop-blur border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all duration-300" />
                <CarouselNext className="z-20 -right-5 bg-white/90 dark:bg-gray-800/90 backdrop-blur border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all duration-300" />
              </Carousel>
            </div>
          </motion.div>
        </div>
      </div>
      </motion.div>
    </div>
  );
};



// Live Batch Card Component
const LiveBatchCard = ({ batch, index, onWhatsAppClick, onGetStarted }) => {
  const getLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        type: "spring",
        stiffness: 100
      }}
      className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-600/50 cursor-pointer h-full flex flex-col"
    >
      {/* Header - Fixed height section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getLevelColor(batch.level)}`}>
            {batch.level}
          </span>
        </div>
        <div className="h-14 flex items-start">
          <h3 className="font-poppins font-medium text-lg text-gray-900 dark:text-white transition-colors duration-300 line-clamp-2">
            {batch.title}
          </h3>
        </div>
      </div>

      {/* Instructor - Fixed height section */}
      <div className="h-6 mb-6 flex items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          with <span className="text-blue-600 dark:text-blue-400 font-medium">{batch.instructor}</span>
        </p>
      </div>

      {/* Schedule Info - Fixed height section */}
      <div className="h-24 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{batch.duration}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>Schedule: {batch.schedule}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>Time: {batch.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>Starts: {batch.startDate}</span>
          </div>
        </div>
      </div>

      {/* Description - Flexible section */}
      <div className="flex-grow mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
          {batch.description}
        </p>
      </div>

      {/* Price and Actions - Fixed height section */}
      <div className="h-12 flex items-center justify-between mb-4">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {batch.price}
        </div>
        <button
          onClick={onWhatsAppClick}
          className="flex items-center gap-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-300"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">WhatsApp</span>
        </button>
      </div>

      {/* Get Started Button - Fixed height */}
      <button
        onClick={onGetStarted}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all duration-300 hover:shadow-lg"
      >
        Get Started
      </button>
    </motion.div>
  );
};

export default Courses;
