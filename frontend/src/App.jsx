import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
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
import { motion, AnimatePresence } from 'framer-motion'
import FloatingCodeWords from './components/FloatingCodeWords'
import FloatingCourseLogos from './components/FloatingCourseLogos'
import LoadingScreen from './components/LoadingScreen'

// Admin Dashboard
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
import Signup from './pages/Auth/Signup'
import Dashboard from './pages/Dashboard/Dashboard'
import TrackTemplate from './pages/TrackTemplate/TrackTemplate'
import ChallengePage from './pages/ChallengePage'
import ResetPassword from './components/auth/ResetPassword';
import Projects from '../src/components/Dashboard/Projects'
import Leaderboard from './pages/Dashboard/Leaderboard';
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
import Certification from './pages/Learn/Certification'
import CertificationPayment from './pages/Learn/CertificationPayment'
import OnlineCompiler from './pages/Learn/OnlineCompiler'

// Build components
import BuildPageMain from './pages/Build/BuildPage'
import ProjectDetail from './pages/Build/ProjectDetail'
import MidProjectDetail from './pages/Build/MidProjectDetail'
import ProjectPayment from './pages/Build/ProjectPayment'
import PaymentGateway from './pages/Build/PaymentGateway'
import UILibrary from './pages/Build/UILibrary'
import Profile from './components/Dashboard/Profile'

import Analytics from './pages/AdminDashbaord/Analytics';
import SystemHealth from './pages/AdminDashbaord/SystemHealth';
import Colleges from './pages/AdminDashbaord/Colleges';
import Batches from './pages/AdminDashbaord/Batches';
import Students from './pages/AdminDashbaord/Students';
import QuestionBank from './pages/AdminDashbaord/QuestionBank';
import Resources from './pages/AdminDashbaord/Resources';
import Certificates from './pages/AdminDashbaord/Certificates';
import SubmissionMonitor from './pages/AdminDashbaord/SubmissionMonitor';
import Notifications from './pages/AdminDashbaord/Notifications';
import AuditLogs from './pages/AdminDashbaord/AuditLogs';
import Reports from './pages/AdminDashbaord/Reports';
import Contact from './pages/Contact/Contact'
import About from './pages/About/About'
import TermsAndConditions from './pages/About/TermsAndConditons';
import PrivacyPolicy from './pages/About/PrivacyPolicy';
import UserMcq from './pages/Mcq/UserMcq'

// Homepage component (Kept exactly the same as your original)
const HomePage = () => {
  const navigate = useNavigate()
  const bottomTextRef = useRef(null)
  const [isBottomTextInViewport, setIsBottomTextInViewport] = useState(false)
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const fullText = "Techlearn;"
  const headingRef = useRef(null)
  const statsRef = useRef(null)
  const [animatedStats, setAnimatedStats] = useState({ courses: 0, batches: 0, students: 0, rating: 0 })
  const marqueeRefs = useRef([])

  const statsData = [
    { target: 10, label: "Courses Offered", suffix: "+" },
    { target: 400, label: "Batches Completed", suffix: "+" },
    { target: 5101, label: "Students Trained", suffix: "+" },
    { target: 4.6, label: "Google Rating", isDecimal: true }
  ]

  const marqueeData = [
    {
      title: "tech PREP",
      subtitle: "Struggling with technical rounds or job interviews?",
      description: "Tech Prep is your comprehensive solution for mastering technical interviews and landing your dream job.",
      features: ["Placement-focused courses with 90% success rate", "Live classes with real hiring patterns"],
      link: "/learn"
    },
    {
      title: "mini PROJECTS",
      subtitle: "Mini Projects — because upskilling is what we do.",
      description: "Transform your learning journey with hands-on mini projects that bridge the gap between theory and practice.",
      features: ["20+ guided mini projects across different technologies", "Portfolio-ready projects"],
      link: "/build",
      reverse: true
    }
  ]

  useEffect(() => {
    const element = headingRef.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isTyping) {
          setIsTyping(true); setDisplayedText(""); setCurrentIndex(0);
        } else if (!entry.isIntersecting && isTyping) {
          setIsTyping(false); setDisplayedText(""); setCurrentIndex(0);
        }
      },
      { threshold: 0.3, rootMargin: '0px' }
    )
    observer.observe(element)
    return () => observer.unobserve(element)
  }, [isTyping])

  useEffect(() => {
    if (isTyping && currentIndex < fullText.length) {
      const charDelay = window.innerWidth <= 480 ? 120 : 75
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, charDelay)
      return () => clearTimeout(timeout)
    }
  }, [currentIndex, fullText, isTyping])

  return (
    <div className="bg-transparent dark:bg-transparent relative">
      <div className="h-screen flex flex-col items-center justify-center px-6 relative pt-16">
        <FloatingCourseLogos />
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="mb-4">
            <div ref={headingRef} className="font-bold text-[#001862] dark:text-[#ffffffde] font-poppins relative" style={{ fontWeight: 700, lineHeight: 1.2, marginBottom: '10px', marginTop: '10%', fontSize: 'clamp(42px, 8vw, 110px)', textAlign: 'center' }}>
              <span style={{ visibility: 'hidden', whiteSpace: 'nowrap' }} aria-hidden="true">{fullText}</span>
              <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', letterSpacing: '0.1em' }}>{displayedText}</span>
            </div>
            <h2 className="font-medium text-[#002d88] dark:text-[#ffffffde] font-poppins" style={{ fontWeight: 500, marginTop: '10px', fontSize: 'clamp(15px, 3vw, 25px)' }}>
              Don't Just Use Technology, Build It.
            </h2>
          </div>
          <button onClick={() => navigate('/learn/courses')} className="inline-block font-poppins font-semibold rounded-lg transition-all duration-300 px-6 py-3 md:px-8 md:py-3 text-sm md:text-base mt-6 md:mt-8" style={{ backgroundColor: '#ffffffac', color: '#001242', border: 'none', cursor: 'pointer' }} onMouseEnter={(e) => { e.target.style.backgroundColor = '#001242'; e.target.style.color = '#ffffff' }} onMouseLeave={(e) => { e.target.style.backgroundColor = '#ffffffac'; e.target.style.color = '#001242' }}>
            Start for Free
          </button>
        </div>
      </div>
    </div>
  )
}

const CareersPage = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const timer = setTimeout(() => setLoading(false), 1000); return () => clearTimeout(timer); }, []);
  if (loading) return <LoadingScreen showMessage={false} size={48} duration={800} />;
  return <div className="min-h-screen pt-24 pb-16 flex items-center justify-center"><h1 className="text-3xl font-bold">Careers Page</h1></div>;
};

function FloatingCodeBackground() {
  const location = useLocation();
  return ['/signup'].includes(location.pathname) ? <FloatingCodeWords /> : null;
}

function LayoutWrapper() {
  const location = useLocation();
  
  // Base dashboard routes
  const adminSidebarRoutes = [
    '/dashboard', '/projects', '/leaderboard', '/profile', '/analytics', '/system-health', 
    '/colleges', '/batches', '/students', '/question-bank', '/track-templates', 
    '/resources', '/certificates', '/submission-monitor', '/notifications', 
    '/audit-logs', '/reports'
  ];

  // SUPER IMPORTANT FIX: Use startsWith to blanket-catch all sub-routes 
  const isDashboardRoute = adminSidebarRoutes.includes(location.pathname) || 
                           location.pathname.startsWith('/track/') ||
                           location.pathname.startsWith('/admin') ||
                           location.pathname.startsWith('/learn') || 
                           location.pathname.startsWith('/projects') ||
                           location.pathname.startsWith('/build');

  const showNavbar = !['/admin', '/mcq', '/admin/codingroundupload'].includes(location.pathname) && 
                     !location.pathname.startsWith('/coding/') && 
                     !isDashboardRoute;

  const showFooter = !['/mcq'].includes(location.pathname) && 
                     !location.pathname.startsWith('/coding/') && 
                     !isDashboardRoute;

  return (
    <div className="relative z-10 flex flex-col min-h-screen">
      {showNavbar && <Navbar />}

      <main className="flex-grow">
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/track-templates" element={<TrackTemplate />} />
            <Route path="/track/:trackId/day/:dayId" element={<ChallengePage />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
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
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/mcq/:linkId" element={<UserMcq />} />
          <Route path="/coding/:linkId" element={<UserCoding />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          
          <Route element={<AdminPrivateRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/courses" element={<Courses_Admin />} />
            <Route path="/admin/upload-topics" element={<UploadTopicsPage />} />
            <Route path="/admin/topics/:courseId" element={<AdminTopicsList />} />
            <Route path="/admin/topics/:courseId/edit/:topicId" element={<EditTopicForm />} />
            <Route path="/admin/codingroundupload" element={<CodingRoundUpload />} />
            <Route path="/admin/mcqupload" element={<McqUpload />} />
            <Route path="/admin/upload-exercises" element={<UploadExercisesPage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/system-health" element={<SystemHealth />} />
            <Route path="/colleges" element={<Colleges />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/students" element={<Students />} />
            <Route path="/question-bank" element={<QuestionBank />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/submission-monitor" element={<SubmissionMonitor />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/reports" element={<Reports />} />
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