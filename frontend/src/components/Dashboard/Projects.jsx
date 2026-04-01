import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FiLayout, FiLayers, FiStar, FiChevronRight, FiTerminal, FiDatabase, FiCheckSquare, FiPieChart, FiClock } from 'react-icons/fi';

export default function Projects() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const isDarkMode = theme === 'dark';
  const userInitial = user?.firstName?.charAt(0)?.toUpperCase() || 'S';
  const userName = user?.firstName ? user.firstName : 'Student';

  const projectStats = [
    { title: "Mini", subtitle: "Foundations", count: 3, icon: <FiLayout className="w-5 h-5" /> },
    { title: "Mid", subtitle: "Architecture", count: 6, icon: <FiLayers className="w-5 h-5" /> },
    { title: "Major", subtitle: "Showcase", count: 0, icon: <FiStar className="w-5 h-5" /> },
  ];

  const recentBuilds = [
    {
      title: "Simple Calculator App",
      description: "Build a functional calculator with basic arithmetic operations using HTML, CSS, and JavaScript.",
      updated: "2 days ago",
      topic: "Logic",
      icon: <FiTerminal className="w-5 h-5 text-[#3C83F6] dark:text-white" />
    },
    {
      title: "Click Counter App",
      description: "Build a super-simple app that counts how many times the user clicks anywhere on the page.",
      updated: "1 week ago",
      topic: "State",
      icon: <FiDatabase className="w-5 h-5 text-[#3C83F6] dark:text-white" />
    },
    {
      title: "Checklist App",
      description: "Create a checklist web app where users can add, complete, and delete tasks.",
      updated: "2 weeks ago",
      topic: "CRUD",
      icon: <FiCheckSquare className="w-5 h-5 text-[#3C83F6] dark:text-white" />
    },
    {
      title: "Data Visualization Dashboard",
      description: "Interactive dashboard for data visualization and analysis.",
      updated: "1 month ago",
      topic: "Architecture",
      icon: <FiPieChart className="w-5 h-5 text-[#3C83F6] dark:text-white" />
    }
  ];

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
      {/* Unified Background */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main className={`flex-1 transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} pt-8 pb-12 px-6 md:px-12 lg:px-16 overflow-auto`}>
        <div className="max-w-[1600px] mx-auto space-y-8">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-black/5 dark:border-white/5 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-[#3C83F6] dark:text-white">
                My Projects.
              </h1>
              <p className="text-xs tracking-widest uppercase text-black/40 dark:text-white/40 mt-2">
                Portfolio Builder
              </p>
            </div>

            {/* Right Side Header Controls */}
            <div className="flex items-center gap-6 self-end md:self-auto relative z-50">
              <button onClick={toggleTheme} className="text-[10px] tracking-widest uppercase text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors">
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
                              {userName}
                            </h3>
                            <p className="text-xs text-black/60 dark:text-white/60 truncate">
                              {user?.email || 'student@techlearn.com'}
                            </p>
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#3C83F6]/10 text-[#3C83F6] dark:bg-white/10 dark:text-white border border-[#3C83F6]/20 dark:border-white/20">
                                Student
                              </span>
                            </div>
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

          {/* Project Stats Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projectStats.map((stat, i) => (
              <div key={i} className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 flex flex-col justify-between hover:bg-white/60 dark:hover:bg-black/60 transition-all duration-300 rounded-2xl min-h-[180px] group">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 group-hover:text-black dark:group-hover:text-white transition-colors">
                    {stat.title} Level
                  </span>
                  <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/40 dark:text-white/40 group-hover:text-[#3C83F6] dark:group-hover:text-white transition-colors">
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-6 flex flex-col">
                  <span className="text-5xl font-light tracking-tighter text-[#3C83F6] dark:text-white mb-2">
                    {stat.count}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40">
                    {stat.subtitle} Builds
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Builds List */}
          <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-2xl flex flex-col">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50">
                Recent Builds
              </h3>
              <button className="text-[10px] font-medium text-[#3C83F6] dark:text-blue-400 hover:underline tracking-widest uppercase">
                View Repository
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentBuilds.map((project, i) => (
                <div key={i} className="group p-8 bg-white/20 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-black/40 border border-black/5 dark:border-white/5 transition-all duration-500 rounded-2xl cursor-pointer flex flex-col justify-between min-h-[240px] relative overflow-hidden">
                  
                  {/* Subtle hover gradient decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3C83F6]/5 to-transparent dark:from-white/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 rounded-xl bg-white/50 dark:bg-black/50 border border-black/5 dark:border-white/5 shadow-sm group-hover:scale-110 transition-transform duration-500">
                        {project.icon}
                      </div>
                      <span className="text-[9px] uppercase tracking-widest px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full text-black/60 dark:text-white/60 font-medium">
                        {project.topic}
                      </span>
                    </div>
                    <h4 className="text-xl font-medium text-black dark:text-white group-hover:text-[#3C83F6] transition-colors mb-3">
                      {project.title}
                    </h4>
                    <p className="text-sm text-black/50 dark:text-white/50 leading-relaxed line-clamp-2 font-light">
                      {project.description}
                    </p>
                  </div>
                  
                  <div className="relative z-10 flex items-center justify-between mt-8 pt-5 border-t border-black/5 dark:border-white/5">
                    <span className="flex items-center gap-2 text-[10px] text-black/40 dark:text-white/40 uppercase tracking-widest">
                      <FiClock className="w-3 h-3" /> {project.updated}
                    </span>
                    <FiChevronRight className="w-5 h-5 text-black/20 dark:text-white/20 group-hover:text-[#3C83F6] dark:group-hover:text-white transition-all duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}