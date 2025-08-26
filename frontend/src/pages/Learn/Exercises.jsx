import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Code, Trophy, Lock, Star, ArrowRight, BookOpen, Zap, Target } from 'lucide-react';
import { courseAPI } from '../../services/api';
import useInViewport from '../../hooks/useInViewport';
import LoadingScreen from '../../components/Loader/Loader3D';

const Exercises = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [headingRef, isHeadingInViewport] = useInViewport();


  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseAPI.getAllCourses();
        // getAllCourses now returns the courses array directly
        setCourses(response || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        // Fallback to static data for development
        setCourses([
          { _id: '1', title: 'JavaScript Programming', level: 'Beginner', description: 'Learn the fundamentals of JavaScript' },
          { _id: '2', title: 'Python Programming', level: 'Intermediate', description: 'Level up your Python with focused problems for interviews, academics, or everyday coding.' },
          { _id: '3', title: 'C Programming', level: 'Beginner', description: 'Understand C programming basics' },
          { _id: '4', title: 'Java Programming', level: 'Intermediate', description: 'Sharpen your Java skills with practical questions for college, placements, or daily practice.' },
          { _id: '5', title: 'C++ Programming', level: 'Advanced', description: 'Advanced C++ programming techniques' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses;

  const handleCourseClick = (courseId) => {
    navigate(`/learn/exercises/${courseId}`);
  };

  const getCategoryIcon = (level) => {
    switch (level) {
      case 'Beginner': return <BookOpen className="w-5 h-5" />;
      case 'Intermediate': return <Zap className="w-5 h-5" />;
      case 'Advanced': return <Target className="w-5 h-5" />;
      default: return <Code className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (level) => {
    switch (level) {
      case 'Beginner': return 'from-blue-300 to-blue-400';
      case 'Intermediate': return 'from-blue-500 to-blue-600';
      case 'Advanced': return 'from-blue-700 to-blue-800';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getLanguageIcon = (courseTitle) => {
    const titleLower = courseTitle.toLowerCase();
    if (titleLower.includes('java') && !titleLower.includes('javascript')) {
      return '/java.png';
    } else if (titleLower.includes('python')) {
      return '/python.png';
    } else if (titleLower.includes('javascript')) {
      return '/js.png';
    } else if (titleLower.includes('html')) {
      return '/html.png';
    } else if (titleLower.includes('css')) {
      return '/css.png';
    } else if (titleLower.includes('c++')) {
      return '/c.png';
    } else if (titleLower.includes('c ') || titleLower.includes('c programming')) {
      return '/c.png';
    }
    return null; // Return null if no specific icon found, will fallback to Code icon
  };

  if (loading) {
    return (
      <LoadingScreen
        showMessage={false}
        fullScreen={true}
        size={40}
        duration={800}
      />
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1
            ref={headingRef}
            className={`Marquee-title-no-border ${isHeadingInViewport ? 'in-viewport' : ''} mb-2 text-center`}
          >
            <span className="italic">code</span> WORKOUT
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 text-left">
          Welcome to CodeWORKOUT! Confused? Don’t be — it’s simple: solve real-world problems, earn XP, and grow with every line of code.
          </p>
        </motion.div>



        {/* TODO: Uncomment when we have Intermediate and Advanced categories
        <div className="space-y-8">
          {['Beginner', 'Intermediate', 'Advanced'].map((level, levelIndex) => {
            const levelCourses = filteredCourses.filter(course => course.level === level);
            if (levelCourses.length === 0) return null;
            return (
              <motion.div key={level} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 + levelIndex * 0.1 }} className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${getCategoryColor(level)} text-white`}>
                    {getCategoryIcon(level)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{level} Level</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {level === 'Beginner' && 'Perfect for getting started'}
                      {level === 'Intermediate' && 'Build on your foundation'}
                      {level === 'Advanced' && 'Challenge yourself'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {levelCourses.map((course, index) => (
                    <motion.div key={course._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }} onClick={() => handleCourseClick(course._id)} className="group cursor-pointer">
                      <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50 dark:border-gray-600/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 flex items-center justify-center">
                            {getLanguageIcon(course.title) ? (
                              <img
                                src={getLanguageIcon(course.title)}
                                alt={`${course.title} logo`}
                                className="w-10 h-10 object-contain"
                              />
                            ) : (
                              <Code className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                            )}
                          </div>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">{course.title}</h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{course.description || 'Practice coding exercises and improve your skills'}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
                          <div className="flex items-center gap-3 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1"><Code className="w-4 h-4" /><span className="text-xs sm:text-sm">10 Exercises</span></div>
                            <div className="flex items-center gap-1"><Trophy className="w-4 h-4" /><span className="text-xs sm:text-sm">100 XP</span></div>
                          </div>
                        </div>
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-800 dark:text-blue-200 font-medium rounded-xl transition-all duration-300 border border-blue-200/50 dark:border-blue-700/50">
                          <span className="text-sm sm:text-base">Start Practicing</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
        */}

        {/* Course Cards - Simple Grid without Level Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCourses && filteredCourses.length > 0 ? filteredCourses.map((course, index) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => handleCourseClick(course._id)}
              className="group cursor-pointer h-full"
            >
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50 dark:border-gray-600/50 hover:shadow-xl transition-all duration-300 h-full hover:scale-105">
                {/* Course Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 flex items-center justify-center">
                    {getLanguageIcon(course.title) ? (
                      <img
                        src={getLanguageIcon(course.title)}
                        alt={`${course.title} logo`}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <Code className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Course Info */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {course.description || 'Practice coding exercises and improve your skills'}
                </p>

                {/* Exercise Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
                  <div className="flex items-center gap-3 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Code className="w-4 h-4" />
                      <span className="text-xs sm:text-sm">10 Exercises</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      <span className="text-xs sm:text-sm">100 XP</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 sm:px-4 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-800 dark:text-blue-200 font-medium rounded-xl transition-all duration-300 border border-blue-200/50 dark:border-blue-700/50">
                  <span className="text-sm sm:text-base">Start Practicing</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full text-center py-12">
              <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No courses available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Courses are being loaded or there might be an issue. Please try refreshing the page.
              </p>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-12"
          >
            <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No exercises found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try selecting a different category or check back later.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Exercises;
