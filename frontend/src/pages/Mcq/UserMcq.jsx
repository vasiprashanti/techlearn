import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
const BASE_URL = import.meta.env.VITE_API_URL || "";
import { Clock, ArrowRight, ArrowLeft, Loader } from "lucide-react";

// Login Page
const LoginPage = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);

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
        // Send OTP for college MCQ
        const res = await fetch(`${BASE_URL}/LinkId/send-otp`, {
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
        // Verify OTP for college MCQ
        if (!code) {
          setError("Verification code is required");
          setLoading(false);
          return;
        }
        const res = await fetch(`${BASE_URL}/LinkId/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: code }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          onSuccess(email);
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

//  Quiz Component with Backend Integration
const UserMcq = () => {
  const [step, setStep] = useState("login"); // login → instructions → quiz → result
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  // Fetch quiz data from backend
  const fetchQuizData = async (email, quizId = null) => {
    setLoading(true);
    setError("");

    try {
      const url = quizId
        ? `/api/quiz/${quizId}?email=${encodeURIComponent(email)}`
        : `/api/quiz?email=${encodeURIComponent(email)}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setQuiz(data.quiz);
        setTimeLeft(data.quiz.timeLimit);
      } else {
        setError(data.message || "Failed to load quiz");
      }
    } catch (err) {
      setError("Server error. Unable to load quiz.");
    }
    setLoading(false);
  };

  // Submit quiz results to backend
  const submitQuizResults = async () => {
    try {
      const answers = quiz.questions.map((q, idx) => ({
        questionId: q.id,
        selectedOption: selectedAnswers[idx],
        isCorrect: selectedAnswers[idx] === q.correct,
      }));

      const score = calculateScore();

      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          quizId: quiz.id,
          answers,
          score,
          timeSpent: quiz.timeLimit - timeLeft,
          completedAt: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to submit quiz results:", data.message);
      }
    } catch (err) {
      console.error("Error submitting quiz results:", err);
    }
  };

  // Timer effect
useEffect(() => {
  if (step === "quiz" && timeLeft > 0) {
    const timer = setInterval(async () => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit
          (async () => {
            await submitQuizResults();  // save result
            setStep("result");
          })();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }
}, [step, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (index) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: index,
    }));
  };

  const handleNext = async () => {
  if (currentQuestion < quiz.questions.length - 1) {
    setCurrentQuestion((prev) => prev + 1);
  } else {
    await submitQuizResults();  // ensure backend submission
    setStep("result");
  }
};

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    const total = quiz.questions.length;
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) correct++;
    });
    return Math.round((correct / total) * 100);
  };

  const handleLoginSuccess = (email) => {
    setUserEmail(email);
    setStep("loading");
    fetchQuizData(email);
  };

  const resetQuiz = () => {
    setStep("login");
    setQuiz(null);
    setUserEmail("");
    setSelectedAnswers({});
    setCurrentQuestion(0);
    setTimeLeft(0);
    setError("");
  };

  //  Step 1: Login Page
  if (step === "login") {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  //  Loading Quiz Data
  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 dark:border-gray-700/20 max-w-md text-center"
        >
          {loading ? (
            <>
              <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Loading Quiz...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we prepare your quiz
              </p>
            </>
          ) : error ? (
            <>
              <div className="text-4xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
                Error Loading Quiz
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => fetchQuizData(userEmail)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
              >
                Retry
              </button>
              <button
                onClick={resetQuiz}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
              >
                Back to Login
              </button>
            </>
          ) : quiz ? (
            setStep("instructions")
          ) : null}
        </motion.div>
      </div>
    );
  }

  //  Step 2: Instructions Page
  if (step === "instructions" && quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-3xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {Math.floor(quiz.timeLimit / 60)} minutes
              </div>
              <div className="flex items-center gap-2">
                <span>📄</span>
                {quiz.questions.length} questions
              </div>
            </div>
          </div>

          {/* Instructions */}
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Quiz Instructions
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
            <li>Read each question carefully and select the best answer.</li>
            <li>You will have a limited time to complete the quiz.</li>
            <li>
              You cannot go back to previous questions once you move forward.
            </li>
            <li>
              Make sure you have a stable internet connection before starting.
            </li>
            <li>Your progress will be automatically saved.</li>
          </ul>

          {/* Important Notes */}
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-yellow-800 mb-2">
              Important Notes:
            </h3>
            <ul className="list-disc list-inside text-yellow-800 space-y-1 text-sm">
              <li>You cannot go back to previous questions.</li>
              <li>The timer will start when you begin the quiz.</li>
              <li>Make sure you have a stable internet connection.</li>
              <li>Your progress will be automatically saved.</li>
              <li>Select your answers carefully as they cannot be changed.</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex justify-between">
            <button
              onClick={resetQuiz}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
            >
              Back
            </button>
            <button
              onClick={() => setStep("quiz")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
            >
              Start Quiz <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  //  Step 3: Quiz Page
  if (step === "quiz" && quiz) {
    const question = quiz.questions[currentQuestion];
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 dark:border-gray-700/20 space-y-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Question {currentQuestion + 1} of {quiz.questions.length}
            </span>
            <div
              className={`flex items-center gap-1 ${
                timeLeft <= 60
                  ? "text-red-600 dark:text-red-400"
                  : "text-blue-600 dark:text-blue-400"
              }`}
            >
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Question */}
          <h2 className="text-xl font-medium text-gray-900 dark:text-white">
            {question.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-300 ${
                  selectedAnswers[currentQuestion] === idx
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:border-blue-400/50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                currentQuestion === 0
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={selectedAnswers[currentQuestion] === undefined}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-800 dark:text-blue-200 border border-blue-200/50 dark:border-blue-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestion === quiz.questions.length - 1
                ? "Finish Quiz"
                : "Next Question"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  //  Step 4: Result Page
  if (step === "result" && quiz) {
    const score = calculateScore();
    const passed = score >= quiz.passingScore;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-10 shadow-lg border border-white/20 dark:border-gray-700/20 text-center max-w-md"
        >
          <div className="text-6xl mb-4">{passed ? "🎉" : "😔"}</div>
          <h2
            className={`text-3xl font-bold mb-2 ${
              passed
                ? "text-green-700 dark:text-green-400"
                : "text-red-700 dark:text-red-400"
            }`}
          >
            {passed ? "Congratulations!" : "Keep Trying!"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Your Score: <span className="font-semibold">{score}%</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Time Spent: {formatTime(quiz.timeLimit - timeLeft)}
          </p>

          <button
            onClick={resetQuiz}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
          >
            Take Another Quiz
          </button>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default UserMcq;