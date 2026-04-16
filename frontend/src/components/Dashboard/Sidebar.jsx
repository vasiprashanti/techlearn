import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiAward,
  FiBarChart2,
  FiBook,
  FiBookOpen,
  FiCpu,
  FiDatabase,
  FiFileText,
  FiGrid,
  FiHome,
  FiMap,
  FiMenu,
  FiSettings,
  FiUser,
  FiX,
  FiZap,
  FiBriefcase,
} from "react-icons/fi";

const Sidebar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = useMemo(
    () => [
      {
        title: "MAIN",
        items: [
          { to: "/dashboard", label: "Dashboard", icon: FiHome, end: true },
          { to: "/dashboard/daily-challenge", label: "Daily Challenge", icon: FiZap },
          { to: "/dashboard/roadmap", label: "Roadmap", icon: FiMap },
          { to: "/dashboard/practice", label: "Practice", icon: FiGrid },
        ],
      },
      {
        title: "PRACTICE",
        items: [
          { to: "/dashboard/practice/core-cs", label: "Core CS", icon: FiCpu },
          { to: "/dashboard/practice/sql", label: "SQL Practice", icon: FiDatabase },
          { to: "/dashboard/practice/dsa", label: "DSA Practice", icon: FiAward },
          {
            to: "/dashboard/practice/company-based",
            label: "Company-Based Questions",
            icon: FiBriefcase,
          },
        ],
      },
      {
        title: "PERFORMANCE",
        items: [
          { to: "/dashboard/performance", label: "Performance", icon: FiBarChart2 },
          { to: "/dashboard/leaderboard", label: "Leaderboard", icon: FiAward },
        ],
      },
      {
        title: "RESOURCES",
        items: [
          {
            to: "/dashboard/resources/free-courses",
            label: "Free Courses",
            icon: FiBookOpen,
          },
          {
            to: "/dashboard/resources/important-concepts",
            label: "Important Concepts",
            icon: FiBook,
          },
          {
            to: "/dashboard/resources/free-certifications",
            label: "Free Certifications",
            icon: FiAward,
          },
          {
            to: "/dashboard/resources/resume-templates",
            label: "Resume Templates",
            icon: FiFileText,
          },
        ],
      },
      {
        title: "ACCOUNT",
        items: [
          {
            to: "/dashboard/account/profile-analytics",
            label: "Profile & Analytics",
            icon: FiUser,
          },
          {
            to: "/dashboard/account/settings",
            label: "Settings",
            icon: FiSettings,
          },
        ],
      },
    ],
    [],
  );

  const NavItem = ({ item, onClick }) => {
    const Icon = item.icon;

    return (
      <motion.div
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.99 }}
        className="relative"
      >
        <NavLink
          to={item.to}
          end={item.end}
          onClick={onClick}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors
            ${
              isActive
                ? "bg-blue-600/10 text-blue-700 dark:text-blue-200"
                : "text-slate-700 hover:bg-white/40 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-blue-200"
            }`
          }
        >
          <Icon className="h-4 w-4 shrink-0 opacity-90" />
          <span className="font-medium">{item.label}</span>
        </NavLink>
      </motion.div>
    );
  };

  const SidebarContent = ({ onItemClick }) => (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8 pt-6">
      {sections.map((section) => (
        <div key={section.title} className="mb-6">
          <div className="px-2 text-[11px] font-semibold tracking-widest text-slate-500 dark:text-slate-400">
            {section.title}
          </div>
          <div className="mt-2 space-y-1">
            {section.items.map((item) => (
              <NavItem key={item.to} item={item} onClick={onItemClick} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex h-screen w-72 shrink-0 flex-col border-r border-white/20 bg-white/10 pt-20 backdrop-blur-xl dark:border-gray-700/20 dark:bg-black/10">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 rounded-lg bg-white/70 p-2 shadow-md backdrop-blur-xl dark:bg-gray-800/70"
      >
        <FiMenu className="h-5 w-5 text-gray-700 dark:text-gray-200" />
      </button>

      {/* Mobile Close Button */}
      {mobileMenuOpen && (
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed top-6 right-6 z-[60] rounded-lg bg-white/70 p-2 shadow-md backdrop-blur-xl dark:bg-gray-800/70"
        >
          <FiX className="h-5 w-5 text-gray-700 dark:text-gray-200" />
        </button>
      )}

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-80 border-r border-white/20 bg-white/85 pt-20 shadow-2xl backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-950/70"
            >
              <SidebarContent onItemClick={() => setMobileMenuOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
