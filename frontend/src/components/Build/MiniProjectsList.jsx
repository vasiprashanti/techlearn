import React from 'react';
import useMiniProjects from '../../hooks/useMiniProjects';
import MiniProjectCard from './MiniProjectCard';

export default function MiniProjectsList() {
  const { projects, loading, error } = useMiniProjects();

  if (loading) return <p className="text-gray-500">Loading mini projects…</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <MiniProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
