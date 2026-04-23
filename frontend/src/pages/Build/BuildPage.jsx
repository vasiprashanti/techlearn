import React, { useState } from "react";
import MiniProjectCard from "../../components/Build/MiniProjectCard";
import MajorProjectCard from "../../components/Build/MajorProjectCard";
import MidLevelProjectsAnimatedLayout from "../../components/Build/MidLevelProjectsAnimatedLayout";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import useMiniProjects from "../../hooks/useMiniProjects";
import useMidProjects from "../../hooks/useMidProjects";
import LoadingScreen from "../../components/Loader/Loader3D";
import useMajorProjects from "../../hooks/useMajorProjects";
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Dashboard/Sidebar';

const BuildPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [currentMiniProjectIndex, setCurrentMiniProjectIndex] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  
  const isDarkMode = theme === 'dark';
  const userInitial = user?.firstName?.charAt(0)?.toUpperCase() || 'S';

  const { miniProjects, loading, error } = useMiniProjects();
  const { midProjects, loading: loadingMid, error: errorMid } = useMidProjects();
  const { majorProjects, loading: loadingMajor, error: errorMajor } = useMajorProjects();

  const safeMidProjects = Array.isArray(midProjects) ? midProjects : [];
  const safeMajorProjects = Array.isArray(majorProjects) ? majorProjects : [];

  const allowedTitles = [
    "E-commerce Product Listing Page",
    "Data Visualization Dashboard",
    "Social Media Feed with API",
    "Expense Tracker with Analytics",
    "Recipe Finder App",
    "Machine Learning Predictor"
  ];

  let filteredProjects = safeMidProjects.filter(project => allowedTitles.includes(project.title));
  const mlIndex = filteredProjects.findIndex(p => p.title === "Machine Learning Predictor");
  if (mlIndex !== -1) {
    const [mlProject] = filteredProjects.splice(mlIndex, 1);
    filteredProjects.push(mlProject);
  }

  const processedMidProjects = filteredProjects;

  const handleMiniProjectsScroll = (e) => {
    const container = e.target;
    const scrollPosition = container.scrollLeft;
    const newIndex = Math.round(scrollPosition / window.innerWidth);

    const totalCards = miniProjects.filter(p =>
      ["Simple Calculator App", "Click Counter App", "Checklist App"].includes(p.title)
    ).length;

    setCurrentMiniProjectIndex(Math.min(totalCards - 1, Math.max(0, newIndex)));
  };

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
      {/* Unified Background */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />

      {/* Sidebar */}
      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main className={`flex-1 transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} pt-8 pb-12 px-6 md:px-12 lg:px-16 overflow-auto`}>
        <div className="max-w-[1600px] mx-auto space-y-8">
          
          {/* Header */}
          <header className="flex items-center justify-between pb-6 border-b border-black/5 dark:border-white/5 gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight text-[#3C83F6] dark:text-white truncate">
                Projects.
              </h1>
              <p className="text-[9px] sm:text-xs tracking-widest uppercase text-black/40 dark:text-white/40 mt-2 truncate">
                Build amazing projects
              </p>
            </div>

            <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0 relative z-50">
              <button onClick={toggleTheme} className="text-[10px] tracking-widest uppercase text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors whitespace-nowrap">
                {isDarkMode ? "Light" : "Dark"}
              </button>

              <div className="relative">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-sm font-medium tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-white/20 dark:border-black/20"
                >
                  {userInitial}
                </button>
                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-4 border-b border-black/5 dark:border-white/5 bg-gradient-to-br from-[#3C83F6]/5 to-[#2563eb]/5 dark:from-white/5 dark:to-gray-200/5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-lg font-medium tracking-wider shadow-md">
                            {userInitial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-black dark:text-white truncate">
                              {user?.firstName || 'Student'}
                            </h3>
                            <p className="text-xs text-black/60 dark:text-white/60 truncate">
                              {user?.email || 'student@techlearn.com'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <button onClick={() => { setProfileDropdownOpen(false); navigate('/profile'); }} className="w-full px-4 py-3 text-left text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-3 group">
                          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#3C83F6]/10 group-hover:text-[#3C83F6] dark:group-hover:bg-white/10 dark:group-hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </div>
                          <div>
                            <div className="font-medium">My Profile</div>
                            <div className="text-[10px] text-black/50 dark:text-white/50">Manage your account</div>
                          </div>
                        </button>
                        <div className="mx-4 my-2 h-px bg-black/10 dark:bg-white/10"></div>
                        <button onClick={() => { setProfileDropdownOpen(false); logout(); }} className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 group">
                          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          </div>
                          <div>
                            <div className="font-medium">Log Out</div>
                            <div className="text-[10px] text-red-500/70 dark:text-red-400/70">Sign out securely</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>
        </div>
        
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 pb-16" style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
      {/* Hero Section */}
      <div className="pt-0 md:pt-0">
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between min-h-screen px-1 sm:px-4">
          {/* Left: Headings */}
          <div className="flex-1 min-w-0">
            <h1
              className="
                brand-heading-primary hover-gradient-text
                mb-2 sm:mb-4 lowercase
                font-medium italic
                text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl truncate
              "
              style={{
                fontFamily: "'Poppins', sans-serif",
                lineHeight: 0.9,
                letterSpacing: '-0.05em'
              }}>
              build
            </h1>
            <h1
              className="
                brand-heading-primary hover-gradient-text
                mt-2 sm:mt-4 uppercase
                font-medium
                text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl truncate
              "
              style={{
                fontFamily: "'Poppins', sans-serif",
                lineHeight: 0.9,
                letterSpacing: '-0.05em'
              }}>
              PROJECTS
            </h1>
            <p
              className="
                mt-4 sm:mt-6 mb-3 sm:mb-6 hidden sm:block
                text-sm md:text-base lg:text-xl
                font-poppins text-gray-600 dark:text-gray-400 hover-gradient-text truncate
              "
              style={{ fontFamily: "system-ui, 'Inter', sans-serif"}}>
              Whoa! You're dangerously close to becoming a real coder
            </p>

            {/* Mobile GIF - now placed back below headings */}
            <div className="flex-shrink-0 flex items-center justify-center w-full mt-2 md:hidden">
              {/* Light mode GIF */}
              <img
                src="https://i.postimg.cc/k4MzD8PC/blue-cup-unscreen.gif"
                alt="Blue Cup"
                className="w-96 h-96 sm:w-[28rem] sm:h-[28rem] object-contain rounded-2xl block dark:hidden"
                style={{ background: "transparent" }}
              />
              {/* Dark mode GIF */}
              <img
                src="/blue_cup_light.gif"
                alt="Blue Cup Light"
                className="w-96 h-96 sm:w-[28rem] sm:h-[28rem] object-contain rounded-2xl hidden dark:block"
                style={{ background: "transparent" }}
              />
            </div>
          </div>

          {/* Desktop GIF - right side (unchanged) */}
          <div className="flex-shrink-0 flex items-center justify-center h-full ml-2 sm:ml-8 hidden md:flex">
            {/* Light mode GIF */}
            <img
              src="https://i.postimg.cc/k4MzD8PC/blue-cup-unscreen.gif"
              alt="Blue Cup"
              className="md:w-[350px] md:h-[350px] lg:w-[420px] lg:h-[420px] object-contain rounded-2xl block dark:hidden"
              style={{ background: "transparent" }}
            />
            {/* Dark mode GIF */}
            <img
              src="/blue_cup_light.gif"
              alt="Blue Cup Light"
              className="md:w-[350px] md:h-[350px] lg:w-[420px] lg:h-[420px] object-contain rounded-2xl hidden dark:block"
              style={{ background: "transparent" }}
            />
          </div>
        </div>
      </div>

      {/* Mini Projects Section */}
      <section className="mb-16 max-w-7xl mx-auto px-2 sm:px-4 md:px-8">
        <div style={{ marginBottom: "0.15rem" }}>
          <span
            className="
              brand-heading-primary hover-gradient-text italic
              text-3xl md:text-5xl font-semibold ml-2
            "
            style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
            mini
          </span>
          <span
            className="
              brand-heading-primary hover-gradient-text ml-2
              text-3xl md:text-5xl font-semibold
            "
            style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
            PROJECTS
          </span>
        </div>
        <div
          className="font-sans text-[0.9rem] md:text-[1.2rem] mb-12 mt-[0.1rem] text-gray-700 dark:text-gray-300 hover-gradient-text ml-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
          because crying over big ones is overrated
        </div>

        {loading ? (
          <LoadingScreen
            showMessage={false}
            fullScreen={false}
            size={40}
            duration={800}
          />
        ) : error ? (
          <p style={{ color: "#dc2626" }}>Error: {error}</p>
        ) : (
          <div className="relative">
            {/* Mobile: Full-width single card container */}
            <div
              className="flex flex-nowrap overflow-x-auto pb-2 sm:grid sm:grid-cols-2 md:grid-cols-3 sm:gap-6 sm:overflow-x-visible scrollbar-hide mini-projects-container"
              onScroll={handleMiniProjectsScroll}
              style={{
                scrollSnapType: 'x mandatory',
              }}
            >
              {Array.isArray(miniProjects) &&
                miniProjects
                  .filter((project) =>
                    ["Simple Calculator App", "Click Counter App", "Checklist App"].includes(project.title)
                  )
                  .map((project, index) => (
                    <div
                      key={project._id}
                      className="flex-shrink-0 w-full px-4 sm:w-auto sm:px-0"
                      style={{
                        scrollSnapAlign: 'center',
                      }}
                      data-index={index}
                    >
                      <div className="w-full max-w-[180px] mx-auto sm:max-w-none">
                        <MiniProjectCard project={project} />
                      </div>
                    </div>
                  ))}
            </div>

            {/* Indicator dots - mobile only */}
            <div className="flex justify-center gap-2 mt-4 md:hidden">
              {miniProjects
                .filter(project => ["Simple Calculator App", "Click Counter App", "Checklist App"].includes(project.title))
                .map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const container = document.querySelector('.mini-projects-container');
                      if (container) {
                        container.scrollTo({
                          left: index * container.offsetWidth,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentMiniProjectIndex === index
                        ? 'bg-blue-600 dark:bg-blue-400 w-3'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    aria-label={`View project ${index + 1}`}
                  />
                ))}
            </div>
          </div>
        )}
      </section>

      {/* Mid-Level Projects Section */}
      <section className="mb-16">
        <div className="block md:hidden" style={{ height: "80px" }} />
        <div style={{ marginBottom: "0.15rem" }}>
          <span
            className="
              brand-heading-primary hover-gradient-text italic
              text-3xl md:text-5xl font-semibold lg:ml-8 ml-2
            "
            style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
            mid
          </span>
          <span
            className="
              brand-heading-primary hover-gradient-text ml-2
              text-3xl md:text-5xl font-semibold
            "
            style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
            PROJECTS
          </span>
        </div>
        <div
          className="font-sans text-[0.9rem] md:text-[1.2rem] mb-12 mt-[0.1rem] text-gray-700 dark:text-gray-300 hover-gradient-text lg:ml-8 ml-2"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
          for when you want to flex a little harder
        </div>

        {loadingMid ? (
          <LoadingScreen
            showMessage={false}
            fullScreen={false}
            size={40}
            duration={800}
          />
        ) : errorMid ? (
          <p style={{ color: "#dc2626" }}>Error: {errorMid}</p>
        ) : (
          <MidLevelProjectsAnimatedLayout
            projects={processedMidProjects}
            setShowPopup={setShowPopup}/>
        )}
      </section>

      {/* Major Projects Section */}
{/* <section className="mb-12">
        <div className="block md:hidden" style={{ height: "80px" }} />
        <div style={{ marginBottom: "0.15rem" }}>
          <span
            className="
              brand-heading-primary hover-gradient-text italic
              text-3xl md:text-5xl font-semibold
            "
            style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
            major
          </span>
          <span
            className="
              brand-heading-primary hover-gradient-text ml-2
              text-3xl md:text-5xl font-semibold
            "
            style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
            PROJECTS
          </span>
        </div>
        <div
          className="font-sans text-[0.9rem] md:text-[1.2rem] mb-12 mt-[0.1rem] text-gray-700 dark:text-gray-300 hover-gradient-text"
          style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
          for the ultimate show-off
        </div>
        {loadingMajor ? (
          <LoadingScreen
            showMessage={false}
            fullScreen={false}
            size={40}
            duration={800}
          />
        ) : errorMajor ? (
          <p style={{ color: "#dc2626" }}>Error: {errorMajor}</p>
        ) : (
          <>
            <div
              className="hidden md:grid grid-cols-2 gap-10 w-full max-w-5xl mx-auto"
              style={{ minHeight: "740px" }}>
              <div className="flex flex-col justify-between h-full gap-10">
                {safeMajorProjects[0] && (
                  <MajorProjectCard project={safeMajorProjects[0]} />
                )}
                {safeMajorProjects[1] && (
                  <MajorProjectCard project={safeMajorProjects[1]} />
                )}
              </div>
              <div className="flex flex-col justify-center h-full">
                {safeMajorProjects[2] && (
                  <MajorProjectCard project={safeMajorProjects[2]} />
                )}
              </div>
            </div>
            <div className="md:hidden flex flex-col gap-8 w-full max-w-5xl mx-auto">
              {safeMajorProjects.map((project) => (
                <MajorProjectCard key={project._id} project={project} />
              ))}
            </div>
          </>
        )}
      </section> */}

      {/* Design Lab Section */}
      <section className="mt-20 md:mt-14 py-10">
        <div className="block md:hidden" style={{ height: "80px" }} />
        {/* Heading */}
        <div className="mb-10 px-0">
          <span
            className="
              brand-heading-primary hover-gradient-text italic
              text-3xl md:text-5xl font-semibold lg:ml-8 ml-2
            "
            style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
            design
          </span>
          <span
            className="
              brand-heading-primary hover-gradient-text ml-2
              text-3xl md:text-5xl font-semibold
            "
            style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
            LAB
          </span>
        </div>

        {/* Three Marquee Rows */}
        <div className="overflow-hidden w-full space-y-6">
          {/* Row 1: Right to Left */}
          <div className="flex whitespace-nowrap animate-marquee-rtl gap-4">
            {[
              "Cards", "Loaders", "Forms", "Buttons", "3D Buttons", "Hover Buttons", "Inputs"
            ].concat([
              "Cards", "Loaders", "Forms", "Buttons", "3D Buttons", "Hover Buttons", "Inputs"
            ]).map((label, idx) => (
              <div
                key={label + idx}
                className="flex items-center justify-center px-8 py-3 rounded-full bg-white/60 text-[#0600a6] text-base font-semibold min-w-[120px] max-w-xs truncate"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Row 2: Left to Right */}
          <div className="flex whitespace-nowrap animate-marquee-ltr gap-4">
            {[
              "Checkboxes", "Toggles", "Tooltips", "Alerts", "Badges", "Pagination", "Tabs"
            ].concat([
              "Checkboxes", "Toggles", "Tooltips", "Alerts", "Badges", "Pagination", "Tabs"
            ]).map((label, idx) => (
              <div
                key={label + idx}
                className="flex items-center justify-center px-8 py-3 rounded-full bg-white/60 text-[#0600a6] text-base font-semibold min-w-[120px] max-w-xs truncate"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Row 3: Right to Left */}
          <div className="flex whitespace-nowrap animate-marquee-rtl gap-4">
            {[
              "Sliders", "Modals", "Dropdowns", "Accordions", "Carousels", "Progress Bars", "Toolbars"
            ].concat([
              "Sliders", "Modals", "Dropdowns", "Accordions", "Carousels", "Progress Bars", "Toolbars"
            ]).map((label, idx) => (
              <div
                key={label + idx}
                className="flex items-center justify-center px-8 py-3 rounded-full bg-white/60 text-[#0600a6] text-base font-semibold min-w-[120px] max-w-xs truncate"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <AccessPopup open={showPopup} onClose={() => setShowPopup(false)} />
        </div>
      </main>
    </div>
  );
};

export default BuildPage;
