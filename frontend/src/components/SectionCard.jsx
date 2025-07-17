import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import useInViewport from "../hooks/useInViewport";
import VideoPreview from "./VideoPreview";
import { useTheme } from "../context/ThemeContext";

const SectionCard = ({ section, index }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [titleRef, isTitleInViewport] = useInViewport();
  const sectionRef = useRef(null);

  // Generate section ID for navigation
  const sectionId = `${section.id}-section`;

  // Track scroll progress for this specific section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Check if this is the last section (certification)
  const isLastSection = section.id === 'certification';

  // Slower scroll-triggered animations with extended ranges
  // Button slides in from bottom with slower timing
  const buttonY = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    isLastSection ? [200, 0, 0, 0] : [200, 0, 0, -200]
  );
  const buttonOpacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    isLastSection ? [0, 1, 1, 1] : [0, 1, 1, 0]
  );
  const buttonScale = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    isLastSection ? [0.3, 1, 1, 1] : [0.3, 1, 1, 0.3]
  );
  const buttonRotate = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    isLastSection ? [45, 0, 0, 0] : [45, 0, 0, -45]
  );

  // Visual container slides in from the side with slower timing
  const visualDirection = index % 2 === 0 ? 1 : -1; // Even indexes from right, odd from left
  const containerX = useTransform(
    scrollYProgress,
    [0, 0.4, 0.6, 1],
    isLastSection ? [300 * visualDirection, 0, 0, 0] : [300 * visualDirection, 0, 0, -300 * visualDirection]
  );
  const containerScale = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    isLastSection ? [0.4, 1, 1, 1] : [0.4, 1, 1, 0.4]
  );
  const containerRotate = useTransform(
    scrollYProgress,
    [0, 0.4, 0.6, 1],
    isLastSection ? [20 * visualDirection, 0, 0, 0] : [20 * visualDirection, 0, 0, -20 * visualDirection]
  );
  const containerOpacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    isLastSection ? [0, 1, 1, 1] : [0, 1, 1, 0]
  );

  // Overall section blur effect with slower timing
  const sectionBlur = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    isLastSection ? [10, 0, 0, 0] : [10, 0, 0, 10]
  );
  const sectionOpacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    isLastSection ? [0.3, 1, 1, 1] : [0.3, 1, 1, 0.3]
  );
  
  const sectionVariants = {
    hidden: {
      opacity: 0,
      y: 60,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: index * 0.3
      }
    }
  };

  const handleNavigation = () => {
    switch(section.id) {
      case 'courses':
        navigate('/learn/courses');
        break;
      case 'exercises':
        navigate('/learn/exercises');
        break;
      case 'compiler':
        navigate('/learn/compiler');
        break;
      case 'certification':
        navigate('/learn/certification');
        break;
      default:
        break;
    }
  };

  return (
    <motion.section
      id={sectionId}
      ref={sectionRef}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="relative w-full min-h-screen flex items-center py-20"
      style={{
        opacity: sectionOpacity,
        filter: `blur(${sectionBlur}px)`
      }}
    >
      {/* Content container */}
      <div className="container mx-auto max-w-7xl px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content Side - Always on left */}
          <div className="relative z-10 space-y-8">
            {/* Special layout for Interactive Courses section */}
            {section.id === 'courses' ? (
              <>
                {/* "code BOOK" heading */}
                <div className="space-y-4 overflow-visible">
                  <motion.h2
                    ref={titleRef}
                    className="font-poppins text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.1] overflow-visible"
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <span
                      className={`brand-heading-primary hover-gradient-text italic pr-2 ${isTitleInViewport ? 'in-viewport' : ''}`}
                      style={{ display: 'inline-block' }}
                    >
                      code
                    </span>
                    <br />
                    <span className={`brand-heading-secondary hover-gradient-text ${isTitleInViewport ? 'in-viewport' : ''}`}>BOOK</span>
                  </motion.h2>
                </div>

                {/* Subtitle */}
                <motion.p
                  className="font-poppins text-lg md:text-xl text-gray-700 dark:text-gray-300"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Fundamentals First. Brilliance Next.
                </motion.p>

                {/* Description */}
                <motion.p
                  className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  {section.description}
                </motion.p>

                {/* Features list */}
                <motion.ul
                  className="space-y-3"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  {section.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-base text-gray-600 dark:text-gray-400"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      {feature}
                    </li>
                  ))}
                </motion.ul>

                {/* CTA Button with previous styling */}
                <motion.div
                  style={{
                    y: buttonY,
                    opacity: buttonOpacity,
                    scale: buttonScale,
                    rotateZ: buttonRotate
                  }}
                  className="transform-gpu"
                >
                  <motion.div
                    whileHover={{
                      x: 2,
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={handleNavigation}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white border-none px-4 py-2 text-base rounded-lg cursor-pointer inline-flex items-center gap-2 transition-all duration-300 font-sans"
                    >
                      <span>{section.cta}</span>
                      <motion.div
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </button>
                  </motion.div>
                </motion.div>
              </>
            ) : section.id === 'exercises' ? (
              <>
                {/* Special layout for Coding Challenges section */}
                {/* "code WORKOUT" heading */}
                <div className="space-y-4 overflow-visible">
                  <motion.h2
                    ref={titleRef}
                    className="font-poppins text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.1] overflow-visible"
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <span
                      className={`brand-heading-primary hover-gradient-text italic pr-2 ${isTitleInViewport ? 'in-viewport' : ''}`}
                      style={{ display: 'inline-block' }}
                    >
                      code
                    </span>
                    <br />
                    <span className={`brand-heading-secondary hover-gradient-text ${isTitleInViewport ? 'in-viewport' : ''}`}>WORKOUT</span>
                  </motion.h2>
                </div>

                {/* Subtitle */}
                <motion.p
                  className="font-poppins text-lg md:text-xl text-gray-700 dark:text-gray-300"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Turn syntax into muscle memory — minus the sweat.
                </motion.p>

                {/* Description */}
                <motion.p
                  className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  {section.description}
                </motion.p>

                {/* Features list */}
                <motion.ul
                  className="space-y-3"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  {section.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-base text-gray-600 dark:text-gray-400"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      {feature}
                    </li>
                  ))}
                </motion.ul>

                {/* CTA Button with previous styling */}
                <motion.div
                  style={{
                    y: buttonY,
                    opacity: buttonOpacity,
                    scale: buttonScale,
                    rotateZ: buttonRotate
                  }}
                  className="transform-gpu"
                >
                  <motion.div
                    whileHover={{
                      x: 2,
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={handleNavigation}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white border-none px-4 py-2 text-base rounded-lg cursor-pointer inline-flex items-center gap-2 transition-all duration-300 font-sans"
                    >
                      <span>{section.cta}</span>
                      <motion.div
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </button>
                  </motion.div>
                </motion.div>
              </>
            ) : section.id === 'compiler' ? (
              <>
                {/* Special layout for Online Compiler section */}
                {/* "code LAB" heading */}
                <div className="space-y-4 overflow-visible">
                  <motion.h2
                    ref={titleRef}
                    className="font-poppins text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.1] overflow-visible"
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <span
                      className={`brand-heading-primary hover-gradient-text italic pr-2 ${isTitleInViewport ? 'in-viewport' : ''}`}
                      style={{ display: 'inline-block' }}
                    >
                      code
                    </span>
                    <br />
                    <span className={`brand-heading-secondary hover-gradient-text ${isTitleInViewport ? 'in-viewport' : ''}`}>LAB</span>
                  </motion.h2>
                </div>

                {/* Subtitle */}
                <motion.p
                  className="font-poppins text-lg md:text-xl text-gray-700 dark:text-gray-300"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Your browser is your IDE now.
                </motion.p>

                {/* Description */}
                <motion.p
                  className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  {section.description}
                </motion.p>

                {/* Features list */}
                <motion.ul
                  className="space-y-3"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  {section.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-base text-gray-600 dark:text-gray-400"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      {feature}
                    </li>
                  ))}
                </motion.ul>

                {/* CTA Button with previous styling */}
                <motion.div
                  style={{
                    y: buttonY,
                    opacity: buttonOpacity,
                    scale: buttonScale,
                    rotateZ: buttonRotate
                  }}
                  className="transform-gpu"
                >
                  <motion.div
                    whileHover={{
                      x: 2,
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={handleNavigation}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white border-none px-4 py-2 text-base rounded-lg cursor-pointer inline-flex items-center gap-2 transition-all duration-300 font-sans"
                    >
                      <span>{section.cta}</span>
                      <motion.div
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </button>
                  </motion.div>
                </motion.div>
              </>
            ) : (
              <>
                {/* Special layout for Professional Certification section */}
                {/* "code MASTER" heading */}
                <div className="space-y-4 overflow-visible">
                  <motion.h2
                    ref={titleRef}
                    className="font-poppins text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.1] overflow-visible"
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <span
                      className={`brand-heading-primary hover-gradient-text italic pr-2 ${isTitleInViewport ? 'in-viewport' : ''}`}
                      style={{ display: 'inline-block' }}
                    >
                      code
                    </span>
                    <br />
                    <span className={`brand-heading-secondary hover-gradient-text ${isTitleInViewport ? 'in-viewport' : ''}`}>MASTER</span>
                  </motion.h2>
                </div>

                {/* Subtitle */}
                <motion.p
                  className="font-poppins text-lg md:text-xl text-gray-700 dark:text-gray-300"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Prove Your Expertise
                </motion.p>

                {/* Description */}
                <motion.p
                  className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  {section.description}
                </motion.p>

                {/* Features list */}
                <motion.ul
                  className="space-y-3"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  {section.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-base text-gray-600 dark:text-gray-400"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      {feature}
                    </li>
                  ))}
                </motion.ul>

                {/* CTA Button with previous styling */}
                <motion.div
                  style={{
                    y: buttonY,
                    opacity: buttonOpacity,
                    scale: buttonScale,
                    rotateZ: buttonRotate
                  }}
                  className="transform-gpu"
                >
                  <motion.div
                    whileHover={{
                      x: 2,
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={handleNavigation}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white border-none px-4 py-2 text-base rounded-lg cursor-pointer inline-flex items-center gap-2 transition-all duration-300 font-sans"
                    >
                      <span>{section.cta}</span>
                      <motion.div
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </button>
                  </motion.div>
                </motion.div>
              </>
            )}
          </div>

          {/* Visual Side - Always on right */}
          <motion.div
            className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] transform-gpu perspective-1000"
            style={{
              x: containerX,
              scale: containerScale,
              rotateZ: containerRotate,
              opacity: containerOpacity
            }}
          >
            <div className="w-full h-full flex items-center justify-center relative">
              {section.id === 'courses' ? (
                /* Interactive Courses with Theme-Aware Videos */
                <motion.video
                  src={theme === 'dark' ? '/videos/book-dark.mp4' : '/videos/book-light.mp4'}
                  alt="Interactive Courses"
                  className="w-full h-auto object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                />
              ) : section.id === 'exercises' ? (
                /* Coding Challenges with Theme-Aware Images */
                <motion.img
                  src={theme === 'dark' ? '/workout-dark.png' : '/workout-light.png'}
                  alt="Coding Challenges"
                  className="w-full h-auto object-contain"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                />
              ) : section.id === 'compiler' ? (
                /* Online Compiler with Theme-Aware Images */
                <motion.img
                  src={theme === 'dark' ? '/compiler-dark.png' : '/compiler-light.png'}
                  alt="Code Compiler"
                  className="w-full h-auto object-contain"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                />
              ) : (
                /* Professional Certification with Certificate Image */
                <motion.div
                  className="w-full h-full flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <motion.img
                    src="/certificate.png"
                    alt="Professional Certificate"
                    className="w-full h-auto max-w-md object-contain drop-shadow-2xl"
                    animate={{
                      y: [0, -12, 0],
                      rotate: [-1, 1, -1]
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default SectionCard;
