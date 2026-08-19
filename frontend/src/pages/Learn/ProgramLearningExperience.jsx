import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Code2,
  Loader2,
  Target,
} from 'lucide-react';
import Sidebar from '../../components/Dashboard/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { programLearningAPI } from '../../services/programLearningApi';

const phaseTone = {
  'day_0_readiness': 'from-violet-500 to-fuchsia-500',
  revision: 'from-amber-500 to-orange-500',
  company_preparation: 'from-cyan-500 to-blue-500',
  final_assessment: 'from-rose-500 to-red-500',
};

const getQuestionType = (item) => String(
  item?.question?.categoryType || item?.categoryType || 'Coding'
).toLowerCase();

const isSqlQuestion = (item) => {
  const values = [
    item?.question?.trackType,
    item?.question?.categoryTitle,
    item?.question?.categorySlug,
  ].map((value) => String(value || '').toLowerCase());
  return values.some((value) => value === 'sql' || value.includes('sql'));
};

const getNextQuestionIndex = (assignment, start = 0) => {
  const questions = assignment?.questions || [];
  const next = questions.findIndex((item, index) => index >= start && !item.attempted);
  return next >= 0 ? next : -1;
};

const formatPercent = (value) => (
  value === null || value === undefined ? '—' : Math.round(Number(value)) + '%'
);

