import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Eye, EyeOff, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../config/firebase'; // Your Firebase config file
import { FcGoogle } from 'react-icons/fc';
import { navigateUserByProgram } from '../../utils/navigation';

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const { register, setSession } = useAuth();
  const { refetchUserData } = useUser();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const hasMinLength = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_]/.test(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword;
  const showMatchError = formData.confirmPassword.length > 0 && !passwordsMatch;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Helper function to handle navigation based on user role and program selection
  const navigateBasedOnRole = (userData) => {
    navigateUserByProgram(userData, navigate);
  };

  // Firebase Google Sign-up
  const handleGoogleSignUp = async () => {
    // Check if Firebase is initialized
    if (!auth) {
      setError("Google Sign-up is not available. Please use email/password registration.");
      return;
    }
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // Send idToken to your backend Firebase endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('isAdmin', data.user?.isAdmin ? 'true' : 'false');
        setSession(data.user, data.token);
        await refetchUserData();
        
        // Navigate based on user role
        navigateBasedOnRole(data.user);
        onClose();
      } else {
        setError(data.message || "Google sign-up failed");
      }
    } catch (error) {
      console.error('Google sign-up error:', error);
      setError("Google sign-up failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!hasMinLength || !hasUppercase || !hasSpecialChar) {
      setError("Password does not meet all requirements");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const result = await register(formData);

      if (result.success) {
        if (result.data?.token) {
          localStorage.setItem('token', result.data.token);
        }
        if (result.data?.user) {
          localStorage.setItem('userData', JSON.stringify(result.data.user));
          localStorage.setItem('isAdmin', result.data.user?.isAdmin ? 'true' : 'false');
        }
        console.log("Signed up:", result.data);
        
        // Navigate based on user role
        navigateBasedOnRole(result.data?.user);
        onClose();
      } else {
        setError(result.error || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setError('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md mx-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg rounded-xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20 max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-400 mb-6 text-center">Sign Up</h2>

          {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                name="fullName"
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Full name"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                name="email"
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="username@gmail.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

             <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="w-full pl-4 pr-10 py-3 bg-white/80 dark:bg-gray-800/80 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="mt-2 space-y-1.5">
                <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {hasMinLength ? <Check size={12} className="stroke-[3]" /> : <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 ml-1 mr-0.5"></span>}
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {hasUppercase ? <Check size={12} className="stroke-[3]" /> : <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 ml-1 mr-0.5"></span>}
                  <span>At least 1 uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {hasSpecialChar ? <Check size={12} className="stroke-[3]" /> : <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 ml-1 mr-0.5"></span>}
                  <span>At least 1 special character</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className="w-full pl-4 pr-10 py-3 bg-white/80 dark:bg-gray-800/80 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {showMatchError && (
                <p className="text-xs font-semibold text-red-500 mt-1.5 select-none">
                  Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-800 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Create account
            </button>

            {/* Google Sign-up Section */}
            <div className="flex items-center justify-center my-4 text-gray-500 dark:text-gray-400">
              <span className="border-t border-gray-400 dark:border-gray-600 w-full"></span>
              <span className="px-3 text-sm whitespace-nowrap">or continue with</span>
              <span className="border-t border-gray-400 dark:border-gray-600 w-full"></span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FcGoogle className="w-5 h-5" />
              Sign up with Google
            </button>

            <p className="text-gray-700 dark:text-gray-300 text-center mt-6 text-sm">
              Already have an account?
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 dark:text-blue-400 hover:underline ml-1 font-medium"
              >
                Sign in
              </button>
            </p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}