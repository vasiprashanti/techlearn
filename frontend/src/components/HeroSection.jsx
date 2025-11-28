import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useInViewport from "../hooks/useInViewport";

// ---- SECTION CARD COMPONENT INSIDE SAME FILE ---- //
const SectionCard = ({ section }) => {
  return (
    <motion.div
      className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-16"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
        {/* Left */}
        <motion.div initial={{ x: -40 }} whileInView={{ x: 0 }} transition={{ duration: 0.8 }}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{section.title}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{section.description}</p>

          {section.features?.length > 0 && (
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              {section.features.map((f, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  {f}
                </li>
              ))}
            </ul>
          )}

          {section.cta && (
            <button className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition">
              {section.cta}
              <ArrowRight size={18} />
            </button>
          )}
        </motion.div>

        {/* Right */}
        <motion.div initial={{ x: 40 }} whileInView={{ x: 0 }} transition={{ duration: 0.8 }}>
          <img
            src={section.image}
            alt="section preview"
            className="rounded-xl shadow-lg w-full object-cover"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

// ---- SECTIONS DATA ---- //
const sections = [
  {
    title: "Structured Coding Courses",
    description: "Master DSA, Java, Python, C++, SQL, full-stack development and more with guided modules.",
    features: [
      "Video + Text based learning",
      "Beginner → Advanced roadmap",
      "Assignments & assessments"
    ],
    image: "/img1.png",
    cta: "Explore Courses"
  },
  {
    title: "College Integrated Test Portal",
    description: "A full testing system where your college uploads student data & students take secure coding tests.",
    features: [
      "LeetCode-like test environment",
      "OTP verification + time tracking",
      "Automated scoring via GPT/Judge API"
    ],
    image: "/img2.png",
    cta: "View Test Portal"
  },
  {
    title: "Placement Preparation",
    description: "HR interviews, mock tests, resume correction, company-wise test strategies & more.",
    features: [
      "Aptitude + coding test prep",
      "Mock interviews",
      "Placement-ready projects"
    ],
    image: "/img3.png",
    cta: "Start Placement Prep"
  }
];

// ---- HERO SECTION WITH SECTION CARDS ---- //
const HeroSection = () => {
  const navigate = useNavigate();
  const [titleRef, isTitleInViewport] = useInViewport();
  const [subtitleRef, isSubtitleInViewport] = useInViewport();
  const [descriptionRef, isDescriptionInViewport] = useInViewport();

  return (
    <div className="w-full overflow-hidden">

      {/* ---------------- HERO ---------------- */}
      <motion.div
        className="relative z-10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/20 pt-20"
        initial={{ filter: "blur(10px)" }}
        animate={{ filter: "blur(0px)" }}
        transition={{ duration: 1.2, delay: 0.1 }}
      >
        <motion.div
          className="container px-4 py-12 mx-auto max-w-7xl relative z-20"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.0, delay: 0.3 }}
        >
          <div className="grid lg:grid-cols-[2fr_1fr] gap-12 items-center min-h-[480px]">

            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.0 }}
              className="relative z-10"
            >
              <motion.h1
                className="font-poppins text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight mb-6"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9 }}
              >
                <span
                  ref={titleRef}
                  className={`brand-heading-primary hover-gradient-text italic pr-2 ${isTitleInViewport ? "in-viewport" : ""}`}
                >
                  learn
                </span>
                <br />
                <span
                  ref={subtitleRef}
                  className={`brand-heading-secondary hover-gradient-text ${isSubtitleInViewport ? "in-viewport" : ""}`}
                >
                  CODING
                </span>
              </motion.h1>

              <motion.p
                className="font-poppins text-lg text-gray-600 dark:text-gray-400"
                initial={{ filter: "blur(4px)" }}
                animate={{ filter: "blur(0px)" }}
                transition={{ duration: 0.8 }}
              >
                Warning: Coding skills may cause sudden job offers and inflated Git pushes.
              </motion.p>
            </motion.div>

            {/* Right */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.0 }}
              className="relative flex justify-center lg:justify-end"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1.2, delay: 0.6 }}
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <img
                  src="/book.gif"
                  alt="Learning Books Animation"
                  className="w-64 md:w-80 lg:w-96 drop-shadow-2xl"
                />
              </motion.div>
            </motion.div>

          </div>
        </motion.div>
      </motion.div>


      {/* ---------------- SECTION CARDS BELOW HERO ---------------- */}
      {sections.map((section, index) => (
        <SectionCard key={index} section={section} />
      ))}

    </div>
  );
};

export default HeroSection;
