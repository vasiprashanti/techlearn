import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, User, Mail, Award, AlertTriangle, Send, RotateCcw } from 'lucide-react';

const MCQSubmissionSystem = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [showScore, setShowScore] = useState(false);

  // Sample MCQ data
  const questions = [
    {
      id: 1,
      question: "What is the time complexity of binary search?",
      options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      correctAnswer: 1
    },
    {
      id: 2,
      question: "Which data structure follows LIFO principle?",
      options: ["Queue", "Stack", "Array", "Linked List"],
      correctAnswer: 1
    },
    {
      id: 3,
      question: "What does SQL stand for?",
      options: ["Structured Query Language", "Simple Query Language", "Sequential Query Language", "Standard Query Language"],
      correctAnswer: 0
    },
    {
      id: 4,
      question: "Which sorting algorithm has the best average case time complexity?",
      options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"],
      correctAnswer: 2
    },
    {
      id: 5,
      question: "What is the default port for HTTP?",
      options: ["80", "443", "8080", "3000"],
      correctAnswer: 0
    }
  ];

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctCount++;
      }
    });
    return {
      correct: correctCount,
      total: questions.length,
      percentage: Math.round((correctCount / questions.length) * 100)
    };
  };

  const submitToAPI = async (email, answersArray) => {
    try {
      const response = await fetch('/api/college-mcq/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          answers: answersArray
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error('Network error occurred');
    }
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      alert('Please enter your email address');
      return;
    }

    if (Object.keys(answers).length !== questions.length) {
      alert('Please answer all questions before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert answers object to array format as shown in Postman: [0, 1, 2, 2, 2]
      const answersArray = questions.map((_, index) => answers[index] || 0);
      
      // Simulate API call with the exact structure from Postman
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      
      // Simulate the API response structure from Postman
      const hasAlreadySubmitted = Math.random() < 0.3; // 30% chance of already submitted
      
      let apiResponse;
      
      if (hasAlreadySubmitted) {
        // Simulate failure response as shown in Postman
        apiResponse = {
          success: false,
          message: "You have already submitted this college MCQ"
        };
      } else {
        // Simulate success response with score
        const score = calculateScore();
        apiResponse = {
          success: true,
          message: "MCQ submitted successfully",
          score: score.correct,
          total: score.total,
          percentage: score.percentage
        };
      }

      setSubmissionResult(apiResponse);
      
      if (apiResponse.success) {
        setShowScore(true);
      }
      
    } catch (error) {
      setSubmissionResult({
        success: false,
        message: "Network error. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setEmail('');
    setSubmissionResult(null);
    setShowScore(false);
  };

  const getProgressPercentage = () => {
    return ((Object.keys(answers).length) / questions.length) * 100;
  };

  // Success Screen - Show Score
  if (showScore && submissionResult?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <Award className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
            <p className="text-gray-600">{submissionResult.message}</p>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-6">
            <div className="text-5xl font-bold mb-2">{submissionResult.percentage}%</div>
            <div className="text-green-100 mb-4">Your Score</div>
            <div className="flex justify-center items-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-semibold">{submissionResult.score}</div>
                <div className="text-green-100 text-sm">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">{submissionResult.total - submissionResult.score}</div>
                <div className="text-green-100 text-sm">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">{submissionResult.total}</div>
                <div className="text-green-100 text-sm">Total</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-blue-600 font-semibold text-lg">{submissionResult.score}/{submissionResult.total}</div>
              <div className="text-blue-500 text-sm">Questions Answered Correctly</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="text-purple-600 font-semibold text-lg">
                {submissionResult.percentage >= 70 ? 'Pass' : 'Retry'}
              </div>
              <div className="text-purple-500 text-sm">Result Status</div>
            </div>
          </div>

          <button
            onClick={resetQuiz}
            className="inline-flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors duration-200"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Take Quiz Again
          </button>
        </div>
      </div>
    );
  }

  // Error Screen - Already Submitted or Network Error
  if (submissionResult && !submissionResult.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Submission Failed</h2>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="font-medium text-red-800">Error</span>
            </div>
            <p className="text-red-700 text-sm">{submissionResult.message}</p>
          </div>

          <button
            onClick={resetQuiz}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main Quiz Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">College MCQ Assessment</h1>
                <p className="text-gray-600">Complete all questions and submit your answers</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Progress</div>
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(answers).length}/{questions.length}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>

          {/* Email Input */}
          <div className="mt-6">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                required
              />
            </div>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Questions</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>No time limit</span>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`h-12 rounded-lg font-medium transition-all duration-200 ${
                  currentQuestion === index
                    ? 'bg-blue-500 text-white shadow-md'
                    : answers[index] !== undefined
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {index + 1}
                {answers[index] !== undefined && (
                  <CheckCircle className="w-3 h-3 ml-1 inline" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Current Question */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="text-gray-500 text-sm">Select one answer</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 leading-relaxed">
              {questions[currentQuestion].question}
            </h3>
          </div>

          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion, index)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                  answers[currentQuestion] === index
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    answers[currentQuestion] === index
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {answers[currentQuestion] === index && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === questions.length - 1}
              className="px-6 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Ready to submit? Make sure you've answered all questions and provided your email.
            </p>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(answers).length !== questions.length || !email.trim()}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Assessment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCQSubmissionSystem;