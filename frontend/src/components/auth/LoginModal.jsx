import { useEffect, useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Hardcoded admin credentials check
    if (formData.email === 'admintls@123' && formData.password === 'admintls123') {
      localStorage.setItem('token', 'mock-admin-token');
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin');
      onClose();
      return;
    }

    try {
      const result = await login(formData);
      if (result.success) {
        localStorage.setItem('isAdmin', 'false');
        navigate("/dashboard");
        onClose();
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordMessage("");
    setError("");
    
    if (!forgotPasswordEmail) {
      setError("Please enter your email");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setForgotPasswordMessage("Password reset link sent to your email");
      } else {
        setError(data.message || "Failed to send reset email");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Something went wrong");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setFormData({ email: '', password: '' });
      setError("");
      setShowPassword(false);
      setForgotPasswordMode(false);
      setForgotPasswordEmail("");
      setForgotPasswordMessage("");
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
          className="relative w-full max-w-md mx-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg rounded-xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          {forgotPasswordMode ? (
            <>
              <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-400 mb-6 text-center">Forgot Password</h2>
              
              {forgotPasswordMessage && (
                <p className="text-green-600 text-sm text-center mb-4">{forgotPasswordMessage}</p>
              )}
              {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-800 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Send Reset Link
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordMode(false);
                    setError("");
                    setForgotPasswordMessage("");
                  }}
                  className="w-full text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  Back to Login
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-400 mb-6 text-center">Login</h2>

              {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="username@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-[calc(50%+10px)] transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotPasswordMode(true)}
                  className="text-center text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer w-full"
                >
                  Forgot Password?
                </button>
                <button
                  type="submit"
                  className="w-full bg-blue-800 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Sign in
                </button>

                <p className="text-gray-700 dark:text-gray-300 text-center mt-6 text-sm">
                  Don't have an account?
                  <button
                    type="button"
                    onClick={onSwitchToSignup}
                    className="text-blue-600 dark:text-blue-400 hover:underline ml-1 font-medium"
                  >
                    Sign up for free
                  </button>
                </p>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>  
  );
}