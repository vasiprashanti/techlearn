import React from "react";
import { useNavigate } from "react-router-dom";

const MiniProjectCard = ({ project }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center mx-3">
      <div
        className="
          bg-[#e8ebf0] dark:bg-slate-800 rounded-2xl shadow hover:shadow-lg transition cursor-pointer
          flex items-center justify-center
          w-[180px] h-[200px]        // Mobile size
          sm:w-[180px] sm:h-[220px]  // Small screen
          md:w-[220px] md:h-[280px]  // Desktop size
        "
        style={{
          boxSizing: "border-box",
          overflow: "hidden",
        }}
        onClick={() => navigate(`/build/mini/${project._id}`)}
      >
        <img
          src={project.image}
          alt={project.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
      {/* Title */}
      <div className="px-4 flex flex-col items-center text-center w-full mt-4">
        <h3
          className="mb-1 leading-tight text-black dark:text-white w-full text-center text-[0.85rem] md:text-[1.1rem]"
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 480,
          }}
        >
          {project.title}
        </h3>
      </div>
    </div>
  );
};

export default MiniProjectCard;