export default function ProgramLearningExperience() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [experience, setExperience] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState({ selectedAnswer: '', code: '', language: 'javascript' });
  const [lastResult, setLastResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const assignment = experience?.assignment || null;
  const activeItem = assignment?.questions?.[questionIndex] || null;
  const activeQuestion = activeItem?.question || {};
  const questionType = getQuestionType(activeItem);
  const isReadiness = Boolean(assignment?.isLeadAssessment);
  const isNotes = questionType === 'notes';
  const isMcq = questionType === 'mcq';
  const isSql = isSqlQuestion(activeItem);
  const isCompleted = Boolean(
    assignment?.status === 'Completed'
    || (assignment?.questions?.length > 0 && assignment.questions.every((item) => item.attempted))
  );

  const themeClasses = isDark
    ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128] text-slate-100'
    : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] text-slate-900';
  const panelClasses = isDark
    ? 'border-white/10 bg-[#071432]/85'
    : 'border-slate-200/80 bg-white/80';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    programLearningAPI.getExperience(programId)
      .then((payload) => {
        if (cancelled) return;
        const nextExperience = payload.experience || null;
        setExperience(nextExperience);
        const nextIndex = getNextQuestionIndex(nextExperience?.assignment, 0);
        setQuestionIndex(nextIndex >= 0 ? nextIndex : 0);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || 'Unable to load this program.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [programId]);

  useEffect(() => {
    setAnswer({ selectedAnswer: '', code: '', language: 'javascript' });
    setLastResult(null);
  }, [activeItem?.questionId]);

  const progress = useMemo(() => {
    const questions = assignment?.questions || [];
    const answered = questions.filter((item) => item.attempted).length;
    return {
      answered,
      total: questions.length,
      percent: questions.length ? Math.round((answered / questions.length) * 100) : 0,
    };
  }, [assignment]);

  const handleSubmit = async () => {
    if (!assignment || !activeItem || submitting) return;
    if (isMcq && !answer.selectedAnswer) {
      setError('Choose an option before submitting.');
      return;
    }
    if (!isNotes && !isMcq && !String(answer.code || '').trim()) {
      setError('Enter your solution before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const body = {
        questionId: activeItem.questionId,
        selectedAnswer: answer.selectedAnswer,
        code: answer.code,
        language: answer.language,
      };
      const payload = isReadiness
        ? await programLearningAPI.submitReadinessAnswer(programId, body)
        : await programLearningAPI.submitAssignmentAnswer(programId, assignment.id, body);
      const nextAssignment = payload.assignment || assignment;
      setExperience((previous) => ({
        ...previous,
        assignment: nextAssignment,
      }));
      if (!isReadiness && phase === 'final_assessment' && nextAssignment.status === 'Completed') {
        try {
          const reportPayload = await programLearningAPI.getFinalReport(programId);
          setExperience((previous) => ({
            ...previous,
            finalReport: reportPayload.report || null,
          }));
        } catch {
          // The answer is already saved; the report can be loaded on refresh.
        }
      }
      setLastResult(payload.result || null);
      const nextIndex = getNextQuestionIndex(nextAssignment, questionIndex + 1);
      setQuestionIndex(nextIndex >= 0 ? nextIndex : questionIndex);
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit this answer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={'min-h-screen ' + themeClasses + ' flex items-center justify-center'}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error && !experience) {
    return (
      <div className={'min-h-screen ' + themeClasses + ' flex items-center justify-center px-6'}>
        <div className={'max-w-lg rounded-2xl border p-8 text-center shadow-xl ' + panelClasses}>
          <CircleAlert className="mx-auto mb-4 h-10 w-10 text-rose-400" />
          <h1 className="text-xl font-semibold">Program experience unavailable</h1>
          <p className="mt-2 text-sm opacity-70">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-6 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const program = experience?.program || {};
  const phase = experience?.phase || 'learning';
  const phaseLabel = experience?.phaseLabel || 'Structured Learning';
  const phaseGradient = phaseTone[phase] || 'from-blue-500 to-indigo-500';

  return (
    <div className={'min-h-screen ' + themeClasses}>
      <Sidebar />
      <main className="min-h-screen px-4 pb-16 pt-24 lg:ml-[90px] lg:px-10">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold opacity-70 transition hover:opacity-100"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <section className={'overflow-hidden rounded-2xl border shadow-xl ' + panelClasses}>
            <div className={'bg-gradient-to-r ' + phaseGradient + ' p-6 text-white sm:p-8'}>
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/75">
                    {program.programType || 'Program'} learning path
                  </p>
                  <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{program.name || 'Program Experience'}</h1>
                  <p className="mt-2 max-w-2xl text-sm text-white/80">{phaseLabel}</p>
                </div>
                <div className="rounded-xl bg-black/15 px-4 py-3 text-right backdrop-blur">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/70">Program day</div>
                  <div className="mt-1 text-2xl font-bold">{experience?.programDay || 0}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-b border-current/10 p-4 sm:grid-cols-3">
              <div className="rounded-xl bg-black/5 p-3 dark:bg-white/5">
                <div className="text-xs opacity-60">Schedule</div>
                <div className="mt-1 font-semibold">
                  {experience?.scheduleType === 'batch' ? 'Batch schedule' : experience?.enrolled ? 'Individual schedule' : 'Pre-enrollment'}
                </div>
              </div>
              <div className="rounded-xl bg-black/5 p-3 dark:bg-white/5">
                <div className="text-xs opacity-60">Progress</div>
                <div className="mt-1 font-semibold">{progress.answered} / {progress.total || '—'} answered</div>
              </div>
              <div className="rounded-xl bg-black/5 p-3 dark:bg-white/5">
                <div className="text-xs opacity-60">Target</div>
                <div className="mt-1 truncate font-semibold">{experience?.profile?.targetRole || experience?.profile?.learningGoal || 'Personalized path'}</div>
              </div>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-8">
              <div>
                {error && (
                  <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {error}
                  </div>
                )}

                {!assignment ? (
                  <div className="rounded-2xl border border-dashed border-current/15 p-8 text-center">
                    <BookOpen className="mx-auto mb-4 h-10 w-10 opacity-50" />
                    <h2 className="text-xl font-semibold">Structured learning is active</h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm opacity-70">
                      Daily Tasks and Daily Challenges are supplied by the program&apos;s Track Templates. Dynamic assignments begin automatically when this program reaches its configured phase.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Open Dashboard <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : isCompleted ? (
                  <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-8">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                    <h2 className="mt-4 text-2xl font-bold">
                      {isReadiness ? 'Readiness assessment complete' : phaseLabel + ' complete'}
                    </h2>
                    <p className="mt-2 text-sm opacity-75">
                      Score: {formatPercent(
                        lastResult?.summary?.accuracy ??
                        assignment.questions.reduce((sum, item) => sum + (Number(item.accuracy) || 0), 0) / Math.max(1, assignment.questions.filter((item) => item.accuracy !== null).length)
                      )}
                    </p>
                    {experience?.finalReport && (
                      <div className="mt-6 rounded-xl border border-current/10 bg-black/5 p-4 text-left dark:bg-white/5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="font-semibold">Final Report</h3>
                          <span className="text-xs font-semibold uppercase tracking-wider opacity-60">
                            {experience.finalReport.status}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                          <div>
                            <span className="block text-xs opacity-60">Score</span>
                            <span className="font-semibold">{formatPercent(experience.finalReport.score)}</span>
                          </div>
                          <div>
                            <span className="block text-xs opacity-60">Correct</span>
                            <span className="font-semibold">{experience.finalReport.correctAnswers} / {experience.finalReport.totalQuestions}</span>
                          </div>
                          <div>
                            <span className="block text-xs opacity-60">Completed</span>
                            <span className="font-semibold">
                              {experience.finalReport.completedAt ? new Date(experience.finalReport.completedAt).toLocaleDateString() : 'In progress'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {isReadiness && (
                      <button
                        type="button"
                        onClick={() => navigate('/onboarding/programs')}
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
                      >
                        Continue to Enrollment <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : activeItem ? (
                  <div className="rounded-2xl border border-current/10 p-5 sm:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
                          Question {questionIndex + 1} of {assignment.questions.length}
                        </div>
                        <h2 className="mt-2 text-xl font-bold">{activeQuestion.title || 'Assigned question'}</h2>
                      </div>
                      <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold opacity-70 dark:bg-white/10">
                        {activeItem.difficulty || activeQuestion.difficulty || 'Easy'}
                      </span>
                    </div>

                    <div className="mt-5 whitespace-pre-wrap text-sm leading-6 opacity-80">
                      {activeQuestion.description || activeQuestion.markdownBody || 'Complete this assigned item to continue.'}
                    </div>

                    {isMcq && (
                      <div className="mt-6 grid gap-3">
                        {(activeQuestion.options || []).map((option) => (
                          <label
                            key={option.label}
                            className={'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ' + (
                              answer.selectedAnswer === option.label
                                ? 'border-blue-400 bg-blue-500/10'
                                : 'border-current/10 hover:border-blue-400/50'
                            )}
                          >
                            <input
                              type="radio"
                              name="program-answer"
                              value={option.label}
                              checked={answer.selectedAnswer === option.label}
                              onChange={(event) => setAnswer((previous) => ({ ...previous, selectedAnswer: event.target.value }))}
                              className="mt-1 accent-blue-500"
                            />
                            <span className="font-semibold">{option.label}.</span>
                            <span className="text-sm opacity-85">{option.text}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {isNotes && (
                      <div className="mt-6 rounded-xl bg-blue-500/10 p-4 text-sm">
                        <div className="flex items-center gap-2 font-semibold text-blue-300">
                          <BookOpen className="h-4 w-4" /> Read this resource and mark it complete.
                        </div>
                        {activeQuestion.editorial && <p className="mt-3 whitespace-pre-wrap opacity-80">{activeQuestion.editorial}</p>}
                      </div>
                    )}

                    {!isMcq && !isNotes && (
                      <div className="mt-6">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-xs font-semibold opacity-70">
                            <Code2 className="h-4 w-4" /> Your solution
                          </label>
                          <select
                            value={answer.language}
                            onChange={(event) => setAnswer((previous) => ({ ...previous, language: event.target.value }))}
                            className="rounded-lg border border-current/10 bg-transparent px-3 py-2 text-xs"
                          >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="sql">SQL</option>
                          </select>
                        </div>
                        <textarea
                          value={answer.code}
                          onChange={(event) => setAnswer((previous) => ({ ...previous, code: event.target.value }))}
                          rows={10}
                          placeholder={isSql ? 'Write your SQL query here...' : (activeQuestion.starterCode?.javascript?.code || 'Write your answer here...')}
                          className="w-full rounded-xl border border-current/10 bg-black/5 p-4 font-mono text-sm outline-none focus:border-blue-400 dark:bg-black/20"
                        />
                      </div>
                    )}

                    {lastResult && (
                      <div className={'mt-5 rounded-xl border p-4 text-sm ' + (
                        lastResult.correct === false
                          ? 'border-rose-400/25 bg-rose-500/10'
                          : 'border-emerald-400/25 bg-emerald-500/10'
                      )}>
                        {lastResult.correct === null || lastResult.correct === undefined
                          ? 'Answer recorded.'
                          : lastResult.correct ? 'Correct answer.' : 'Answer recorded for review.'}
                        {lastResult.accuracy !== null && lastResult.accuracy !== undefined && (
                          <span className="ml-2 font-semibold">{formatPercent(lastResult.accuracy)}</span>
                        )}
                      </div>
                    )}

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isReadiness ? 'Submit Readiness Answer' : 'Submit Answer'}
                        {!submitting && <ChevronRight className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-current/15 p-8 text-center">
                    <Target className="mx-auto mb-4 h-10 w-10 opacity-50" />
                    <h2 className="text-xl font-semibold">No questions available yet</h2>
                    <p className="mt-2 text-sm opacity-70">
                      The configured Blueprint does not have enough matching Question Bank entries yet. The shortfall is recorded for the admin to resolve.
                    </p>
                  </div>
                )}
              </div>

              <aside className="space-y-4">
                <div className={'rounded-2xl border p-5 ' + panelClasses}>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                    <span>Assignment progress</span>
                    <span>{progress.percent}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: progress.percent + '%' }} />
                  </div>
                  <div className="mt-4 space-y-2">
                    {(assignment?.questions || []).map((item, index) => (
                      <button
                        key={item.id || item.questionId}
                        type="button"
                        onClick={() => setQuestionIndex(index)}
                        className={'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition ' + (
                          index === questionIndex ? 'bg-blue-500/15 text-blue-300' : 'hover:bg-black/5 dark:hover:bg-white/5'
                        )}
                      >
                        {item.attempted
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          : <span className="h-4 w-4 rounded-full border border-current/25" />}
                        <span className="truncate">Question {index + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {(experience?.revisionMaterials || []).length > 0 && (
                  <div className={'rounded-2xl border p-5 ' + panelClasses}>
                    <h3 className="flex items-center gap-2 font-semibold">
                      <BookOpen className="h-4 w-4 text-amber-400" /> Your Revision Focus
                    </h3>
                    <div className="mt-4 space-y-3">
                      {experience.revisionMaterials.map((material) => (
                        <div key={[material.subject, material.topic, material.subtopic].join('-')} className="rounded-lg bg-amber-500/10 p-3 text-xs">
                          <div className="font-semibold">{material.subject || 'General'} · {material.topic || 'Topic'}</div>
                          <div className="mt-1 opacity-70">{material.subtopic || 'General'} · {formatPercent(material.accuracy)}</div>
                          {(material.resources || []).slice(0, 2).map((resource) => (
                            <div key={resource.id} className="mt-2 border-t border-current/10 pt-2 opacity-75">
                              {resource.title}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
