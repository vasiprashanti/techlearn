import { useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, ClipboardList, Loader2, Target, XCircle } from "lucide-react";
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

const Metric = ({ label, value, hint }) => (
  <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    {hint ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
  </div>
);

const ActivityCell = ({ activity }) => {
  if (!activity?.completed && !activity?.attempted) {
    return <span className="text-xs text-slate-400">N/A</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      {activity.completed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {activity.score === null || activity.score === undefined ? "Attempted" : `${activity.score}%`}
    </span>
  );
};

const reportTabs = [
  { key: "program", label: "Program", icon: <Target size={16} /> },
  { key: "practice", label: "Practice", icon: <ClipboardList size={16} /> },
  { key: "assessments", label: "Assessments", icon: <CheckCircle2 size={16} /> },
];

const ProgramReport = ({ report }) => {
  const snapshot = report?.snapshot || {};
  const days = snapshot.days || [];
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-[#081a3c]/80">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">{report.type || "Program"}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{report.title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {snapshot.schedule?.type === "batch" ? `Batch schedule${snapshot.schedule.batchName ? ` · ${snapshot.schedule.batchName}` : ""}` : "Individual schedule"}
            {snapshot.schedule?.startDate ? ` · started ${formatDate(snapshot.schedule.startDate)}` : ""}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-right">
          <Metric label="Progress" value={`${snapshot.completedDays || 0}/${snapshot.program?.durationDays || days.length || 0}`} hint="days complete" />
          <Metric label="Today" value={`Day ${snapshot.currentDay || 1}`} />
          <Metric label="Score" value={snapshot.score === null || snapshot.score === undefined ? "—" : `${snapshot.score}%`} />
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Day</th>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Challenge</th>
              <th className="px-4 py-3">Assessment</th>
              <th className="px-4 py-3">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {days.map((day) => (
              <tr key={day.day} className={day.available ? "" : "opacity-55"}>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900 dark:text-white">Day {day.day}</td>
                <td className="px-4 py-3"><ActivityCell activity={day.task} /></td>
                <td className="px-4 py-3"><ActivityCell activity={day.challenge} /></td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                  {day.assessment ? `${day.assessment.title} · ${day.assessment.score ?? "—"}%` : "N/A"}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{day.score === null || day.score === undefined ? "—" : `${day.score}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
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
    return () => { cancelled = true; };
  }, []);

  const practiceRows = useMemo(() => data.practice?.snapshot?.tracks || [], [data.practice]);

  return (
    <UserSidebarLayout maxWidthClass="max-w-[1500px]">
      <section className="w-full">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Performance history</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Reports</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Your program progress, practice activity, and completed assessments stay available here.</p>
          </div>
          <BarChart3 className="text-blue-500" size={32} />
        </div>

        <div className="mt-7 flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-white/10">
          {reportTabs.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === key ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"}`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center text-slate-500"><Loader2 className="mr-2 animate-spin" size={20} /> Loading reports…</div>
        ) : error ? (
          <div className="mt-7 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{error}</div>
        ) : activeTab === "program" ? (
          <div className="mt-7 space-y-5">
            {data.program.length ? data.program.map((report) => <ProgramReport key={report._id || report.reportKey} report={report} />) : <EmptyState text="No enrolled program reports yet." />}
          </div>
        ) : activeTab === "practice" ? (
          <div className="mt-7 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-[#081a3c]/80">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Attempts" value={data.practice?.snapshot?.totalAttempts || 0} />
              <Metric label="Correct" value={data.practice?.snapshot?.totalCorrect || 0} />
              <Metric label="Accuracy" value={`${data.practice?.snapshot?.accuracy || 0}%`} />
            </div>
            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/[0.04] dark:text-slate-400"><tr><th className="px-4 py-3">Practice</th><th className="px-4 py-3">Attempts</th><th className="px-4 py-3">Correct</th><th className="px-4 py-3">Accuracy</th><th className="px-4 py-3">Score</th></tr></thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {practiceRows.map((row) => <tr key={row.practice}><td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{row.practice}</td><td className="px-4 py-3">{row.attempts}</td><td className="px-4 py-3">{row.correct}</td><td className="px-4 py-3">{row.accuracy}%</td><td className="px-4 py-3">{row.score}</td></tr>)}
                </tbody>
              </table>
            </div>
            {!practiceRows.length ? <EmptyState text="No practice submissions yet." /> : null}
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-[#081a3c]/80">
            <div className="mb-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><CheckCircle2 size={18} className="text-emerald-500" /> Completed assessment history is stored on your account.</div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/[0.04] dark:text-slate-400"><tr><th className="px-4 py-3">Assessment</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Attempted</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Report</th></tr></thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {data.assessments.map((report) => <tr key={report._id || report.reportKey}><td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{report.title}</td><td className="px-4 py-3">{report.type || "Program"}</td><td className="px-4 py-3">{formatDate(report.snapshot?.attemptedAt || report.generatedAt)}</td><td className="px-4 py-3 font-semibold">{report.score === null || report.score === undefined ? "—" : `${report.score}%`}</td><td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{report.snapshot?.correctAnswers ?? 0}/{report.snapshot?.totalQuestions ?? 0} correct</td></tr>)}
                </tbody>
              </table>
            </div>
            {!data.assessments.length ? <EmptyState text="No completed assessments yet." /> : null}
          </div>
        )}
      </section>
    </UserSidebarLayout>
  );
}

function EmptyState({ text }) {
  return <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">{text}</p>;
}
