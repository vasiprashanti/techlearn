import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const CourseLogosMarquee = ({ courses = [] }) => {
  const [duplicatedCourses, setDuplicatedCourses] = useState([]);

  useEffect(() => {
    // Duplicate courses array to create seamless loop
    if (courses.length > 0) {
      setDuplicatedCourses([...courses, ...courses, ...courses]);
    }
  }, [courses]);

  // Default courses if none provided
  const defaultCourses = [
    { id: 1, title: "Java Programming", image: "/java.png", icon: "☕" },
    { id: 2, title: "Python Programming", image: "/python.png", icon: "🐍" },
    { id: 3, title: "Data Structures & Algorithms", image: "/dsa.png", icon: "🔗" },
    { id: 4, title: "MySQL Database", image: "/mysql.png", icon: "🗄️" },
  ];

  const displayCourses = duplicatedCourses.length > 0 ? duplicatedCourses : [...defaultCourses, ...defaultCourses, ...defaultCourses];

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="relative">
        {/* Gradient overlays for smooth fade effect */}
        <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-blue-50 via-blue-50/80 to-transparent dark:from-gray-900 dark:via-gray-900/80 dark:to-transparent z-10"></div>
        <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-blue-50 via-blue-50/80 to-transparent dark:from-gray-900 dark:via-gray-900/80 dark:to-transparent z-10"></div>
        
        {/* Marquee container */}
        <motion.div
          className="flex space-x-12"
          animate={{
            x: [0, -100 * (displayCourses.length / 3)]
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear",
            },
          }}
          style={{
            width: `${displayCourses.length * 120}px`
          }}
        >
          {displayCourses.map((course, index) => (
            <motion.div
              key={`${course.id}-${index}`}
              className="flex-shrink-0 flex flex-col items-center justify-center group cursor-pointer"
              whileHover={{
                scale: 1.1,
                y: -5,
                transition: { duration: 0.2 }
              }}
            >
              {/* Logo container */}
              <div className="w-20 h-20 mb-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-600/50 flex items-center justify-center group-hover:shadow-xl transition-all duration-300">
                {course.image ? (
                  <img
                    src={course.image}
                    alt={`${course.title} logo`}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <div
                  className="text-2xl hidden"
                  style={{ display: course.image ? 'none' : 'block' }}
                >
                  {course.icon}
                </div>
              </div>
              
              {/* Course title */}
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center max-w-20 leading-tight">
                {course.title}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default CourseLogosMarquee;
