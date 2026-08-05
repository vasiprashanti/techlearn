import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { register, googleLogin, checkGoogleUser } from '../../api/authService';
import { useAuthModalContext } from '../../context/AuthModalContext';
import { navigateUserByProgram } from '../../utils/navigation';
import { 
  User, Mail, Phone, Lock, Eye, EyeOff, Check, X,
  ChevronDown, Search, GraduationCap, BookOpen, Calendar,
  Briefcase, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 8-Bit Pixel Art Icon Components
function PixelBriefcase({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges">
      <rect x="6" y="2" width="4" height="2" />
      <rect x="2" y="4" width="12" height="10" />
      <rect x="3" y="5" width="10" height="8" fill="rgba(0,0,0,0.15)" />
      <rect x="5" y="7" width="2" height="2" fill="currentColor" />
      <rect x="9" y="7" width="2" height="2" fill="currentColor" />
      <rect x="2" y="8" width="12" height="1" fill="currentColor" />
    </svg>
  );
}

function PixelBook({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges">
      <rect x="2" y="2" width="12" height="12" />
      <rect x="3" y="3" width="10" height="10" fill="rgba(0,0,0,0.15)" />
      <rect x="7" y="3" width="2" height="10" fill="currentColor" />
      <rect x="4" y="5" width="2" height="1" fill="currentColor" />
      <rect x="4" y="7" width="2" height="1" fill="currentColor" />
      <rect x="10" y="5" width="2" height="1" fill="currentColor" />
      <rect x="10" y="7" width="2" height="1" fill="currentColor" />
    </svg>
  );
}

function PixelCompass({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges">
      <rect x="4" y="2" width="8" height="1" />
      <rect x="4" y="13" width="8" height="1" />
      <rect x="2" y="4" width="1" height="8" />
      <rect x="13" y="4" width="1" height="8" />
      <rect x="3" y="3" width="1" height="1" />
      <rect x="12" y="3" width="1" height="1" />
      <rect x="3" y="12" width="1" height="1" />
      <rect x="12" y="12" width="1" height="1" />
      <rect x="9" y="5" width="2" height="2" fill="#ef4444" />
      <rect x="7" y="7" width="2" height="2" fill="currentColor" />
      <rect x="5" y="9" width="2" height="2" fill="#3b82f6" />
    </svg>
  );
}

function PixelCap({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges">
      <rect x="7" y="2" width="2" height="1" />
      <rect x="5" y="3" width="6" height="1" />
      <rect x="3" y="4" width="10" height="1" />
      <rect x="1" y="5" width="14" height="1" />
      <rect x="3" y="6" width="10" height="1" />
      <rect x="4" y="7" width="8" height="4" />
      <rect x="12" y="6" width="1" height="4" fill="#eab308" />
      <rect x="12" y="10" width="2" height="2" fill="#eab308" />
    </svg>
  );
}

function PixelBuilding({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges">
      <rect x="3" y="2" width="10" height="12" />
      <rect x="4" y="3" width="8" height="10" fill="rgba(0,0,0,0.15)" />
      <rect x="5" y="4" width="2" height="2" fill="currentColor" />
      <rect x="9" y="4" width="2" height="2" fill="currentColor" />
      <rect x="5" y="7" width="2" height="2" fill="currentColor" />
      <rect x="9" y="7" width="2" height="2" fill="currentColor" />
      <rect x="7" y="10" width="2" height="3" fill="currentColor" />
    </svg>
  );
}

function PixelLaptop({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges">
      <rect x="3" y="2" width="10" height="8" />
      <rect x="4" y="3" width="8" height="6" fill="#38bdf8" />
      <rect x="1" y="10" width="14" height="2" />
      <rect x="6" y="10" width="4" height="1" fill="rgba(0,0,0,0.2)" />
    </svg>
  );
}

function PixelGlobe({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges">
      <rect x="4" y="2" width="8" height="12" />
      <rect x="2" y="4" width="12" height="8" />
      <rect x="3" y="3" width="10" height="10" fill="rgba(0,0,0,0.15)" />
      <rect x="7" y="2" width="2" height="12" fill="currentColor" />
      <rect x="2" y="7" width="12" height="2" fill="currentColor" />
    </svg>
  );
}

function PixelRefresh({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges">
      <rect x="4" y="3" width="8" height="2" />
      <rect x="11" y="5" width="2" height="4" />
      <rect x="4" y="11" width="8" height="2" />
      <rect x="3" y="7" width="2" height="4" />
      <rect x="12" y="3" width="2" height="2" />
      <rect x="2" y="11" width="2" height="2" />
    </svg>
  );
}

// Options list
const COLLEGE_OPTIONS = [
  "IIT Delhi",
  "IIT Bombay",
  "IIT Madras",
  "NIT Trichy",
  "NIT Surathkal",
  "BITS Pilani",
  "DTU (Delhi Technological University)",
  "VIT Vellore",
  "SRM Institute of Science and Technology",
  "Manipal Institute of Technology",
  "Anna University",
  "JNTU Hyderabad",
  "Other"
];

const DEGREE_OPTIONS = [
  "B.Tech / B.E.",
  "B.Sc",
  "BCA",
  "MCA",
  "M.Tech / M.E.",
  "M.Sc",
  "Diploma",
  "Other"
];

const BRANCH_OPTIONS = [
  "Computer Science & Engineering (CSE)",
  "Information Technology (IT)",
  "Artificial Intelligence & Machine Learning (AI/ML)",
  "Data Science",
  "Electronics & Communication (ECE)",
  "Electrical Engineering (EEE)",
  "Mechanical Engineering",
  "Civil Engineering",
  "Cyber Security",
  "Other"
];

const GRADUATION_YEARS = ["2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030"];

const LEARNING_GOALS = [
  {
    id: "Get Placed",
    title: "GET PLACED",
    subtitle: "Prepare for SDE, Full Stack & IT campus/off-campus placements",
    pixelIcon: <PixelBriefcase className="w-5 h-5" />
  },
  {
    id: "Learn a New Skill",
    title: "LEARN A NEW SKILL",
    subtitle: "Master programming languages, DSA, Web Dev & AI",
    pixelIcon: <PixelBook className="w-5 h-5" />
  },
  {
    id: "Just Exploring",
    title: "JUST EXPLORING",
    subtitle: "Check out free tracks, problem sets, and roadmaps",
    pixelIcon: <PixelCompass className="w-5 h-5" />
  }
];

const TARGET_ROLES = [
  "Software Engineer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Java Developer",
  "Python Developer",
  "QA / Test Engineer",
  "Data Analyst",
  "Not Sure Yet"
];

const PLACEMENT_TYPES = [
  { id: "Campus Placements", label: "Campus Placements", pixelIcon: <PixelCap className="w-4 h-4 shrink-0" /> },
  { id: "Service Companies", label: "Service Companies (TCS, Infosys, Accenture)", pixelIcon: <PixelBuilding className="w-4 h-4 shrink-0" /> },
  { id: "Product Companies", label: "Product Companies (Amazon, Microsoft, Adobe)", pixelIcon: <PixelLaptop className="w-4 h-4 shrink-0" /> },
  { id: "Off-Campus Opportunities", label: "Off-Campus Opportunities", pixelIcon: <PixelGlobe className="w-4 h-4 shrink-0" /> },
  { id: "All Opportunities", label: "All Opportunities", pixelIcon: <PixelRefresh className="w-4 h-4 shrink-0" /> }
];

const PLACEMENT_TIMELINES = [
  "Within 2 Weeks",
  "Within 1 Month",
  "Within 2–3 Months",
  "More than 3 Months"
];

const DAILY_COMMITMENT_OPTIONS = [
  "Less than 1 Hour",
  "1–2 Hours",
  "2–4 Hours",
  "4+ Hours"
];

const SKILLS_TO_LEARN_OPTIONS = [
  "Python",
  "Java",
  "Python + DSA",
  "Java + DSA",
  "DSA",
  "SQL (DBMS)",
  "Web Development",
  "Java Full Stack",
  "GenAI",
  "AI / ML"
];

// Custom Searchable Dropdown Component (With Reduced Font Weight)
function SearchableSelect({ options, value, onChange, placeholder = "Select option...", searchable = true, icon: IconComponent, maxHeightClass = "max-h-24 sm:max-h-28" }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isDark = theme === 'dark';

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 rounded-lg border text-xs text-left flex justify-between items-center transition-all duration-200 focus:outline-none focus:ring-2 ${
          isDark
            ? 'bg-[#070a14] text-slate-100 border-[#1c2538] hover:border-[#38486b] focus:ring-blue-500/30'
            : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 focus:ring-blue-500/20 focus:border-[#0043A1]'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {IconComponent && <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />}
          <span className={`truncate font-normal ${!value ? (isDark ? 'text-slate-400' : 'text-slate-500') : (isDark ? 'text-slate-100 font-medium' : 'text-slate-800 font-medium')}`}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600 dark:text-[#7c95ff]' : 'text-slate-500'}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 border rounded-xl shadow-xl ${maxHeightClass} overflow-y-auto p-1 text-xs animate-in fade-in zoom-in-95 duration-150 ${
          isDark 
            ? 'bg-[#0b0f1d] border-[#1c2538] text-slate-100' 
            : 'bg-white border-slate-300 text-slate-900 shadow-xl'
        }`}>
          {searchable && options.length > 5 && (
            <div className="p-1 mb-1">
              <input
                type="text"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-2.5 py-1 rounded-lg border text-xs font-normal focus:outline-none ${
                  isDark
                    ? 'bg-[#060911] text-slate-100 border-[#1c2538] focus:border-[#7c95ff]'
                    : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-[#0043A1]'
                }`}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          )}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition flex items-center justify-between text-xs font-normal ${
                  value === opt
                    ? (isDark ? 'bg-[#7c95ff] text-[#070a14] font-medium' : 'bg-[#0043A1] text-white font-medium')
                    : (isDark ? 'hover:bg-[#141b2e] text-slate-200' : 'hover:bg-slate-100 text-slate-800')
                }`}
              >
                <span className="truncate">{opt}</span>
                {value === opt && <Check className={`w-3 h-3 shrink-0 ml-1 ${isDark ? 'text-[#070a14]' : 'text-white'}`} />}
              </div>
            ))
          ) : (
            <div className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 text-center font-normal">No matching options</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Signup({ onClose, onSwitchToLogin }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    
    // Step 2 Education
    collegeSelect: 'IIT Delhi',
    customCollege: '',
    degree: 'B.Tech / B.E.',
    branch: 'Computer Science & Engineering (CSE)',
    graduationYear: '2026',

    // Step 3 Goal
    learningGoal: 'Get Placed',

    // Step 4 Personalization for Get Placed
    targetRole: 'Software Engineer',
    placementType: 'Campus Placements',
    placementTimeline: 'Within 2–3 Months',
    dailyCommitmentHours: '2–4 Hours',

    // Step 4 Personalization for Learn a New Skill
    skillToLearn: 'Python + DSA',

    // Default Program
    programSelection: 'Placement Sprint'
  });

  const [googleToken, setGoogleToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { openLogin } = useAuthModalContext();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const hasMinLength = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_]/.test(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword;
  const showMatchError = formData.confirmPassword.length > 0 && !passwordsMatch;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoalSelect = (goalId) => {
    let defaultProgram = 'Placement Sprint';
    if (goalId === 'Learn a New Skill') {
      defaultProgram = 'Full Stack Project Program';
    } else if (goalId === 'Just Exploring') {
      defaultProgram = 'TechPass Free Starter';
    }

    setFormData((prev) => ({
      ...prev,
      learningGoal: goalId,
      programSelection: defaultProgram
    }));
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) return "Full Name is required";
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Valid Email is required";
    if (!formData.mobileNumber.trim() || formData.mobileNumber.trim().length < 10) return "Valid 10-digit mobile number is required";
    if (!googleToken) {
      if (!hasMinLength || !hasUppercase || !hasSpecialChar) return "Password must be at least 8 characters with 1 uppercase & 1 special character";
      if (!passwordsMatch) return "Passwords do not match";
    }
    return null;
  };

  const validateStep2 = () => {
    if (formData.collegeSelect === 'Other' && !formData.customCollege.trim()) {
      return "Please enter your college name";
    }
    return null;
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) return setError(err);
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) return setError(err);
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCloseModal = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  const handleSignInClick = () => {
    if (onSwitchToLogin) {
      onSwitchToLogin();
    } else {
      openLogin();
    }
  };

  const handleEnrollAndSubmit = async () => {
    setError('');
    setLoading(true);

    const finalCollege = formData.collegeSelect === 'Other' ? formData.customCollege : formData.collegeSelect;
    const finalDegreeBranch = `${formData.degree} - ${formData.branch}`;

    let personalizedSummary = '';
    if (formData.learningGoal === 'Get Placed') {
      personalizedSummary = `${formData.targetRole} | ${formData.placementType} | ${formData.placementTimeline}`;
    } else if (formData.learningGoal === 'Learn a New Skill') {
      personalizedSummary = formData.skillToLearn;
    } else {
      personalizedSummary = 'Exploring';
    }

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password || "GoogleAuthAccount123!",
      confirmPassword: formData.confirmPassword || "GoogleAuthAccount123!",
      mobileNumber: formData.mobileNumber,
      collegeName: finalCollege,
      degree: formData.degree,
      branch: formData.branch,
      degreeBranch: finalDegreeBranch,
      graduationYear: Number(formData.graduationYear.replace('+', '')),
      learningGoal: formData.learningGoal,
      personalizedDetail: personalizedSummary,
      programSelection: formData.programSelection === 'TechPass Free Starter' ? 'Placement Sprint' : formData.programSelection,
      placementReadiness: formData.placementTimeline || 'Just Starting',
      dailyCommitment: formData.dailyCommitmentHours || 'Yes',
      declarationAccepted: true
    };

    try {
      let data;
      if (googleToken) {
        const res = await googleLogin(googleToken, payload);
        data = res.data;
      } else {
        const res = await register(payload);
        data = res.data;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user));
      
      setStep(5); // Show welcome/redirect screen
      setTimeout(() => {
        navigateUserByProgram(data.user, navigate);
      }, 1500);

    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || err.message || "Registration failed. Please check your details.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = useCallback(async (response) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await checkGoogleUser(response.credential);

      if (data?.isExisting) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userData", JSON.stringify(data.user));
        navigateUserByProgram(data.user, navigate);
      } else {
        setGoogleToken(response.credential);
        setFormData((prev) => ({
          ...prev,
          fullName: data?.name || prev.fullName,
          email: data?.email || prev.email,
        }));
        setStep(2);
      }
    } catch (err) {
      console.error("Google sign-in check failed:", err);
      setError(err.response?.data?.message || "Google sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (step === 1) {
      const loadGoogleScript = () => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
          if (window.google) {
            window.google.accounts.id.initialize({
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID,
              callback: handleGoogleResponse,
            });

            const div = document.getElementById("googleSignupDiv");
            if (div) {
              window.google.accounts.id.renderButton(div, { 
                theme: theme === 'dark' ? 'filled_black' : 'outline', 
                size: "medium",
                width: '240'
              });
            }
          }
        };
      };

      if (!window.google) {
        loadGoogleScript();
      } else {
        const div = document.getElementById("googleSignupDiv");
        if (div) {
          window.google.accounts.id.renderButton(div, { 
            theme: theme === 'dark' ? 'filled_black' : 'outline', 
            size: "medium",
            width: '240'
          });
        }
      }
    }
  }, [theme, handleGoogleResponse, step]);

  const stepTitles = [
    "Account Credentials",
    "Personal Details",
    "Skill Selection",
    "Final Confirmation"
  ];

  const isDark = theme === 'dark';
  const logoSrc = isDark ? "/logoo2.png" : "/logoo.png";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Background Modal Backdrop Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleCloseModal}
        className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
      />

      {/* Modal Content Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className={`relative w-full max-w-lg rounded-2xl p-4 sm:p-6 border shadow-2xl z-10 overflow-hidden transition-all duration-300 my-auto ${
          isDark 
            ? 'bg-[#090d18] border-[#1b2438] text-slate-100 shadow-black/90' 
            : 'bg-white border-slate-300 text-slate-900 shadow-2xl shadow-blue-900/15'
        }`}
      >
        
        {/* Top Gradient Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0043A1] via-blue-500 to-indigo-600"></div>

        {/* Top Header Row with Logo */}
        <div className={`flex items-center justify-between pb-2.5 mb-3 border-b ${
          isDark ? 'border-[#182133]' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <img 
              src={logoSrc} 
              alt="TechLearn Logo" 
              className="h-6 sm:h-7 w-auto object-contain shrink-0" 
              onError={(e) => {
                e.target.src = isDark ? "/logoo2-small.webp" : "/logoo-small.webp";
              }}
            />
            <h1 className={`font-press-start text-xs sm:text-xs uppercase tracking-wide truncate ${
              isDark ? 'text-slate-100 font-normal' : 'text-[#003d94] font-normal'
            }`}>
              {stepTitles[Math.min(step - 1, 3)]}
            </h1>
          </div>
          <button 
            type="button"
            onClick={handleCloseModal} 
            className={`p-1 rounded-lg transition ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-[#141c2e]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Segmented Progress Bar */}
        <div className="mb-4 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>STEP {Math.min(step, 4)} OF 4</span>
            <span className={isDark ? 'text-[#7c95ff]' : 'text-[#0043A1]'}>
              {step === 1 && "Basic Details"}
              {step === 2 && "Education"}
              {step === 3 && "Learning Goal"}
              {step >= 4 && "Personalization"}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= Math.min(step, 4)
                    ? (isDark 
                        ? 'bg-[#7c95ff] shadow-[0_0_8px_rgba(124,149,255,0.4)]' 
                        : 'bg-[#0043A1] shadow-[0_0_6px_rgba(0,67,161,0.3)]')
                    : (isDark ? 'bg-[#182133]' : 'bg-slate-200')
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="text-[11px] font-medium mb-3 text-red-600 dark:text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 flex items-center gap-1.5">
            <span className="shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: Basic Details */}
          {step === 1 && (
            <motion.div 
              key="step1" 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <div>
                <h2 className={`font-press-start text-xs uppercase tracking-wider ${
                  isDark ? 'text-slate-100 font-normal' : 'text-[#003d94] font-normal'
                }`}>Step 1 – Basic Details</h2>
                <p className="text-[11px] font-normal text-slate-600 dark:text-slate-400 mt-0.5">
                  Let's create your account credentials to get started.
                </p>
              </div>

              <div className={`p-3 rounded-xl border space-y-2.5 ${
                isDark ? 'bg-[#0b0f1c] border-[#1a2336]' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Full Name */}
                <div>
                  <div className="flex justify-between items-center mb-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    <label>Full Name *</label>
                    <span className="text-[9px] text-slate-500 uppercase font-mono font-normal">Required</span>
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      name="fullName"
                      required
                      className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs font-normal focus:ring-2 focus:outline-none transition ${
                        isDark 
                          ? 'bg-[#060911] text-slate-100 border-[#1c2538] focus:border-[#7c95ff] focus:ring-blue-500/30 placeholder:text-slate-500' 
                          : 'bg-white text-slate-900 border-slate-300 focus:border-[#0043A1] focus:ring-blue-500/20 placeholder:text-slate-400'
                      }`}
                      placeholder="e.g. Alex Rivera"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Email Address & Mobile Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex justify-between items-center mb-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      <label>Email Address *</label>
                      <span className="text-[9px] text-slate-500 uppercase font-mono font-normal">Required</span>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="email"
                        name="email"
                        required
                        className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs font-normal focus:ring-2 focus:outline-none transition ${
                          isDark 
                            ? 'bg-[#060911] text-slate-100 border-[#1c2538] focus:border-[#7c95ff] focus:ring-blue-500/30 placeholder:text-slate-500' 
                            : 'bg-white text-slate-900 border-slate-300 focus:border-[#0043A1] focus:ring-blue-500/20 placeholder:text-slate-400'
                        }`}
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      <label>Mobile Number *</label>
                      <span className="text-[9px] text-slate-500 uppercase font-mono font-normal">Required</span>
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="tel"
                        name="mobileNumber"
                        required
                        className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs font-normal focus:ring-2 focus:outline-none transition ${
                          isDark 
                            ? 'bg-[#060911] text-slate-100 border-[#1c2538] focus:border-[#7c95ff] focus:ring-blue-500/30 placeholder:text-slate-500' 
                            : 'bg-white text-slate-900 border-slate-300 focus:border-[#0043A1] focus:ring-blue-500/20 placeholder:text-slate-400'
                        }`}
                        placeholder="10-digit mobile number"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex justify-between items-center mb-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      <label>Password *</label>
                      <span className="text-[9px] text-slate-500 uppercase font-mono font-normal">Required</span>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        className={`w-full pl-9 pr-7 py-2 rounded-lg border text-xs font-normal focus:ring-2 focus:outline-none transition ${
                          isDark 
                            ? 'bg-[#060911] text-slate-100 border-[#1c2538] focus:border-[#7c95ff] focus:ring-blue-500/30 placeholder:text-slate-500' 
                            : 'bg-white text-slate-900 border-slate-300 focus:border-[#0043A1] focus:ring-blue-500/20 placeholder:text-slate-400'
                        }`}
                        placeholder="Min 8 characters"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[9px]">
                      <span className={hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-500 font-normal'}>✓ 8+ chars</span>
                      <span className={hasUppercase ? 'text-emerald-600 font-medium' : 'text-slate-500 font-normal'}>✓ 1 Upper</span>
                      <span className={hasSpecialChar ? 'text-emerald-600 font-medium' : 'text-slate-500 font-normal'}>✓ 1 Special</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      <label>Confirm Password *</label>
                      <span className="text-[9px] text-slate-500 uppercase font-mono font-normal">Required</span>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        required
                        className={`w-full pl-9 pr-7 py-2 rounded-lg border text-xs font-normal focus:ring-2 focus:outline-none transition ${
                          isDark 
                            ? 'bg-[#060911] text-slate-100 border-[#1c2538] focus:border-[#7c95ff] focus:ring-blue-500/30 placeholder:text-slate-500' 
                            : 'bg-white text-slate-900 border-slate-300 focus:border-[#0043A1] focus:ring-blue-500/20 placeholder:text-slate-400'
                        }`}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {showMatchError && (
                      <p className="text-[9px] text-red-600 font-medium mt-0.5">Passwords do not match</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Google Sign In Option */}
              <div className="pt-0.5">
                <div className="flex items-center justify-center my-1.5 text-slate-400 text-[9px] font-mono">
                  <span className="border-t border-slate-200 dark:border-slate-800 w-full"></span>
                  <span className="px-2 uppercase tracking-wider font-normal">or</span>
                  <span className="border-t border-slate-200 dark:border-slate-800 w-full"></span>
                </div>
                <div className="flex justify-center">
                  <div id="googleSignupDiv"></div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Education */}
          {step === 2 && (
            <motion.div 
              key="step2" 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <div>
                <h2 className={`font-press-start text-xs uppercase tracking-wider ${
                  isDark ? 'text-slate-100 font-normal' : 'text-[#003d94] font-normal'
                }`}>Step 2 – Education</h2>
                <p className="text-[11px] font-normal text-slate-600 dark:text-slate-400 mt-0.5">
                  Select your college and academic details.
                </p>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-medium mb-0.5 text-slate-700 dark:text-slate-300">College *</label>
                  <SearchableSelect
                    options={COLLEGE_OPTIONS}
                    value={formData.collegeSelect}
                    onChange={(val) => setFormData((prev) => ({ ...prev, collegeSelect: val }))}
                    placeholder="Search or select college..."
                    icon={Search}
                  />
                </div>

                {formData.collegeSelect === 'Other' && (
                  <div>
                    <label className="block text-[11px] font-medium mb-0.5 text-slate-700 dark:text-slate-300">Enter College Name *</label>
                    <input
                      type="text"
                      name="customCollege"
                      placeholder="e.g. Stanford University"
                      value={formData.customCollege}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded-lg border text-xs font-normal focus:ring-2 focus:outline-none transition ${
                        isDark 
                          ? 'bg-[#060911] text-slate-100 border-[#1c2538] focus:border-[#7c95ff]' 
                          : 'bg-white text-slate-900 border-slate-300 focus:border-[#0043A1]'
                      }`}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium mb-0.5 text-slate-700 dark:text-slate-300">Degree *</label>
                    <SearchableSelect
                      options={DEGREE_OPTIONS}
                      value={formData.degree}
                      onChange={(val) => setFormData((prev) => ({ ...prev, degree: val }))}
                      placeholder="Select degree..."
                      searchable={false}
                      icon={GraduationCap}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-0.5 text-slate-700 dark:text-slate-300">Branch / Specialization *</label>
                    <SearchableSelect
                      options={BRANCH_OPTIONS}
                      value={formData.branch}
                      onChange={(val) => setFormData((prev) => ({ ...prev, branch: val }))}
                      placeholder="Select branch..."
                      icon={BookOpen}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium mb-0.5 text-slate-700 dark:text-slate-300">Graduation Year *</label>
                  <SearchableSelect
                    options={GRADUATION_YEARS}
                    value={formData.graduationYear}
                    onChange={(val) => setFormData((prev) => ({ ...prev, graduationYear: val }))}
                    placeholder="Select graduation year..."
                    searchable={false}
                    icon={Calendar}
                    maxHeightClass="max-h-20"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Learning Goal */}
          {step === 3 && (
            <motion.div 
              key="step3" 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <div>
                <h2 className={`font-press-start text-xs uppercase tracking-wider ${
                  isDark ? 'text-slate-100 font-normal' : 'text-[#003d94] font-normal'
                }`}>Step 3 – Learning Goal</h2>
                <p className="text-[11px] font-normal text-slate-600 dark:text-slate-400 mt-0.5">
                  What brings you to TechLearn today?
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {LEARNING_GOALS.map((goal) => {
                  const isSelected = formData.learningGoal === goal.id;
                  return (
                    <div
                      key={goal.id}
                      onClick={() => handleGoalSelect(goal.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between space-x-3 ${
                        isSelected 
                          ? (isDark 
                              ? 'border-2 border-[#7c95ff] bg-[#11172a] shadow-[0_0_12px_rgba(124,149,255,0.2)] text-[#7c95ff]' 
                              : 'border-2 border-[#0043A1] bg-blue-50 shadow-md shadow-blue-500/10 text-[#003d94]')
                          : (isDark ? 'border-[#1d263a] bg-[#0a0e19] hover:border-[#374563] text-slate-300' : 'border-slate-300 bg-white hover:border-slate-400 shadow-sm text-slate-800')
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          isSelected 
                            ? (isDark ? 'bg-[#7c95ff] text-[#070a14]' : 'bg-[#0043A1] text-white')
                            : (isDark ? 'bg-[#161f33] text-slate-300' : 'bg-slate-100 text-slate-700')
                        }`}>
                          {goal.pixelIcon}
                        </div>

                        <div>
                          <h3 className={`font-press-start text-[11px] ${
                            isSelected 
                              ? (isDark ? 'text-[#7c95ff]' : 'text-[#003d94]')
                              : (isDark ? 'text-slate-100 font-normal' : 'text-slate-900 font-medium')
                          }`}>{goal.title}</h3>
                          <p className={`text-[10px] mt-0.5 leading-tight ${
                            isDark ? 'text-slate-400' : 'text-slate-600 font-normal'
                          }`}>{goal.subtitle}</p>
                        </div>
                      </div>

                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 font-medium text-[10px] transition ${
                        isSelected 
                          ? (isDark ? 'bg-[#7c95ff] border-[#7c95ff] text-[#070a14]' : 'bg-[#0043A1] border-[#0043A1] text-white')
                          : 'border-slate-400 dark:border-slate-600 bg-transparent'
                      }`}>
                        {isSelected && '✓'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 4: Personalization */}
          {step === 4 && (
            <motion.div 
              key="step4" 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <div>
                <h2 className={`font-press-start text-xs uppercase tracking-wider ${
                  isDark ? 'text-slate-100 font-normal' : 'text-[#003d94] font-normal'
                }`}>Step 4 – Personalization</h2>
                <p className="text-[11px] font-normal text-slate-600 dark:text-slate-400 mt-0.5">
                  Tailoring your experience for <span className="font-medium text-[#003d94] dark:text-[#8fd9ff]">{formData.learningGoal}</span>.
                </p>
              </div>

              {/* Conditional Form: Get Placed */}
              {formData.learningGoal === 'Get Placed' && (
                <div className="space-y-3">
                  {/* Target Role */}
                  <div>
                    <label className="block text-[11px] font-medium mb-0.5 text-slate-700 dark:text-slate-300">Target Role *</label>
                    <SearchableSelect
                      options={TARGET_ROLES}
                      value={formData.targetRole}
                      onChange={(val) => setFormData((prev) => ({ ...prev, targetRole: val }))}
                      placeholder="Select target role..."
                      icon={Briefcase}
                    />
                  </div>

                  {/* Placement Type (Single Choice Cards with Pixel Icons) */}
                  <div>
                    <label className="block text-[11px] font-medium mb-1 text-slate-700 dark:text-slate-300">Placement Type *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {PLACEMENT_TYPES.map((pt) => {
                        const isSelected = formData.placementType === pt.id;
                        return (
                          <div
                            key={pt.id}
                            onClick={() => setFormData((prev) => ({ ...prev, placementType: pt.id }))}
                            className={`p-2 rounded-lg border cursor-pointer transition text-[11px] flex items-center gap-2 font-medium ${
                              isSelected 
                                ? (isDark ? 'bg-[#7c95ff]/10 border-[#7c95ff] text-[#7c95ff]' : 'bg-blue-50 border-[#0043A1] text-[#003d94] shadow-sm')
                                : (isDark ? 'bg-[#070a14] border-[#1c2538] text-slate-300 hover:border-[#38486b]' : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400')
                            }`}
                          >
                            <span className="shrink-0 text-current">{pt.pixelIcon}</span>
                            <span className="leading-tight truncate">{pt.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Placement Timeline */}
                    <div>
                      <label className="block text-[11px] font-medium mb-0.5 text-slate-700 dark:text-slate-300">When do placements begin? *</label>
                      <SearchableSelect
                        options={PLACEMENT_TIMELINES}
                        value={formData.placementTimeline}
                        onChange={(val) => setFormData((prev) => ({ ...prev, placementTimeline: val }))}
                        placeholder="Select timeline..."
                        searchable={false}
                        icon={Calendar}
                      />
                    </div>

                    {/* Daily Commitment */}
                    <div>
                      <label className="block text-[11px] font-medium mb-0.5 text-slate-700 dark:text-slate-300">Daily Time Commitment *</label>
                      <SearchableSelect
                        options={DAILY_COMMITMENT_OPTIONS}
                        value={formData.dailyCommitmentHours}
                        onChange={(val) => setFormData((prev) => ({ ...prev, dailyCommitmentHours: val }))}
                        placeholder="Select commitment..."
                        searchable={false}
                        icon={BookOpen}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Form: Learn a New Skill */}
              {formData.learningGoal === 'Learn a New Skill' && (
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium mb-0.5 text-slate-700 dark:text-slate-300">What would you like to learn? *</label>
                    <SearchableSelect
                      options={SKILLS_TO_LEARN_OPTIONS}
                      value={formData.skillToLearn}
                      onChange={(val) => setFormData((prev) => ({ ...prev, skillToLearn: val }))}
                      placeholder="Search or select a skill..."
                      icon={BookOpen}
                    />
                  </div>
                </div>
              )}

              {/* Conditional Form: Just Exploring */}
              {formData.learningGoal === 'Just Exploring' && (
                <div className={`py-4 text-center space-y-2 p-4 rounded-xl border ${
                  isDark ? 'bg-[#060912] border-[#182133]' : 'bg-slate-50 border-slate-300'
                }`}>
                  <PixelCompass className="w-8 h-8 mx-auto text-[#0043A1] dark:text-[#7c95ff]" />
                  <h3 className={`font-medium text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>Ready to Explore TechLearn</h3>
                  <p className="text-[11px] font-normal text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    No additional questions needed! You'll get free access to open practice hubs, roadmaps, and compiler tools.
                  </p>
                </div>
              )}

              {/* Status Summary Panel */}
              <div className={`p-2.5 rounded-lg border font-mono text-[10px] space-y-1 ${
                isDark ? 'bg-[#060912] border-[#182133]' : 'bg-slate-100 border-slate-300 text-slate-900 font-medium'
              }`}>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>STATUS:</span>
                  <span className={`font-medium ${isDark ? 'text-[#7c95ff]' : 'text-[#003d94]'}`}>
                    {formData.learningGoal.toUpperCase().replace(/\s+/g, '_')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>SYSTEM_READY:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">TRUE</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Welcome Loading Transition */}
          {step === 5 && (
            <motion.div 
              key="step5" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="py-8 text-center space-y-3"
            >
              <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl font-medium border animate-bounce ${
                isDark ? 'bg-[#7c95ff]/10 text-[#7c95ff] border-[#7c95ff]/30' : 'bg-blue-50 text-[#0043A1] border-blue-200'
              }`}>
                ⚡
              </div>
              <div>
                <h2 className={`font-press-start text-xs uppercase tracking-wider ${
                  isDark ? 'text-slate-100 font-normal' : 'text-[#003d94] font-normal'
                }`}>Welcome to TechLearn!</h2>
                <p className="text-[11px] font-normal text-slate-600 dark:text-slate-400 mt-1">
                  Creating your account & redirecting to your dashboard...
                </p>
              </div>

              <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto mt-3 ${
                isDark ? 'border-[#7c95ff]' : 'border-[#0043A1]'
              }`} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Stepper Navigation Actions */}
        {step >= 1 && step <= 4 && (
          <div className={`flex items-center justify-between pt-4 border-t mt-4 ${
            isDark ? 'border-[#182133]' : 'border-slate-200'
          }`}>
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className={`px-4 py-2 rounded-lg font-press-start text-[11px] font-normal transition flex items-center gap-1 ${
                  isDark 
                    ? 'text-slate-300 bg-[#131825] hover:bg-[#1c2438] border border-[#232c42]' 
                    : 'text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                &lt; BACK
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignInClick}
                className={`text-[11px] font-medium hover:underline ${
                  isDark ? 'text-[#7c95ff]' : 'text-[#003d94]'
                }`}
              >
                Already registered? Sign in
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className={`px-5 py-2 rounded-lg font-press-start text-[11px] font-normal transition flex items-center gap-1.5 ${
                  isDark 
                    ? 'text-[#070a14] bg-[#a5b4fc] hover:bg-[#b8c5ff] shadow-[0_0_15px_rgba(165,180,252,0.3)]' 
                    : 'text-white bg-[#0043A1] hover:bg-blue-700 shadow-sm shadow-blue-500/20'
                }`}
              >
                NEXT &rarr;
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnrollAndSubmit}
                disabled={loading}
                className={`px-5 py-2 rounded-lg font-press-start text-[11px] font-normal transition flex items-center gap-1.5 disabled:opacity-50 ${
                  isDark 
                    ? 'text-[#070a14] bg-[#a5b4fc] hover:bg-[#b8c5ff] shadow-[0_0_15px_rgba(165,180,252,0.3)]' 
                    : 'text-white bg-[#0043A1] hover:bg-blue-700 shadow-sm shadow-blue-500/20'
                }`}
              >
                {loading ? (
                  <span>SIGNING UP...</span>
                ) : (
                  <>
                    <span>COMPLETE SIGN UP</span>
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </motion.div>
    </div>
  );
}
