import { Routes, Route, useLocation, Navigate, Link } from 'react-router-dom'
import { Suspense, useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ErrorBoundary from './components/ErrorBoundary'
import lazyWithRetry from './utils/lazyWithRetry'
import ExternalLinkHandler from './components/ExternalLinkHandler'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AuthModalProvider } from './context/AuthModalContext'
import { UserProvider } from './context/UserContext'
import PrivateRoute from './Routes/PrivateRoute'
import AdminPrivateRoute from './Routes/AdminPrivateRoute'
import FloatingCodeWords from './components/FloatingCodeWords';
import EditHiringJob from "./pages/AdminDashbaord/EditHiringJob";

const Jobs = lazyWithRetry(() => import('./pages/Jobs'));
const Hiring = lazyWithRetry(() => import("./pages/AdminDashbaord/Hiring.jsx"));
const HomePage = lazyWithRetry(() => import('./pages/HomePage'))
const Signup = lazyWithRetry(() => import('./pages/Auth/Signup'))
const ResetPassword = lazyWithRetry(() => import('./components/auth/ResetPassword'))
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard/Dashboard'))
const DemoDashboard = lazyWithRetry(() => import('./pages/Dashboard/Demo'))
const ProjectDayNotes = lazyWithRetry(() => import('./pages/Dashboard/ProjectDayNotes'))
const ProjectOverview = lazyWithRetry(() => import('./pages/Dashboard/ProjectOverview'))
const Performance = lazyWithRetry(() => import('./pages/Dashboard/Reports'))
const DashboardSettings = lazyWithRetry(() => import('./pages/Dashboard/Settings'))
const OnboardingPrograms = lazyWithRetry(() => import('./pages/Onboarding/OnboardingPrograms'))
const Languages = lazyWithRetry(() => import('./pages/Dashboard/Languages'))
const Concepts = lazyWithRetry(() => import('./pages/Dashboard/Concepts'))
const ImportantConceptDetail = lazyWithRetry(() => import('./pages/Dashboard/ImportantConceptDetail'))
const ResourcesHub = lazyWithRetry(() => import('./pages/Dashboard/ResourcesHub'))
const Projects = lazyWithRetry(() => import('./components/Dashboard/Projects'))
const Profile = lazyWithRetry(() => import('./components/Dashboard/Profile'))
const Leaderboard = lazyWithRetry(() => import('./pages/Dashboard/Leaderboard'))
const UserCoding = lazyWithRetry(() => import('./pages/Coding/UserCoding'))
const UserMcq = lazyWithRetry(() => import('./pages/Mcq/UserMcq'))
const DailyChallengeAccess = lazyWithRetry(() => import('./pages/DailyChallenge/DailyChallengeAccess'))
const DailyChallengeInstructions = lazyWithRetry(() => import('./pages/DailyChallenge/DailyChallengeInstructions'))
const DailyChallengeTest = lazyWithRetry(() => import('./pages/DailyChallenge/DailyChallengeTest'))
const DailyChallengeResult = lazyWithRetry(() => import('./pages/DailyChallenge/DailyChallengeResult'))

