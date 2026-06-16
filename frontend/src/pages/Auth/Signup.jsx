import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { register, googleLogin } from '../../api/authService';
import { useAuthModalContext } from '../../context/AuthModalContext';
import { navigateUserByProgram } from '../../utils/navigation';

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
    <div className="flex items-center justify-center px-4 min-h-screen pt-24 pb-12">
      <div className={`w-full max-w-xl backdrop-blur-lg rounded-xl p-6 shadow-xl z-10 border text-left
                      ${theme === 'dark' ? 
                        'bg-gray-900/80 text-gray-100 border-gray-800' : 
                        'bg-white/70 text-gray-900 border-gray-200'}`}>

        <h2 className={`text-2xl font-bold mb-2 text-center ${theme === 'dark' ? 'text-blue-400' : 'text-blue-800'}`}>
          Student Sign Up
        </h2>
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-4">
          Complete your profile registration to access your personalized learning track.
        </p>

        {error && (
          <p className="text-sm text-center font-semibold mb-4 text-red-500 bg-red-500/10 py-2 rounded-lg border border-red-500/20">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Section 1: Basic Info */}
          <div className="border-b border-black/5 dark:border-white/5 pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">1. Personal Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm
                              ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                  placeholder="e.g. Angad Kumar"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm
                                ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                    placeholder="name@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    required
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm
                                ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                    placeholder="e.g. 9876543210"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm
                                ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm
                                ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: College & Academic Info */}
          <div className="border-b border-black/5 dark:border-white/5 pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">2. College & Academic Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  College Name *
                </label>
                <input
                  type="text"
                  name="collegeName"
                  required
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm
                              ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                  placeholder="e.g. IIT Delhi"
                  value={formData.collegeName}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Degree / Branch *
                  </label>
                  <input
                    type="text"
                    name="degreeBranch"
                    required
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm
                                ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
                    placeholder="e.g. B.Tech CSE"
                    value={formData.degreeBranch}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Graduation Year *
                  </label>
                  <select
                    name="graduationYear"
                    required
                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm
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
          <div className="space-y-4 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Program Selection & Readiness</h3>
            
            <div>
              <span className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-300">
                Which program are you joining? *
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {['Placement Sprint', 'Full Stack Project Program', 'Both'].map((program) => (
                  <label 
                    key={program} 
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-blue-500/5 transition text-sm
                                ${formData.programSelection === program 
                                  ? 'border-blue-500 bg-blue-500/10' 
                                  : (theme === 'dark' ? 'border-gray-700' : 'border-gray-300')}`}
                  >
                    <input
                      type="radio"
                      name="programSelection"
                      value={program}
                      checked={formData.programSelection === program}
                      onChange={handleChange}
                      className="text-blue-500 focus:ring-blue-500"
                    />
                    <span>{program}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Are you preparing for placements? *
                </label>
                <select
                  name="placementReadiness"
                  required
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm
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
                <span className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-300">
                  Can you commit 30–90 minutes daily? *
                </span>
                <div className="flex gap-4">
                  {['Yes', 'No'].map((option) => (
                    <label key={option} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="dailyCommitment"
                        value={option}
                        checked={formData.dailyCommitment === option}
                        onChange={handleChange}
                        className="text-blue-500 focus:ring-blue-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div className={`p-3 rounded-lg border flex gap-3 text-xs leading-5
                            ${theme === 'dark' ? 'border-gray-800 bg-gray-900/30' : 'border-gray-200 bg-slate-50'}`}>
              <input
                type="checkbox"
                name="declarationAccepted"
                id="declarationAccepted"
                checked={formData.declarationAccepted}
                onChange={handleChange}
                className="mt-1 text-blue-500 focus:ring-blue-500 h-4 w-4 rounded shrink-0 cursor-pointer"
              />
              <label htmlFor="declarationAccepted" className="text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                I understand that this program requires daily participation and consistent effort. *
              </label>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full font-bold py-2.5 px-4 rounded-lg transition-colors shadow-md transform active:scale-[0.99] text-sm
                      ${theme === 'dark' ? 
                        'bg-blue-600 hover:bg-blue-500 text-white' : 
                        'bg-blue-800 hover:bg-blue-700 text-white'}`}
          >
            Create account
          </button>

          <div className={`flex items-center justify-center my-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <span className={`border-t w-full ${theme === 'dark' ? 'border-gray-800' : 'border-gray-300'}`}></span>
            <span className="px-2 text-xs text-slate-400 whitespace-nowrap">or continue with</span>
            <span className={`border-t w-full ${theme === 'dark' ? 'border-gray-800' : 'border-gray-300'}`}></span>
          </div>

          <div className="flex justify-center mt-2">
            <div className={`rounded-lg p-1.5 border hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center 
                            ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
              <div id="googleSignupDiv"></div>
            </div>
          </div>

          <p className={`text-center mt-4 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
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
