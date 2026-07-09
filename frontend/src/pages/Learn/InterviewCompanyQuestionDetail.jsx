import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, CheckCircle, Play, X } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { practiceAPI } from '../../services/practiceApi';
import { useTheme } from '../../context/ThemeContext';

const difficultyPillClass = {
  Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  Hard: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
};

const LANGUAGES = {
  python: { id: "python", name: "Python", monacoLanguage: "python", starter: "# Write your Python solution here\n" },
  javascript: { id: "javascript", name: "JavaScript", monacoLanguage: "javascript", starter: "// Write your JavaScript solution here\n" },
  java: { id: "java", name: "Java", monacoLanguage: "java", starter: "public class Main {\n  public static void main(String[] args) {\n    // Write your solution here\n  }\n}\n" },
  sql: { id: "sql", name: "SQL", monacoLanguage: "sql", starter: "-- Write your SQL query here\nSELECT * FROM users;\n" }
};

export default function InterviewCompanyQuestionDetail() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  // General navigation
  const sourceParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isDashboardContext = location.pathname.startsWith('/dashboard/practice/company-based/');
  const sourcePath = sourceParams.get('from');
  const backPath = isDashboardContext
    ? '/dashboard/practice/company-based'
    : '/learn/interview-questions/company';

  // MCQ state
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [isLastSubmissionCorrect, setIsLastSubmissionCorrect] = useState(false);

  // Coding states
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    practiceAPI.getQuestionById(questionId)
      .then((data) => {
        if (!cancelled && data) {
          const catType = String(data.categoryType || data.categoryId?.categoryType || 'Coding').toUpperCase();
          const isMcq = catType === 'MCQ';

          let options = [];
          let correctIndex = 0;
          if (isMcq) {
            if (data.content?.options && data.content.options.length > 0) {
              options = data.content.options.map(opt => opt.text);
            } else if (data.options && data.options.length > 0) {
              options = data.options.map(opt => opt.optionText || opt.text || opt);
            } else {
              options = ['A', 'B', 'C', 'D'];
            }

            if (data.content?.correctOption) {
              const letter = data.content.correctOption.toUpperCase();
              correctIndex = ['A', 'B', 'C', 'D'].indexOf(letter);
              if (correctIndex === -1) correctIndex = 0;
            } else if (data.options && data.options.length > 0) {
              const foundIndex = data.options.findIndex(opt => opt.isCorrect);
              if (foundIndex !== -1) correctIndex = foundIndex;
            }
          }

          const descriptionText = data.description || '';
          const inputFormatText = data.inputFormat || '';
          const outputFormatText = data.outputFormat || '';

          const pythonStarter = data.content?.starterCode?.python?.code || LANGUAGES.python.starter;

          setQuestion({
            id: String(data._id),
            title: data.title,
            subtitle: data.categoryTitle || 'Company',
            difficulty: data.difficulty || 'Easy',
            description: descriptionText,
            topic: 'Company',
            categoryType: catType,
            options,
            correctIndex,
            explanation: data.content?.explanation || data.explanation || data.editorial || 'No explanation provided.',
            statement: descriptionText
              ? `## Problem\n\n${descriptionText}\n\n${inputFormatText ? `### Input Format\n${inputFormatText}\n\n` : ''}${outputFormatText ? `### Output Format\n${outputFormatText}` : ''}`
              : `## Problem\n\n**${data.title}** (Topic: ${data.categoryTitle || 'Company'})\n\nProblem statement will be added here.`,
            starterCode: pythonStarter
          });

          setCode(pythonStarter);
        }
        if (!cancelled) setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load Company question details:", err);
        if (!cancelled) {
          setQuestion(null);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [questionId]);

  // Handle MCQ solve
  const handleMcqSubmit = async () => {
    if (selectedOption === null) return;
    const correct = selectedOption === question.correctIndex;
    setShowFeedback(true);
    setIsLastSubmissionCorrect(correct);

    try {
      await practiceAPI.recordSubmission({
        questionId: question.id,
        track: 'Company',
        isCorrect: correct,
        selectedAnswer: String.fromCharCode(65 + selectedOption),
      });
      setSubmissionMessage('Answer submitted successfully!');
      window.dispatchEvent(new CustomEvent('xpUpdated'));
    } catch (error) {
      setSubmissionMessage(error?.message || 'Could not save practice progress.');
    }
  };

  // Handle Coding Run/Submit
  const handleCodeRun = async () => {
    setIsRunning(true);
    setOutput('Running test cases...');
    try {
      const res = await practiceAPI.recordSubmission({
        questionId: question.id,
        track: 'Company',
        isCorrect: false,
        code,
        language: selectedLanguage,
        finalize: false,
      });
      const passed = Number(res?.passedTestCases || 0);
      const total = Number(res?.totalTestCases || 0);
      const accuracy = Number(res?.accuracy || 0);
      const detail = total > 0 ? `${passed}/${total} test cases passed (${accuracy}% accuracy).` : 'Code submitted for evaluation.';
      setOutput(detail);
      setIsLastSubmissionCorrect(Boolean(res?.isCorrect));
    } catch (error) {
      setOutput(`Execution failed: ${error?.message || 'Unknown error occurred'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (!code || code.trim() === '') {
      setOutput('Error: Code cannot be empty.');
      return;
    }
    try {
      setOutput('Submitting code for evaluation...');
      const res = await practiceAPI.recordSubmission({
        questionId: question.id,
        track: 'Company',
        isCorrect: false,
        code,
        language: selectedLanguage,
        finalize: true,
      });
      const passed = Number(res?.passedTestCases || 0);
      const total = Number(res?.totalTestCases || 0);
      if (res?.isCorrect) {
        setOutput(`Submission successful! ${passed}/${total} test cases passed.`);
        setIsLastSubmissionCorrect(true);
      } else {
        setOutput(`Submission saved. ${passed}/${total} test cases passed.`);
        setIsLastSubmissionCorrect(false);
      }
    } catch (error) {
      setOutput(`Submission failed: ${error?.message || 'Unknown error occurred'}`);
    }
  };

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

  const isMcq = question.categoryType === 'MCQ';

  if (isMcq) {
    // MCQ UI rendering
    return (
      <UserSidebarLayout maxWidthClass="max-w-[1400px]">
        <div className="mx-auto max-w-[800px] flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full flex flex-col items-start rounded-2xl border border-[#2563eb]/15 dark:border-[#15366f]/45 bg-white/20 p-6 shadow-[0_20px_50px_rgba(12,52,171,0.06)] backdrop-blur-xl dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)]">
            
            {/* Header Action Button */}
            <div className="relative w-full flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => navigate(backPath)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-black/50 transition-all duration-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <span className={`absolute right-0 rounded-full border px-2.5 py-0.5 font-semibold text-xs ${difficultyPillClass[question.difficulty]}`}>
                {question.difficulty}
              </span>
            </div>

            {/* Question text card */}
            <div className="relative w-full border border-[#2563eb]/20 dark:border-white/10 bg-[#e5f3ff]/45 dark:bg-[#091b40]/75 rounded-xl p-6 shadow-md shadow-[#2563eb]/5 text-center mb-6 mt-3">
              <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white leading-relaxed mt-2 select-none">
                {question.title}
              </h2>
              {question.description && (
                <p className="mt-4 text-sm md:text-base text-gray-600 dark:text-gray-300 select-none whitespace-pre-line text-center border-t border-black/5 dark:border-white/5 pt-4 leading-relaxed">
                  {question.description}
                </p>
              )}
            </div>

            {/* Options Grid (2x2 options layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {question.options.map((opt, idx) => {
                const optionClass = !showFeedback
                  ? selectedOption === idx
                    ? 'border-[#2563eb] bg-[#2563eb]/10 dark:bg-[#2563eb]/20 text-[#2563eb] dark:text-[#a0baff]'
                    : 'border-[#2563eb]/20 dark:border-gray-600/70 bg-[#e5f3ff]/35 dark:bg-[#091b40]/50 text-gray-800 dark:text-gray-200 hover:border-[#2563eb] dark:hover:border-blue-400 hover:bg-[#e5f3ff]/60 dark:hover:bg-[#091b40]/75'
                  : idx === question.correctIndex
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : selectedOption === idx
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : 'border-[#2563eb]/10 dark:border-gray-700/30 bg-[#e5f3ff]/10 dark:bg-[#091b40]/20 text-gray-600/60 dark:text-gray-400/60';

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={showFeedback}
                    onClick={() => {
                      setSelectedOption(idx);
                      setShowFeedback(false);
                      setIsLastSubmissionCorrect(false);
                      setSubmissionMessage('');
                    }}
                    className={`relative w-full rounded-xl border-2 p-4 text-center font-semibold text-sm transition min-h-[60px] flex items-center justify-center ${optionClass} ${
                      showFeedback ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
                    }`}
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
            {showFeedback && question.explanation && question.explanation !== 'No explanation provided.' ? (
              <div
                className={`mt-5 w-full rounded-xl border p-4 text-left ${
                  isLastSubmissionCorrect
                    ? 'border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/20'
                    : 'border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20'
                }`}
              >
                <div className={`font-semibold ${isLastSubmissionCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                  {isLastSubmissionCorrect ? 'Correct!' : 'Incorrect'}
                </div>
                <div className={`mt-1 text-sm leading-relaxed ${isLastSubmissionCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {question.explanation}
                </div>
              </div>
            ) : null}

            {submissionMessage ? (
              <p className="mt-4 text-xs font-semibold text-[#2563eb] dark:text-blue-400 w-full text-center">{submissionMessage}</p>
            ) : null}

            {/* Action Row - Submit Answer or Next/Finish controls */}
            <div className="mt-8 flex items-center justify-center gap-4 w-full">
              {!showFeedback ? (
                <button
                  type="button"
                  disabled={selectedOption === null}
                  onClick={handleMcqSubmit}
                  className="inline-flex w-44 justify-center items-center gap-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none px-5 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(backPath)}
                  className="inline-flex w-44 justify-center items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 px-5 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 shadow-sm transition-all duration-200"
                >
                  Back to Practice
                </button>
              )}
            </div>

          </div>
        </div>
      </UserSidebarLayout>
    );
  } else {
    // Coding UI rendering
    return (
      <UserSidebarLayout maxWidthClass="max-w-[1400px]">
        <div className="min-h-[calc(100vh-12rem)] lg:h-[calc(100vh-10rem)] flex flex-col lg:overflow-hidden w-full">
          {/* Workspace Body split */}
          <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden gap-4">
            {/* Left Panel */}
            <aside className="w-full lg:w-[35%] xl:w-[40%] h-[300px] lg:h-auto flex flex-col shrink-0 overflow-hidden rounded-xl border border-[#2563eb]/15 dark:border-[#15366f]/45 bg-white/20 shadow-[0_20px_50px_rgba(12,52,171,0.06)] backdrop-blur-xl dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
              {/* Header inside Left Card */}
              <div className="p-4 border-b border-black/5 dark:border-white/5 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(backPath)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff] mb-3"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                
                <h1 className="text-lg font-bold tracking-tight text-[#0d2a57] dark:text-white mb-2">
                  {question.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-black/5 dark:border-white/10 bg-white/30 dark:bg-white/5 px-2.5 py-0.5 font-semibold text-gray-700 dark:text-gray-300">
                    {question.subtitle}
                  </span>
                  <span className="rounded-full border border-black/5 dark:border-white/10 bg-white/30 dark:bg-white/5 px-2.5 py-0.5 font-semibold text-gray-700 dark:text-gray-300">
                    {question.difficulty}
                  </span>
                </div>
              </div>

              {/* Scrollable description */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="prose prose-slate max-w-none dark:prose-invert text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.statement}</ReactMarkdown>
                </div>
              </div>
            </aside>

            {/* Right Panel */}
            <div className="flex-grow flex-1 w-full lg:w-[65%] xl:w-[60%] flex flex-col gap-4 lg:overflow-hidden">
              {/* Code Editor */}
              <section className="h-[450px] lg:h-auto lg:flex-[2] flex flex-col overflow-hidden rounded-xl border border-[#2563eb]/15 bg-white/20 p-3 shadow-[0_20px_50px_rgba(12,52,171,0.06)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 shrink-0 border-b border-black/5 dark:border-white/5 pb-2">
                  <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                    <span className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Code Editor</span>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => {
                        const nextLang = e.target.value;
                        setSelectedLanguage(nextLang);
                        setCode(LANGUAGES[nextLang].starter);
                      }}
                      className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      {Object.values(LANGUAGES).map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={isRunning}
                      onClick={handleCodeRun}
                      className="flex-grow sm:flex-initial sm:w-20 justify-center items-center inline-flex gap-1.5 rounded-lg border border-[#2563eb]/20 dark:border-white/10 bg-[#2563eb]/5 dark:bg-white/5 px-2.5 py-1.5 sm:py-1 text-xs font-semibold text-[#2563eb] dark:text-gray-300 hover:bg-[#2563eb]/15"
                    >
                      <Play className="h-3 w-3" />
                      Run
                    </button>
                    <button
                      type="button"
                      disabled={isRunning}
                      onClick={handleCodeSubmit}
                      className="flex-grow sm:flex-initial sm:w-32 justify-center items-center inline-flex gap-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] px-3 py-1.5 sm:py-1 text-xs font-semibold text-white"
                    >
                      Submit Code
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 relative border dark:border-gray-800 rounded-lg overflow-hidden">
                  <Editor
                    height="100%"
                    language={LANGUAGES[selectedLanguage].monacoLanguage}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    value={code}
                    onChange={(val) => setCode(val || '')}
                    options={{
                      fontSize: 13,
                      minimap: { enabled: false },
                      automaticLayout: true,
                    }}
                  />
                </div>
              </section>

              {/* Execution Console */}
              <section className="flex-[1] min-h-[180px] lg:min-h-0 flex flex-col overflow-hidden rounded-xl border border-[#2563eb]/15 bg-white/20 p-3 shadow-[0_20px_50px_rgba(12,52,171,0.06)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 shrink-0">Console Output</h3>
                <pre className="flex-grow overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed bg-[#f3f4f6]/50 dark:bg-black/35 p-2 rounded-lg border dark:border-gray-700 text-gray-800 dark:text-emerald-400">
                  {output || 'Output of code execution will be displayed here.'}
                </pre>
              </section>
            </div>
          </div>
        </div>
      </UserSidebarLayout>
    );
  }
}
