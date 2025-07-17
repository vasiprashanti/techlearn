import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../../components/Loader/Loader3D";
import ProjectStatsCard from "../../components/Dashboard/ProjectStatsCard";
import RecentProjectCard from "../../components/Dashboard/RecentProjectCard";

const ProjectsDashboard = () => {
  const [projectsData, setProjectsData] = useState({
    miniProjects: [],
    midProjects: [],
    majorProjects: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // ==============================================
  // BACKEND CONNECTION - FETCHING ALL PROJECTS
  // Uses the endpoint you provided initially:
  // GET https://tl-final.onrender.com/api/dashboard/projects
  // ==============================================
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "https://tl-final.onrender.com/api/dashboard/projects",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }

        const data = await response.json();
        setProjectsData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // ==============================================
  // RECENT PROJECTS LOGIC 
  // Uses the projectsData from backend to:
  // 1. Take first 3 projects from each category
  // 2. Combine and sort by creation date (newest first)
  // 3. Return top 4 most recent projects
  // ==============================================
  const getRecentProjects = () => {
    const recentMini = [...projectsData.miniProjects].slice(0, 3);
    const recentMid = [...projectsData.midProjects].slice(0, 3);
    const recentMajor = [...projectsData.majorProjects].slice(0, 3);
    
    return [...recentMini, ...recentMid, ...recentMajor]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);
  };

  if (loading) {
    return <LoadingScreen showMessage={true} fullScreen={true} size={40} duration={800} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600 text-xl">Error: {error}</p>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-2 sm:px-4 pt-20 md:px-8 pb-16" style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
      {/* Hero Section */}
      <div className="block md:hidden" style={{ height: "120px" }} />
      {/*<div className="pt-0 md:pt-0">
        <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between min-h-screen px-1 sm:px-4">
        
          <div className="flex-1">
            <h1
              className="
                brand-heading-primary hover-gradient-text
                mb-2 md:mb-4 lowercase leading-none
                font-medium italic
                text-5xl sm:text-5xl md:text-7xl md:text-9xl
              "
              style={{ fontFamily: "'Poppins', sans-serif", lineHeight: 1 }}>
              your
            </h1>
            <h1
              className="
                brand-heading-primary hover-gradient-text
                mt-2 md:mt-4 uppercase leading-none
                font-medium tracking-wide
                text-6xl sm:text-6xl md:text-8xl md:text-[10rem]
              "
              style={{ fontFamily: "'Poppins', sans-serif", lineHeight: 1 }}>
              PROJECTS
            </h1>
            <p
              className="
                mt-6 mb-3 sm:mb-6 text-base md:text-2xl lg:text-3xl
                font-poppins text-gray-700 dark:text-gray-300 hover-gradient-text
              "
              style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
              Everything you need in one place
            </p>
          </div>
        </div>
      </div> */}

      {/* Stats Overview Section */}
      <section className="mb-16">
        <div style={{ marginBottom: "0.15rem" }}>
          <span
            className="
              brand-heading-primary hover-gradient-text italic
              text-3xl md:text-5xl font-semibold
            "
            style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
            project
          </span>
          <span
            className="
              brand-heading-primary hover-gradient-text ml-2
              text-3xl md:text-5xl font-semibold
            "
            style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
            STATS
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <ProjectStatsCard 
            title="Mini Projects" 
            count={projectsData.miniProjects.length} 
            icon="📦"
            description="Quick wins and small challenges"
            colorClass="bg-blue-100 dark:bg-blue-900"
          />
          <ProjectStatsCard 
            title="Mid Projects" 
            count={projectsData.midProjects.length} 
            icon="🏗️"
            description="Intermediate level builds"
            colorClass="bg-purple-100 dark:bg-purple-900"
          />
          <ProjectStatsCard 
            title="Major Projects" 
            count={projectsData.majorProjects.length} 
            icon="🚀"
            description="Showcase-worthy work"
            colorClass="bg-green-100 dark:bg-green-900"
          />
        </div>
      </section>

      {/* ============================================== */}
      {/* RECENT PROJECTS SECTION - FULLY FUNCTIONAL */}
      {/* Uses the getRecentProjects() function defined above */}
      {/* ============================================== */}
      <section className="mb-16">
        <div style={{ marginBottom: "0.15rem" }}>
          <span
            className="
              brand-heading-primary hover-gradient-text italic
              text-3xl md:text-5xl font-semibold
            "
            style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
            recent
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {getRecentProjects().map((project) => (
            <RecentProjectCard 
              key={project._id} 
              project={project} 
              onClick={() => navigate(`/projects/${project._id}`)}
            />
          ))}
        </div>
      </section>
    </main>
  );
};

export default ProjectsDashboard;