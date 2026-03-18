import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../../components/Loader/Loader3D";
import ProjectStatsCard from "../../components/Dashboard/ProjectStatsCard";
import RecentProjectCard from "../../components/Dashboard/RecentProjectCard";

const BASE_URL = import.meta.env.VITE_API_URL;

const ProjectsDashboard = () => {
  const [projectsData, setProjectsData] = useState({
    miniProjects: [],
    midProjects: [],
    majorProjects: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No authentication token found");

        const response = await fetch(`${BASE_URL}/dashboard/projects`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch projects");

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

  const getRecentProjects = () => {
    const recentMini = [...projectsData.miniProjects].slice(0, 3);
    const recentMid = [...projectsData.midProjects].slice(0, 3);
    const recentMajor = [...projectsData.majorProjects].slice(0, 3);
    
    return [...recentMini, ...recentMid, ...recentMajor]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);
  };

  if (loading) {
    return <LoadingScreen showMessage={false} fullScreen={true} size={40} duration={800} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="border border-black/10 dark:border-white/10 p-8 text-center">
          <p className="text-xs uppercase tracking-widest text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-[1400px] mx-auto px-8 md:px-16 pt-28 pb-20 font-sans antialiased">
      <section className="mb-24">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-black dark:text-white">
            Projects.
          </h1>
          <div className="h-[1px] w-full bg-black/5 dark:bg-white/5 mt-8"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProjectStatsCard 
            title="Mini" 
            count={projectsData.miniProjects.length} 
            icon=""
            description="Foundations"
            colorClass="bg-transparent border border-black/10 dark:border-white/10 text-black dark:text-white"
          />
          <ProjectStatsCard 
            title="Mid" 
            count={projectsData.midProjects.length} 
            icon=""
            description="Architecture"
            colorClass="bg-transparent border border-black/10 dark:border-white/10 text-black dark:text-white"
          />
          <ProjectStatsCard 
            title="Major" 
            count={projectsData.majorProjects.length} 
            icon=""
            description="Showcase"
            colorClass="bg-black dark:bg-white text-white dark:text-black border-none"
          />
        </div>
      </section>

      <section className="mb-16">
        <div className="flex justify-between items-end border-b border-black/5 dark:border-white/5 pb-4 mb-8">
          <h2 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50">
            Recent Builds
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {getRecentProjects().map((project) => (
            <div className="group cursor-pointer" key={project._id} onClick={() => navigate(`/projects/${project._id}`)}>
              <RecentProjectCard project={project} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default ProjectsDashboard;