const LearnMain = lazyWithRetry(() => import('./pages/Learn/LearnMain'))
const WaitlistPage = lazyWithRetry(() => import('./pages/Learn/WaitlistPage'))
const CourseDetails = lazyWithRetry(() => import('./pages/Learn/CourseDetails'))
const CourseQuiz = lazyWithRetry(() => import('./pages/Learn/CourseQuiz'))
const CourseTopics = lazyWithRetry(() => import('./pages/Learn/CourseTopics'))
const ProgramPreview = lazyWithRetry(() => import('./pages/Learn/ProgramPreview'))
const ProgramPricingPage = lazyWithRetry(() => import('./pages/Learn/ProgramPricingPage'))
const PaymentStatus = lazyWithRetry(() => import('./pages/Learn/PaymentStatus'))
const LiveBatchDetails = lazyWithRetry(() => import('./pages/Learn/LiveBatchDetails'))
const AllInterviewQuestions = lazyWithRetry(() => import('./pages/Learn/AllInterviewQuestions'))
const PracticeHub = lazyWithRetry(() => import('./pages/Learn/PracticeHub'))
const DsaQuestions = lazyWithRetry(() => import('./pages/Learn/DsaQuestions'))
const SqlQuestions = lazyWithRetry(() => import('./pages/Learn/SqlQuestions'))
const CoreCsQuestions = lazyWithRetry(() => import('./pages/Learn/CoreCsQuestions'))
const AptitudeQuestions = lazyWithRetry(() => import('./pages/Learn/AptitudeQuestions'))
const CompanyQuestions = lazyWithRetry(() => import('./pages/Learn/CompanyQuestions'))
const InterviewDsaQuestionDetail = lazyWithRetry(() => import('./pages/Learn/InterviewDsaQuestionDetail'))
const InterviewSqlQuestionDetail = lazyWithRetry(() => import('./pages/Learn/InterviewSqlQuestionDetail'))
const InterviewCoreCsQuestionDetail = lazyWithRetry(() => import('./pages/Learn/InterviewCoreCsQuestionDetail'))
const InterviewCompanyQuestionDetail = lazyWithRetry(() => import('./pages/Learn/InterviewCompanyQuestionDetail'))
const InterviewAptitudeQuestionDetail = lazyWithRetry(() => import('./pages/Learn/InterviewAptitudeQuestionDetail'))
const CompanyMockQuestionDetail = lazyWithRetry(() => import('./pages/Learn/CompanyMockQuestionDetail'))
const Exercises = lazyWithRetry(() => import('./pages/Learn/Exercises'))
const ExercisesList = lazyWithRetry(() => import('./pages/Learn/ExercisesList'))
const ExerciseDetail = lazyWithRetry(() => import('./pages/Learn/ExerciseDetail'))
const Certification = lazyWithRetry(() => import('./pages/Learn/Certification'))
const CertificationPayment = lazyWithRetry(() => import('./pages/Learn/CertificationPayment'))
const OnlineCompiler = lazyWithRetry(() => import('./pages/Learn/OnlineCompiler'))
const DynamicPracticeQuestions = lazyWithRetry(() => import('./pages/Learn/DynamicPracticeQuestions'))
const ProgramLearningExperience = lazyWithRetry(() => import('./pages/Learn/ProgramLearningExperience'))
const FreeAssessmentSetup = lazyWithRetry(() => import('./pages/Assessment/FreeAssessmentSetup'))
const FreeAssessmentTest = lazyWithRetry(() => import('./pages/Assessment/FreeAssessmentTest'))
const ContextualOnboarding = lazyWithRetry(() => import('./pages/Onboarding/ContextualOnboarding'))
const ContextualSignup = lazyWithRetry(() => import('./pages/Auth/ContextualSignup'))

const Roadmaps = lazyWithRetry(() => import('./pages/Resources/Roadmaps'))
const ResumeTemplates = lazyWithRetry(() => import('./pages/Resources/ResumeTemplates'))
const TrackTemplate = lazyWithRetry(() => import('./pages/TrackTemplate/TrackTemplate'))
const TrackTemplateDetails = lazyWithRetry(() => import('./pages/TrackTemplate/TrackTemplateDetails'))
const ChallengePage = lazyWithRetry(() => import('./pages/ChallengePage'))

const BuildPageMain = lazyWithRetry(() => import('./pages/Build/BuildPage'))
const ProjectDetail = lazyWithRetry(() => import('./pages/Build/ProjectDetail'))
const ProjectPayment = lazyWithRetry(() => import('./pages/Build/ProjectPayment'))
const PaymentGateway = lazyWithRetry(() => import('./pages/Build/PaymentGateway'))
const UILibrary = lazyWithRetry(() => import('./pages/Build/UILibrary'))

