import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Star,
  Clock,
  Users,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Download,
  Trophy,
  Calendar,
  BookOpen,
  Target,
  Zap,
} from "lucide-react";
import ScrollProgress from "../../components/ScrollProgress";
import LoadingScreen from "../../components/LoadingScreen";
import useInViewport from "../../hooks/useInViewport";
import { courseAPI } from "../../services/api";

const Certification = () => {
  const navigate = useNavigate();
  const [certificationsHeadingRef, isCertificationsHeadingInViewport] =
    useInViewport();
  const [benefitsHeadingRef, isBenefitsHeadingInViewport] = useInViewport();
  const [certifications, setCertifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch courses from backend for certifications
  useEffect(() => {
    const fetchCertifications = async () => {
      try {
        setIsLoading(true);
        const courses = await courseAPI.getAllCourses();

        // Transform courses into certification format
        const transformedCertifications = courses.map((course, index) => {
          // Get pricing based on course title
          const getCertificationPricing = (title) => {
            const titleLower = title.toLowerCase();
            if (titleLower.includes("python")) {
              return {
                price: 1000, // Changed from 1499 to 1000
                originalPrice: 1500,
                xpDiscount: 500,
                requiredXP: 1000,
              };
            } else if (
              titleLower.includes("java") ||
              titleLower.includes("c programming")
            ) {
              return {
                price: 1300, // Changed from 1499 to 1300
                originalPrice: 1800,
                xpDiscount: 500,
                requiredXP: 1000,
              };
            } else {
              return {
                price: 1000, // Other courses remain unchanged
                originalPrice: 3000,
                xpDiscount: null,
                requiredXP: null,
              };
            }
          };

          const pricing = getCertificationPricing(course.title);

          // Generate certification-specific data based on course
          const certificationData = {
            id: course._id,
            title: course.title,
            description:
              course.description ||
              "Master the fundamentals and advanced concepts",
            duration: "12 weeks", // Default duration
            level: course.level || "Intermediate",
            price: pricing.price,
            originalPrice: pricing.originalPrice,
            xpDiscount: pricing.xpDiscount,
            requiredXP: pricing.requiredXP,
            rating: 4.8, // Default rating
            studentsEnrolled: Math.floor(Math.random() * 2000) + 1000, // Random enrollment
            modules: course.topics?.length || 10,
            hours: (course.topics?.length || 10) * 3, // Estimate 3 hours per topic
            chapters: (course.topics?.length || 10) * 2, // Estimate 2 chapters per topic
            quizzes: course.topics?.length || 10, // One quiz per topic
            forms: 2,
            totalHours: Math.floor(((course.topics?.length || 10) * 3) / 4), // Estimate
            skills: getSkillsForCourse(course.title),
            features: [
              "Blockchain-verified authenticity",
              "LinkedIn credential integration",
              "Lifetime validity",
              "Employer verification portal",
              "Downloadable PDF certificate",
              "Industry mentor guidance",
              "Portfolio development",
              "Job placement assistance",
            ],
            image: "/api/placeholder/400/250",
            icon: getIconForCourse(course.title),
            iconColor: getIconColorForCourse(index),
          };

          return certificationData;
        });

        setCertifications(transformedCertifications);
      } catch (error) {
        console.error("Error fetching certifications:", error);
        // Fallback to empty array on error
        setCertifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertifications();
  }, []);

  // Helper functions to generate course-specific data
  const getSkillsForCourse = (title) => {
    const titleLower = title.toLowerCase();
    if (
      titleLower.includes("web") ||
      titleLower.includes("react") ||
      titleLower.includes("javascript")
    ) {
      return [
        "React.js",
        "Node.js",
        "MongoDB",
        "Express.js",
        "JavaScript",
        "HTML/CSS",
      ];
    } else if (
      titleLower.includes("python") ||
      titleLower.includes("data") ||
      titleLower.includes("machine")
    ) {
      return [
        "Python",
        "Pandas",
        "NumPy",
        "Scikit-learn",
        "TensorFlow",
        "Tableau",
      ];
    } else if (
      titleLower.includes("mobile") ||
      titleLower.includes("app") ||
      titleLower.includes("android") ||
      titleLower.includes("ios")
    ) {
      return ["React Native", "Flutter", "Dart", "Firebase", "API Integration"];
    } else if (titleLower.includes("java")) {
      return ["Java", "Spring Boot", "MySQL", "REST APIs", "Maven", "JUnit"];
    } else {
      return [
        "Programming",
        "Problem Solving",
        "Algorithms",
        "Data Structures",
      ];
    }
  };

  const getIconForCourse = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes("web") || titleLower.includes("react")) return "WD";
    if (titleLower.includes("data") || titleLower.includes("python"))
      return "DS";
    if (titleLower.includes("mobile") || titleLower.includes("app"))
      return "MA";
    if (titleLower.includes("java")) return "JA";
    return title.substring(0, 2).toUpperCase();
  };

  const getIconColorForCourse = (index) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-orange-500",
      "bg-red-500",
      "bg-indigo-500",
    ];
    return colors[index % colors.length];
  };

  const benefits = [
    {
      icon: Award,
      title: "Industry-Recognized Certificates",
      description:
        "Get certificates that are valued by top tech companies worldwide",
    },
    {
      icon: Target,
      title: "Skill-Based Learning",
      description:
        "Focus on practical skills that directly apply to real-world projects",
    },
    {
      icon: Users,
      title: "Expert Mentorship",
      description: "Learn from industry professionals with years of experience",
    },
    {
      icon: Zap,
      title: "Fast-Track Career",
      description:
        "Accelerate your career growth with our comprehensive programs",
    },
  ];

  const handleGetCertified = (certificationId) => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    setTimeout(
      () =>
        navigate(`/learn/certification/payment?courseId=${certificationId}`),
      100
    );
  };

  // Show loading state while fetching certifications
  if (isLoading) {
    return (
      <>
        <ScrollProgress />
        <LoadingScreen showMessage={false} size={48} duration={800} />
      </>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <ScrollProgress />

      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-6 flex justify-start">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-1 py-1 text-sm font-semibold text-[#2d7fe8] transition hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center">
          <h1
            ref={certificationsHeadingRef}
            className={`Marquee-title-no-border ${
              isCertificationsHeadingInViewport ? "in-viewport" : ""
            } mb-6 mx-auto w-fit text-center`}
          >
            Get Certified
          </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Advance your career with industry-recognized certifications. Learn
            from experts, build real projects, and get the skills that matter.
          </p>
        </motion.div>

        {/* Certifications Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-20 items-stretch"
        >
          {certifications.map((cert, index) => (
            <CertificationCard
              key={cert.id}
              certification={cert}
              index={index}
              onGetCertified={() => handleGetCertified(cert.id)}
            />
          ))}
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-16"
        >
          <h2
            ref={benefitsHeadingRef}
            className={`font-poppins text-3xl md:text-4xl font-medium brand-heading-primary ${
              isBenefitsHeadingInViewport ? "in-viewport" : ""
            } text-center mb-12 tracking-wider`}
          >
            Why Choose Our Certifications?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Certification Card Component
const CertificationCard = ({ certification, index, onGetCertified }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="h-full overflow-hidden rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 shadow-[0_12px_34px_rgba(60,131,246,0.12)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:from-[#ecf8ff] hover:to-[#deefff] hover:shadow-[0_18px_40px_rgba(60,131,246,0.16)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70 dark:hover:from-[#0a2f6f]/85 dark:hover:to-[#0b3677]/80 flex flex-col"
    >
      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Header with Level and Price */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#86c4ff]/45 bg-[#dbf1ff] px-3 py-1 text-sm font-medium text-[#2d7fe8] dark:border-[#6fbfff]/35 dark:bg-[#0d366f] dark:text-[#8fd9ff]">
              {certification.level}
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-[#4c6f9a] dark:text-[#7fb8e2]">
                {certification.rating}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#0d2a57] dark:text-[#8fd9ff]">
              ₹{certification.price.toLocaleString()}
            </div>
            {certification.xpDiscount && (
              <div className="mt-1 text-xs text-[#2d7fe8] dark:text-[#8fd9ff]">
                Save ₹{certification.xpDiscount} with {certification.requiredXP}{" "}
                XP
              </div>
            )}
          </div>
        </div>

        {/* Title and Description */}
        <div className="flex-1">
          <h3 className="mb-2 text-xl font-bold text-[#0d2a57] dark:text-[#8fd9ff]">
            {certification.title}
          </h3>
          <p className="mb-4 text-sm text-[#4c6f9a] dark:text-[#7fb8e2] line-clamp-2">
            {certification.description}
          </p>

          {/* Stats */}
          <div className="mb-4 flex items-center gap-4 text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{certification.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{certification.studentsEnrolled.toLocaleString()}</span>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
              Skills You'll Learn:
            </h4>
            <div className="flex flex-wrap gap-1">
              {certification.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="rounded border border-[#86c4ff]/45 bg-[#dbf1ff] px-2 py-1 text-xs text-[#4c6f9a] dark:border-[#6fbfff]/35 dark:bg-[#0d366f] dark:text-[#7fb8e2]"
                >
                  {skill}
                </span>
              ))}
              {certification.skills.length > 3 && (
                <span className="rounded border border-[#86c4ff]/45 bg-[#dbf1ff] px-2 py-1 text-xs text-[#4c6f9a] dark:border-[#6fbfff]/35 dark:bg-[#0d366f] dark:text-[#7fb8e2]">
                  +{certification.skills.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h4 className="mb-2 text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
              What's Included:
            </h4>
            <ul className="space-y-1">
              {certification.features.slice(0, 3).map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-sm text-[#4c6f9a] dark:text-[#7fb8e2]"
                >
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span className="line-clamp-1">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onGetCertified}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#86c4ff]/45 bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6] px-6 py-3 font-semibold text-[#082a5d] shadow-md transition-all duration-300 hover:brightness-105 hover:shadow-lg dark:border-[#6fbfff]/35"
        >
          <Trophy className="w-4 h-4" />
          <span>Get Certified</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default Certification;
