import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const PaymentGateway = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const project = location.state?.project;

  const [transactionId, setTransactionId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [submittedPayments, setSubmittedPayments] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <p className="text-red-500 font-semibold">Project not found.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!transactionId) {
      return;
    }

    const paymentData = {
      transactionId: transactionId,
      projectTitle: project.title,
      amount: project.price,
      upiId: "9676663136@axl",
      timestamp: new Date().toISOString(),
      status: "pending"
    };

    console.log("=== PAYMENT SUBMISSION DETAILS ===");
    console.log("Transaction ID:", paymentData.transactionId);
    console.log("Project Title:", paymentData.projectTitle);
    console.log("Amount:", `₹${paymentData.amount}`);
    console.log("UPI ID:", paymentData.upiId);
    console.log("Timestamp:", paymentData.timestamp);
    console.log("Status:", paymentData.status);
    console.log("Full Payment Object:", paymentData);
    console.log("===================================");

    setPaymentDetails(paymentData);
    setSubmittedPayments(prev => [...prev, paymentData]);
    setIsProcessing(true);

    setTimeout(() => {
      const completedPayment = { ...paymentData, status: "completed" };
      setPaymentDetails(completedPayment);
      setSubmittedPayments(prev =>
        prev.map(payment =>
          payment.transactionId === paymentData.transactionId
            ? completedPayment
            : payment
        )
      );

      console.log("=== PAYMENT COMPLETED ===");
      console.log("Updated Payment Status:", completedPayment);
      console.log("All Submitted Payments:", [...submittedPayments, completedPayment]);
      console.log("========================");

      setIsProcessing(false);
      setShowSuccessModal(true);
    }, 1200);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate("/build");
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <div className="max-w-xl mx-auto px-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-xl p-8 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Payment for Project
          </h2>

          <div className="mb-4 text-blue-800 font-semibold text-lg">
            ₹150/month
          </div>

          <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Scan the QR code below or pay to UPI ID: <span className="font-bold text-gray-900 dark:text-white">9676663136@axl</span>
          </div>

          <div className="flex justify-center mb-6">
            <img src="/QR_project.jpg" alt="Payment QR Code" className="w-48 h-48 rounded shadow" />
          </div>

          {paymentDetails && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Current Payment Details:</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Transaction ID: {paymentDetails.transactionId}<br />
                Status: <span className="capitalize">{paymentDetails.status}</span><br />
                Amount: ₹{paymentDetails.amount}<br />
                Submitted: {new Date(paymentDetails.timestamp).toLocaleString()}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transaction ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="transactionId"
              value={transactionId}
              onChange={e => setTransactionId(e.target.value)}
              className="w-full px-4 py-3 mb-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter transaction ID after payment"
              required
            />
            <button
              type="submit"
              disabled={isProcessing || !transactionId}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Submit Payment
                </>
              )}
            </button>
          </form>

          {submittedPayments.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Payment History ({submittedPayments.length}):
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Check console for detailed logs
              </p>
            </div>
          )}
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 transform transition-all duration-300 scale-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Payment Submitted Successfully!
              </h3>
              <div className="bg-gradient-to-r from-[#daf0fa] to-[#bceaff] dark:from-[#020b23] dark:to-[#001233] rounded-lg p-4 mb-6">
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  Your payment is being processed and you will receive confirmation via email within
                  <span className="font-semibold text-blue-600 dark:text-blue-400"> 48 hours</span>.
                </p>
              </div>
              {paymentDetails && (
                <div className="bg-white/60 dark:bg-gray-700/60 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Payment Summary:</h4>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p><span className="font-medium">Transaction ID:</span> {paymentDetails.transactionId}</p>
                    <p><span className="font-medium">Project:</span> {paymentDetails.projectTitle}</p>
                    <p><span className="font-medium">Amount:</span> ₹{paymentDetails.amount}</p>
                    <p><span className="font-medium">Status:</span> <span className="text-green-600 dark:text-green-400 font-medium">Completed</span></p>
                  </div>
                </div>
              )}
              <button
                onClick={handleCloseModal}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentGateway;
