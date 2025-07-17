import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Star,
  Smartphone,
  CreditCard
} from 'lucide-react';
import { getProjectById } from '../../api/project';

const ProjectPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();


  // Always use project from navigation state if present
  const [project, setProject] = useState(() => {
    if (location.state?.project) {
      console.log('Project received from navigation state:', location.state.project);
      return location.state.project;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!location.state?.project);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const projectId = searchParams.get('projectId');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // No backend fetch: only use project from navigation state
  useEffect(() => {
    if (location.state?.project) {
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleInitiatePayment = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all required fields.');
      return;
    }
    setIsProcessing(true);
    navigate("/payment-gateway", { state: { project } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#beaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading project details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const safeProject = project || {
    title: 'Project Not Found',
    description: 'The requested project could not be loaded',
    price: 0,
    originalPrice: 0,
    duration: 'N/A',
    level: 'N/A',
    rating: 0,
    features: []
  };

  // Use backend price if available, fallback to frontend
  const price = typeof safeProject.price === 'number' ? safeProject.price : (safeProject.price === 'Free' ? 0 : 150);
  const originalPrice = typeof safeProject.originalPrice === 'number' ? safeProject.originalPrice : 150;
  const discount = Math.max(0, originalPrice - price);
  const features = Array.isArray(safeProject.features) ? safeProject.features : [];

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Projects</span>
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-xl p-8 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8" style={{ fontFamily: "'Poppins', sans-serif" }}>Complete Your Enrollment</h2>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email address" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your phone number" />
                  </div>
                </div>
              </div>

              {/* UPI Payment Method Box */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Choose Payment Method</h3>
                <div className="grid grid-cols-1">
                  <div
                    className="relative p-4 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-500/10 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">UPI Payment</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Secure payment with UPI</p>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">₹150</p>
                        </div>
                      </div>
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Recommended</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleInitiatePayment}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Get Project Access
                  </>
                )}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}>
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-xl p-6 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>{safeProject.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{safeProject.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{safeProject.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{safeProject.rating}</span>
                    </div>
                  </div>

                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded" style={{ fontFamily: "'Poppins', sans-serif" }}>{safeProject.level}</span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-3">What's Included:</h5>
                  <div className="space-y-2">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-600 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Original Price:</span>
                    <span className="text-gray-600 dark:text-gray-400">₹{originalPrice}/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                    <span className="text-green-600 dark:text-green-400">-₹{discount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-gray-900 dark:text-white">₹{price}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPayment;
