import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, X } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { coreCsMcqs } from '../../data/coreCsMcqs';
import { practiceAPI } from '../../services/practiceApi';

const difficultyPillClass = {
  Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  Hard: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
};

export default function InterviewCoreCsQuestionDetail() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const sourceParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isDailyMode = sourceParams.get('mode') === 'daily';
  const isDashboardContext = location.pathname.startsWith('/dashboard/practice/core-cs/');
  const sourcePath = sourceParams.get('from');
  const backPath = isDailyMode
    ? '/dashboard'
    : isDashboardContext
      ? sourcePath === '/dashboard/practice' || sourcePath === '/dashboard/practice/core-cs'
        ? sourcePath
        : '/dashboard/practice/core-cs'
      : '/learn/interview-questions/core-cs';

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyTasksList, setDailyTasksList] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const localQ = coreCsMcqs.find((q) => q.id === questionId);
    if (localQ) {
      setQuestion(localQ);
      setLoading(false);
      return;
    }

    practiceAPI.getQuestionById(questionId)
      .then((data) => {
        if (!cancelled && data) {
          const options = (data.options || []).map(opt => opt.optionText);
          const correctIndex = (data.options || []).findIndex(opt => opt.isCorrect);
          setQuestion({
            id: String(data._id),
            tag: data.categoryTitle || 'Core CS',
            difficulty: data.difficulty || 'Easy',
            question: data.title || '',
            options: options.length > 0 ? options : ['A', 'B', 'C', 'D'],
            correctIndex: correctIndex !== -1 ? correctIndex : 0,
            explanation: data.explanation || data.content?.explanation || 'No explanation provided.'
          });
        }
        if (!cancelled) setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load Core CS question details:", err);
        if (!cancelled) {
          setQuestion(null);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [questionId]);

  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [isLastSubmissionCorrect, setIsLastSubmissionCorrect] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  useEffect(() => {
    setSelectedOption(null);
    setShowFeedback(false);
    setSubmissionMessage('');
    setIsLastSubmissionCorrect(false);
    setShowFinishModal(false);
  }, [questionId]);
  
  const fetchDailyTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/daily-task/today`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload?.success && payload?.data?.tasks) {
          setDailyTasksList(payload.data.tasks);
        }
      }
    } catch (err) {
      console.error("Error fetching daily tasks:", err);
    }
  };

  useEffect(() => {
    if (isDailyMode) {
      fetchDailyTasks();
      setIsSubmitted(false);
    }
  }, [questionId, isDailyMode]);

  const dailySequence = useMemo(() => {
    if (!isDailyMode) return [];
    return dailyTasksList.filter(t => t.taskType === 'MCQ' || t.taskType === 'Core CS');
  }, [dailyTasksList, isDailyMode]);

  const currentTaskIndex = useMemo(() => {
    return dailySequence.findIndex(t => String(t.questionId) === String(questionId));
  }, [dailySequence, questionId]);

  const isCurrentQuestionCompleted = useMemo(() => {
    if (isSubmitted) return true;
    if (currentTaskIndex !== -1 && dailySequence[currentTaskIndex]) {
      return dailySequence[currentTaskIndex].status === 'Completed';
    }
    return false;
  }, [dailySequence, currentTaskIndex, isSubmitted]);

  if (loading) {
    return (
      <UserSidebarLayout maxWidthClass="max-w-[1400px]">
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500"></div>
            <div className="absolute h-10 w-10 animate-ping rounded-full border-2 border-blue-400/30"></div>
          </div>
          <div className="text-sm font-semibold tracking-wide text-blue-700/80 dark:text-blue-300/80 animate-pulse">
            Loading assessment challenge...
          </div>
        </div>
      </UserSidebarLayout>
    );
  }

  if (!question) {
    return (
      <UserSidebarLayout maxWidthClass="max-w-[1400px]">
        <div className="rounded-2xl border border-red-200/30 bg-gradient-to-br from-red-50/90 to-red-100/80 p-8 text-center shadow-xl backdrop-blur-xl dark:border-red-900/30 dark:from-red-950/40 dark:to-red-900/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
            <span className="text-xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-bold text-red-900 dark:text-red-200 mb-2">Question Not Found</h2>
          <p className="text-sm text-red-700/80 dark:text-red-400/80 mb-6 max-w-md mx-auto">
            The requested assessment was not found or has been moved. Please return to the practice page.
          </p>
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-105 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Practice
          </button>
        </div>
      </UserSidebarLayout>
    );
  }

  const isCorrect = showFeedback && selectedOption === question.correctIndex;

  const handleMarkSolved = async () => {
    if (selectedOption === null) return;
    const correct = selectedOption === question.correctIndex;
    setShowFeedback(true);
    setIsLastSubmissionCorrect(correct);
    
    try {
      setSubmissionMessage('Submitting answer for evaluation...');
      const res = await practiceAPI.recordSubmission({
        questionId: question.id,
        track: 'Core CS',
        isCorrect: correct,
        selectedAnswer: String.fromCharCode(65 + selectedOption),
        finalize: false,
      });
      if (correct) {
        setSubmissionMessage('Submission successful! Correct answer.');
      } else {
        setSubmissionMessage('Incorrect submission. Please select another option and try again.');
      }
    } catch (error) {
      setSubmissionMessage(error?.message || 'Could not save practice progress.');
    }
  };

  const handleNext = async () => {
    if (isLastSubmissionCorrect) {
      try {
        await practiceAPI.recordSubmission({
          questionId: question.id,
          track: 'Core CS',
          isCorrect: true,
          selectedAnswer: String.fromCharCode(65 + selectedOption),
          finalize: true,
        });
      } catch (err) {
        console.error("Failed to finalize task:", err);
      }
    }
    const nextType = dailySequence[currentTaskIndex + 1].taskType === 'SQL' ? 'sql' : dailySequence[currentTaskIndex + 1].taskType === 'MCQ' || dailySequence[currentTaskIndex + 1].taskType === 'Core CS' ? 'core-cs' : 'dsa';
    navigate(`/dashboard/practice/${nextType}/${dailySequence[currentTaskIndex + 1].questionId}?mode=daily`);
  };

  const handleFinish = async () => {
    if (isLastSubmissionCorrect) {
      try {
        await practiceAPI.recordSubmission({
          questionId: question.id,
          track: 'Core CS',
          isCorrect: true,
          selectedAnswer: String.fromCharCode(65 + selectedOption),
          finalize: true,
        });
      } catch (err) {
        console.error("Failed to finalize task:", err);
      }
      navigate('/dashboard');
    } else {
      setShowFinishModal(true);
    }
  };

  return (
    <UserSidebarLayout maxWidthClass="max-w-3xl">
      <div className="max-w-2xl mx-auto">
        {/* Outer Card - Matching exact Dashboard Overview Card styles */}
        <div className="border border-black/5 dark:border-[#15366f]/45 bg-white/40 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] backdrop-blur-xl p-6 md:p-8 rounded-xl flex flex-col items-center">
          {/* Header row with heading centered and difficulty pill absolute on the right */}
          <div className="relative flex items-center justify-center w-full mb-6 select-none">
            <h1 className="text-[10px] md:text-xs font-press-start text-[#3C83F6] dark:text-[#8fd9ff] uppercase">
              TECHNICAL MCQ
            </h1>
            <span className={`absolute right-0 rounded-full border px-2.5 py-0.5 font-semibold text-xs ${difficultyPillClass[question.difficulty]}`}>
              {question.difficulty}
            </span>
          </div>

          <div className="relative w-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-sm text-center mb-6 mt-3">
            {isDailyMode && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#3C83F6] text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-md whitespace-nowrap">
                Question {currentTaskIndex + 1} of {dailySequence.length}
              </div>
            )}
            <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white leading-relaxed mt-2 select-none">
              {question.question}
            </h2>
          </div>

          {/* Options Grid (2x2 options layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {question.options.map((opt, idx) => {
              const optionClass = !showFeedback
                ? selectedOption === idx
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-400 hover:bg-white/70 dark:hover:bg-gray-800/70'
                : idx === question.correctIndex
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : selectedOption === idx
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-300';

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedOption(idx);
                    setShowFeedback(false);
                    setIsLastSubmissionCorrect(false);
                    setSubmissionMessage('');
                  }}
                  className={`relative w-full rounded-xl border-2 p-4 text-center font-semibold text-sm transition min-h-[60px] flex items-center justify-center ${optionClass}`}
                >
                  <span className="leading-tight px-6">{opt}</span>
                  {showFeedback && idx === question.correctIndex ? (
                    <CheckCircle className="absolute right-3.5 h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                  ) : showFeedback && selectedOption === idx && selectedOption !== question.correctIndex ? (
                    <X className="absolute right-3.5 h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Feedback Section */}
          {showFeedback ? (
            <div
              className={`mt-5 w-full rounded-xl border p-4 text-left ${
                isCorrect
                  ? 'border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/20'
                  : 'border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20'
              }`}
            >
              <div className={`font-semibold ${isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </div>
              <div className={`mt-1 text-sm leading-relaxed ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {question.explanation}
              </div>
            </div>
          ) : null}

          {submissionMessage ? (
            <p className="mt-4 text-xs font-semibold text-blue-600 dark:text-blue-400 w-full text-center">{submissionMessage}</p>
          ) : null}

          {/* Action Row - Submit Answer or Next/Finish controls */}
          <div className="mt-8 flex items-center justify-center gap-4 w-full">
            {isDailyMode ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (currentTaskIndex === 0) {
                      navigate('/dashboard');
                    } else {
                      const prevType = dailySequence[currentTaskIndex - 1].taskType === 'SQL' ? 'sql' : dailySequence[currentTaskIndex - 1].taskType === 'MCQ' || dailySequence[currentTaskIndex - 1].taskType === 'Core CS' ? 'core-cs' : 'dsa';
                      navigate(`/dashboard/practice/${prevType}/${dailySequence[currentTaskIndex - 1].questionId}?mode=daily`);
                    }
                  }}
                  className="inline-flex w-32 justify-center items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/40 dark:bg-black/35 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-black/50 transition"
                >
                  Back
                </button>

                {!showFeedback && !isCurrentQuestionCompleted ? (
                  <button
                    type="button"
                    disabled={selectedOption === null}
                    onClick={handleMarkSolved}
                    className="inline-flex w-36 justify-center items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none px-4 py-2.5 text-sm font-semibold text-white shadow-md transition"
                  >
                    Submit Answer
                  </button>
                ) : (
                  currentTaskIndex < dailySequence.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex w-36 justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinish}
                      className="inline-flex w-36 justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
                    >
                      Finish
                    </button>
                  )
                )}
              </>
            ) : (
              <button
                type="button"
                disabled={selectedOption === null}
                onClick={handleMarkSolved}
                className="inline-flex w-44 justify-center items-center gap-2 rounded-xl bg-[#3C83F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:pointer-events-none px-4 py-2.5 text-sm font-semibold text-white shadow-md transition"
              >
                Submit Answer
              </button>
            )}
          </div>
        </div>
      </div>

      {showFinishModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#86c4ff]/30 bg-white p-6 shadow-2xl dark:bg-gray-900 text-gray-900 dark:text-white">
            <h3 className="text-lg font-bold text-[#0d2a57] dark:text-[#8fd9ff] mb-2">
              Finish without completing the task?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 font-medium">
              You have not successfully completed this task. If you finish now, your progress will not be saved. Do you want to finish anyway?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFinishModal(false);
                  navigate('/dashboard');
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                Yes, Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </UserSidebarLayout>
  );
}




