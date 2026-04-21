import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  clearDailyChallengeSession,
  getDailyChallengeSession,
} from "../../lib/dailyChallengeSession";

const formatTimeTaken = (metrics = {}) => {
  if (typeof metrics.timeTakenMinutes === "number") {
    return `${metrics.timeTakenMinutes} mins`;
  }

  if (typeof metrics.timeTakenSeconds === "number") {
    return `${Math.ceil(metrics.timeTakenSeconds / 60)} mins`;
  }

  return "-";
};

export default function DailyChallengeResult() {
  const { linkId } = useParams();
  const navigate = useNavigate();

  const session = useMemo(() => getDailyChallengeSession(linkId), [linkId]);
  const result = session?.result || {};
  const metrics = result?.challengeMetrics || {};

  const score = typeof result?.totalScore === "number" ? result.totalScore : metrics.score || 0;
  const xpGained = typeof metrics.xpGained === "number" ? metrics.xpGained : score;
  const streak = typeof metrics.streak === "number" ? metrics.streak : "-";
  const timeTaken = formatTimeTaken(metrics);

  useEffect(() => {
    const timer = setTimeout(() => {
      clearDailyChallengeSession(linkId);
      navigate("/dashboard", { replace: true });
    }, 8000);

    return () => clearTimeout(timer);
  }, [linkId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/30 bg-white/80 p-8 shadow-lg backdrop-blur-xl dark:border-gray-700/30 dark:bg-gray-900/70">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daily Challenge Result</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">You’ll be redirected to Dashboard shortly.</p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/20">
            <p className="text-xs uppercase tracking-wider text-blue-700 dark:text-blue-200">Score</p>
            <p className="mt-2 text-2xl font-semibold text-blue-800 dark:text-blue-100">{score}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/20">
            <p className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-200">XP Gained</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-800 dark:text-emerald-100">+{xpGained}</p>
          </div>
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/40 dark:bg-orange-900/20">
            <p className="text-xs uppercase tracking-wider text-orange-700 dark:text-orange-200">Streak</p>
            <p className="mt-2 text-2xl font-semibold text-orange-800 dark:text-orange-100">{streak}</p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-900/40 dark:bg-purple-900/20">
            <p className="text-xs uppercase tracking-wider text-purple-700 dark:text-purple-200">Time Taken</p>
            <p className="mt-2 text-2xl font-semibold text-purple-800 dark:text-purple-100">{timeTaken}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            clearDailyChallengeSession(linkId);
            navigate("/dashboard", { replace: true });
          }}
          className="mt-8 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Go to Dashboard now
        </button>
      </div>
    </div>
  );
}
