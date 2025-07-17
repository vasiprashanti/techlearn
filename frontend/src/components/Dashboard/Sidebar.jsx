import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiCheckCircle, FiX, FiMenu } from 'react-icons/fi';

const Sidebar = ({ onToggle }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleToggleSidebar = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    onToggle(newCollapsed);
  };

  const menuItems = [
    { id: 'profile', title: 'Profile', description: 'Your profile settings', completed: false },
    { id: 'learn/courses', title: 'Courses', description: 'View your courses', completed: false },
    { id: 'learn/exercises', title: 'Exercises', description: 'Practice exercises', completed: false },
    { id: 'projects', title: 'Projects', description: 'Your projects', completed: false},
    { id: 'dashboard', title: 'Dashboard', description: 'Progress dashboard', completed: true },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: sidebarCollapsed ? "90px" : "280px",
          transition: { duration: 0.3, ease: "easeInOut" }
        }}
        className="hidden lg:flex flex-col bg-white/20 dark:bg-gray-900/40 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/20 relative z-40"
      >
        {/* Clickable Logo */}
       {/* Sidebar Logo */}
<div className="flex flex-col items-center justify-center pt-6 pb-4 border-b border-white/10 dark:border-gray-700/20">
  <Link to="/" className="cursor-pointer block relative h-16 w-auto">
    {/* Light Mode Logo */}
    <img
      src="/logoo.png"
      alt="Logo Light"
      className="h-16 w-auto dark:hidden"
    />
    {/* Dark Mode Logo */}
    <img
      src="/logoo2.png"
      alt="Logo Dark"
      className="h-16 w-auto hidden dark:block"
    />
  </Link>
</div>




        {/* Sidebar Toggle */}
        <div className="p-4 border-b border-white/10 dark:border-gray-700/20 pt-10 relative z-50">
          <div className="flex items-center justify-end relative z-50">
            <button
              type="button"
              onClick={handleToggleSidebar}
              onMouseDown={(e) => {
                console.log('Mouse down on toggle button');
                e.preventDefault();
              }}
              className="p-3 rounded-lg bg-blue-500/20 dark:bg-blue-600/20 hover:bg-blue-500/30 dark:hover:bg-blue-600/30 transition-all duration-200 border-2 border-blue-500/50 dark:border-blue-400/50 flex-shrink-0 cursor-pointer z-[60] relative shadow-lg active:scale-95"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <FiChevronRight className="w-3 h-3 text-blue-700 dark:text-blue-300" />
              ) : (
                <FiChevronLeft className="w-3 h-3 text-blue-700 dark:text-blue-300" />
              )}
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => {}}
                whileHover={{ scale: sidebarCollapsed ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative w-full text-left rounded-xl transition-all duration-300 ${
                  item.completed
                    ? 'bg-green-500/20 border-2 border-green-500/50 text-green-700 dark:text-green-300 shadow-lg'
                    : 'bg-white/40 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/60 dark:hover:bg-gray-700/50 hover:shadow-md'
                } ${sidebarCollapsed ? 'p-3 mx-1' : 'p-4'}`}
              >
                <NavLink
                  to={`/${item.id}`}
                  className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}
                >
                  <div className={`${sidebarCollapsed ? 'w-10 h-8' : 'w-8 h-8'} rounded-lg flex items-center justify-center ${
                    item.completed ? 'bg-green-500 shadow-sm' : 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 shadow-sm'
                  } ${sidebarCollapsed ? 'border border-white/10 dark:border-gray-500/20' : ''}`}>
                    {item.completed ? (
                      <FiCheckCircle className={`${sidebarCollapsed ? 'w-4 h-4' : 'w-4 h-4'} text-white`} />
                    ) : (
                      <span className={`${sidebarCollapsed ? 'text-sm' : 'text-xs'} font-bold ${
                        sidebarCollapsed ? 'text-gray-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        {index + 1}
                      </span>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    {!sidebarCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 min-w-0"
                      >
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1 truncate">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {item.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </NavLink>

                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.title}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-24 left-4 z-40 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/20 shadow-lg"
      >
        <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

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
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/20 z-50"
            >
              {/* Mobile Header */}
              <div className="p-4 border-b border-white/10 dark:border-gray-700/20 pt-6">
                <div className="flex items-center justify-between">
                  <Link to="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                    <img 
                      src="/logoo.png"
                      alt="Logo"
                      className="h-16 w-auto dark:hidden"
                    />
                    <img 
                      src="/logoo2.png"
                      alt="Logo"
                      className="h-16 w-auto hidden dark:block"
                    />
                  </Link>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-700/50 transition-all duration-200"
                  >
                    <FiX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              
              {/* Mobile Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {menuItems.map((item, index) => (
                    <NavLink
                      key={item.id}
                      to={`/${item.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block w-full text-left p-4 rounded-xl transition-all duration-300 ${
                        item.completed
                          ? 'bg-green-500/20 border-2 border-green-500/50 text-green-700 dark:text-green-300 shadow-lg'
                          : 'bg-white/40 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/60 dark:hover:bg-gray-700/50 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 shadow-sm">
                          {item.completed ? (
                            <FiCheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </NavLink>
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
