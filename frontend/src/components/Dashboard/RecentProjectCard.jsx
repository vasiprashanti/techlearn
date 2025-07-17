import React from "react";
import PropTypes from "prop-types";

const RecentProjectCard = ({ project, onClick }) => {
  const getTypeIcon = React.useMemo(() => {
    switch (project.type) {
      case 'mini': return '📦';
      case 'mid': return '🏗️';
      default: return '🚀';
    }
  }, [project.type]);

  const getTypeStyle = (type) => {
    const styles = {
      mini: { 
        background: 'rgba(59, 130, 246, 0.1)', 
        color: '#3b82f6',
        darkBackground: 'rgba(59, 130, 246, 0.2)',
        darkColor: '#93c5fd'
      },
      mid: { 
        background: 'rgba(168, 85, 247, 0.1)', 
        color: '#a855f7',
        darkBackground: 'rgba(168, 85, 247, 0.2)',
        darkColor: '#c4b5fd'
      },
      large: { 
        background: 'rgba(16, 185, 129, 0.1)', 
        color: '#10b981',
        darkBackground: 'rgba(16, 185, 129, 0.2)',
        darkColor: '#6ee7b7'
      },
    };
    return styles[type] || styles.large;
  };

  const typeStyle = getTypeStyle(project.type);
  const formattedDate = project.updatedAt
    ? new Date(project.updatedAt).toLocaleDateString()
    : 'Unknown';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all cursor-pointer h-full hover:scale-[1.02] hover:shadow-lg"
    >
      <div className="flex items-center mb-3">
        <span className="text-2xl mr-3 dark:text-white">{getTypeIcon}</span>
        <span
          className="text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wider"
          style={{
            backgroundColor: typeStyle.background,
            color: typeStyle.color,
            '--tw-dark-bg': typeStyle.darkBackground,
            '--tw-dark-text': typeStyle.darkColor
          }}
          dark="[color:var(--tw-dark-text)] [background-color:var(--tw-dark-bg)]"
        >
          {project.type}
        </span>
      </div>
      <h3 className="text-lg font-bold mb-2 dark:text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {project.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2" style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
        {project.description || 'No description provided'}
      </p>
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Last updated: {formattedDate}
      </div>
    </div>
  );
};

RecentProjectCard.propTypes = {
  project: PropTypes.shape({
    type: PropTypes.oneOf(['mini', 'mid', 'large']).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    updatedAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default React.memo(RecentProjectCard);