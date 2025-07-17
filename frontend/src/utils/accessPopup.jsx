import React from "react";
import axios from "axios";

const AccessPopup = ({ open, onClose }) => {
  const loadRazorpay = () => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onerror = () => alert("Failed to load Razorpay SDK. Are you online?");
    script.onload = () => {
      const options = {
        key: "YOUR_RAZORPAY_KEY", // Replace with actual Razorpay key
        amount: 49900, // ₹499 in paise
        currency: "INR",
        name: "TechLearn Club",
        description: "Access to Premium Projects",
        handler: async function (response) {
          const token = localStorage.getItem("authToken");
          try {
            await axios.post(
              `${import.meta.env.VITE_API_URL}/transactions/submit-transaction`,
              {
                transactionId: response.razorpay_payment_id,
                immediateAccess: true
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            alert("Payment successful and access granted!");
            window.location.reload();
          } catch (err) {
            alert("Error submitting transaction");
          }
        },
        theme: { color: "#007bff" },
      };
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    };
    document.body.appendChild(script);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#001233] p-8 rounded shadow-lg min-w-[320px] max-w-full text-center">
        <h3 className="text-lg font-bold mb-2 text-[#001233] dark:text-[#e0e6f5]">
          Club Membership Required
        </h3>
        <p className="mb-4 text-[#001233] dark:text-[#e0e6f5]">
          Please become a club member to access this project.
        </p>
        <button
          onClick={loadRazorpay}
          className="bg-blue-600 text-white px-4 py-2 rounded-full">
          Pay with Razorpay
        </button>
        <button
          onClick={onClose}
          className="ml-4 text-gray-600">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AccessPopup;
