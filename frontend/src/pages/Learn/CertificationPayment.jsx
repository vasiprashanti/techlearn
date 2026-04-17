import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  Clock,
  Users,
  Star,
  Award,
  Smartphone,
  Trophy,
  CreditCard,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useAuthModalContext } from "../../context/AuthModalContext";
import {
  paymentAPI,
  courseAPI,
  progressAPI,
  certificateAPI,
} from "../../services/api";

const CertificationPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { openLogin } = useAuthModalContext();

  const [certification, setCertification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("upi");
  const [userXP, setUserXP] = useState(0);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  // Payment flow states
  const [paymentStatus, setPaymentStatus] = useState(null); // null, 'eligible', 'not-eligible', 'already-paid'
  const [eligibilityData, setEligibilityData] = useState(null);
  const [paymentInitiated, setPaymentInitiated] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    transactionId: "",
  });

  const courseId = searchParams.get("courseId");

  useEffect(() => {
    const fetchCertificationDetails = async () => {
      try {
        if (courseId) {
          const courseData = await courseAPI.getCourse(courseId);

          // Get pricing based on course title
          const getCertificationPricing = (title) => {
            const titleLower = title.toLowerCase();
            if (titleLower.includes("python")) {
              return {
                price: 1000, // Changed from 1499 to 1000
                originalPrice: 1000,
                xpDiscount: 500,
                requiredXP: 1000,
              };
            } else if (
              titleLower.includes("java") ||
              titleLower.includes("c programming")
            ) {
              return {
                price: 1300, // Changed from 1499 to 1300
                originalPrice: 1300,
                xpDiscount: 500,
                requiredXP: 1000,
              };
            } else {
              return {
                price: 7999, // Other courses remain unchanged
                originalPrice: 7999,
                xpDiscount: null,
                requiredXP: null,
              };
            }
          };

          const pricing = getCertificationPricing(courseData.title);

          setCertification({
            id: courseData._id,
            title: courseData.title,
            description:
              courseData.description ||
              "Master the fundamentals and advanced concepts",
            duration: "12 weeks",
            level: courseData.level || "Intermediate",
            price: pricing.price,
            originalPrice: pricing.originalPrice,
            xpDiscount: pricing.xpDiscount,
            requiredXP: pricing.requiredXP,
            rating: 4.8,
            studentsEnrolled: Math.floor(Math.random() * 2000) + 1000,
            features: [
              "Industry-recognized certificate",
              "Blockchain-verified authenticity",
              "LinkedIn credential integration",
              "Lifetime validity",
              "Downloadable PDF format",
              "Employer verification portal",
            ],
          });
        }

        // Fetch user XP if authenticated
        if (user) {
          try {
            const xpResponse = await progressAPI.getUserProgress();
            // Calculate total XP from both course and exercise XP
            const totalXP =
              (xpResponse.totalCourseXP || 0) +
              (xpResponse.totalExerciseXP || 0);
            setUserXP(totalXP);
          } catch (error) {
            console.error("Error fetching user XP:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching certification details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificationDetails();
  }, [courseId, user]);

  // Auto-populate form data when user is authenticated
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.firstName || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Calculate final price based on user's XP
  const getFinalPrice = () => {
    if (!certification) return 0;

    // Check if user has enough XP for discount
    if (
      certification.xpDiscount &&
      certification.requiredXP &&
      userXP >= certification.requiredXP
    ) {
      return certification.price - certification.xpDiscount;
    }

    return certification.price;
  };

  // Check if user is eligible for XP discount
  const isEligibleForXPDiscount = () => {
    return (
      certification?.xpDiscount &&
      certification?.requiredXP &&
      userXP >= certification.requiredXP
    );
  };

  const handleInitiatePayment = async () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (!formData.name || !formData.email || !formData.phone) {
      alert("Please fill in all required fields.");
      return;
    }

    if (selectedPaymentMethod === "xp" && userXP < 1000) {
      alert("You do not have enough XP points to redeem this certification.");
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Call the initiate endpoint to check eligibility
      const response = await paymentAPI.initiatePayment(courseId);

      setEligibilityData(response);

      if (response.eligible && response.paymentAllowed) {
        // User is eligible and can pay
        setPaymentStatus("eligible");
        setShowPaymentDetails(true);
        setPaymentInitiated(true);
      } else if (response.eligible && !response.paymentAllowed) {
        // User is eligible but already paid
        setPaymentStatus("already-paid");
        alert(
          "You already have a pending or approved payment for this course."
        );
      } else {
        // User is not eligible yet
        setPaymentStatus("not-eligible");
        alert(
          `Not eligible for certificate yet. You need to complete all quizzes and exercises first.\n\nYour Progress: ${response.userTotalXP}/${response.totalPossibleXP} XP`
        );
      }
    } catch (error) {
      console.error("Error initiating payment:", error);

      // Show the actual error message from the backend if available
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to check payment eligibility. Please try again.";
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to generate certificate after successful payment
  const generateCertificate = async () => {
    try {
      const certificateData = {
        name: formData.name,
        email: formData.email,
        courseName: certification.title,
        xp: eligibilityData?.userTotalXP || 0,
      };

      await certificateAPI.generateCertificate(certificateData);
      console.log("Certificate generated and emailed successfully");
    } catch (error) {
      console.error("Certificate generation failed:", error);
      // Don't block the payment flow if certificate generation fails
    }
  };

  const handleSubmit = async () => {
    if (selectedPaymentMethod === "upi" && !formData.transactionId) {
      alert("Please enter the transaction ID after completing the payment.");
      return;
    }

    // Check if payment was properly initiated
    if (!paymentInitiated || paymentStatus !== "eligible") {
      alert('Please initiate payment first by clicking "Get Certificate".');
      return;
    }

    setIsProcessing(true);

    try {
      if (selectedPaymentMethod === "xp") {
        // Handle XP redemption - use new payment endpoint
        const paymentData = {
          transactionId: "XP_REDEMPTION_" + Date.now(),
          paymentType: "certificate",
          courseId: certification.id,
        };

        await paymentAPI.submitPayment(paymentData);

        // For XP redemption, generate certificate immediately
        await generateCertificate();

        alert(
          "Certificate redeemed successfully with XP points! Your certificate has been generated and emailed to you."
        );
        navigate("/learn/certification");
      } else {
        // Handle UPI payment - use new payment endpoint
        const paymentData = {
          transactionId: formData.transactionId,
          paymentType: "certificate",
          courseId: certification.id,
        };

        await paymentAPI.submitPayment(paymentData);
        alert(
          "Payment submitted successfully! Your payment is being processed and you will receive confirmation via email within 48 hours."
        );
        navigate("/learn/certification");
      }
    } catch (error) {
      console.error("Payment submission error:", error);

      // Handle specific error messages from backend
      if (error.message?.includes("Transaction ID already exists")) {
        alert(
          "This transaction ID has already been used. Please enter a different transaction ID."
        );
      } else if (
        error.message?.includes("already have a pending or approved payment")
      ) {
        alert(
          "You already have a pending or approved payment for this course."
        );
      } else {
        alert(
          "An error occurred while processing your payment. Please try again."
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading certification details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!certification) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Certification Not Found
            </h2>
            <button
              onClick={() => navigate("/learn/certification")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Certifications
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => navigate("/learn/certification")}
            className="inline-flex items-center gap-2 px-1 py-1 text-sm font-semibold text-[#2d7fe8] transition hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Certifications</span>
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-8 shadow-[0_12px_34px_rgba(60,131,246,0.12)] backdrop-blur-lg dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70">
              <h2 className="mb-8 font-poppins text-3xl font-bold text-[#0d2a57] dark:text-[#8fd9ff]">
                Complete Your Enrollment
              </h2>

              {/* Contact Information */}
              <div className="mb-8">
                <h3 className="mb-6 text-xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4c6f9a] dark:text-[#7fb8e2]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-[#86c4ff]/45 bg-[#f5fbff] px-4 py-3 text-[#0d2a57] placeholder-[#7aa1c6] outline-none focus:border-[#2d7fe8] dark:border-[#6fbfff]/35 dark:bg-[#0a2f6f]/55 dark:text-[#8fd9ff] dark:placeholder-[#78b3de]"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4c6f9a] dark:text-[#7fb8e2]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-[#86c4ff]/45 bg-[#f5fbff] px-4 py-3 text-[#0d2a57] placeholder-[#7aa1c6] outline-none focus:border-[#2d7fe8] dark:border-[#6fbfff]/35 dark:bg-[#0a2f6f]/55 dark:text-[#8fd9ff] dark:placeholder-[#78b3de]"
                      placeholder="Enter your email address"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-[#4c6f9a] dark:text-[#7fb8e2]">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-[#86c4ff]/45 bg-[#f5fbff] px-4 py-3 text-[#0d2a57] placeholder-[#7aa1c6] outline-none focus:border-[#2d7fe8] dark:border-[#6fbfff]/35 dark:bg-[#0a2f6f]/55 dark:text-[#8fd9ff] dark:placeholder-[#78b3de]"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-8">
                <h3 className="mb-6 text-xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                  Choose Payment Method
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* UPI Payment */}
                  <div
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPaymentMethod === "upi"
                        ? "border-[#2d7fe8] bg-[#dbf1ff] dark:border-[#8fd9ff] dark:bg-[#0d366f]/60"
                        : "border-[#86c4ff]/40 bg-[#f5fbff] hover:border-[#5da8f0] dark:border-[#6fbfff]/30 dark:bg-[#0a2f6f]/45 dark:hover:border-[#8fd9ff]/60"
                    }`}
                    onClick={() => setSelectedPaymentMethod("upi")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                            UPI Payment
                          </h4>
                          <p className="text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">
                            Secure payment with UPI
                          </p>
                          <p className="text-lg font-bold text-[#2d7fe8] dark:text-[#8fd9ff]">
                            ₹{getFinalPrice().toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {selectedPaymentMethod === "upi" && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    {selectedPaymentMethod === "upi" && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Recommended
                        </span>
                      </div>
                    )}
                  </div>

                  {/* XP Redemption */}
                  <div
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPaymentMethod === "xp"
                        ? "border-[#f0c85f] bg-[#fff4cc] dark:border-[#f0c85f]/70 dark:bg-[#7c6216]/25"
                        : "border-[#86c4ff]/40 bg-[#f5fbff] hover:border-[#5da8f0] dark:border-[#6fbfff]/30 dark:bg-[#0a2f6f]/45 dark:hover:border-[#8fd9ff]/60"
                    }`}
                    onClick={() => setSelectedPaymentMethod("xp")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                            Redeem XP Points
                          </h4>
                          <p className="text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">
                            {certification.xpDiscount
                              ? `Save ₹${certification.xpDiscount} with XP points`
                              : "Use your earned XP points"}
                          </p>
                          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                            {certification.requiredXP || 1000} XP Required
                          </p>
                        </div>
                      </div>
                      {selectedPaymentMethod === "xp" && (
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Payment Details - Only show after user clicks "Proceed to Pay" */}
              {showPaymentDetails && selectedPaymentMethod === "upi" && (
                <div className="mb-8">
                  <h3 className="mb-6 text-xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                    Complete Your Payment
                  </h3>
                  <div className="rounded-lg border border-[#86c4ff]/40 bg-[#f5fbff] p-6 dark:border-[#6fbfff]/30 dark:bg-[#0a2f6f]/55">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Smartphone className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="mb-2 text-lg font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                        UPI Payment
                      </h4>
                      <p className="text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">
                        Google Pay, PhonePe, Paytm, BHIM
                      </p>
                    </div>
                    <div className="text-center mb-6">
                      <div className="bg-white rounded-lg p-4 inline-block shadow-md mb-4">
                        <img
                          src="/QR1.jpg"
                          alt="Payment QR Code"
                          className="w-48 h-48 mx-auto"
                        />
                      </div>
                      <p className="text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">
                        Scan QR code or pay to UPI ID:{" "}
                        <strong className="text-[#0d2a57] dark:text-[#8fd9ff]">
                          9676663136@axl
                        </strong>
                      </p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-2">
                        Amount: ₹{getFinalPrice()?.toLocaleString()}
                      </p>
                    </div>

                    {/* Transaction ID Input */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#4c6f9a] dark:text-[#7fb8e2]">
                        Transaction ID *
                      </label>
                      <input
                        type="text"
                        name="transactionId"
                        value={formData.transactionId}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-[#86c4ff]/45 bg-white px-4 py-3 text-[#0d2a57] placeholder-[#7aa1c6] outline-none focus:border-[#2d7fe8] dark:border-[#6fbfff]/35 dark:bg-[#0a2f6f]/55 dark:text-[#8fd9ff] dark:placeholder-[#78b3de]"
                        placeholder="Enter transaction ID after payment"
                        required
                      />
                      <p className="mt-1 text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">
                        Enter the transaction ID you received after completing
                        the UPI payment
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* XP Redemption Details */}
              {selectedPaymentMethod === "xp" && (
                <div className="mb-8">
                  <h3 className="mb-6 text-xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                    XP Points Redemption
                  </h3>
                  <div className="rounded-lg border border-[#86c4ff]/40 bg-[#f5fbff] p-6 dark:border-[#6fbfff]/30 dark:bg-[#0a2f6f]/55">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[#4c6f9a] dark:text-[#7fb8e2]">
                        Available XP Points:
                      </span>
                      <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                        {userXP} XP
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[#4c6f9a] dark:text-[#7fb8e2]">
                        Required XP Points:
                      </span>
                      <span className="font-bold text-[#0d2a57] dark:text-[#8fd9ff]">
                        1000 XP
                      </span>
                    </div>
                    {userXP >= 1000 ? (
                      <div className="bg-green-50 dark:bg-green-500/20 border border-green-200 dark:border-green-500 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="text-green-700 dark:text-green-400 font-medium">
                            You have enough XP points!
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-red-700 dark:text-red-400 font-medium">
                            You need {1000 - userXP} more XP points to redeem
                            this certification.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Status Messages */}
              {paymentStatus === "not-eligible" && eligibilityData && (
                <div className="mb-6 bg-yellow-50 dark:bg-yellow-500/20 border border-yellow-200 dark:border-yellow-500 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-yellow-700 dark:text-yellow-400 font-medium">
                      Course Not Completed
                    </span>
                  </div>
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                    Complete all quizzes and exercises to become eligible for
                    certification.
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
                    Progress: {eligibilityData.userTotalXP}/
                    {eligibilityData.totalPossibleXP} XP
                  </p>
                </div>
              )}

              {paymentStatus === "already-paid" && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-700 dark:text-blue-400 font-medium">
                      Payment Already Submitted
                    </span>
                  </div>
                  <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                    You already have a pending or approved payment for this
                    course.
                  </p>
                </div>
              )}

              {paymentStatus === "eligible" && paymentInitiated && (
                <div className="mb-6 bg-green-50 dark:bg-green-500/20 border border-green-200 dark:border-green-500 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-400 font-medium">
                      Eligible for Certification
                    </span>
                  </div>
                  <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                    You can now proceed with the payment.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              {!showPaymentDetails ? (
                <button
                  onClick={handleInitiatePayment}
                  disabled={
                    isProcessing ||
                    (selectedPaymentMethod === "xp" && userXP < 1000)
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#86c4ff]/45 bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6] px-6 py-4 font-semibold text-[#082a5d] shadow-md transition-all duration-300 hover:brightness-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#6fbfff]/35"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Checking Eligibility...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      {selectedPaymentMethod === "upi"
                        ? "Get Certificate"
                        : "Redeem with XP"}
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={
                    isProcessing ||
                    (selectedPaymentMethod === "upi" &&
                      !formData.transactionId) ||
                    paymentStatus !== "eligible"
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#86c4ff]/45 bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6] px-6 py-4 font-semibold text-[#082a5d] shadow-md transition-all duration-300 hover:brightness-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#6fbfff]/35"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirm Payment
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>

          {/* Right Side - Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-6 shadow-[0_12px_34px_rgba(60,131,246,0.12)] backdrop-blur-lg dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70">
              <h3 className="mb-6 text-xl font-bold text-[#0d2a57] dark:text-[#8fd9ff]">
                Order Summary
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                    {certification.title} Programming
                  </h4>
                  <p className="mb-2 text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">
                    {certification.description}
                  </p>

                  <div className="mb-4 flex items-center gap-4 text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{certification.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{certification.rating}</span>
                    </div>
                  </div>

                  <span className="rounded border border-[#86c4ff]/45 bg-[#dbf1ff] px-2 py-1 text-xs text-[#2d7fe8] dark:border-[#6fbfff]/35 dark:bg-[#0d366f] dark:text-[#8fd9ff]">
                    Beginner
                  </span>
                </div>

                <div className="border-t border-[#86c4ff]/35 pt-4 dark:border-[#6fbfff]/25">
                  <h5 className="mb-3 font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                    What's Included:
                  </h5>
                  <div className="space-y-2">
                    {certification.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#86c4ff]/35 pt-4 dark:border-[#6fbfff]/25">
                  <div className="flex justify-between">
                    <span className="text-[#4c6f9a] dark:text-[#7fb8e2]">
                      Original Price:
                    </span>
                    <span className="text-[#0d2a57] dark:text-[#8fd9ff]">
                      ₹{certification.originalPrice.toLocaleString()}
                    </span>
                  </div>
                  {isEligibleForXPDiscount() && (
                    <div className="flex justify-between">
                      <span className="text-[#4c6f9a] dark:text-[#7fb8e2]">
                        XP Discount ({certification.requiredXP} XP):
                      </span>
                      <span className="text-green-600 dark:text-green-400">
                        -₹{certification.xpDiscount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-[#0d2a57] dark:text-[#8fd9ff]">
                      Total:
                    </span>
                    <span className="text-[#0d2a57] dark:text-[#8fd9ff]">
                      ₹{getFinalPrice().toLocaleString()}
                    </span>
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

export default CertificationPayment;