const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashbaord/AdminDashboard.jsx'))
const Courses_Admin = lazyWithRetry(() => import('./pages/AdminDashbaord/Courses.jsx'))
const ProjectsList = lazyWithRetry(() => import('./pages/AdminDashbaord/ProjectsList.jsx'))
const EditProject = lazyWithRetry(() => import('./pages/AdminDashbaord/EditProject.jsx'))
const AdminTopicsList = lazyWithRetry(() => import('./pages/AdminDashbaord/AdminTopicsList.jsx'))
const EditTopicForm = lazyWithRetry(() => import('./pages/AdminDashbaord/EditTopicForm.jsx'))
const McqUpload = lazyWithRetry(() => import('./pages/AdminDashbaord/McqUpload.jsx'))
const UploadExercisesPage = lazyWithRetry(() => import('./pages/AdminDashbaord/UploadExercisesPage.jsx'))
const CodingRoundUpload = lazyWithRetry(() => import('./pages/AdminDashbaord/CodingRoundUpload.jsx'))
const Analytics = lazyWithRetry(() => import('./pages/AdminDashbaord/Analytics.jsx'))
const SystemHealth = lazyWithRetry(() => import('./pages/AdminDashbaord/SystemHealth.jsx'))
const Colleges = lazyWithRetry(() => import('./pages/AdminDashbaord/Colleges.jsx'))
const CollegeDetails = lazyWithRetry(() => import('./pages/AdminDashbaord/CollegeDetails.jsx'))
const Batches = lazyWithRetry(() => import('./pages/AdminDashbaord/Batches.jsx'))
const BatchDetails = lazyWithRetry(() => import('./pages/AdminDashbaord/BatchDetails.jsx'))
const Students = lazyWithRetry(() => import('./pages/AdminDashbaord/Students.jsx'))
const QuestionBankAdminPage = lazyWithRetry(() => import('./pages/Admin/QuestionBankAdminPage'))
const QuestionBankCategoryDetailPage = lazyWithRetry(() => import('./pages/Admin/QuestionBankCategoryDetailPage'))
const Resources = lazyWithRetry(() => import('./pages/AdminDashbaord/Resources.jsx'))
const Certificates = lazyWithRetry(() => import('./pages/AdminDashbaord/Certificates.jsx'))
const SubmissionMonitor = lazyWithRetry(() => import('./pages/AdminDashbaord/SubmissionMonitor.jsx'))
const AuditLogs = lazyWithRetry(() => import('./pages/AdminDashbaord/AuditLogs.jsx'))
const Reports = lazyWithRetry(() => import('./pages/AdminDashbaord/Reports.jsx'))
const Settings = lazyWithRetry(() => import('./pages/AdminDashbaord/Settings.jsx'))
const AdminPricing = lazyWithRetry(() => import('./pages/AdminDashbaord/Pricing.jsx'))
const Programs = lazyWithRetry(() => import('./pages/AdminDashbaord/Programs.jsx'))
const ProgramDetails = lazyWithRetry(() => import('./pages/AdminDashbaord/ProgramDetails.jsx'))
const HiringRoleJobs = lazyWithRetry(() => import("./pages/AdminDashbaord/HiringRoleJobs.jsx"));
const CreateHiringJob = lazyWithRetry(() => import("./pages/AdminDashbaord/CreateHiringJob.jsx"));

const Contact = lazyWithRetry(() => import('./pages/Contact/Contact'))
const About = lazyWithRetry(() => import('./pages/About/About'))
const TermsAndConditions = lazyWithRetry(() => import('./pages/About/TermsAndConditons'))
const PrivacyPolicy = lazyWithRetry(() => import('./pages/About/PrivacyPolicy'))

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
    <div className="flex min-h-[50vh] items-center justify-center bg-transparent text-slate-900 dark:bg-[#080d25] dark:text-white">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#7ec9ff] border-t-transparent" />
    </div>
  );
}

