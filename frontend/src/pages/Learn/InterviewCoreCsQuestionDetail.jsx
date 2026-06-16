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

  useEffect(() => {
    setSelectedOption(null);
    setShowFeedback(false);
    setSubmissionMessage('');
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
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-900 dark:text-white">Loading question...</div>
        </div>
      </UserSidebarLayout>
    );
  }

  if (!question) {
    return (
      <UserSidebarLayout maxWidthClass="max-w-[1400px]">
        <div className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/40">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="mt-4 text-gray-900 dark:text-white">Question not found.</div>
        </div>
      </UserSidebarLayout>
    );
  }

  const isCorrect = showFeedback && selectedOption === question.correctIndex;

  return (
    <UserSidebarLayout maxWidthClass="max-w-3xl">
      <div className="max-w-2xl mx-auto">
        {/* Outer Card - Matching exact Dashboard Overview Card styles */}
        <div className="border border-black/5 dark:border-[#15366f]/45 bg-white/40 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] backdrop-blur-xl p-6 md:p-8 rounded-xl flex flex-col items-center">
          
          {/* Top Header Row with Back Button and tags (now inside the card container) */}
          <div className="flex items-center justify-between w-full mb-6 pb-4 border-b border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full border border-black/5 dark:border-white/10 bg-white/30 dark:bg-white/5 px-2.5 py-0.5 font-semibold text-gray-700 dark:text-gray-300">
                {question.tag}
              </span>
              <span className={`rounded-full border px-2.5 py-0.5 font-semibold ${difficultyPillClass[question.difficulty]}`}>
                {question.difficulty}
              </span>
            </div>
          </div>
          
          <h1 className="text-[10px] md:text-xs font-press-start text-[#3C83F6] dark:text-[#8fd9ff] uppercase select-none mb-6">
            TECHNICAL MCQ
          </h1>

          {/* Centered Question Box with Question Number Pill */}
          <div className="relative w-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-sm text-center mb-6 mt-3">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#3C83F6] text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-md whitespace-nowrap">
              Question {currentTaskIndex + 1} of {dailySequence.length}
            </div>
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
                  disabled={showFeedback}
                  onClick={() => {
                    setSelectedOption(idx);
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
            <p className="mt-3 text-xs text-gray-600 dark:text-gray-300 w-full text-center">{submissionMessage}</p>
          ) : null}

          {/* Action Row - Submit Answer or Next/Finish controls */}
          <div className="mt-6 flex flex-col items-center gap-3 w-full">
            {!showFeedback ? (
              <button
                type="button"
                disabled={selectedOption === null}
                onClick={async () => {
                  if (selectedOption === null) return;
                  setShowFeedback(true);
                  if (isDashboardContext) {
                    try {
                      await practiceAPI.recordSubmission({
                        questionId: question.id,
                        track: 'Core CS',
                        isCorrect: selectedOption === question.correctIndex,
                      });
                      setSubmissionMessage('Practice progress saved.');
                      setIsSubmitted(true);
                      window.dispatchEvent(new CustomEvent('xpUpdated'));
                    } catch (error) {
                      setSubmissionMessage(error?.message || 'Could not save practice progress.');
                    }
                  }
                }}
                className="inline-flex w-44 justify-center items-center gap-2 rounded-xl bg-[#3C83F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:pointer-events-none px-4 py-2.5 text-sm font-semibold text-white shadow-md transition"
              >
                Submit Answer
              </button>
            ) : (
              isDailyMode && isCurrentQuestionCompleted && (
                currentTaskIndex < dailySequence.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/practice/core-cs/${dailySequence[currentTaskIndex + 1].questionId}?mode=daily`)}
                    className="inline-flex w-44 justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex w-44 justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
                  >
                    Finish Daily Task
                  </button>
                )
              )
            )}

            {/* If already completed, also let daily mode user skip next directly without double submitting */}
            {!showFeedback && isDailyMode && isCurrentQuestionCompleted && (
              currentTaskIndex < dailySequence.length - 1 ? (
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/practice/core-cs/${dailySequence[currentTaskIndex + 1].questionId}?mode=daily`)}
                  className="inline-flex w-44 justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
                >
                  Next Question
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex w-44 justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
                >
                  Finish Daily Task
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </UserSidebarLayout>
  );
}


