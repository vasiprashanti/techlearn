import React from "react";

const MajorProjectCard = ({ project, onAccess }) => {
  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700 mb-2"
        style={{
          width: "420px",
          height: "420px",
          maxWidth: "100%",
          margin: "1rem auto",
        }}>
        <img
          src="/major_background.png"
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-300"/>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <div className="absolute inset-0 bg-white/60 dark:bg-[#001233]/60 backdrop-blur-[4px]"></div>
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className="text-xl md:text-2xl font-bold text-[#001233] dark:text-white drop-shadow-lg text-center">
              Coming Soon...<br />Stay Tuned!
            </span>
          </div>
        </div>
      </div>
      <div className="w-full text-center">
        <h3
          className="leading-tight text-black dark:text-white w-full text-center text-lg md:text-1.3xl"
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 480,
          }}>
          {project.title}
        </h3>

      </div>
    </div>
  );
};

export default MajorProjectCard;
