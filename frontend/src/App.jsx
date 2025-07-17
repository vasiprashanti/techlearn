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

// Motion for animations
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import FloatingCodeWords from './components/FloatingCodeWords'
import FloatingCourseLogos from './components/FloatingCourseLogos'
import LoadingScreen from './components/LoadingScreen'

//Admin Dashboard
import AdminDashboard from './pages/Admin/AdminDashboard';
import PaymentConfirm from './pages/Admin/PaymentConfirm';
import { RequireAuth } from './components/RequireAuth';

// Auth pages
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import Dashboard from './pages/Dashboard/Dashboard'
import ResetPassword from './components/auth/ResetPassword';
import Projects from '../src/components/Dashboard/Projects'

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

// Homepage component
const HomePage = () => {
  const navigate = useNavigate()
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
      title: "tech PREP",
      subtitle: "Struggling with technical rounds or job interviews?",
      description: "Tech Prep is your comprehensive solution for mastering technical interviews and landing your dream job. Our carefully curated curriculum covers data structures, algorithms, system design, and behavioral interview techniques. With real-world coding challenges, mock interviews, and personalized feedback from industry experts, you'll build the confidence and skills needed to excel in any technical interview. From FAANG companies to startups, our proven methodology has helped thousands of students secure positions at top tech companies.",
      features: ["Placement-focused courses with 90% success rate", "Live classes with real hiring patterns from top companies", "1-on-1 mock interviews with industry professionals", "Comprehensive system design workshops"],
      link: "/learn"
    },
    {
      title: "mini PROJECTS",
      subtitle: "Mini Projects — because upskilling is what we do.",
      description: "Transform your learning journey with hands-on mini projects that bridge the gap between theory and practice. Each project is carefully designed to reinforce fundamental concepts while building real-world applications that showcase your skills to potential employers. From simple calculators to complex web applications, you'll progressively build a diverse portfolio that demonstrates your growth as a developer. Our project-based learning approach ensures you not only understand the concepts but can apply them effectively in professional environments.",
      features: ["20+ guided mini projects across different technologies", "Step-by-step tutorials with code explanations", "Portfolio-ready projects with deployment guides", "Peer code reviews and feedback sessions"],
      link: "/build",
      reverse: true
    },
    {
      title: "summer INTERN",
      subtitle: "Join live internships in Web Dev, UI/UX Design, or Content Creation.",
      description: "Gain invaluable real-world experience through our comprehensive internship program designed to bridge the gap between academic learning and professional development. Work on live projects with established companies, receive personalized mentorship from industry veterans, and build a professional network that will accelerate your career. Our internships offer hands-on experience in cutting-edge technologies, collaborative team environments, and the opportunity to contribute to meaningful projects that impact real users and businesses.",
      features: ["3-6 month structured internship programs", "Direct mentorship from senior developers and designers", "Real client projects with measurable impact", "Certificate of completion and LinkedIn recommendations"],
      note: "Summer positions filled — Winter applications open in November.",
      link: "/careers"
    },
    {
      title: "design LAB",
      subtitle: "DesignLab is our open-source UI library with ready-to-use buttons, loaders, forms, toggles, radios, and more.",
      description: "Revolutionize your development workflow with our comprehensive open-source UI component library, meticulously crafted to accelerate your design and development process. DesignLab provides production-ready, accessible, and customizable components that follow modern design principles and best practices. From elegant buttons and smooth animations to complex form elements and interactive toggles, every component is built with performance, accessibility, and developer experience in mind. Save countless hours of development time while maintaining consistent, professional design standards across all your projects.",
      features: ["50+ production-ready UI components", "Full accessibility compliance (WCAG 2.1)", "Dark mode support and theme customization", "React, Vue, and vanilla JavaScript versions"],
      link: "/build",
      reverse: true
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
            onClick={() => navigate('/learn')}
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
              <p className="text-sm md:text-base text-[#000234] dark:text-[#555] mt-2 font-inter">
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
          className={item.reverse ? "marquee-header-2" : "marquee-header"}
          ref={el => marqueeRefs.current[index] = el}
        >
          <a
            href={item.link}
            className="marquee-link"
            onClick={(e) => {
              e.preventDefault();
              navigate(item.link);
            }}
          >
            <h2 className={item.reverse ? "marquee-title-2" : "marquee-title"}>
              <span>
                <i>{item.title.split(' ')[0]}</i> {item.title.split(' ').slice(1).join(' ')}
              </span>
            </h2>
          </a>
          <p className={item.reverse ? "marquee-subtext-2" : "marquee-subtext"}>
            {item.subtitle}<br/><br/>
            <strong>{item.description}</strong>
            {item.features && (
              <>
                <br/>
                {item.features.map((feature, idx) => (
                  <span key={idx}>• {feature}<br/></span>
                ))}
              </>
            )}
            {item.note && (
              <>
                <br/>
                <em>{item.note}</em>
              </>
            )}
          </p>
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
            <div className="flex gap-4 animate-scroll-horizontal" style={{width: 'max-content'}}>
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
  const showNavbar = !['/dashboard'].includes(location.pathname);

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
          <Route 
  path="/admin" 
  element={
    <RequireAuth adminOnly={true}>
      <AdminDashboard />
    </RequireAuth>
  } 
/>
<Route 
  path="/admin/payments/:paymentId" 
  element={
    <RequireAuth adminOnly={true}>
      <PaymentConfirm />
    </RequireAuth>
  } 
/>
          
        </Routes>
      </main>
      
      <Footer />
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
