import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { register, googleLogin } from '../../api/authService';
import { useAuthModalContext } from '../../context/AuthModalContext';
import { navigateUserByProgram } from '../../utils/navigation';
import { Eye, EyeOff, Check } from 'lucide-react';

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobileNumber: '',
    collegeName: '',
    degreeBranch: '',
    graduationYear: '2026',
    programSelection: 'Placement Sprint',
    placementReadiness: 'Just Starting',
    dailyCommitment: 'Yes',
    declarationAccepted: false
  });

  const [error, setError] = useState('');
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
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.mobileNumber.trim() ||
      !formData.collegeName.trim() ||
      !formData.degreeBranch.trim()
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (!hasMinLength || !hasUppercase || !hasSpecialChar) {
      setError("Password does not meet all requirements");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.declarationAccepted) {
      setError("You must accept the daily participation declaration");
      return;
    }

    try {
      const { data } = await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        mobileNumber: formData.mobileNumber,
        collegeName: formData.collegeName,
        degreeBranch: formData.degreeBranch,
        graduationYear: Number(formData.graduationYear),
        programSelection: formData.programSelection,
        placementReadiness: formData.placementReadiness,
        dailyCommitment: formData.dailyCommitment,
        declarationAccepted: formData.declarationAccepted
      });

      localStorage.setItem("token", data.token);
      navigateUserByProgram(data.user, navigate);
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  const handleGoogleResponse = useCallback(async (response) => {
    try {
      const { data } = await googleLogin(response.credential);
      localStorage.setItem("token", data.token);
      navigateUserByProgram(data.user, navigate);
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-up failed");
    }
  }, [navigate]);

  useEffect(() => {
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

          window.google.accounts.id.renderButton(
            document.getElementById("googleSignupDiv"),
            { 
              theme: theme === 'dark' ? 'filled_black' : 'outline', 
              size: "large",
              width: '250'
            }
          );
        }
      };
    };

    if (!window.google) {
      loadGoogleScript();
    } else {
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignupDiv"),
        { 
          theme: theme === 'dark' ? 'filled_black' : 'outline', 
          size: "large",
          width: '250'
        }
      );
    }
  }, [theme, handleGoogleResponse]);

  return (
    <div className="flex items-center justify-center px-4 min-h-screen pt-20 pb-6">
      <div className={`w-full max-w-lg backdrop-blur-lg rounded-xl p-4 sm:p-5 shadow-xl z-10 border text-left
                      ${theme === 'dark' ? 
                        'bg-gray-900/90 text-gray-100 border-gray-800' : 
                        'bg-white/80 text-gray-900 border-gray-200'}`}>

        <h2 className={`text-xl font-bold mb-0.5 text-center ${theme === 'dark' ? 'text-blue-400' : 'text-blue-800'}`}>
          Student Sign Up
        </h2>
        <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mb-2.5">
          Complete your profile registration to access your personalized learning track.
        </p>

        {error && (
          <p className="text-xs text-center font-semibold mb-2.5 text-red-500 bg-red-500/10 py-1.5 px-2 rounded-md border border-red-500/20">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          
          {/* Section 1: Basic Info */}
          <div className="border-b border-black/5 dark:border-white/5 pb-2.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">1. Personal Information</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold mb-0.5 text-slate-600 dark:text-slate-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  className={`w-full px-2.5 py-1.5 rounded-md border focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs
                              ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                  placeholder="e.g. John Smith"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold mb-0.5 text-slate-600 dark:text-slate-300">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className={`w-full px-2.5 py-1.5 rounded-md border focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs
                                ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                    placeholder="name@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-0.5 text-slate-600 dark:text-slate-300">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    required
                    className={`w-full px-2.5 py-1.5 rounded-md border focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs
                                ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                    placeholder="e.g. 9876543210"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold mb-0.5 text-slate-600 dark:text-slate-300">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      className={`w-full pl-2.5 pr-8 py-1.5 rounded-md border focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs
                                  ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                      placeholder="Min 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px]">
                    <div className={`flex items-center gap-1 transition-colors ${hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {hasMinLength ? <Check size={10} className="stroke-[3]" /> : <span className="inline-block w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500"></span>}
                      <span>8+ chars</span>
                    </div>
                    <div className={`flex items-center gap-1 transition-colors ${hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {hasUppercase ? <Check size={10} className="stroke-[3]" /> : <span className="inline-block w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500"></span>}
                      <span>1 Uppercase</span>
                    </div>
                    <div className={`flex items-center gap-1 transition-colors ${hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {hasSpecialChar ? <Check size={10} className="stroke-[3]" /> : <span className="inline-block w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500"></span>}
                      <span>1 Special char</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-0.5 text-slate-600 dark:text-slate-300">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      required
                      className={`w-full pl-2.5 pr-8 py-1.5 rounded-md border focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs
                                  ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {showMatchError && (
                    <p className="text-[10px] font-semibold text-red-500 mt-1 select-none">
                      Passwords do not match
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: College & Academic Info */}
          <div className="border-b border-black/5 dark:border-white/5 pb-2.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">2. College & Academic Information</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold mb-0.5 text-slate-600 dark:text-slate-300">
                  College Name *
                </label>
                <input
                  type="text"
                  name="collegeName"
                  required
                  className={`w-full px-2.5 py-1.5 rounded-md border focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs
                              ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                  placeholder="e.g. IIT Delhi"
                  value={formData.collegeName}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold mb-0.5 text-slate-600 dark:text-slate-300">
                    Degree / Branch *
                  </label>
                  <input
                    type="text"
                    name="degreeBranch"
                    required
                    className={`w-full px-2.5 py-1.5 rounded-md border focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs
                                ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                    placeholder="e.g. B.Tech CSE"
                    value={formData.degreeBranch}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-0.5 text-slate-600 dark:text-slate-300">
                    Graduation Year *
                  </label>
                  <select
                    name="graduationYear"
                    required
                    className={`w-full px-2.5 py-1.5 rounded-md border focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs
                                ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                    value={formData.graduationYear}
                    onChange={handleChange}
                  >
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                    <option value="2029">2029</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Program & Commitment */}
          <div className="space-y-2 pb-1">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">3. Program Selection & Readiness</h3>
            
            <div>
              <span className="block text-[11px] font-semibold mb-1 text-slate-600 dark:text-slate-300">
                Which program are you joining? *
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                {['Placement Sprint', 'Full Stack Project Program', 'Both'].map((program) => (
                  <label 
                    key={program} 
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border cursor-pointer hover:bg-blue-500/5 transition text-[11px]
                                ${formData.programSelection === program 
                                  ? 'border-blue-500 bg-blue-500/10 font-medium' 
                                  : (theme === 'dark' ? 'border-gray-700' : 'border-gray-300')}`}
                  >
                    <input
                      type="radio"
                      name="programSelection"
                      value={program}
                      checked={formData.programSelection === program}
                      onChange={handleChange}
                      className="text-blue-500 focus:ring-blue-500 h-3 w-3"
                    />
                    <span className="truncate">{program}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold mb-0.5 text-slate-600 dark:text-slate-300">
                  Placement readiness? *
                </label>
                <select
                  name="placementReadiness"
                  required
                  className={`w-full px-2.5 py-1.5 rounded-md border focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs
                              ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                  value={formData.placementReadiness}
                  onChange={handleChange}
                >
                  <option value="Just Starting">Just Starting</option>
                  <option value="Preparing Inconsistently">Preparing Inconsistently</option>
                  <option value="Actively Preparing">Actively Preparing</option>
                  <option value="Already Attending Interviews">Already Attending Interviews</option>
                </select>
              </div>

              <div>
                <span className="block text-[11px] font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Commit 30–90 min daily? *
                </span>
                <div className="flex gap-4 items-center pt-0.5">
                  {['Yes', 'No'].map((option) => (
                    <label key={option} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="dailyCommitment"
                        value={option}
                        checked={formData.dailyCommitment === option}
                        onChange={handleChange}
                        className="text-blue-500 focus:ring-blue-500 h-3 w-3"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div className={`p-2 rounded-md border flex gap-2 text-[11px] leading-4
                            ${theme === 'dark' ? 'border-gray-800 bg-gray-900/30' : 'border-gray-200 bg-slate-50'}`}>
              <input
                type="checkbox"
                name="declarationAccepted"
                id="declarationAccepted"
                checked={formData.declarationAccepted}
                onChange={handleChange}
                className="mt-0.5 text-blue-500 focus:ring-blue-500 h-3.5 w-3.5 rounded shrink-0 cursor-pointer"
              />
              <label htmlFor="declarationAccepted" className="text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                I understand that this program requires daily participation and consistent effort. *
              </label>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full font-bold py-2 px-4 rounded-md transition-colors shadow-sm transform active:scale-[0.99] text-xs mt-1
                      ${theme === 'dark' ? 
                        'bg-blue-600 hover:bg-blue-500 text-white' : 
                        'bg-blue-800 hover:bg-blue-700 text-white'}`}
          >
            Create account
          </button>

          <div className={`flex items-center justify-center my-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <span className={`border-t w-full ${theme === 'dark' ? 'border-gray-800' : 'border-gray-300'}`}></span>
            <span className="px-2 text-[10px] text-slate-400 whitespace-nowrap">or continue with</span>
            <span className={`border-t w-full ${theme === 'dark' ? 'border-gray-800' : 'border-gray-300'}`}></span>
          </div>

          <div className="flex justify-center">
            <div className={`rounded-md p-1 border hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center 
                            ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
              <div id="googleSignupDiv"></div>
            </div>
          </div>

          <p className={`text-center mt-2 text-[11px] ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Already have an account?{' '}
            <button 
              type="button"
              onClick={openLogin}
              className={`font-semibold hover:underline ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} bg-transparent border-none cursor-pointer`}
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
