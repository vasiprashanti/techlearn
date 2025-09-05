import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { AuthModalProvider } from './context/AuthModalContext'
import { UserProvider } from './context/UserContext'
import PrivateRoute from './Routes/PrivateRoute'
import AdminPrivateRoute from './Routes/AdminPrivateRoute'

// Motion for animations
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import FloatingCodeWords from './components/FloatingCodeWords'
import FloatingCourseLogos from './components/FloatingCourseLogos'
import LoadingScreen from './components/LoadingScreen'
import { useTheme } from './context/ThemeContext'

//Admin Dashboard
import AdminDashboard from './pages/AdminDashbaord/AdminDashboard';
import Sidebar from '../src/components/AdminDashbaord/Admin_Sidebar'
import UploadTopicsPage from '../src/pages/AdminDashbaord/UploadTopicsPage'
import Courses_Admin from "../src/pages/AdminDashbaord/Courses";
import AdminTopicsList from "../src/pages/AdminDashbaord/AdminTopicsList";
import EditTopicForm from "../src/pages/AdminDashbaord/EditTopicForm";
import McqUpload from "../src/pages/AdminDashbaord/McqUpload"
import UploadExercisesPage from "../src/pages/AdminDashbaord/UploadExercisesPage";
import CodingRoundUpload from '../src/pages/AdminDashbaord/CodingRoundUpload';

// Auth pages
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import Dashboard from './pages/Dashboard/Dashboard'
import ResetPassword from './components/auth/ResetPassword';
import Projects from '../src/components/Dashboard/Projects'
import UserCoding from './pages/Coding/UserCoding';


// Learn components
import LearnMain from './pages/Learn/LearnMain'
import Courses from './pages/Learn/Courses'
import AllCourses from './pages/Learn/AllCourses'
import CourseDetails from './pages/Learn/CourseDetails'
import CourseQuiz from './pages/Learn/CourseQuiz'
import CourseTopics from './pages/Learn/CourseTopics'
import LiveBatchDetails from './pages/Learn/LiveBatchDetails'

// Exercise components
import Exercises from './pages/Learn/Exercises'
import ExercisesList from './pages/Learn/ExercisesList'
import ExerciseDetail from './pages/Learn/ExerciseDetail'

// Certification components
import Certification from './pages/Learn/Certification'
import CertificationPayment from './pages/Learn/CertificationPayment'

// Compiler component
import OnlineCompiler from './pages/Learn/OnlineCompiler'

// Build components
import BuildPageMain from './pages/Build/BuildPage'
import ProjectDetail from './pages/Build/ProjectDetail'
import MidProjectDetail from './pages/Build/MidProjectDetail'
import ProjectPayment from './pages/Build/ProjectPayment'
import PaymentGateway from './pages/Build/PaymentGateway'
import UILibrary from './pages/Build/UILibrary'
import Profile from './components/Dashboard/Profile'

// Contact component
import Contact from './pages/Contact/Contact'

// About component
import About from './pages/About/About'
// Terms and Conditions componenet
import TermsAndConditions from './pages/About/TermsAndConditons';

import PrivacyPolicy from './pages/About/PrivacyPolicy';
import UserMcq from './pages/Mcq/UserMcq'

//College list
import CollegeAssessment from "./pages/Colleges/CollegeAssesment";

