import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Flame,
  Layers,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
  FileText,
  Calendar,
  Award,
} from "lucide-react";
import UserSidebarLayout from "../../components/Dashboard/UserSidebarLayout";

const API_BASE = (() => {
  const raw = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const base = raw.replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
})();

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const StatCard = ({ label, value, hint, icon: Icon, colorClass = "text-[#3c83f6] dark:text-[#8fd9ff]" }) => (
  <div className="dashboard-surface relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
    <div className="flex items-center justify-between gap-3">
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] text-[#00113b]/60 dark:text-[#afcff1]/70">
        {label}
      </p>
      {Icon && (
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
    <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#00113b] dark:text-white">
      {value}
    </p>
    {hint && (
      <p className="mt-1 text-xs text-[#00113b]/55 dark:text-[#afcff1]/60 font-medium">
        {hint}
      </p>
    )}
  </div>
);

const ActivityCell = ({ activity }) => {
  if (!activity?.completed && !activity?.attempted) {
    return <span className="text-xs font-medium text-slate-400 dark:text-slate-500">—</span>;
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
        activity.completed
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      }`}
    >
      {activity.completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {activity.score === null || activity.score === undefined ? "Attempted" : `${activity.score}%`}
    </span>
  );
};

const reportTabs = [
  { key: "program", label: "Program", icon: Target },
  { key: "practice", label: "Practice", icon: ClipboardList },
  { key: "assessments", label: "Assessments", icon: Award },
];

const ProgramReport = ({ report }) => {
  const snapshot = report?.snapshot || {};
  const days = snapshot.days || [];
  const duration = snapshot.program?.durationDays || days.length || 0;
  const completed = snapshot.completedDays || 0;
  const progressPercent = duration > 0 ? Math.round((completed / duration) * 100) : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="dashboard-surface rounded-2xl p-5 sm:p-7 shadow-sm transition duration-300"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-black/5 dark:border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#3c83f6]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#3c83f6] dark:bg-[#3c83f6]/20 dark:text-[#8fd9ff]">
              {report.type || "Program"}
            </span>
            {snapshot.schedule?.type && (
              <span className="text-xs text-[#00113b]/50 dark:text-[#afcff1]/50 font-medium">
                {snapshot.schedule.type === "batch" ? "Batch Cohort" : "Self-Paced"}
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-[#00113b] dark:text-white">
            {report.title}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-[#00113b]/60 dark:text-[#afcff1]/70">
            <Calendar className="h-3.5 w-3.5" />
            {snapshot.schedule?.startDate
              ? `Started on ${formatDate(snapshot.schedule.startDate)}`
              : "Ongoing schedule"}
            {snapshot.schedule?.batchName ? ` · ${snapshot.schedule.batchName}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/40 dark:bg-white/5 p-3 text-center border border-black/5 dark:border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#00113b]/50 dark:text-[#afcff1]/60">Progress</p>
            <p className="mt-1 text-lg sm:text-xl font-bold text-[#00113b] dark:text-white">{completed}/{duration}</p>
            <p className="text-[10px] text-[#3c83f6] dark:text-[#8fd9ff] font-semibold">{progressPercent}%</p>
          </div>
          <div className="rounded-xl bg-white/40 dark:bg-white/5 p-3 text-center border border-black/5 dark:border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#00113b]/50 dark:text-[#afcff1]/60">Current</p>
            <p className="mt-1 text-lg sm:text-xl font-bold text-[#00113b] dark:text-white">Day {snapshot.currentDay || 1}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">of {duration}</p>
          </div>
          <div className="rounded-xl bg-white/40 dark:bg-white/5 p-3 text-center border border-black/5 dark:border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#00113b]/50 dark:text-[#afcff1]/60">Avg Score</p>
            <p className="mt-1 text-lg sm:text-xl font-bold text-[#00113b] dark:text-white">
              {snapshot.score === null || snapshot.score === undefined ? "—" : `${snapshot.score}%`}
            </p>
            <p className="text-[10px] text-emerald-500 font-semibold">Overall</p>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-black/5 dark:border-white/10 bg-white/30 dark:bg-black/15">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-black/[0.02] dark:bg-white/[0.03] text-[11px] font-bold uppercase tracking-wider text-[#00113b]/60 dark:text-[#afcff1]/70 border-b border-black/5 dark:border-white/5">
              <tr>
                <th className="px-5 py-3.5">Day</th>
                <th className="px-5 py-3.5">Daily Task</th>
                <th className="px-5 py-3.5">Coding Challenge</th>
                <th className="px-5 py-3.5">Assessment</th>
                <th className="px-5 py-3.5 text-right">Daily Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {days.map((day) => (
                <tr
                  key={day.day}
                  className={`transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02] ${
                    day.available ? "" : "opacity-45"
                  }`}
                >
                  <td className="whitespace-nowrap px-5 py-3.5 font-bold text-[#00113b] dark:text-white">
                    Day {day.day}
                  </td>
                  <td className="px-5 py-3.5">
                    <ActivityCell activity={day.task} />
                  </td>
                  <td className="px-5 py-3.5">
                    <ActivityCell activity={day.challenge} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#00113b]/70 dark:text-[#afcff1]/80">
                    {day.assessment ? (
                      <span className="font-semibold text-[#00113b] dark:text-white">
                        {day.assessment.title}{" "}
                        <span className="text-slate-400">·</span>{" "}
                        <span className="text-emerald-600 dark:text-emerald-400">{day.assessment.score ?? "—"}%</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-[#00113b] dark:text-white">
                    {day.score === null || day.score === undefined ? (
                      <span className="text-slate-400 font-normal">—</span>
                    ) : (
                      `${day.score}%`
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.article>
  );
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState("program");
  const [data, setData] = useState({ program: [], practice: null, assessments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || "Unable to load reports.");
        if (!cancelled) setData(payload.reports || { program: [], practice: null, assessments: [] });
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Unable to load reports.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const practiceRows = useMemo(() => data.practice?.snapshot?.tracks || [], [data.practice]);

  return (
    <UserSidebarLayout maxWidthClass="max-w-[1400px]">
      <div className="space-y-8 px-1 py-2">
        {/* Brand Page Heading */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="mx-auto max-w-4xl pt-2 text-center md:pt-4"
        >
          <h1 className="font-press-start leading-normal">
            <span className="block text-xl sm:text-2xl md:text-3xl brand-heading-primary">
              PERFORMANCE REPORTS
            </span>
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#00113b]/65 dark:text-[#afcff1]/70 max-w-xl mx-auto">
            Review your enrolled program milestones, practice accuracy, and historical assessment transcripts.
          </p>
        </motion.div>

        {/* Navigation Tabs Pill Container */}
        <div className="flex justify-center">
          <div className="dashboard-surface inline-flex items-center gap-1.5 rounded-2xl p-1.5 shadow-sm">
            {reportTabs.map(({ key, label, icon: IconComponent }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? "bg-[#3c83f6] text-white shadow-md shadow-[#3c83f6]/30 dark:bg-[#3c83f6] dark:text-white"
                      : "text-[#00113b]/70 hover:bg-black/5 hover:text-[#00113b] dark:text-[#afcff1]/70 dark:hover:bg-white/5 dark:hover:text-white"
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <section className="flex min-h-[360px] items-center justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#86c4ff]/45 bg-white/40 px-5 py-3 text-sm font-medium text-[#00113b] shadow-sm shadow-[#3c83f6]/10 backdrop-blur-xl dark:border-[#6fbfff]/24 dark:bg-[#051738]/75 dark:text-[#8fd9ff]">
              <Loader2 className="h-4 w-4 animate-spin text-[#3c83f6] dark:text-[#8fd9ff]" />
              Syncing performance reports
            </div>
          </section>
        ) : error ? (
          <section className="dashboard-surface dashboard-surface-strong mx-auto max-w-2xl border-dashed p-8 text-center rounded-2xl">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              <XCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-[#00113b] dark:text-white">Unable to Load Reports</h2>
            <p className="mt-2 text-sm text-[#00113b]/65 dark:text-[#afcff1]/70">{error}</p>
          </section>
        ) : activeTab === "program" ? (
          <div className="space-y-6">
            {data.program.length ? (
              data.program.map((report) => (
                <ProgramReport key={report._id || report.reportKey} report={report} />
              ))
            ) : (
              <EmptyState
                icon={Target}
                title="No Enrolled Program Reports Yet"
                description="Enroll in a skill or placement cohort to unlock daily tasks, challenges, and curriculum progress tracking."
              />
            )}
          </div>
        ) : activeTab === "practice" ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Quick Metrics Grid */}
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Total Attempts"
                value={data.practice?.snapshot?.totalAttempts || 0}
                icon={ClipboardList}
                hint="Questions practiced"
              />
              <StatCard
                label="Correct Solutions"
                value={data.practice?.snapshot?.totalCorrect || 0}
                icon={CheckCircle2}
                colorClass="text-emerald-500"
                hint="Successfully solved"
              />
              <StatCard
                label="Overall Accuracy"
                value={`${data.practice?.snapshot?.accuracy || 0}%`}
                icon={TrendingUp}
                colorClass="text-[#3c83f6]"
                hint="Global hit rate"
              />
            </div>

            {/* Practice Track Table */}
            <div className="dashboard-surface rounded-2xl p-5 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-[#00113b] dark:text-white">Track Breakdown</h2>
                  <p className="text-xs text-[#00113b]/60 dark:text-[#afcff1]/70">Performance across specific domains and topics.</p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-black/5 dark:border-white/10 bg-white/30 dark:bg-black/15">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-black/[0.02] dark:bg-white/[0.03] text-[11px] font-bold uppercase tracking-wider text-[#00113b]/60 dark:text-[#afcff1]/70 border-b border-black/5 dark:border-white/5">
                      <tr>
                        <th className="px-5 py-3.5">Practice Track</th>
                        <th className="px-5 py-3.5 text-center">Attempts</th>
                        <th className="px-5 py-3.5 text-center">Correct</th>
                        <th className="px-5 py-3.5 text-center">Accuracy</th>
                        <th className="px-5 py-3.5 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {practiceRows.map((row) => (
                        <tr key={row.practice} className="transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02]">
                          <td className="px-5 py-3.5 font-bold text-[#00113b] dark:text-white">
                            {row.practice}
                          </td>
                          <td className="px-5 py-3.5 text-center font-medium text-[#00113b]/80 dark:text-[#afcff1]/80">
                            {row.attempts}
                          </td>
                          <td className="px-5 py-3.5 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                            {row.correct}
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold text-[#00113b] dark:text-white">
                            <span className="inline-block rounded-md bg-[#3c83f6]/10 px-2 py-0.5 text-xs text-[#3c83f6] dark:bg-[#3c83f6]/20 dark:text-[#8fd9ff]">
                              {row.accuracy}%
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-extrabold text-[#00113b] dark:text-white">
                            {row.score}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {!practiceRows.length && (
                <div className="py-8 text-center">
                  <p className="text-xs text-[#00113b]/50 dark:text-[#afcff1]/50">No track submissions recorded yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="dashboard-surface rounded-2xl p-5 sm:p-7 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-[#00113b] dark:text-white">Assessment Transcripts</h2>
                  <p className="text-xs text-[#00113b]/60 dark:text-[#afcff1]/70">Permanent records of all completed milestone assessments.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Verified Records
                </span>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-black/5 dark:border-white/10 bg-white/30 dark:bg-black/15">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-black/[0.02] dark:bg-white/[0.03] text-[11px] font-bold uppercase tracking-wider text-[#00113b]/60 dark:text-[#afcff1]/70 border-b border-black/5 dark:border-white/5">
                      <tr>
                        <th className="px-5 py-3.5">Assessment Name</th>
                        <th className="px-5 py-3.5">Phase Type</th>
                        <th className="px-5 py-3.5">Attempted Date</th>
                        <th className="px-5 py-3.5 text-center">Score</th>
                        <th className="px-5 py-3.5 text-right">Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {data.assessments.map((report) => (
                        <tr key={report._id || report.reportKey} className="transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02]">
                          <td className="px-5 py-3.5 font-bold text-[#00113b] dark:text-white">
                            {report.title}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#00113b]/75 dark:text-[#afcff1]">
                              {report.type || "Program Assessment"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#00113b]/70 dark:text-[#afcff1]/80">
                            {formatDate(report.snapshot?.attemptedAt || report.generatedAt)}
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold text-[#00113b] dark:text-white">
                            <span className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-extrabold ${
                              (report.score ?? 0) >= 70
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            }`}>
                              {report.score === null || report.score === undefined ? "—" : `${report.score}%`}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right text-xs font-semibold text-[#00113b]/70 dark:text-[#afcff1]/80">
                            {report.snapshot?.correctAnswers ?? 0}/{report.snapshot?.totalQuestions ?? 0} questions
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {!data.assessments.length && (
                <div className="py-8 text-center">
                  <p className="text-xs text-[#00113b]/50 dark:text-[#afcff1]/50">No completed assessments recorded yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </UserSidebarLayout>
  );
}

function EmptyState({ icon: Icon = FileText, title = "No Records", description = "" }) {
  return (
    <div className="dashboard-surface dashboard-surface-strong mx-auto max-w-2xl border-dashed p-8 sm:p-10 text-center rounded-2xl">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#8ec8ff]/45 bg-white/40 text-[#1266af] dark:border-[#6fbfff]/24 dark:bg-[#051738]/75 dark:text-[#9cd6ff]">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-[#00113b] dark:text-white">{title}</h2>
      {description && (
        <p className="mt-2 text-sm leading-6 text-[#00113b]/65 dark:text-[#afcff1]/70 max-w-md mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}
