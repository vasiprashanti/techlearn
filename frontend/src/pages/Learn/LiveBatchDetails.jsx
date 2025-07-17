import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock, Calendar, MessageCircle, Users, Star, Trophy,
  CheckCircle, ArrowLeft, ArrowRight, Play, BookOpen,
  Award, Target, Zap, User, MapPin, Globe
} from "lucide-react";
import ScrollProgress from "../../components/ScrollProgress";
import useInViewport from "../../hooks/useInViewport";

const LiveBatchDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [titleRef, isTitleInViewport] = useInViewport();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  const handleBackToCourses = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    setTimeout(() => navigate('/learn/courses'), 100);
  };

  // Live Batches detailed data
  const liveBatchesData = {
    "beginner-python": {
      id: "beginner-python",
      title: "Beginner Python Programming",
      instructor: {
        name: "Michael Chen",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        experience: "5+ years",
        bio: "Senior Python Developer at Google with expertise in teaching programming fundamentals. Passionate about making coding accessible to everyone.",
        rating: 4.9,
        studentsCount: 2500
      },
      duration: "6 weeks",
      schedule: "Tuesday, Thursday",
      time: "8:00 PM - 10:00 PM IST",
      startDate: "20/01/2024",
      endDate: "28/02/2024",
      price: "₹5,000",
      originalPrice: "₹8,000",
      description: "Kickstart your coding journey with Python. No prior experience needed—join live interactive classes with hands-on projects and personalized feedback.",
      level: "Beginner",
      language: "English",
      mode: "Live Online",
      enrolled: 45,
      maxCapacity: 50,
      features: [
        "Live interactive sessions",
        "Hands-on coding exercises",
        "Personal mentor support",
        "Certificate of completion",
        "Lifetime access to recordings",
        "Career guidance sessions"
      ],
      curriculum: [
        {
          week: 1,
          title: "Python Basics & Setup",
          topics: ["Installing Python", "Variables & Data Types", "Basic Operations", "Input/Output"]
        },
        {
          week: 2,
          title: "Control Structures",
          topics: ["If-else statements", "Loops", "Break & Continue", "Nested structures"]
        },
        {
          week: 3,
          title: "Functions & Modules",
          topics: ["Defining functions", "Parameters & Arguments", "Return values", "Importing modules"]
        },
        {
          week: 4,
          title: "Data Structures",
          topics: ["Lists", "Tuples", "Dictionaries", "Sets", "String manipulation"]
        },
        {
          week: 5,
          title: "File Handling & Error Management",
          topics: ["Reading/Writing files", "Exception handling", "Try-except blocks", "Debugging"]
        },
        {
          week: 6,
          title: "Final Project",
          topics: ["Project planning", "Implementation", "Code review", "Presentation"]
        }
      ],
      prerequisites: ["Basic computer knowledge", "No programming experience required"],
      outcomes: [
        "Write Python programs confidently",
        "Understand programming fundamentals",
        "Build simple applications",
        "Ready for advanced Python topics"
      ]
    },
    "data-science-essentials": {
      id: "data-science-essentials",
      title: "Data Science Essentials",
      instructor: {
        name: "Sarah Johnson",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        experience: "7+ years",
        bio: "Data Scientist at Microsoft with PhD in Statistics. Expert in machine learning and data visualization with industry experience.",
        rating: 4.8,
        studentsCount: 1800
      },
      duration: "8 weeks",
      schedule: "Monday, Wednesday",
      time: "7:00 PM - 9:00 PM IST",
      startDate: "25/01/2024",
      endDate: "15/03/2024",
      price: "₹7,000",
      originalPrice: "₹12,000",
      description: "Master essential data skills: analysis, visualization, machine learning. Practical, project-led, and live with real industry datasets.",
      level: "Intermediate",
      language: "English",
      mode: "Live Online",
      enrolled: 38,
      maxCapacity: 40,
      features: [
        "Real industry datasets",
        "Live coding sessions",
        "Portfolio projects",
        "Industry mentor guidance",
        "Job placement assistance",
        "Kaggle competition prep"
      ],
      curriculum: [
        {
          week: 1,
          title: "Data Science Fundamentals",
          topics: ["Introduction to Data Science", "Python for Data Science", "Jupyter Notebooks", "Data Types"]
        },
        {
          week: 2,
          title: "Data Manipulation with Pandas",
          topics: ["DataFrames", "Data Cleaning", "Filtering & Grouping", "Merging Data"]
        }
      ],
      prerequisites: ["Basic Python knowledge", "High school mathematics"],
      outcomes: [
        "Analyze complex datasets",
        "Create compelling visualizations",
        "Build predictive models",
        "Present data insights effectively"
      ]
    }
  };

  const batch = liveBatchesData[batchId];

  if (!batch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Batch Not Found</h1>
          <button
            onClick={handleBackToCourses}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const getLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const handleEnrollNow = () => {
    const message = `Hi! I'm interested in enrolling for the ${batch.title} batch. Can you provide enrollment details?`;
    const whatsappUrl = `https://wa.me/1234567890?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleContactInstructor = () => {
    const message = `Hi! I have some questions about the ${batch.title} batch. Can we discuss?`;
    const whatsappUrl = `https://wa.me/1234567890?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <ScrollProgress />
      
      <div className="relative z-10 pt-24 pb-12">
        <div className="container px-6 mx-auto max-w-6xl">
          
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onClick={handleBackToCourses}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-8 transition-colors duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Courses</span>
          </motion.button>

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 dark:border-gray-700/20 mb-8"
          >
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Info */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getLevelColor(batch.level)}`}>
                    {batch.level}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Live
                  </span>
                </div>
                
                <h1 
                  ref={titleRef}
                  className={`Marquee-title-no-border ${isTitleInViewport ? 'in-viewport' : ''} mb-4`}
                >
                  {batch.title}
                </h1>
                
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  {batch.description}
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{batch.duration}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{batch.enrolled}/{batch.maxCapacity}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Enrolled</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 text-center">
                    <div>{batch.language}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Language</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{batch.mode}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Mode</div>
                  </div>
                </div>
              </div>

              {/* Pricing & CTA */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">{batch.price}</span>
                      <span className="text-lg text-gray-500 dark:text-gray-400 line-through">{batch.originalPrice}</span>
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Save {Math.round((1 - parseInt(batch.price.replace(/[₹,]/g, '')) / parseInt(batch.originalPrice.replace(/[₹,]/g, ''))) * 100)}%
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Starts: {batch.startDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{batch.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{batch.time}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleEnrollNow}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 hover:shadow-lg mb-3"
                  >
                    Enroll Now
                  </button>
                  
                  <button
                    onClick={handleContactInstructor}
                    className="w-full py-3 bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700/70 font-medium rounded-xl transition-all duration-300 border border-gray-200 dark:border-gray-600 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contact Instructor
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Instructor Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 dark:border-gray-700/20 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Meet Your Instructor</h2>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <img
                  src={batch.instructor.avatar}
                  alt={batch.instructor.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-200 dark:border-blue-800"
                />
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{batch.instructor.name}</h3>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">{batch.instructor.experience} Experience</p>
                  </div>

                  <div className="flex items-center gap-4 mt-2 md:mt-0">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-bold text-gray-900 dark:text-white">{batch.instructor.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">{batch.instructor.studentsCount}+ students</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {batch.instructor.bio}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 dark:border-gray-700/20 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">What You'll Get</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batch.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Curriculum Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 dark:border-gray-700/20 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Course Curriculum</h2>

            <div className="space-y-4">
              {batch.curriculum.map((week, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white/30 dark:bg-gray-800/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {week.week}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{week.title}</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-2 ml-11">
                    {week.topics.map((topic, topicIndex) => (
                      <div key={topicIndex} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-600 dark:text-gray-400">{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Prerequisites & Outcomes */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Prerequisites */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 dark:border-gray-700/20"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Prerequisites
              </h2>

              <div className="space-y-3">
                {batch.prerequisites.map((prereq, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">{prereq}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Learning Outcomes */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 dark:border-gray-700/20"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Learning Outcomes
              </h2>

              <div className="space-y-3">
                {batch.outcomes.map((outcome, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">{outcome}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white"
          >
            <h2 className="text-2xl font-bold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join {batch.enrolled} students already enrolled in this batch. Limited seats available!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleEnrollNow}
                className="px-8 py-3 bg-white text-blue-600 hover:bg-gray-100 font-bold rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                Enroll Now - {batch.price}
              </button>

              <button
                onClick={handleContactInstructor}
                className="px-8 py-3 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Have Questions?
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LiveBatchDetails;