// Homepage component
const HomePage = () => {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const bottomTextRef = useRef(null)
  const [isBottomTextInViewport, setIsBottomTextInViewport] = useState(false)

  // Typewriter effect state
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const fullText = "Techlearn;"
  const headingRef = useRef(null)

  // Stats animation state
  const statsRef = useRef(null)
  const [animatedStats, setAnimatedStats] = useState({
    courses: 0,
    batches: 0,
    students: 0,
    rating: 0
  })

  // Marquee refs for intersection observer
  const marqueeRefs = useRef([])

  // Stats data
  const statsData = [
    { target: 10, label: "Courses Offered", suffix: "+" },
    { target: 400, label: "Batches Completed", suffix: "+" },
    { target: 5101, label: "Students Trained", suffix: "+" },
    { target: 4.6, label: "Google Rating", isDecimal: true }
  ]

  // Marquee sections data
  const marqueeData = [
  {
    title: "techPREP",
    subtitle: "Already learned with us? Time to prove it.",
    description:
      "Click your college logo below and start your assessment now with TechPrep at Techlearn Solutions. Because practice turns preparation into success.",
    logos: [
      {
        name: "University of Hyderabad",
        src: "uh.png",
        srcDark: "uh_dark.png",
        link: "/colleges/uoh",
      },
      {
        name: "Vidya Jyothi Institute of Technology",
        src: "/vjit.png",
        srcDark: "vjit_dark.png",
        link: "/colleges/vjit",
      },
      {
        name: "VNR Vignana Jyothi Institute of Engineering and Technology",
        src: "/vnrvjiet.png",
        srcDark: "/vnrvjiet_dark.png",
        link: "/colleges/vnr",
      },
      {
        name: "Mahindra University",
        src: "/mu.png",
        srcDark: "/mu_dark.png",
        link: "/colleges/mahindra",
      },
    ],
  },
    {
      id: "exercises",
      title: "code WORKOUT",
      subtitle: "Turn syntax into muscle memory — minus the sweat.",
      description: "Challenge yourself with our comprehensive coding exercises designed to strengthen your programming fundamentals. Practice makes perfect, and our structured workout sessions will help you build the coding stamina needed for real-world development challenges.",
      features: ["Progressive difficulty levels from beginner to advanced", "Interactive coding challenges with instant feedback", "Track your progress and identify improvement areas", "Real-world problem scenarios and algorithmic thinking"],
      link: "/learn/exercises",
      reverse: true,
      visual: "workout"
    },
    {
      id: "compiler",
      title: "code LAB",
      subtitle: "Your browser is your IDE now.",
      description: "Experience seamless coding with our powerful online compiler that supports multiple programming languages. No installations, no setup hassles – just pure coding experience in your browser with all the features of a professional development environment.",
      features: ["Multi-language support including C, C++, Java, Python, JavaScript", "Real-time code compilation and execution", "Syntax highlighting and error detection", "Share and collaborate on code with others"],
      link: "/learn/compiler",
      visual: "compiler"
    },
    {
      id: "certification",
      title: "code MASTER",
      subtitle: "Prove Your Expertise",
      description: "Validate your programming skills with industry-recognized certifications that demonstrate your technical proficiency. Our comprehensive certification program evaluates both theoretical knowledge and practical coding abilities to give you credentials that employers trust.",
      features: ["Industry-recognized certification programs", "Comprehensive skill assessments covering theory and practice", "Digital certificates with verification codes", "Professional portfolio enhancement and career advancement"],
      link: "/learn/certification",
      reverse: true,
      visual: "certification"
    }
  ]

  // Custom viewport detection for typewriter - triggers every time
  useEffect(() => {
    const element = headingRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isTyping) {
          setIsTyping(true)
          setDisplayedText("")
          setCurrentIndex(0)
        } else if (!entry.isIntersecting && isTyping) {
          setIsTyping(false)
          setDisplayedText("")
          setCurrentIndex(0)
        }
      },
      {
        threshold: 0.3,
        rootMargin: '0px'
      }
    )

    observer.observe(element)
    return () => observer.unobserve(element)
  }, [isTyping])

  // Typewriter animation
  useEffect(() => {
    if (isTyping && currentIndex < fullText.length) {
      const isMobile = window.innerWidth <= 480
      const charDelay = isMobile ? 120 : 75

      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, charDelay)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, fullText, isTyping])

  // Custom viewport detection for stats
  useEffect(() => {
    const element = statsRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimatedStats({ courses: 0, batches: 0, students: 0, rating: 0 })

          statsData.forEach((stat, index) => {
            const increment = stat.isDecimal ? 0.1 : Math.ceil(stat.target / 50)
            let count = 0

            const timer = setInterval(() => {
              count += increment
              if (count >= stat.target) {
                count = stat.target
                clearInterval(timer)
              }

              setAnimatedStats(prev => ({
                ...prev,
                [index === 0 ? 'courses' : index === 1 ? 'batches' : index === 2 ? 'students' : 'rating']: count
              }))
            }, 30)
          })
        } else {
          setAnimatedStats({ courses: 0, batches: 0, students: 0, rating: 0 })
        }
      },
      {
        threshold: 0.3,
        rootMargin: '0px'
      }
    )

    observer.observe(element)
    return () => observer.unobserve(element)
  }, [])

  // Bottom text viewport detection
  useEffect(() => {
    const element = bottomTextRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsBottomTextInViewport(entry.isIntersecting)
      },
      {
        threshold: 0.3,
        rootMargin: '0px'
      }
    )

    observer.observe(element)
    return () => observer.unobserve(element)
  }, [])

  // Marquee animation intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const title = entry.target.querySelector('.marquee-title, .marquee-title-2')
        if (title) {
          if (entry.isIntersecting) {
            title.classList.add('animate')
          } else {
            title.classList.remove('animate')
          }
        }
      })
    }, {
      threshold: 0.3
    })

    marqueeRefs.current.forEach(header => {
      if (header) {
        observer.observe(header)
      }
    })

    return () => {
      marqueeRefs.current.forEach(header => {
        if (header) {
          observer.unobserve(header)
        }
      })
    }
  }, [])

  return (
    <div className="bg-transparent dark:bg-transparent relative">
      {/* Hero Section */}
      <div className="h-screen flex flex-col items-center justify-center px-6 relative pt-16">
        {/* Floating Course Logos - Hero Section Only */}
        <FloatingCourseLogos />
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          {/* TECHLEARN Heading with Typewriter Effect */}
          <div className="mb-4">
            <div
              ref={headingRef}
              className="font-bold text-[#001862] dark:text-[#ffffffde] font-poppins relative"
              style={{
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: '10px',
                marginTop: '10%',
                fontSize: 'clamp(42px, 8vw, 110px)',
                textAlign: 'center'
              }}
            >
              <span
                style={{
                  visibility: 'hidden',
                  whiteSpace: 'nowrap'
                }}
                aria-hidden="true"
              >
                {fullText}
              </span>
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.1em'
                }}
              >
                {displayedText}
              </span>
            </div>
            <h2
              className="font-medium text-[#002d88] dark:text-[#ffffffde] font-poppins"
              style={{
                fontWeight: 500,
                marginTop: '10px',
                fontSize: 'clamp(15px, 3vw, 25px)'
              }}
            >
              Don't Just Use Technology, Build It.
            </h2>
          </div>

          {/* Start for Free Button */}
          <button
            onClick={() => navigate('/learn/courses')}
            className="inline-block font-poppins font-semibold rounded-lg transition-all duration-300 px-6 py-3 md:px-8 md:py-3 text-sm md:text-base mt-6 md:mt-8"
            style={{
              backgroundColor: '#ffffffac',
              color: '#001242',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#001242'
              e.target.style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ffffffac'
              e.target.style.color = '#001242'
            }}
          >
            Start for Free
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="flex items-start justify-center px-6 pt-16 pb-8">
        <div
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 w-full max-w-4xl"
        >
          {statsData.map((stat, index) => (
            <div key={index} className="text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-[#000c3e] dark:text-[#ffffffde]">
                {stat.isDecimal
                  ? animatedStats.rating.toFixed(1)
                  : Math.floor(index === 0 ? animatedStats.courses : index === 1 ? animatedStats.batches : animatedStats.students)
                }{stat.suffix || ''}
              </h2>
              <p className="text-sm md:text-base text-[#000234] dark:text-[#ffffff] mt-2 font-inter">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Sections */}
      {marqueeData.map((item, index) => (
        <div
          key={index}
          className={item.reverse ? "marquee-header-2" : "marquee-header "}
          ref={(el) => (marqueeRefs.current[index] = el)}
        >
          {/* Special layout for techPREP section with logos */}
          {item.logos ? (
            <div className="w-full">
              {/* Text content */}
              <div className="mb-12 max-w-4xl mx-auto px-8 ">
                {/* TechPREP title first - left aligned */}
                <a
                  href={item.link}
                  className="marquee-link"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.link);
                  }}
                >
                  <h2
                    className={`${
                      item.reverse ? "marquee-title-2 " : "marquee-title "
                    } !text-left`} style={{ marginLeft: -30 }}
                  >
                    <span>
                      <i>{item.title.split(" ")[0]}</i>{" "}
                      {item.title.split(" ").slice(1).join(" ")}
                    </span>
                  </h2>
                </a>
                {/* Subtitle and description below - centered */}
                <p
                  className={`${
                    item.reverse ? "marquee-subtext-2" : "marquee-subtext"
                  } text-center`}
                >
                  {item.subtitle}
                </p>
                <p
                  className={`${
                    item.reverse ? "marquee-subtext-2" : "marquee-subtext"
                  } text-center`}
                >
                  <strong>{item.description}</strong>
                </p>
              </div>
              {/* College Logos Row */}
              <div className="flex flex-row flex-nowrap overflow-x-auto gap-6 mt-8 px-2">
                {item.logos.map((logo, logoIndex) => (
                  <button
                    key={logoIndex}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(logo.link);
                    }}
                    className="flex items-center justify-center bg-transparent transition-transform duration-300 hover:scale-105 hover:opacity-90"
                  >
                    <div className="w-40 h-24 md:w-56 md:h-32 lg:w-64 lg:h-36 flex items-center justify-center">
                      <img
  src={
    logo.srcDark && theme === "dark"
      ? logo.srcDark
      : logo.src
  }
  alt={logo.name}
  className="max-w-full max-h-full object-contain filter drop-shadow-md"
/>

                      <div className="hidden w-full h-full bg-blue-500 text-white items-center justify-center text-lg font-bold text-center rounded-lg">
                        {logo.name
                          .split(" ")
                          .map((word) => word[0])
                          .join("")
                          .slice(0, 4)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="block md:hidden text-right pr-4 mt-1">
  <span className="italic text-xs text-gray-400">swipe for more...</span>
</div>
            </div>
          ) : item.visual ? (
            /* Learn sections */
            <div className="container mx-auto max-w-7xl px-6 py-20">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Content Side */}
                <div className="relative z-10 space-y-8 text-left">
                  <a
                    href={item.link}
                    className="marquee-link"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.link);
                    }}
                  >
                    <h2 className={`${item.reverse ? "marquee-title-2" : "marquee-title"} !text-left ml-0`}
    style={{ marginLeft: -30 }}>
                      <span>
                        <i>{item.title.split(" ")[0]}</i>{" "}
                        {item.title.split(" ").slice(1).join(" ")}
                      </span>
                    </h2>
                  </a>
                  
                  <motion.p
                    className="font-poppins text-lg md:text-xl text-gray-700 dark:text-gray-300"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    viewport={{ once: true }}
                  >
                    {item.subtitle}
                  </motion.p>

                  <motion.p
                    className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    viewport={{ once: true }}
                  >
                    {item.description}
                  </motion.p>

                  {item.visual === 'compiler' && <div className="h-10 md:h-0"></div>}

                  {item.features && (
  <ul className="space-y-3 list-none" style={{ listStyle: 'none' }}>
    {item.features.map((feature, idx) => (
      <motion.li
        key={idx}
        className="flex items-start gap-3 text-base text-gray-600 dark:text-gray-400"
        style={{ listStyle: 'none' }}
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ 
          duration: 0.6, 
          delay: 0.8 + (idx * 0.15)
        }}
        viewport={{ once: true }}
      >
        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
        <span>{feature}</span>
      </motion.li>
    ))}
  </ul>
)}

                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.0 }}
                    viewport={{ once: true }}
                  >
                    <div className="pt-6 md:pt-8">
                    <motion.div
                      whileHover={{
                        x: 2,
                        transition: { duration: 0.2, ease: "easeOut" }
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        onClick={() => navigate(item.link)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white border-none px-4 py-2 text-base rounded-lg cursor-pointer inline-flex items-center gap-2 transition-all duration-300 font-sans"
                      >
                        <span>Start {item.title.split(" ")[1]}</span>
                        <motion.div
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.div>
                      </button>
                    </motion.div>
                    </div>
                  </motion.div>
                </div>

                {/* Visual Side */}
                <motion.div
                  className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] transform-gpu perspective-1000"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <div className="w-full h-full flex items-center justify-center relative">
                    {item.visual === 'workout' && (
                      <motion.img
                        src={theme === 'dark' ? '/workout-dark.png' : '/workout-light.png'}
                        alt="Coding Challenges"
                        className="w-full h-auto object-contain"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        viewport={{ once: true }}
                      />
                    )}
                    
                    {item.visual === 'compiler' && (
                      <motion.img
                        src={theme === 'dark' ? '/compiler-dark.png' : '/compiler-light.png'}
                        alt="Code Compiler"
                        className="w-full h-auto object-contain"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        viewport={{ once: true }}
                      />
                    )}
                    
                    {item.visual === 'certification' && (
                      <motion.div
                        className="w-full h-full flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        viewport={{ once: true }}
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
          ) : (
            /* Regular sections without logos or visuals */
            <>
              <a
                href={item.link}
                className="marquee-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.link);
                }}
              >
                <h2
                  className={item.reverse ? "marquee-title-2" : "marquee-title"}
                >
                  <span>
                    <i>{item.title.split(" ")[0]}</i>{" "}
                    {item.title.split(" ").slice(1).join(" ")}
                  </span>
                </h2>
              </a>
              <p
                className={
                  item.reverse ? "marquee-subtext-2" : "marquee-subtext"
                }
              >
                {item.subtitle}
                <br />
                <br />
                <strong>{item.description}</strong>
                {item.features && (
                  <>
                    <br />
                    {item.features.map((feature, idx) => (
                      <span key={idx}>
                        • {feature}
                        <br />
                      </span>
                    ))}
                  </>
                )}
                {item.note && (
                  <>
                    <br />
                    <em>{item.note}</em>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      ))}

      {/* Reviews Section */}
      <div className="py-2 md:py-16">
        {/* Desktop: Two column layout with vertical scrolling */}
        <div className="hidden md:flex h-screen overflow-hidden">
          {/* Left column scrolling up */}
          <div className="flex-1 flex flex-col justify-start items-center overflow-hidden relative">
            <div className="flex flex-col gap-4 animate-scroll-up">
              {/* First set of reviews */}
              {[
                { name: "Daksh Mavani", text: "I had got myself enrolled in C language course as a beginner. We were given enough theory on all aspects of course so that we would be aware of all important concepts." },
                { name: "Loknath", text: "Through her experience ma'am has explained the concepts in a way in which everyone can understand easily. If one has pure interest in learning, he/she will thoroughly understand." },
                { name: "Sudhakar Reddy", text: "The tutor was really good and explained each and every topic clearly with personal care." },
                { name: "Pavan Vinayak", text: "TechLearn Solutions is an exceptional coding institution that provides comprehensive and engaging programming education." },
                { name: "Prakash", text: "Best institute for beginners to learn any programming language. The faculty was highly knowledgeable with personalized attention." }
              ].map((review, index) => (
                <div key={`left-first-${index}`} className="bg-transparent border-none rounded-3xl p-5 min-h-[90px] w-80 max-w-sm mx-auto">
                  <div className="font-bold mb-2 text-[#490096] dark:text-purple-300">{review.name}</div>
                  <div className="text-[#00195a] dark:text-gray-300 text-sm leading-relaxed line-clamp-2">{review.text}</div>
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {[
                { name: "Daksh Mavani", text: "I had got myself enrolled in C language course as a beginner. We were given enough theory on all aspects of course so that we would be aware of all important concepts." },
                { name: "Loknath", text: "Through her experience ma'am has explained the concepts in a way in which everyone can understand easily. If one has pure interest in learning, he/she will thoroughly understand." },
                { name: "Sudhakar Reddy", text: "The tutor was really good and explained each and every topic clearly with personal care." },
                { name: "Pavan Vinayak", text: "TechLearn Solutions is an exceptional coding institution that provides comprehensive and engaging programming education." },
                { name: "Prakash", text: "Best institute for beginners to learn any programming language. The faculty was highly knowledgeable with personalized attention." }
              ].map((review, index) => (
                <div key={`left-second-${index}`} className="bg-transparent border-none rounded-3xl p-5 min-h-[90px] w-80 max-w-sm mx-auto">
                  <div className="font-bold mb-2 text-[#490096] dark:text-purple-300">{review.name}</div>
                  <div className="text-[#00195a] dark:text-gray-300 text-sm leading-relaxed line-clamp-2">{review.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Center heading */}
          <div className="flex-none flex items-center justify-center px-5">
            <h2 className="text-3xl lg:text-4xl font-bold text-center brand-heading-primary">
              <span className="italic">learn</span> REVIEWS
            </h2>
          </div>

          {/* Right column scrolling down */}
          <div className="flex-1 flex flex-col justify-start items-center overflow-hidden relative">
            <div className="flex flex-col gap-4 animate-scroll-down">
              {/* First set of reviews */}
              {[
                { name: "Samuel Jude Philips", text: "Many people don't know about this centre due to its location but you'll go in as a beginner with zero knowledge and walk out confidently with all the necessary knowledge acquired!" },
                { name: "Prasanna", text: "Mam explains the class in a very good way. She takes many real-time examples and makes the topic clear to understand so that it makes us easy to take an interview." },
                { name: "Teja", text: "Very easy to understand the concept and faculty explain doubts very easily. Thank you Techlearn Solutions." },
                { name: "Rajani", text: "It was a great experience to be back in classroom after almost 25 years. Prashanthi Ma'm is subject expert with good grasp on fundamentals." },
                { name: "Shradha", text: "Very good learning experience. I have learnt C language in Techlearn Solutions and I feel really confident with the coding part." }
              ].map((review, index) => (
                <div key={`right-first-${index}`} className="bg-transparent border-none rounded-3xl p-5 min-h-[90px] w-80 max-w-sm mx-auto">
                  <div className="font-bold mb-2 text-[#490096] dark:text-purple-300">{review.name}</div>
                  <div className="text-[#00195a] dark:text-gray-300 text-sm leading-relaxed line-clamp-2">{review.text}</div>
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {[
                { name: "Samuel Jude Philips", text: "Many people don't know about this centre due to its location but you'll go in as a beginner with zero knowledge and walk out confidently with all the necessary knowledge acquired!" },
                { name: "Prasanna", text: "Mam explains the class in a very good way. She takes many real-time examples and makes the topic clear to understand so that it makes us easy to take an interview." },
                { name: "Teja", text: "Very easy to understand the concept and faculty explain doubts very easily. Thank you Techlearn Solutions." },
                { name: "Rajani", text: "It was a great experience to be back in classroom after almost 25 years. Prashanthi Ma'm is subject expert with good grasp on fundamentals." },
                { name: "Shradha", text: "Very good learning experience. I have learnt C language in Techlearn Solutions and I feel really confident with the coding part." }
              ].map((review, index) => (
                <div key={`right-second-${index}`} className="bg-transparent border-none rounded-3xl p-5 min-h-[90px] w-80 max-w-sm mx-auto">
                  <div className="font-bold mb-2 text-[#490096] dark:text-purple-300">{review.name}</div>
                  <div className="text-[#00195a] dark:text-gray-300 text-sm leading-relaxed line-clamp-2">{review.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: Horizontal scrolling layout */}
        <div className="md:hidden">
          {/* Mobile heading */}
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold brand-heading-primary">
              <span className="italic">learn</span> REVIEWS
            </h2>
          </div>

          {/* Horizontal scrolling reviews */}
          <div className="overflow-hidden pb-4 w-full">
            <div className="flex gap-4 animate-scroll-horizontal" style={{width: 'max-content', animationDuration: '50s'}}>
              {[
                { name: "Daksh Mavani", text: "I had got myself enrolled in C language course as a beginner. We were given enough theory on all aspects of course so that we would be aware of all important concepts." },
                { name: "Loknath", text: "Through her experience ma'am has explained the concepts in a way in which everyone can understand easily. If one has pure interest in learning, he/she will thoroughly understand." },
                { name: "Sudhakar Reddy", text: "The tutor was really good and explained each and every topic clearly with personal care." },
                { name: "Pavan Vinayak", text: "TechLearn Solutions is an exceptional coding institution that provides comprehensive and engaging programming education." },
                { name: "Prakash", text: "Best institute for beginners to learn any programming language. The faculty was highly knowledgeable with personalized attention." },
                { name: "Samuel Jude Philips", text: "Many people don't know about this centre due to its location but you'll go in as a beginner with zero knowledge and walk out confidently with all the necessary knowledge acquired!" },
                { name: "Prasanna", text: "Mam explains the class in a very good way. She takes many real-time examples and makes the topic clear to understand so that it makes us easy to take an interview." },
                { name: "Teja", text: "Very easy to understand the concept and faculty explain doubts very easily. Thank you Techlearn Solutions." },
                { name: "Rajani", text: "It was a great experience to be back in classroom after almost 25 years. Prashanthi Ma'm is subject expert with good grasp on fundamentals." },
                { name: "Shradha", text: "Very good learning experience. I have learnt C language in Techlearn Solutions and I feel really confident with the coding part." }
              ].map((review, index) => (
                <div key={`first-${index}`} className="bg-transparent border-none rounded-3xl p-4 min-h-[120px] w-72 flex-shrink-0">
                  <div className="font-bold mb-2 text-[#490096] dark:text-purple-300">{review.name}</div>
                  <div className="text-[#00195a] dark:text-gray-300 text-sm leading-relaxed line-clamp-3">{review.text}</div>
                </div>
              ))}
              {[
                { name: "Daksh Mavani", text: "I had got myself enrolled in C language course as a beginner. We were given enough theory on all aspects of course so that we would be aware of all important concepts." },
                { name: "Loknath", text: "Through her experience ma'am has explained the concepts in a way in which everyone can understand easily. If one has pure interest in learning, he/she will thoroughly understand." },
                { name: "Sudhakar Reddy", text: "The tutor was really good and explained each and every topic clearly with personal care." },
                { name: "Pavan Vinayak", text: "TechLearn Solutions is an exceptional coding institution that provides comprehensive and engaging programming education." },
                { name: "Prakash", text: "Best institute for beginners to learn any programming language. The faculty was highly knowledgeable with personalized attention." },
                { name: "Samuel Jude Philips", text: "Many people don't know about this centre due to its location but you'll go in as a beginner with zero knowledge and walk out confidently with all the necessary knowledge acquired!" },
                { name: "Prasanna", text: "Mam explains the class in a very good way. She takes many real-time examples and makes the topic clear to understand so that it makes us easy to take an interview." },
                { name: "Teja", text: "Very easy to understand the concept and faculty explain doubts very easily. Thank you Techlearn Solutions." },
                { name: "Rajani", text: "It was a great experience to be back in classroom after almost 25 years. Prashanthi Ma'm is subject expert with good grasp on fundamentals." },
                { name: "Shradha", text: "Very good learning experience. I have learnt C language in Techlearn Solutions and I feel really confident with the coding part." }
              ].map((review, index) => (
                <div key={`second-${index}`} className="bg-transparent border-none rounded-3xl p-4 min-h-[120px] w-72 flex-shrink-0">
                  <div className="font-bold mb-2 text-[#490096] dark:text-purple-300">{review.name}</div>
                  <div className="text-[#00195a] dark:text-gray-300 text-sm leading-relaxed line-clamp-3">{review.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CareersPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen showMessage={false} size={48} duration={800} />;
  }

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-transparent dark:bg-transparent">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Careers Page</h1>
        <p className="text-gray-600 dark:text-gray-300">Coming soon...</p>
      </div>
    </div>
  );
};

function FloatingCodeBackground() {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);
  return isAuthPage ? <FloatingCodeWords /> : null;
}

function LayoutWrapper() {
  const location = useLocation();
  // Hide header/footer for /coding/:linkId and /mcq/:linkId
  const codingRegex = /^\/coding\/[^/]+$/;
  const mcqRegex = /^\/mcq\/[^/]+$/;
  const showNavbar = !(codingRegex.test(location.pathname) || mcqRegex.test(location.pathname) || location.pathname === '/dashboard' || location.pathname === '/admin' || location.pathname === '/admin/codingroundupload');
  const showFooter = !(codingRegex.test(location.pathname) || mcqRegex.test(location.pathname));

  return (
    <div className="relative z-10 flex flex-col min-h-screen">
      {showNavbar && <Navbar />}

      <main className="flex-grow">
        <Routes>
          
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          
          
          <Route path="/profile" element={<Profile />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/colleges/:collegeId" element={<CollegeAssessment />} />

          
          <Route path="/learn" element={<LearnMain />} />
          <Route path="/learn/courses" element={<Courses />} />
          <Route path="/learn/courses/all" element={<AllCourses />} />
          <Route path="/learn/courses/:courseId" element={<CourseDetails />} />
          <Route path="/learn/courses/:courseId/topics" element={<CourseTopics />} />
          <Route path="/learn/courses/:courseId/quiz" element={<CourseQuiz />} />
          <Route path="/learn/batches/:batchId" element={<LiveBatchDetails />} />
          <Route path="/learn/exercises" element={<Exercises />} />
          <Route path="/learn/exercises/:courseId" element={<ExercisesList />} />
          <Route path="/learn/exercises/:courseId/:exerciseId" element={<ExerciseDetail />} />
          <Route path="/learn/certification" element={<Certification />} />
          <Route path="/learn/certification/payment" element={<CertificationPayment />} />
          <Route path="/learn/compiler" element={<OnlineCompiler />} />
          <Route path="/build" element={<BuildPageMain />} />
          <Route path="/build/mini/:id" element={<ProjectDetail />} />
          <Route path="/build/midproject/:id" element={<ProjectDetail />} />
          <Route path="/build/major/:id" element={<ProjectDetail />} />
          <Route path="/payment" element={<ProjectPayment />} />
           <Route path="/payment-gateway" element={<PaymentGateway />} />
          <Route path="/build/ui-library" element={<UILibrary />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/mcq/:linkId" element={<UserMcq />} />
          <Route path="/coding/:linkId" element={ <UserCoding />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          {/* All admin routes protected by AdminPrivateRoute */}
          <Route element={<AdminPrivateRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/courses" element={<Courses_Admin />} />
            <Route path="/admin/upload-topics" element={<UploadTopicsPage />} />
            <Route path="/admin/topics/:courseId" element={<AdminTopicsList />} />
            <Route path="/admin/topics/:courseId/edit/:topicId" element={<EditTopicForm />} />
            <Route path="/admin/codingroundupload"  element={<CodingRoundUpload/>} />
            <Route path="/admin/mcqupload" element={<McqUpload/>} />
            <Route path="/admin/upload-exercises" element={<UploadExercisesPage />} />
          </Route>
          <Route path="/about" element={<About />} />
          
        </Routes>
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <AuthModalProvider>
            
              <ScrollToTop />
              <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] transition-all duration-300">
                <FloatingCodeBackground />
                <LayoutWrapper />
              </div>
        
          </AuthModalProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
