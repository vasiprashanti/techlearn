import { motion } from "framer-motion";
import { Card, CardContent } from "./ui/card";
import useInViewport from "../hooks/useInViewport";
import AnimatedLogo from "./AnimatedLogo";

const CourseCard = ({ course, index, onClick }) => {
  const [titleRef, isTitleInViewport] = useInViewport();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{
        y: -8,
        transition: { duration: 0.2 }
      }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <Card className="h-full bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-xl hover:border-purple-300/50 dark:hover:border-purple-500/50 transition-all duration-300 overflow-hidden">
        <CardContent className="p-0">
          {/* Course Icon/Header - Simplified with plain background */}
          <div className="h-48 bg-purple-200 dark:bg-purple-800 flex items-center justify-center relative">
            {/* Optimized animated logo */}
            <AnimatedLogo
              src={course.image}
              alt={`${course.title} logo`}
              fallbackIcon={course.icon}
            />

            {/* Simple hover overlay */}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Course Info */}
          <div className="p-6">
            <h3
              ref={titleRef}
              className={`font-poppins text-xl font-medium text-blue-900 dark:text-white mb-2 hover-gradient-text ${isTitleInViewport ? 'in-viewport' : ''}`}
            >
              {course.title}
            </h3>
            <p className="text-blue-700 dark:text-gray-200 text-sm leading-relaxed">
              {course.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CourseCard;
