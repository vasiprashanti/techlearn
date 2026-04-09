import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft, Trophy, Home, X } from "lucide-react";
import ScrollProgress from "../../components/ScrollProgress";
import LoadingScreen from "../../components/LoadingScreen";
import useInViewport from "../../hooks/useInViewport";
import { courseAPI, progressAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useAuthModalContext } from "../../context/AuthModalContext";
import { useTheme } from '../../context/ThemeContext';

const CourseQuiz = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModalContext();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [quizStarted, setQuizStarted] = useState(false);

  const [correctAnswers, setCorrectAnswers] = useState({});
  const [questionResults, setQuestionResults] = useState({});
  const [titleRef, isTitleInViewport] = useInViewport();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topicId, setTopicId] = useState(null);
  const [quizId, setQuizId] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const [quizResumeData, setQuizResumeData] = useState(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      setTimeout(() => navigate('/learn/courses', { replace: true }), 100);
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const urlParams = new URLSearchParams(window.location.search);
    const finalTopicId = urlParams.get('topicId') || location.state?.topicId;

    if (finalTopicId) {
      setTopicId(finalTopicId);
    } else {
      setError('Topic ID is required to load quiz');
      setLoading(false);
    }
  }, [location, isAuthenticated]);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!topicId || !courseId) return;
      try {
        setLoading(true);
        const courseResponse = await courseAPI.getCourse(courseId);
        const courseData = courseResponse.course || courseResponse;
        const topic = courseData.topics?.find(t => t.topicId === topicId || t._id === topicId);

        if (topic && topic.quizId) setQuizId(topic.quizId);

        const quizData = await courseAPI.getQuiz(courseId, topicId);
        const topicTitle = quizData.topicTitle || quizData.topic || topic?.title || 'Quiz';

        const transformedQuiz = {
          title: `${topicTitle} Quiz`,
          description: `Test your knowledge on ${topicTitle}`,
          timeLimit: 600,
          passingScore: 70,
          xpPerQuestion: 10,
          questions: quizData.questions.map((q, index) => ({
            id: q._id,
            displayId: index + 1,
            question: q.question,
            options: q.options,
            explanation: q.explanation || "No explanation provided"
          }))
        };

        setQuiz(transformedQuiz);
        setTimeLeft(transformedQuiz.timeLimit);
        setError(null);
      } catch (error) {
        setError(error.message);
        setQuiz(null);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [courseId, topicId]);

  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!isAuthenticated || !quizId) return;
      try {
        const progress = await progressAPI.getUserProgress();
        setUserProgress(progress);

        const isQuizCompleted = progress.completedQuizzes?.some(
          completedQuizId => completedQuizId.toString() === quizId.toString()
        );
        const answeredQuestions = progress.answeredQuestions?.[quizId.toString()] || [];
        const hasPartialProgress = answeredQuestions.length > 0 && !isQuizCompleted;

        if (isQuizCompleted) {
          setQuizCompleted(true);
          setError('You have already completed this quiz. Each quiz can only be attempted once.');
        } else if (hasPartialProgress) {
          setQuizResumeData({ answeredQuestions: answeredQuestions.length, totalQuestions: quiz?.questions?.length || 0 });
          setShowResumePrompt(true);
          setQuizCompleted(false);
          setError(null);
        } else {
          setQuizCompleted(false);
          setQuizResumeData(null);
          setShowResumePrompt(false);
          setError(null);
        }
      } catch (error) {
        setUserProgress(null);
        setQuizCompleted(false);
        setQuizResumeData(null);
        setShowResumePrompt(false);
      }
    };
    fetchUserProgress();
  }, [isAuthenticated, quizId]);

  const currentQ = quiz?.questions[currentQuestion];

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); }, []);

  useEffect(() => {
    if (quizStarted && !showResults && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => {
          if (prev <= 1) { setShowResults(true); return 0; }
          return prev - 1;
        }), 1000);
      return () => clearInterval(timer);
    }
  }, [quizStarted, showResults, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex) => setSelectedAnswers(prev => ({ ...prev, [currentQuestion]: answerIndex }));

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } else {
      setShowResults(true);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const calculateScore = () => {
    const totalQuestions = quiz.questions.length;
    const correctCount = Object.values(correctAnswers).filter(isCorrect => isCorrect).length;
    return Math.round((correctCount / totalQuestions) * 100);
  };

  const calculateTotalXP = () => Object.values(questionResults).reduce((total, result) => total + (result?.receivedXP || 0), 0);

  const handleStartQuiz = () => {
    if (!isAuthenticated) return openLogin();
    setQuizStarted(true);
    setTimeLeft(quiz.timeLimit);
    setShowResumePrompt(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleResumeQuiz = async () => {
    if (!isAuthenticated) return openLogin();
    try {
      const progress = await progressAPI.getUserProgress();
      const answeredQuestions = progress.answeredQuestions?.[quizId.toString()] || [];
      const nextQuestionIndex = answeredQuestions.length;

      setCurrentQuestion(nextQuestionIndex);
      setQuizStarted(true);
      setShowResumePrompt(false);
      setTimeLeft(quiz.timeLimit);

      const alreadyAnswered = {};
      for (let i = 0; i < answeredQuestions.length; i++) alreadyAnswered[i] = -1;
      setSelectedAnswers(alreadyAnswered);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } catch (error) {
      handleStartQuiz();
    }
  };

  // View Renders
  if (!isAuthenticated || loading || error || !quiz || quizCompleted) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans ${isDarkMode ? "dark" : "light"}`}>
         <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />
        
        {loading ? (
           <LoadingScreen showMessage={false} size={48} duration={800} />
        ) : (
          <div className="text-center bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-12 rounded-2xl max-w-md">
            {quizCompleted && <CheckCircle size={48} className="mx-auto text-[#3C83F6] mb-6" />}
            <h1 className="text-xl font-light tracking-tight text-black dark:text-white mb-4">
              {!isAuthenticated ? 'Authentication Required' : error ? 'Quiz Status' : 'Quiz Not Found'}
            </h1>
            <p className="text-sm text-black/60 dark:text-white/60 font-light mb-8">
              {!isAuthenticated ? 'Please log in to access the quiz.' : error ? error : 'The requested quiz could not be located.'}
            </p>
            <button onClick={() => { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); setTimeout(() => navigate('/learn/courses'), 100); }} className="px-6 py-3 bg-[#3C83F6] text-white rounded-xl text-[11px] uppercase tracking-widest font-medium transition-all duration-300 shadow-md hover:shadow-lg w-full">
              Back to Courses
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
      <ScrollProgress />
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />
      
      <div className="relative z-10 pt-24 pb-12">
        <div className="container px-6 mx-auto max-w-4xl">
          
          {!quizStarted ? (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
              <h1 ref={titleRef} className={`text-4xl md:text-5xl font-normal tracking-tight text-[#3C83F6] dark:text-white mb-6 ${isTitleInViewport ? 'in-viewport' : ''}`}>
                {quiz.title}.
              </h1>
              <p className="text-lg text-black/60 dark:text-white/60 mb-10 leading-relaxed font-light max-w-2xl mx-auto">
                {quiz.description}
              </p>

              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl p-8 mb-10">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-3xl font-light text-black dark:text-white mb-2">{quiz.questions.length}</div>
                    <div className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50">Questions</div>
                  </div>
                  <div>
                    <div className="text-3xl font-light text-[#3C83F6] dark:text-blue-400 mb-2">{formatTime(quiz.timeLimit)}</div>
                    <div className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50">Time Limit</div>
                  </div>
                  <div>
                    <div className="text-3xl font-light text-black dark:text-white mb-2">{quiz.passingScore}%</div>
                    <div className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50">Passing Score</div>
                  </div>
                </div>
              </div>

              {showResumePrompt ? (
                <div className="space-y-6">
                  <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl p-8 mb-6">
                    <h3 className="text-lg font-medium text-black dark:text-white mb-2">Quiz In Progress</h3>
                    <p className="text-sm text-black/60 dark:text-white/60 mb-6 font-light">
                      You have already answered {quizResumeData?.answeredQuestions} out of {quizResumeData?.totalQuestions} questions. Would you like to continue?
                    </p>
                    <button onClick={handleResumeQuiz} className="px-8 py-4 bg-[#3C83F6] hover:bg-blue-600 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white rounded-xl text-[11px] uppercase tracking-widest font-medium transition-all duration-300 shadow-md flex items-center gap-3 justify-center w-full max-w-xs mx-auto">
                      <span>Resume Quiz</span> <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={handleStartQuiz} className="px-8 py-4 bg-[#3C83F6] hover:bg-blue-600 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white rounded-xl text-[11px] uppercase tracking-widest font-medium transition-all duration-300 shadow-md flex items-center gap-3 mx-auto">
                  <span>Start Quiz</span> <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ) : showResults ? (
            <QuizResults
              score={calculateScore()}
              passingScore={quiz.passingScore}
              totalQuestions={quiz.questions.length}
              correctAnswers={correctAnswers}
              totalXP={calculateTotalXP()}
              onBackToCourse={() => { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); setTimeout(() => navigate(`/learn/courses/${courseId}`), 100); }}
              onBackToHome={() => { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); setTimeout(() => navigate('/learn'), 100); }}
            />
          ) : (
            <QuizQuestion
              question={currentQ}
              questionNumber={currentQuestion + 1}
              totalQuestions={quiz.questions.length}
              selectedAnswer={selectedAnswers[currentQuestion]}
              onAnswerSelect={handleAnswerSelect}
              onNext={handleNext}
              onPrevious={handlePrevious}
              timeLeft={timeLeft}
              canGoNext={selectedAnswers[currentQuestion] !== undefined}
              canGoPrevious={currentQuestion > 0}
              isLastQuestion={currentQuestion === quiz.questions.length - 1}
              courseId={courseId}
              topicId={topicId}
              quizId={quizId}
              onAnswerResult={(questionIndex, result) => {
                setCorrectAnswers(prev => ({ ...prev, [questionIndex]: result.correct }));
                setQuestionResults(prev => ({ ...prev, [questionIndex]: result }));
              }}
              currentQuestionIndex={currentQuestion}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const QuizQuestion = ({
  question, questionNumber, totalQuestions, selectedAnswer,
  onAnswerSelect, onNext, onPrevious, timeLeft, canGoNext,
  canGoPrevious, isLastQuestion, courseId, topicId, quizId,
  onAnswerResult, currentQuestionIndex
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModalContext();
  const isAlreadyAnswered = selectedAnswer === -1;

  useEffect(() => {
    if (isAlreadyAnswered) {
      setAnswerSubmitted(true);
      setShowFeedback(true);
      setAnswerResult({ correct: null, explanation: "Previously Answered.", receivedXP: 0, correctOption: null, selectedOption: null });
    } else {
      setAnswerSubmitted(false); setShowFeedback(false); setAnswerResult(null);
    }
  }, [isAlreadyAnswered, currentQuestionIndex]);

  const handleAnswerClick = (index) => { if (!answerSubmitted && !isAlreadyAnswered) onAnswerSelect(index); };

  const handleSubmitAnswer = async () => {
    if (!isAuthenticated) return openLogin();
    if (isAlreadyAnswered || submitting) return;
    
    if (selectedAnswer !== undefined && !answerSubmitted) {
      setSubmitting(true);
      try {
        const response = await courseAPI.submitQuizAnswer(courseId, topicId, question.id, selectedAnswer, quizId);
        const mappedResult = { correct: response.isCorrect, correctOption: response.correctAnswer, receivedXP: response.xpAwarded, explanation: response.explanation, selectedOption: selectedAnswer };
        setAnswerResult(mappedResult);
        setAnswerSubmitted(true);
        setShowFeedback(true);
        if (onAnswerResult) onAnswerResult(currentQuestionIndex, mappedResult);
        if (response.xpAwarded > 0) window.dispatchEvent(new CustomEvent('xpUpdated', { detail: { xp: response.xpAwarded } }));
      } catch (error) {
        const errorResult = { correct: false, explanation: `Error: ${error.message}`, receivedXP: 0, correctOption: null, selectedOption: selectedAnswer };
        setAnswerResult(errorResult);
        setAnswerSubmitted(true);
        setShowFeedback(true);
        if (onAnswerResult) onAnswerResult(currentQuestionIndex, errorResult);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const getOptionStyle = (index) => {
    if (isAlreadyAnswered) return 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60';
    if (!showFeedback) return selectedAnswer === index ? 'border-[#3C83F6] bg-[#3C83F6]/10 text-[#3C83F6] dark:text-white' : 'border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/40 text-black/80 dark:text-white/80 hover:bg-white/60 dark:hover:bg-black/60';
    if (answerResult && index === answerResult.correctOption) return 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400';
    if (selectedAnswer === index && answerResult && !answerResult.correct) return 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400';
    return 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 opacity-50';
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-medium">
        <div className="text-black/50 dark:text-white/50">Question {questionNumber} of {totalQuestions}</div>
        <div className="flex items-center gap-2 text-[#3C83F6] dark:text-blue-400">
          <Clock className="w-3 h-3" /> <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1 overflow-hidden">
        <div className="bg-[#3C83F6] dark:bg-white h-full transition-all duration-300" style={{ width: `${(questionNumber / totalQuestions) * 100}%` }} />
      </div>

      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-8 md:p-12 shadow-sm border border-black/5 dark:border-white/5">
        <h2 className="text-xl md:text-2xl font-light text-black dark:text-white mb-8 leading-relaxed">
          {question.question}
        </h2>

        <div className="space-y-4">
          {question.options.map((option, index) => (
            <button key={index} onClick={() => handleAnswerClick(index)} disabled={answerSubmitted} className={`w-full p-5 text-left rounded-xl border transition-all duration-300 ${getOptionStyle(index)} ${answerSubmitted ? 'cursor-default' : 'cursor-pointer'}`}>
              <div className="flex items-center justify-between">
                <span className="font-light text-sm md:text-base">{option}</span>
                {showFeedback && answerResult && index === answerResult.correctOption && <CheckCircle className="w-5 h-5 text-green-500" />}
                {showFeedback && answerResult && selectedAnswer === index && !answerResult.correct && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            </button>
          ))}
        </div>

        {isAlreadyAnswered ? (
          <div className="mt-8 p-4 bg-black/5 dark:bg-white/5 text-center text-xs uppercase tracking-widest text-black/50 dark:text-white/50 rounded-xl border border-black/5 dark:border-white/5">
            Already answered in previous session
          </div>
        ) : !answerSubmitted && selectedAnswer !== undefined && (
          <div className="mt-8 flex justify-center">
            <button onClick={handleSubmitAnswer} disabled={submitting} className="px-8 py-3 bg-[#3C83F6] text-white rounded-xl text-[11px] uppercase tracking-widest font-medium transition-all duration-300 hover:shadow-lg w-full md:w-auto">
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </div>
        )}

        {showFeedback && !isAlreadyAnswered && (
          <div className={`mt-8 p-6 rounded-xl border ${answerResult?.correct ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <h4 className={`text-[10px] uppercase tracking-widest font-medium mb-2 ${answerResult?.correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {answerResult?.correct ? 'Correct' : 'Incorrect'}
            </h4>
            <p className="text-sm font-light text-black/70 dark:text-white/70 leading-relaxed">
              {answerResult?.explanation || question.explanation}
            </p>
          </div>
        )}
      </div>

      {answerSubmitted && (
        <div className="flex items-center justify-between pt-4">
          <button onClick={onPrevious} disabled={!canGoPrevious} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest font-medium transition-all duration-300 ${canGoPrevious ? 'bg-white/40 dark:bg-black/40 border border-black/5 dark:border-white/5 text-black/60 dark:text-white/60 hover:bg-white/60 dark:hover:bg-black/60 hover:text-black dark:hover:text-white' : 'opacity-0 pointer-events-none'}`}>
            <ArrowLeft className="w-3 h-3" /> Previous
          </button>
          <button onClick={() => { setShowFeedback(false); setAnswerSubmitted(false); onNext(); }} className="flex items-center gap-2 px-8 py-3 bg-[#3C83F6] hover:bg-blue-600 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white rounded-xl text-[11px] uppercase tracking-widest font-medium transition-all duration-300 shadow-md">
            {isLastQuestion ? 'Finish' : 'Next'} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
};

const QuizResults = ({ score, passingScore, totalQuestions, correctAnswers, onBackToCourse, onBackToHome, totalXP }) => {
  const passed = score >= passingScore;
  const correctCount = Object.values(correctAnswers || {}).filter(isCorrect => isCorrect).length;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="text-center max-w-2xl mx-auto space-y-8">
      
      <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-12 shadow-sm border border-black/5 dark:border-white/5">
        <div className="flex justify-center mb-6">
          {passed ? <Trophy className="w-16 h-16 text-[#3C83F6] dark:text-white" strokeWidth={1} /> : <XCircle className="w-16 h-16 text-black/40 dark:text-white/40" strokeWidth={1} />}
        </div>
        <h2 className="text-3xl font-light text-black dark:text-white mb-4">
          {passed ? 'Assessment Complete' : 'Needs Review'}
        </h2>
        <p className="text-sm font-light text-black/60 dark:text-white/60 mb-10">
          {passed ? 'You have successfully passed the requirements.' : 'Review the material and try again.'}
        </p>

        <div className="grid grid-cols-3 gap-6 mb-10 border-t border-b border-black/5 dark:border-white/5 py-8">
          <div>
            <div className="text-3xl font-light text-black dark:text-white mb-2">{score}%</div>
            <div className="text-[9px] uppercase tracking-widest text-black/50 dark:text-white/50">Score</div>
          </div>
          <div className="border-l border-r border-black/5 dark:border-white/5">
            <div className="text-3xl font-light text-black dark:text-white mb-2">{correctCount}/{totalQuestions}</div>
            <div className="text-[9px] uppercase tracking-widest text-black/50 dark:text-white/50">Correct</div>
          </div>
          <div>
            <div className="text-3xl font-light text-[#3C83F6] dark:text-blue-400 mb-2">+{totalXP}</div>
            <div className="text-[9px] uppercase tracking-widest text-black/50 dark:text-white/50">XP Earned</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={onBackToCourse} className="flex items-center justify-center gap-2 px-8 py-3 bg-white/40 dark:bg-black/40 border border-black/5 dark:border-white/5 text-black/60 dark:text-white/60 hover:bg-white/60 dark:hover:bg-black/60 hover:text-black dark:hover:text-white rounded-xl text-[10px] uppercase tracking-widest font-medium transition-all duration-300">
            <ArrowLeft className="w-3 h-3" /> Back to Course
          </button>
          <button onClick={onBackToHome} className="flex items-center justify-center gap-2 px-8 py-3 bg-[#3C83F6] hover:bg-blue-600 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white rounded-xl text-[10px] uppercase tracking-widest font-medium transition-all duration-300 shadow-md">
            <Home className="w-3 h-3" /> Learn Home
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseQuiz;