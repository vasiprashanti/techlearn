import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ExternalLinkHandler from './components/ExternalLinkHandler'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { AuthModalProvider } from './context/AuthModalContext'
import { UserProvider } from './context/UserContext'
import PrivateRoute from './Routes/PrivateRoute'
import AdminPrivateRoute from './Routes/AdminPrivateRoute'
import FloatingCodeWords from './components/FloatingCodeWords'

const HomePage = lazy(() => import('./pages/HomePage'))
const Signup = lazy(() => import('./pages/Auth/Signup'))
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'))
const Performance = lazy(() => import('./pages/Dashboard/Performance'))
const DailyChallenge = lazy(() => import('./pages/Dashboard/DailyChallenge'))
const DashboardSettings = lazy(() => import('./pages/Dashboard/Settings'))
const Languages = lazy(() => import('./pages/Dashboard/Languages'))
const Concepts = lazy(() => import('./pages/Dashboard/Concepts'))
const ImportantConceptDetail = lazy(() => import('./pages/Dashboard/ImportantConceptDetail'))
const ResourcesHub = lazy(() => import('./pages/Dashboard/ResourcesHub'))
const Projects = lazy(() => import('./components/Dashboard/Projects'))
const Profile = lazy(() => import('./components/Dashboard/Profile'))
const Leaderboard = lazy(() => import('./pages/Dashboard/Leaderboard'))
const UserCoding = lazy(() => import('./pages/Coding/UserCoding'))
const UserMcq = lazy(() => import('./pages/Mcq/UserMcq'))
const DailyChallengeAccess = lazy(() => import('./pages/DailyChallenge/DailyChallengeAccess'))
const DailyChallengeInstructions = lazy(() => import('./pages/DailyChallenge/DailyChallengeInstructions'))
const DailyChallengeTest = lazy(() => import('./pages/DailyChallenge/DailyChallengeTest'))
const DailyChallengeResult = lazy(() => import('./pages/DailyChallenge/DailyChallengeResult'))

const LearnMain = lazy(() => import('./pages/Learn/LearnMain'))
const CourseDetails = lazy(() => import('./pages/Learn/CourseDetails'))
const CourseQuiz = lazy(() => import('./pages/Learn/CourseQuiz'))
const CourseTopics = lazy(() => import('./pages/Learn/CourseTopics'))
const LiveBatchDetails = lazy(() => import('./pages/Learn/LiveBatchDetails'))
const AllInterviewQuestions = lazy(() => import('./pages/Learn/AllInterviewQuestions'))
const PracticeHub = lazy(() => import('./pages/Learn/PracticeHub'))
const DsaQuestions = lazy(() => import('./pages/Learn/DsaQuestions'))
const SqlQuestions = lazy(() => import('./pages/Learn/SqlQuestions'))
const CoreCsQuestions = lazy(() => import('./pages/Learn/CoreCsQuestions'))
const AptitudeQuestions = lazy(() => import('./pages/Learn/AptitudeQuestions'))
const CompanyQuestions = lazy(() => import('./pages/Learn/CompanyQuestions'))
const InterviewDsaQuestionDetail = lazy(() => import('./pages/Learn/InterviewDsaQuestionDetail'))
const InterviewSqlQuestionDetail = lazy(() => import('./pages/Learn/InterviewSqlQuestionDetail'))
const InterviewCoreCsQuestionDetail = lazy(() => import('./pages/Learn/InterviewCoreCsQuestionDetail'))
const InterviewCompanyQuestionDetail = lazy(() => import('./pages/Learn/InterviewCompanyQuestionDetail'))
const InterviewAptitudeQuestionDetail = lazy(() => import('./pages/Learn/InterviewAptitudeQuestionDetail'))
const CompanyMockQuestionDetail = lazy(() => import('./pages/Learn/CompanyMockQuestionDetail'))
const Exercises = lazy(() => import('./pages/Learn/Exercises'))
const ExercisesList = lazy(() => import('./pages/Learn/ExercisesList'))
const ExerciseDetail = lazy(() => import('./pages/Learn/ExerciseDetail'))
const Certification = lazy(() => import('./pages/Learn/Certification'))
const CertificationPayment = lazy(() => import('./pages/Learn/CertificationPayment'))
const OnlineCompiler = lazy(() => import('./pages/Learn/OnlineCompiler'))

const Roadmaps = lazy(() => import('./pages/Resources/Roadmaps'))
const ResumeTemplates = lazy(() => import('./pages/Resources/ResumeTemplates'))
const TrackTemplate = lazy(() => import('./pages/TrackTemplate/TrackTemplate'))
const TrackTemplateDetails = lazy(() => import('./pages/TrackTemplate/TrackTemplateDetails'))
const ChallengePage = lazy(() => import('./pages/ChallengePage'))

const BuildPageMain = lazy(() => import('./pages/Build/BuildPage'))
const ProjectDetail = lazy(() => import('./pages/Build/ProjectDetail'))
const ProjectPayment = lazy(() => import('./pages/Build/ProjectPayment'))
const PaymentGateway = lazy(() => import('./pages/Build/PaymentGateway'))
const UILibrary = lazy(() => import('./pages/Build/UILibrary'))

const AdminDashboard = lazy(() => import('./pages/AdminDashbaord/AdminDashboard'))
const UploadTopicsPage = lazy(() => import('./pages/AdminDashbaord/UploadTopicsPage'))
const Courses_Admin = lazy(() => import('./pages/AdminDashbaord/Courses'))
const AdminTopicsList = lazy(() => import('./pages/AdminDashbaord/AdminTopicsList'))
const EditTopicForm = lazy(() => import('./pages/AdminDashbaord/EditTopicForm'))
const McqUpload = lazy(() => import('./pages/AdminDashbaord/McqUpload'))
const UploadExercisesPage = lazy(() => import('./pages/AdminDashbaord/UploadExercisesPage'))
const CodingRoundUpload = lazy(() => import('./pages/AdminDashbaord/CodingRoundUpload'))
const Analytics = lazy(() => import('./pages/AdminDashbaord/Analytics'))
const SystemHealth = lazy(() => import('./pages/AdminDashbaord/SystemHealth'))
const Colleges = lazy(() => import('./pages/AdminDashbaord/Colleges'))
const CollegeDetails = lazy(() => import('./pages/AdminDashbaord/CollegeDetails'))
const Batches = lazy(() => import('./pages/AdminDashbaord/Batches'))
const BatchDetails = lazy(() => import('./pages/AdminDashbaord/BatchDetails'))
const Students = lazy(() => import('./pages/AdminDashbaord/Students'))
const QuestionBankAdminPage = lazy(() => import('./pages/Admin/QuestionBankAdminPage'))
const QuestionBankCategoryDetailPage = lazy(() => import('./pages/Admin/QuestionBankCategoryDetailPage'))
const Resources = lazy(() => import('./pages/AdminDashbaord/Resources'))
const Certificates = lazy(() => import('./pages/AdminDashbaord/Certificates'))
const SubmissionMonitor = lazy(() => import('./pages/AdminDashbaord/SubmissionMonitor'))
const AuditLogs = lazy(() => import('./pages/AdminDashbaord/AuditLogs'))
const Reports = lazy(() => import('./pages/AdminDashbaord/Reports'))
const Settings = lazy(() => import('./pages/AdminDashbaord/Settings'))

const Contact = lazy(() => import('./pages/Contact/Contact'))
const About = lazy(() => import('./pages/About/About'))
const TermsAndConditions = lazy(() => import('./pages/About/TermsAndConditons'))
const PrivacyPolicy = lazy(() => import('./pages/About/PrivacyPolicy'))

const CareersPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-transparent dark:bg-transparent">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#7ec9ff] border-t-transparent" />
      </div>
    );
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

function DelayedAnalytics() {
  useEffect(() => {
    if (window.__techlearnAnalyticsLoaded) return undefined;

    const loadAnalytics = () => {
      if (window.__techlearnAnalyticsLoaded) return;
      window.__techlearnAnalyticsLoaded = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', 'G-C1SXKD3LMD');

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-C1SXKD3LMD';
      document.head.appendChild(script);
    };

    const timeoutId = window.setTimeout(loadAnalytics, 5000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return null;
}

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#7ec9ff] border-t-transparent" />
    </div>
  );
}

function LayoutWrapper() {
  const location = useLocation();

  // NEW: Array containing all our sidebar dashboard routes
  const adminSidebarRoutes = [
    '/analytics', 
    '/system-health', 
    '/colleges', 
    '/batches', 
    '/students', 
    '/question-bank', 
    '/track-templates', 
    '/admin/roadmaps', 
    '/certificates', 
    '/submission-monitor', 
    '/audit-logs',  
    '/reports',
    '/settings'
  ];

  const isDashboardRoute = adminSidebarRoutes.includes(location.pathname) || 
                           location.pathname.startsWith('/colleges/') ||
                           location.pathname.startsWith('/batches/') ||
                           location.pathname.startsWith('/question-bank/') ||
                           location.pathname.startsWith('/track-templates/') ||
                           location.pathname.startsWith('/track/') ||
                           location.pathname.startsWith('/admin');

  const isStudentSidebarRoute =
    ['/projects', '/leaderboard'].includes(location.pathname) ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/interview/') ||
    location.pathname.startsWith('/learn/interview-questions') ||
    location.pathname.startsWith('/core-prep/languages') ||
    location.pathname.startsWith('/core-prep/important-concepts') ||
    location.pathname.startsWith('/resources/roadmaps') ||
    location.pathname.startsWith('/resources/resume-templates') ||
    location.pathname.startsWith('/learn/exercises') ||
    location.pathname === '/dashboard/profile' ||
    location.pathname.startsWith('/dashboard/profile/');

  const showNavbar = !['/mcq'].includes(location.pathname) && 
                     !location.pathname.startsWith('/coding/') && 
                     !location.pathname.startsWith('/daily-challenge/');

  const showFooter = !['/mcq'].includes(location.pathname) && 
                     !location.pathname.startsWith('/coding/') && 
                     !location.pathname.startsWith('/daily-challenge/') &&
                     !isDashboardRoute &&
                     !isStudentSidebarRoute;

  return (
    <div className="relative z-10 flex flex-col min-h-screen">
      {showNavbar && <Navbar />}

      <Suspense fallback={<main className="flex-grow"><RouteFallback /></main>}>
        <main className="flex-grow">
          <Routes>
          <Route path="/login" element={<Navigate to="/signup" replace />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/daily-challenge" element={<DailyChallenge />} />
            <Route path="/daily-challenge/:linkId" element={<DailyChallengeAccess />} />
            <Route path="/daily-challenge/:linkId/instructions" element={<DailyChallengeInstructions />} />
            <Route path="/daily-challenge/:linkId/test" element={<DailyChallengeTest />} />
            <Route path="/daily-challenge/:linkId/result" element={<DailyChallengeResult />} />
            <Route path="/dashboard/roadmap" element={<Roadmaps />} />
            <Route path="/dashboard/practice" element={<PracticeHub />} />
            <Route path="/dashboard/practice/core-cs" element={<CoreCsQuestions />} />
            <Route path="/dashboard/practice/core-cs/:questionId" element={<InterviewCoreCsQuestionDetail />} />
            <Route path="/dashboard/practice/aptitude" element={<AptitudeQuestions />} />
            <Route path="/dashboard/practice/aptitude/:questionId" element={<InterviewAptitudeQuestionDetail />} />
            <Route path="/dashboard/practice/sql" element={<SqlQuestions />} />
            <Route path="/dashboard/practice/dsa" element={<DsaQuestions />} />
            <Route path="/dashboard/practice/dsa/:questionId" element={<InterviewDsaQuestionDetail />} />
            <Route path="/dashboard/practice/sql/:questionId" element={<InterviewSqlQuestionDetail />} />
            <Route path="/dashboard/practice/company-based" element={<CompanyQuestions />} />
            <Route path="/dashboard/practice/company-based/:questionId" element={<InterviewCompanyQuestionDetail />} />
            <Route path="/dashboard/practice/company-based/mock/:company/:questionId" element={<CompanyMockQuestionDetail />} />
            <Route path="/dashboard/performance" element={<Performance />} />
            <Route path="/dashboard/leaderboard" element={<Leaderboard />} />
             <Route path="/dashboard/resources" element={<ResourcesHub />} />
            <Route path="/dashboard/resources/free-courses" element={<Navigate to="/learn" replace />} />
            <Route path="/dashboard/resources/important-concepts" element={<Concepts />} />
            <Route path="/dashboard/resources/important-concepts/:conceptId" element={<ImportantConceptDetail />} />
            <Route path="/dashboard/resources/free-certifications" element={<Certification />} />
            <Route path="/dashboard/resources/resume-templates" element={<ResumeTemplates />} />
            <Route path="/dashboard/account" element={<Navigate to="/dashboard/profile" replace />} />
            <Route path="/dashboard/profile/settings" element={<DashboardSettings />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/learn/interview-questions" element={<AllInterviewQuestions />} />
            <Route path="/learn/interview-questions/dsa" element={<DsaQuestions />} />
            <Route path="/learn/interview-questions/sql" element={<SqlQuestions />} />
            <Route path="/learn/interview-questions/core-cs" element={<CoreCsQuestions />} />
            <Route path="/learn/interview-questions/aptitude" element={<AptitudeQuestions />} />
            <Route path="/learn/interview-questions/company" element={<CompanyQuestions />} />
            <Route path="/learn/interview-questions/dsa/:questionId" element={<InterviewDsaQuestionDetail />} />
            <Route path="/learn/interview-questions/sql/:questionId" element={<InterviewSqlQuestionDetail />} />
            <Route path="/learn/interview-questions/core-cs/:questionId" element={<InterviewCoreCsQuestionDetail />} />
            <Route path="/learn/interview-questions/aptitude/:questionId" element={<InterviewAptitudeQuestionDetail />} />
            <Route path="/learn/interview-questions/company/:questionId" element={<InterviewCompanyQuestionDetail />} />
            <Route path="/learn/interview-questions/company/mock/:company/:questionId" element={<CompanyMockQuestionDetail />} />
            <Route path="/interview/all-questions" element={<AllInterviewQuestions />} />
            <Route path="/interview/dsa-questions" element={<DsaQuestions />} />
            <Route path="/interview/sql-questions" element={<SqlQuestions />} />
            <Route path="/interview/core-cs-questions" element={<CoreCsQuestions />} />
            <Route path="/interview/company-based-questions" element={<CompanyQuestions />} />
            <Route path="/core-prep/languages" element={<Languages />} />
            <Route path="/core-prep/important-concepts" element={<Concepts />} />
            <Route path="/core-prep/important-concepts/:conceptId" element={<ImportantConceptDetail />} />
            <Route path="/resources/roadmaps" element={<Roadmaps />} />
            <Route path="/resources/resume-templates" element={<ResumeTemplates />} />
            <Route path="/track/:trackId/day/:dayId" element={<ChallengePage />} />
          </Route>
          
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/dashboard/profile/edit" element={<Navigate to="/dashboard/profile/settings" replace />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/learn" element={<LearnMain />} />
          <Route path="/learn/courses" element={<Navigate to="/learn" replace />} />
          <Route path="/learn/courses/all" element={<Navigate to="/learn" replace />} />
          <Route path="/learn/courses/:courseId" element={<CourseDetails />} />
          <Route path="/learn/courses/:courseId/topics" element={<CourseTopics />} />
          <Route path="/learn/courses/:courseId/quiz" element={<CourseQuiz />} />
          <Route path="/learn/batches/:batchId" element={<LiveBatchDetails />} />
          <Route path="/learn/exercises" element={<Exercises />} />
          <Route path="/learn/exercises/:courseId" element={<ExercisesList />} />
          <Route path="/learn/exercises/:courseId/:exerciseId" element={<ExerciseDetail />} />
          <Route path="/learn/certification" element={<Certification />} />
          <Route path="/learn/certification/payment" element={<CertificationPayment />} />
          <Route path="/compiler" element={<OnlineCompiler />} />
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
          
          {/* All admin routes protected by AdminPrivateRoute */}
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
<Route path="/colleges/:collegeId" element={<CollegeDetails />} />
<Route path="/batches" element={<Batches />} />
<Route path="/batches/:batchId" element={<BatchDetails />} />
<Route path="/students" element={<Students />} />
<Route path="/admin/question-bank" element={<QuestionBankAdminPage />} />
<Route path="/admin/question-bank/:categoryId" element={<QuestionBankCategoryDetailPage />} />
<Route path="/question-bank" element={<QuestionBankAdminPage />} />
<Route path="/question-bank/:categoryId" element={<QuestionBankCategoryDetailPage />} />
<Route path="/track-templates" element={<TrackTemplate />} />
<Route path="/track-templates/:templateId" element={<TrackTemplateDetails />} />
<Route path="/admin/roadmaps" element={<Resources />} />
<Route path="/certificates" element={<Certificates />} />
<Route path="/submission-monitor" element={<SubmissionMonitor />} />
<Route path="/audit-logs" element={<AuditLogs />} />
<Route path="/reports" element={<Reports />} />
<Route path="/settings" element={<Settings />} />


          </Route>
          
          <Route path="/about" element={<About />} />
          </Routes>
        </main>

        {showFooter && <Footer />}
      </Suspense>
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
              <ExternalLinkHandler />
              <DelayedAnalytics />
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
