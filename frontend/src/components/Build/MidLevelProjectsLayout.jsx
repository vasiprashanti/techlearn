import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import MidProjectCard from "./MidProjectCard";

const MidLevelProjectsLayout = ({ projects, setShowPopup }) => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });

  const translateY = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <div className="w-full">
      {/* Desktop Layout (3 columns) */}
      <div className="hidden lg:flex min-h-[80vh] w-full max-w-5xl mx-auto">
        {/* Left Column (Fixed) */}
        <div className="w-1/4 sticky top-28 h-fit self-start bg-white dark:bg-slate-800 rounded-2xl shadow p-6 mr-6">
          <h2 className="text-lg font-bold mb-4 text-[#001233] dark:text-white">
            Project Categories
          </h2>
          <ul className="space-y-3">
            <li className="text-[#001233] dark:text-[#e0e6f5]">Web Development</li>
            <li className="text-[#001233] dark:text-[#e0e6f5]">Data Science</li>
            <li className="text-[#001233] dark:text-[#e0e6f5]">Mobile Apps</li>
            <li className="text-[#001233] dark:text-[#e0e6f5]">UI/UX Design</li>
          </ul>
        </div>

        {/* Middle Column (Scroll-Animated) */}
        <div ref={targetRef} className="flex-1 flex flex-col gap-16">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              style={{ y: translateY }}
              className="rounded-2xl">
              <MidProjectCard project={project} setShowPopup={setShowPopup} index={i} />
            </motion.div>
          ))}
        </div>

        {/* Right Column (Fixed) */}
        <div className="w-1/4 sticky top-28 h-fit self-start bg-white dark:bg-slate-800 rounded-2xl shadow p-6 ml-6">
          <h2 className="text-lg font-bold mb-4 text-[#001233] dark:text-white">
            Project Details
          </h2>
          <p className="text-[#001233] dark:text-[#e0e6f5]">
            Select a project to view detailed requirements, technology stack, and learning outcomes.
          </p>
          <div className="mt-6">
            <h3 className="font-semibold text-[#001233] dark:text-[#e0e6f5] mb-2">Membership Benefits</h3>
            <ul className="list-disc pl-5 text-[#001233] dark:text-[#e0e6f5]">
              <li>Access to all projects</li>
              <li>Priority support</li>
              <li>Exclusive resources</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mobile Layout (2 cards per row) */}
      <div className="lg:hidden grid grid-cols-2 gap-12 px-4">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}>
            <MidProjectCard project={project} setShowPopup={setShowPopup} index={i} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MidLevelProjectsLayout;
