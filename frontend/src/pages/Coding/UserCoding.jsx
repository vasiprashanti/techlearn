import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import CodingCompiler from "./CodingCompiler";

//  BASE_URL should come from your config/env


// ---------------- LOGIN PAGE ----------------
const LoginPage = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const { linkId } = useParams();

  

  const BASE_URL = import.meta.env.VITE_API_URL;
  // Regex for validating college email (adjust domain if needed)
  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/;
    return regex.test(email);
  };

  const handleAction = async () => {
    if (!validateEmail(email)) {
      setError("Please enter a valid college email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!codeSent) {
        // Send OTP
        const res = await fetch(`${BASE_URL}/college-coding/${linkId}/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setCodeSent(true);
        } else {
          setError(data.message || "Failed to send OTP");
        }
      } else {
        // Verify OTP
        if (!code) {
          setError("Verification code is required");
          setLoading(false);
          return;
        }
        const res = await fetch(
          `${BASE_URL}/college-coding/${linkId}/verify-otp`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp: code }),
          }
        );
        const data = await res.json();

        if (res.ok && data.success) {
          // ✅ Pass email + quiz data forward
          onSuccess(email, data.collegeMcq);
        } else {
          setError(data.message || "Invalid OTP");
        }
      }
    } catch (err) {
      setError("Server error. Try again later.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 dark:border-gray-700/20 w-full max-w-md text-center"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Login with Verification Code
        </h2>

        {/* Email Input */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your Email ID"
          className={`w-full px-3 py-2 border rounded-md mb-4 focus:ring-2 ${
            error && !validateEmail(email)
              ? "border-red-500 focus:ring-red-500"
              : "focus:ring-blue-500"
          } dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
        />

        {/* Verification Code Input */}
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter verification code"
          className="w-full px-3 py-2 border rounded-md mb-4 focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Dynamic Button */}
        <button
          onClick={handleAction}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-full"
        >
          {loading
            ? !codeSent
              ? "Sending..."
              : "Verifying..."
            : !codeSent
            ? "Send Verification Code"
            : "Verify & Continue"}
        </button>

        {codeSent && (
          <p className="text-sm text-green-600 mt-3">
            ✅ Code sent to your email. Please check your inbox.
          </p>
        )}
      </motion.div>
    </div>
  );
};

// ---------------- MAIN FLOW ----------------
const UserCoding = () => {
  const [step, setStep] = useState("login"); // login | instructions | compiler
  const [user, setUser] = useState(null);
  const [quiz, setQuiz] = useState(null);

  const handleLoginSuccess = (email, quizData) => {
    setUser({ email });
    setQuiz(quizData);
    setStep("instructions");
  };

  return (
    <>
      {step === "login" && <LoginPage onSuccess={handleLoginSuccess} />}

      {step === "instructions" && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-6">
          <div className="bg-white/20 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 p-8 w-full max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center dark:text-white">
              Coding Round Instructions
            </h1>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-3 mb-6 text-left">
              <li>
                You will be given <b>2 coding problems</b> to solve.
              </li>
              <li>
                Time limit: <b>60 minutes</b>.
              </li>
              <li>You can run and test your code before submitting.</li>
              <li>
                Once submitted, you <b>cannot edit</b> your answers.
              </li>
              <li>
                Plagiarism will lead to <b>disqualification</b>.
              </li>
              <li>Make sure to submit before time runs out.</li>
            </ul>
            <div className="flex justify-center">
              <button
                onClick={() => setStep("compiler")}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
              >
                Start Coding Round
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "compiler" && <CodingCompiler user={user} quiz={quiz} />}
    </>
  );
};

export default UserCoding;
