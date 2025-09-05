import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { FiCheckCircle, FiX, FiMenu } from "react-icons/fi";

const Sidebar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      id: "profile",
      title: "Profile",
      icon: "/sidebar/profile.png",
      completed: false,
    },
    {
      id: "learn/courses",
      title: "Enrolled Courses",
      icon: "/sidebar/courses.png",
      completed: false,
    },
    {
      id: "learn/exercises",
      title: "My Exercises",
      icon: "/sidebar/exercises.png",
      completed: false,
    },
    {
      id: "projects",
      title: "Current Projects",
      icon: "/sidebar/projects.png",
      completed: false,
    },
    {
      id: "mcq",
      title: "MCQ",
      icon: "/sidebar/quizzes.png",
      completed: false,
    },
    {
      id: "coding",
      title: "Coding Round",
      icon: "/sidebar/coding.png",
      completed: false,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar - Fixed Width */}
      <div className="hidden lg:flex flex-col bg-transparent dark:bg-transparent relative z-40 h-screen overflow-hidden w-72 shadow-sm pt-20">
        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6">
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.99 }}
                className="relative"
              >
                <NavLink
                  to={`/${item.id}`}
                  className={({ isActive }) =>
                    `relative flex items-center gap-4 px-2 py-3 text-[17px] font-light transition-all duration-300 ease-in-out
                     hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-0 
                     after:h-[1px] after:bg-current after:transition-all after:duration-300 after:ease-in-out 
                    ${
                      isActive
                        ? "after:w-full text-blue-600 font-medium"
                        : "after:w-0 text-gray-800 dark:text-gray-200 hover:text-blue-500"
                    }`
                  }
                >
                  {/* Bigger Sidebar Icon */}
                  <img
                    src={item.icon}
                    alt={item.title}
                    className="w-6 h-6 md:w-7 md:h-7 object-contain flex-shrink-0"
                    loading="lazy"
                  />

                  {/* Larger Sidebar Text */}
                  <span>{item.title}</span>
                </NavLink>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-gradient-to-b from-[#d2f0ff] to-[#b6e2f5] dark:from-[#1e293b] dark:to-[#0f172a] z-50 shadow-2xl pt-20"
      >
        <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Mobile Close Button - Fixed Position */}
      {mobileMenuOpen && (
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed top-6 right-6 z-[60] p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-700/50 transition-all duration-200"
        >
          <FiX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      )}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-transparent dark:bg-transparent backdrop-blur-xl border-r border-white/20 dark:border-gray-700/20 z-50 shadow-2xl pt-20"
            >
              {/* Mobile Content */}
              <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="space-y-2">
                  {menuItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      className="relative"
                    >
                      <NavLink
                        to={`/${item.id}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `relative flex items-center gap-4 px-2 py-3 text-[17px] font-light transition-all duration-300 ease-in-out
      hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-0 
      after:h-[1px] after:bg-current after:transition-all after:duration-300 after:ease-in-out 
      ${
        isActive
          ? "after:w-full text-blue-600 font-medium"
          : "after:w-0 text-gray-800 dark:text-gray-200 hover:text-blue-500"
      }`
                        }
                      >
                        {/* Bigger Sidebar Icon */}
                        <img
                          src={item.icon}
                          alt={item.title}
                          className="w-6 h-6 md:w-7 md:h-7 object-contain flex-shrink-0"
                          loading="lazy"
                        />

                        {/* Larger Sidebar Text */}
                        <span>{item.title}</span>
                      </NavLink>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
