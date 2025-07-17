import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Clock, Star, BookOpen, ArrowRight, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import ScrollProgress from "../../components/ScrollProgress";
import LoadingScreen from "../../components/LoadingScreen";
import useInViewport from "../../hooks/useInViewport";
import CourseCard from "../../components/CourseCard";
import { courseAPI, dataAdapters } from "../../services/api";

const AllCourses = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [headingRef, isHeadingInViewport] = useInViewport();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const backendCourses = await courseAPI.getAllCourses();
        console.log('All courses from backend:', backendCourses);

        // Adapt backend data to frontend format
        const adaptedCourses = backendCourses.map(course => dataAdapters.adaptCourse(course));
        setCourses(adaptedCourses);
        setError(null);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError(error.message);
        // Set empty array on error
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



  const handleCourseClick = (courseId) => {
    navigate(`/learn/courses/${courseId}`);
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <ScrollProgress />
      
      {/* Header Section */}
      <div className="relative z-10 pt-24 pb-12">
        <div className="container px-6 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1
              ref={headingRef}
              className={`Marquee-title-no-border ${isHeadingInViewport ? 'in-viewport' : ''}`}
            >
              All Courses
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Master in-demand skills with our comprehensive programming courses designed by industry experts.
            </p>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                  selectedFilter === filter.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80"
                }`}
              >
                <Filter className="w-4 h-4" />
                {filter.label}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="container px-6 pb-16 mx-auto max-w-7xl">

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-red-600 dark:text-red-400 mb-4 text-xl">
              Failed to load courses: {error}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Please try refreshing the page or check your connection.
            </p>
          </div>
        )}

        {/* Courses Grid */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredCourses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                index={index}
                onClick={() => handleCourseClick(course.id)}
              />
            ))}
          </motion.div>
        )}

        {!loading && !error && filteredCourses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-xl text-gray-500 dark:text-gray-400">
              No courses found for the selected filter.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};



export default AllCourses;
