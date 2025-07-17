import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Award, Code } from "lucide-react";
import SectionCard from "./SectionCard";

const SectionsList = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const sections = [
    {
      id: "courses",
      title: "Interactive Courses",
      subtitle: "Master the Fundamentals",
      description: "Learn through interactive lessons, real-world projects, and hands-on coding challenges designed to accelerate your learning journey.",
      price: "Free",
      cta: "Start Learning",
      icon: BookOpen,
      gradient: "from-blue-500 to-cyan-500",
      glowColor: "group-hover:shadow-blue-500/25",
      popular: false,
      features: ["24 Interactive Lessons", "Code Playground", "Progress Tracking"]
    },
    {
      id: "exercises",
      title: "Coding Challenges",
      subtitle: "Practice Makes Perfect",
      description: "Sharpen your skills with algorithmic challenges, debugging exercises, and real-world problem-solving scenarios.",
      price: "Free",
      cta: "Start Practicing",
      icon: GraduationCap,
      gradient: "from-purple-500 to-pink-500",
      glowColor: "group-hover:shadow-purple-500/25",
      popular: false,
      features: ["50+ Challenges", "Multiple Difficulty Levels", "Solution Explanations"]
    },
    {
      id: "compiler",
      title: "Online Compiler",
      subtitle: "Code Anywhere, Anytime",
      description: "Write, compile, and run Python and Java code directly in your browser. No setup required, just pure coding experience.",
      price: "Free",
      cta: "Start Coding",
      icon: Code,
      gradient: "from-orange-500 to-red-500",
      glowColor: "group-hover:shadow-orange-500/25",
      popular: false,
      features: ["Python & Java Support", "Real-time Execution", "No Installation Required"]
    },
    {
      id: "certification",
      title: "Professional Certification",
      subtitle: "Prove Your Expertise",
      description: "Earn industry-recognized credentials that showcase your mastery and boost your career opportunities in tech.",
      price: "Premium",
      cta: "Get Certified",
      icon: Award,
      gradient: "from-emerald-500 to-teal-500",
      glowColor: "group-hover:shadow-emerald-500/25",
      popular: true,
      features: ["Industry Recognition", "LinkedIn Badge", "Career Support"]
    }
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      className="w-full relative"
    >
      {sections.map((section, index) => (
        <SectionCard 
          key={section.id}
          section={section}
          index={index}
        />
      ))}
    </motion.div>
  );
};

export default SectionsList;
