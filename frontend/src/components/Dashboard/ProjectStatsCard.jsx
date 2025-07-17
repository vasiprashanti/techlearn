import React from "react";
import PropTypes from "prop-types";

const ProjectStatsCard = ({
  title = "",
  count = 0,
  icon = null,
  description = "",
  colorClass = "bg-gray-100 dark:bg-gray-700",
}) => {
  return (
    <div
      className={`p-6 rounded-2xl ${colorClass} transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center">
            <span className="text-3xl mr-3 dark:text-white">{icon}</span>
            <h3 className="text-xl md:text-2xl font-bold dark:text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {title}
            </h3>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm md:text-base" style={{ fontFamily: "system-ui, 'Inter', sans-serif" }}>
            {description}
          </p>
        </div>
        <span className="text-4xl md:text-5xl font-bold dark:text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {count}
        </span>
      </div>
    </div>
  );
};

ProjectStatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  icon: PropTypes.node,
  description: PropTypes.string,
  colorClass: PropTypes.string,
};

export default React.memo(ProjectStatsCard);