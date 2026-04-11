import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from './Sidebar';
import { FiLayout, FiLayers, FiStar, FiChevronRight, FiTerminal, FiDatabase, FiCheckSquare, FiPieChart, FiClock } from 'react-icons/fi';

export default function Projects() {
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const isDarkMode = theme === 'dark';

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

      <main className={`flex-1 transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} pt-24 pb-12 px-6 md:px-12 lg:px-16 overflow-auto`}>
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