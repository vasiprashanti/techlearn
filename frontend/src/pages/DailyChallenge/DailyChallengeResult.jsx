import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import {
  clearDailyChallengeSession,
  getDailyChallengeSession,
} from "../../lib/dailyChallengeSession";
import pixelStarImg from "../../assets/pixel-star.png";

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
  const { theme } = useTheme();

  const session = useMemo(() => getDailyChallengeSession(linkId), [linkId]);
  const result = session?.result || {};
  const metrics = result?.challengeMetrics || {};

  const accuracy = typeof metrics.accuracy === "number"
    ? metrics.accuracy
    : typeof result?.accuracy === "number"
      ? result.accuracy
      : 0;
  const evaluationStatus =
    result?.evaluationStatus ||
    metrics.evaluationStatus ||
    result?.status ||
    "Completed";
  const score = typeof result?.totalScore === "number" ? result.totalScore : metrics.score || 0;
  const xpGained = typeof metrics.xpGained === "number" ? metrics.xpGained : score;
  const streak = typeof metrics.streak === "number" ? metrics.streak : "-";
  const timeTaken = formatTimeTaken(metrics);

  const categoryBreakdown = useMemo(() => {
    const problemResults = result?.problemResults || [];
    const breakdown = {};
    problemResults.forEach((p) => {
      const cat = p.categoryType || "Coding";
      if (!breakdown[cat]) {
        breakdown[cat] = { correct: 0, total: 0 };
      }
      breakdown[cat].total += 1;
      if (p.isCorrect || p.score >= 100) {
        breakdown[cat].correct += 1;
      }
    });
    return Object.entries(breakdown);
  }, [result]);

  useEffect(() => {
    const timer = setTimeout(() => {
      clearDailyChallengeSession(linkId);
      navigate("/dashboard", { replace: true });
    }, 30000);

    return () => clearTimeout(timer);
  }, [linkId, navigate]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-5 md:p-6 font-sans text-slate-900 dark:text-slate-100">
      <div className="absolute left-5 top-5 md:left-6 md:top-6 flex items-center gap-3">
        <img
          src={theme === "dark" ? "/logoo2-small.webp" : "/logoo-small.webp"}
          alt="TLS"
          className="h-10 w-auto object-contain md:h-12"
        />
        <span className="hidden h-7 w-px bg-black/10 dark:bg-white/10 sm:block" />
        <span className="hidden font-press-start text-[10px] uppercase tracking-wider text-[#00113b]/70 dark:text-[#8fd9ff] sm:block md:text-xs">
          Daily Challenge
        </span>
      </div>

      <div className="relative w-full max-w-md rounded-xl border border-black/5 bg-white/40 p-4 pt-8 text-center shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] md:p-5 md:pt-9">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-xl border border-white/70 bg-white/80 p-3 shadow-md dark:border-[#15366f]/45 dark:bg-[#06183d]">
          <img
            src={pixelStarImg}
            alt="Daily Challenge Result"
            className="h-12 w-12 object-contain pixel-icon select-none"
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        <div className="mt-5 space-y-2">
          <h3 className="font-press-start text-[9px] leading-relaxed tracking-wider text-[#00113b] dark:text-[#8fd9ff] uppercase">
            DAILY CHALLENGE RESULT
          </h3>
          <p className="text-sm font-semibold leading-relaxed text-[#00113b] dark:text-white md:text-base">
            {session?.terminated ? (
              <span className="text-red-600 dark:text-red-400 font-bold">
                Test Terminated: Exceeded tab switch limit!
              </span>
            ) : (
              "You have completed the challenge!"
            )}
          </p>
          <p className="text-xs leading-relaxed text-[#00113b]/70 dark:text-[#81bde6] md:text-sm">
            You’ll be redirected to the Dashboard shortly.
          </p>

          <div className="inline-flex rounded-full border border-black/5 bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#00113b] dark:border-white/5 dark:bg-black/20 dark:text-white">
            Status: {evaluationStatus}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 pt-1">
            {[
              ["Accuracy", `${accuracy}%`],
              ["XP Gained", `+${xpGained}`],
              ["Score", score],
              ["Streak", streak],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-black/5 bg-white/25 px-3 py-2 text-left dark:border-white/5 dark:bg-black/20"
              >
                <span className="block font-press-start text-[8px] uppercase leading-relaxed text-[#00113b]/55 dark:text-[#81bde6]">
                  {label}
                </span>
                <span className="mt-0.5 block text-base font-semibold text-[#00113b] dark:text-white">
                  {value}
                </span>
              </div>
            ))}
            <div className="rounded-lg border border-black/5 bg-white/25 px-3 py-2 text-left dark:border-white/5 dark:bg-black/20 col-span-2">
              <span className="block font-press-start text-[8px] uppercase leading-relaxed text-[#00113b]/55 dark:text-[#81bde6]">
                Time Taken
              </span>
              <span className="mt-0.5 block text-base font-semibold text-[#00113b] dark:text-white">
                {timeTaken}
              </span>
            </div>
          </div>

          {categoryBreakdown.length > 0 && (
            <div className="mt-4 border-t border-black/5 dark:border-white/5 pt-3 w-full">
              <span className="block text-center font-press-start text-[8px] uppercase tracking-wider text-[#00113b]/60 dark:text-[#8fd9ff]/70 mb-2">
                Category breakdown
              </span>
              <div className="grid grid-cols-1 gap-2">
                {categoryBreakdown.map(([cat, info]) => (
                  <div key={cat} className="flex items-center justify-between rounded-lg border border-black/5 bg-white/25 px-4 py-2 dark:border-white/5 dark:bg-black/20">
                    <span className="text-xs font-semibold text-[#00113b]/80 dark:text-slate-300 uppercase">
                      {cat}
                    </span>
                    <span className="text-xs font-bold text-[#00113b] dark:text-white">
                      {info.correct} / {info.total} Correct
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                clearDailyChallengeSession(linkId);
                navigate("/dashboard", { replace: true });
              }}
              className="flex w-full items-center justify-center rounded-md bg-white px-4 py-2 font-press-start text-[9px] font-bold text-[#0a1128] shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-100 active:translate-y-0 active:bg-slate-200"
            >
              Go to Dashboard now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