function LayoutWrapper() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    if (!['/login', '/signup'].includes(location.pathname)) {
      sessionStorage.setItem('lastNonAuthPage', location.pathname + location.search + location.hash);
    }
  }, [location.pathname, location.search, location.hash]);

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
    '/settings',
    '/programs',
    '/admin/programs'
  ];

  const isDashboardRoute = adminSidebarRoutes.includes(location.pathname) || 
                           location.pathname.startsWith('/colleges/') ||
                           location.pathname.startsWith('/batches/') ||
                           location.pathname.startsWith('/question-bank/') ||
                           location.pathname.startsWith('/track-templates/') ||
                           location.pathname.startsWith('/track/') ||
                           location.pathname.startsWith('/programs/') ||
                           location.pathname.startsWith('/admin');

  // Public pages that should share the dashboard's dark page colour.
  const isDarkTonePage =
    location.pathname === '/learn' ||
    location.pathname.startsWith('/learn/') ||
    location.pathname === '/jobs' ||
    location.pathname.startsWith('/jobs/') ||
    location.pathname.startsWith('/roadmaps') ||
    location.pathname.startsWith('/resources/roadmaps');

  const isStudentSidebarRoute =
    ['/projects', '/leaderboard'].includes(location.pathname) ||
    location.pathname.startsWith('/demo') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/interview/') ||
    location.pathname.startsWith('/learn/interview-questions') ||
    location.pathname.startsWith('/core-prep/languages') ||
    location.pathname.startsWith('/core-prep/important-concepts') ||
    (Boolean(isAuthenticated && user) && (location.pathname.startsWith('/resources/roadmaps') || location.pathname.startsWith('/roadmaps') || location.pathname === '/dashboard/roadmap')) ||
    location.pathname.startsWith('/resources/resume-templates') ||
    location.pathname.startsWith('/learn/exercises') ||
    location.pathname.startsWith('/learn/program/') ||
    location.pathname === '/dashboard/profile' ||
    location.pathname.startsWith('/dashboard/profile/');

  const showNavbar = !['/mcq', '/signup', '/login'].includes(location.pathname) &&
                     !location.pathname.startsWith('/coding/') && 
                     !location.pathname.startsWith('/daily-challenge/') &&
                     !location.pathname.startsWith('/free-assessment') &&
                     !location.pathname.startsWith('/onboarding') &&
                     !location.pathname.includes('/pricing');

  const showFooter = !['/mcq', '/signup', '/login'].includes(location.pathname) && 
                     !location.pathname.startsWith('/coding/') && 
                     !location.pathname.startsWith('/daily-challenge/') &&
                     !location.pathname.startsWith('/free-assessment') &&
                     !location.pathname.startsWith('/onboarding') &&
                     !location.pathname.startsWith('/compiler') &&
                     !location.pathname.includes('/pricing') &&
                     !isDashboardRoute &&
                     !isStudentSidebarRoute;

  return (
    <div className={`relative z-10 flex flex-col min-h-screen ${(isDashboardRoute || isStudentSidebarRoute) ? 'dashboard-page-shell' : isDarkTonePage ? 'tl-page-bg' : ''}`}>
      {location.pathname.startsWith('/onboarding') && (
        <div
          className="fixed left-0 top-0 z-[100] h-[72px] w-full"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'transparent',
          }}
        >
          <Link to="/" aria-label="TechLearn home" className="absolute left-[23px] top-[14px]">
            <img
              src="/logoo2-small.webp"
              alt="TechLearn"
              className="block h-11 w-11 rounded-[9px] object-contain"
              style={{ filter: isDarkMode ? 'none' : 'brightness(0) saturate(100%)' }}
            />
          </Link>
        </div>
      )}
      {showNavbar && <Navbar />}

      <Suspense fallback={<main className="flex-grow"><RouteFallback /></main>}>
        <ErrorBoundary resetKey={location.pathname}>
        <main className="flex-grow">
          <Routes>
          <Route path="/login" element={<Signup initialMode="login" />} />
          <Route path="/signup" element={<Signup initialMode="signup" />} />
          <Route path="/signup/contextual" element={<ContextualSignup />} />
          <Route path="/onboarding" element={<ContextualOnboarding />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route element={<PrivateRoute />}>
            <Route path="/onboarding/programs" element={<OnboardingPrograms />} />
            <Route path="/free-assessment/:programId" element={<FreeAssessmentTest />} />
            <Route path="/learn/program/:programId" element={<ProgramLearningExperience />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/demo" element={<DemoDashboard />} />
            <Route path="/demo/project/day-notes" element={<ProjectDayNotes />} />
            <Route path="/dashboard/project/day-notes" element={<ProjectDayNotes />} />
            <Route path="/dashboard/project-overview" element={<ProjectOverview />} />
            <Route path="/daily-challenge/:linkId" element={<DailyChallengeAccess />} />
            <Route path="/daily-challenge/:linkId/instructions" element={<DailyChallengeInstructions />} />
            <Route path="/daily-challenge/:linkId/test" element={<DailyChallengeTest />} />
            <Route path="/daily-challenge/:linkId/result" element={<DailyChallengeResult />} />
            <Route path="/dashboard/roadmap" element={<Roadmaps />} />
            <Route path="/dashboard/roadmap/:roadmapId" element={<Roadmaps />} />
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
            <Route path="/dashboard/practice/category/:categorySlug" element={<DynamicPracticeQuestions />} />
            <Route path="/dashboard/performance" element={<Performance />} />
            <Route path="/dashboard/reports" element={<Navigate to="/dashboard/performance" replace />} />
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
            <Route path="/track/:trackId/day/:dayId" element={<ChallengePage />} />
          </Route>
          
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/dashboard/profile/edit" element={<Navigate to="/dashboard/profile/settings" replace />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/learn" element={<LearnMain />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
          <Route path="/waitlist/:programId" element={<WaitlistPage />} />
          <Route path="/learn/courses" element={<Navigate to="/learn" replace />} />
          <Route path="/learn/courses/all" element={<Navigate to="/learn" replace />} />
          <Route path="/learn/courses/:courseId" element={<CourseDetails />} />
          <Route path="/learn/courses/:courseId/topics" element={<CourseTopics />} />
          <Route path="/learn/programs/:programId" element={<ProgramPreview />} />
          <Route path="/learn/programs/:programId/pricing" element={<ProgramPricingPage />} />
          <Route path="/programs/:programId/pricing" element={<ProgramPricingPage />} />
          <Route path="/learn/courses/:courseId/pricing" element={<ProgramPricingPage />} />
          <Route path="/payment-status" element={<PaymentStatus />} />
          <Route path="/learn/payment-status" element={<PaymentStatus />} />
          <Route path="/learn/courses/:courseId/quiz" element={<CourseQuiz />} />
          <Route path="/learn/batches/:batchId" element={<LiveBatchDetails />} />
          <Route path="/learn/exercises" element={<Exercises />} />
          <Route path="/learn/exercises/:courseId" element={<ExercisesList />} />
          <Route path="/learn/exercises/:courseId/:exerciseId" element={<ExerciseDetail />} />
          <Route path="/learn/certification" element={<Certification />} />
          <Route path="/learn/certification/payment" element={<CertificationPayment />} />
          
          {/* Guest-accessible resource & interview routes */}
          <Route path="/roadmaps" element={<Roadmaps />} />
          <Route path="/roadmaps/:roadmapId" element={<Roadmaps />} />
          <Route path="/resources/roadmaps" element={<Roadmaps />} />
          <Route path="/resources/roadmaps/:roadmapId" element={<Roadmaps />} />
          <Route path="/resources/resume-templates" element={<ResumeTemplates />} />
          <Route path="/core-prep/languages" element={<Languages />} />
          <Route path="/core-prep/important-concepts" element={<Concepts />} />
          <Route path="/core-prep/important-concepts/:conceptId" element={<ImportantConceptDetail />} />
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
          <Route path="/free-assessment" element={<FreeAssessmentSetup />} />
          <Route path="/free-assessment/setup" element={<FreeAssessmentSetup />} />

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
          <Route path="/admin/pricing" element={<AdminPricing />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/courses" element={<Courses_Admin />} />
            <Route path="/admin/hiring" element={<Hiring />} />
            <Route path="/admin/hiring/:roleId" element={<HiringRoleJobs />} />
            <Route path="/admin/hiring/:roleId/jobs/create" element={<CreateHiringJob />}/>
            <Route path="/admin/hiring/:roleId/jobs/:jobId/edit" element={<EditHiringJob />}/>
            <Route path="/admin/projects" element={<ProjectsList />} />
            <Route path="/admin/projects/edit/:projectId" element={<EditProject />} />
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
<Route path="/programs" element={<Programs />} />
<Route path="/programs/:programId" element={<ProgramDetails />} />
<Route path="/admin/programs" element={<Programs />} />
<Route path="/admin/programs/:programId" element={<ProgramDetails />} />


          </Route>
          
          <Route path="/about" element={<About />} />
          </Routes>
        </main>
        </ErrorBoundary>

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
              <div className="relative min-h-screen overflow-x-clip bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:bg-[#050b2f] dark:bg-none">
                <FloatingCodeBackground />
                <LayoutWrapper />
              </div>
        
          </AuthModalProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
