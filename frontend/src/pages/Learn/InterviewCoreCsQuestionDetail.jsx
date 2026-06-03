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
    <UserSidebarLayout maxWidthClass="max-w-[1400px]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/40">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Core CS Question</h1>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {question.tag} • {question.difficulty}
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/60 p-6 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/30">
          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-300">
            <span className="rounded-full border border-white/20 bg-white/60 px-3 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700/20 dark:bg-gray-900/30 dark:text-gray-200">
              {question.tag}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${difficultyPillClass[question.difficulty]}`}>
              {question.difficulty}
            </span>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{question.question}</h2>

          <div className="mt-4 space-y-3">
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
                  onClick={async () => {
                    setSelectedOption(idx);
                    setShowFeedback(true);
                    if (isDashboardContext) {
                      try {
                        await practiceAPI.recordSubmission({
                          questionId: question.id,
                          track: 'Core CS',
                          isCorrect: idx === question.correctIndex,
                        });
                        setSubmissionMessage('Practice progress saved.');
                        setIsSubmitted(true);
                      } catch (error) {
                        setSubmissionMessage(error?.message || 'Could not save practice progress.');
                      }
                    }
                  }}
                  className={`w-full rounded-xl border-2 p-4 text-left text-sm transition ${optionClass}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{opt}</div>
                    {showFeedback && idx === question.correctIndex ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : showFeedback && selectedOption === idx && selectedOption !== question.correctIndex ? (
                      <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {showFeedback ? (
            <div
              className={`mt-5 rounded-xl border p-4 ${
                isCorrect
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
              }`}
            >
              <div className={`font-semibold ${isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </div>
              <div className={`mt-1 text-sm ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {question.explanation}
              </div>
            </div>
          ) : null}
          {submissionMessage ? (
            <p className="mt-3 text-xs text-gray-600 dark:text-gray-300">{submissionMessage}</p>
          ) : null}

          {isDailyMode && isCurrentQuestionCompleted && (
            <div className="mt-4">
              {currentTaskIndex < dailySequence.length - 1 ? (
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/practice/core-cs/${dailySequence[currentTaskIndex + 1].questionId}?mode=daily`)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
                >
                  Next Question
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
                >
                  Finish Daily Task
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </UserSidebarLayout>
  );
}
