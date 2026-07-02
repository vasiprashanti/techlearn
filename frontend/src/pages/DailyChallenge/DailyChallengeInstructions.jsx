import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Play } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { dailyChallengeAPI } from "../../services/dailyChallengeApi";
import {
  getDailyChallengeSession,
  setDailyChallengeSession,
} from "../../lib/dailyChallengeSession";

const defaultRules = {
  timerLimitMinutes: 30,
  runLimitPerQuestion: 5,
  submitLimitPerQuestion: 1,
  antiCheatRules: [
    "Do not switch tabs or windows during the challenge.",
    "Max 5 runs are allowed per question.",
    "Only one final submission is allowed.",
    "Challenge will auto-submit when timer ends.",
  ],
};

export default function DailyChallengeInstructions() {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const session = useMemo(() => getDailyChallengeSession(linkId), [linkId]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState(session?.challenge || null);
  const [rules, setRules] = useState(session?.instructions || defaultRules);

  useEffect(() => {
    if (!session?.isVerified || !session?.studentEmail) {
      navigate(`/daily-challenge/${linkId}`, { replace: true });
      return;
    }

    let cancelled = false;

    const loadChallenge = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await dailyChallengeAPI.getByLink(linkId);
        if (cancelled) return;

        const responseChallenge = response?.data || null;
        setChallenge(responseChallenge);
        setRules(responseChallenge?.instructions || defaultRules);
        setDailyChallengeSession(linkId, {
          challenge: responseChallenge,
          instructions: responseChallenge?.instructions || defaultRules,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load challenge instructions.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadChallenge();

    return () => {
      cancelled = true;
    };
  }, [linkId, navigate, session?.isVerified, session?.studentEmail]);

  const timerLimitMinutes = Number(challenge?.duration || rules.timerLimitMinutes || 30);

  const startTest = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await dailyChallengeAPI.start(linkId, session?.studentEmail);
      const challengePayload = response?.data?.codingRound || challenge;
      const attempt = response?.data?.attempt || null;

      setDailyChallengeSession(linkId, {
        challenge: challengePayload,
        attempt,
      });

      navigate(`/daily-challenge/${linkId}/test`);
    } catch (err) {
      setError(err.message || "Unable to start the Daily Challenge.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-4 md:p-6 font-sans text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-2xl flex items-center gap-3 mb-6 md:absolute md:left-6 md:top-6 md:mb-0 md:w-auto justify-center md:justify-start select-none">
        <img
          src={theme === "dark" ? "/logoo2-small.webp" : "/logoo-small.webp"}
          alt="TLS"
          className="h-9 w-auto object-contain md:h-12 shrink-0"
        />
        <span className="h-6 w-px bg-black/10 dark:bg-white/10 shrink-0" />
        <span className="font-press-start text-[8.5px] sm:text-[10px] uppercase tracking-wider text-[#00113b]/70 dark:text-[#8fd9ff] md:text-xs whitespace-nowrap shrink-0">
          Daily Challenge
        </span>
      </div>

      <div className="w-full max-w-2xl rounded-xl border border-black/5 bg-white/40 p-4 shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] md:p-6">
        <h1 className="text-center font-press-start text-[10px] uppercase tracking-wider text-[#00113b] dark:text-[#8fd9ff] md:text-xs">
          Daily Challenge Instructions
        </h1>
        <p className="mt-3 text-center text-sm font-semibold leading-relaxed text-[#00113b] dark:text-white md:text-base">
          {challenge?.title || "Read all instructions before starting the challenge."}
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-[#00113b]/70 dark:text-[#81bde6]">
            Loading instructions...
          </p>
        ) : error ? (
          <p className="mt-6 text-sm font-semibold text-red-500">{error}</p>
        ) : (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {/* MCQ Card */}
              <div className="rounded-lg border border-black/5 bg-white/25 p-4 text-left dark:border-white/5 dark:bg-black/20 flex flex-col justify-between">
                <div>
                  <span className="block font-press-start text-[8px] sm:text-[9px] uppercase leading-relaxed text-[#00113b]/70 dark:text-[#8fd9ff] mb-2">
                    MCQ Questions
                  </span>
                  <ul className="space-y-1.5 text-xs sm:text-sm leading-relaxed text-[#00113b]/75 dark:text-[#cdeeff]">
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3C83F6] dark:bg-[#8fd9ff]" />
                      <span>Multiple choices with single correct options.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3C83F6] dark:bg-[#8fd9ff]" />
                      <span>No negative marking. Answer all questions.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3C83F6] dark:bg-[#8fd9ff]" />
                      <span>Saves automatically upon option selection.</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                  <span className="font-press-start text-[8px] uppercase text-[#00113b]/55 dark:text-[#81bde6]">Duration: </span>
                  <span className="text-xs font-bold text-[#00113b] dark:text-white">{timerLimitMinutes} mins (Total)</span>
                </div>
              </div>

              {/* Coding Card */}
              <div className="rounded-lg border border-black/5 bg-white/25 p-4 text-left dark:border-white/5 dark:bg-black/20 flex flex-col justify-between">
                <div>
                  <span className="block font-press-start text-[8px] sm:text-[9px] uppercase leading-relaxed text-[#00113b]/70 dark:text-[#8fd9ff] mb-2">
                    Coding Questions
                  </span>
                  <ul className="space-y-1.5 text-xs sm:text-sm leading-relaxed text-[#00113b]/75 dark:text-[#cdeeff]">
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3C83F6] dark:bg-[#8fd9ff]" />
                      <span>Write clean, compiling code in the compiler editor.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3C83F6] dark:bg-[#8fd9ff]" />
                      <span>Run logic limits: Max {rules.runLimitPerQuestion || 5} compiler runs per question.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3C83F6] dark:bg-[#8fd9ff]" />
                      <span>Submit limit: {rules.submitLimitPerQuestion || 1} final submit per question.</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                  <span className="font-press-start text-[8px] uppercase text-[#00113b]/55 dark:text-[#81bde6]">Grading: </span>
                  <span className="text-xs font-bold text-[#00113b] dark:text-white">Based on passed test cases</span>
                </div>
              </div>
            </div>

            {/* Anti-cheat Card */}
            <div className="mt-4 rounded-lg border border-black/5 bg-white/25 p-4 dark:border-white/5 dark:bg-black/20">
              <h2 className="font-press-start text-[8px] sm:text-[9px] uppercase tracking-wider text-[#00113b] dark:text-[#8fd9ff]">
                Anti-cheat rules
              </h2>
              <ul className="mt-3 space-y-2 text-xs sm:text-sm leading-relaxed text-[#00113b]/75 dark:text-[#cdeeff]">
                {(rules.antiCheatRules || defaultRules.antiCheatRules).map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 dark:bg-red-400" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={startTest}
                disabled={loading}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white px-4 py-2.5 font-press-start text-[9px] font-bold text-[#0a1128] shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-100 active:translate-y-0 active:bg-slate-200 disabled:opacity-60"
              >
                <Play className="h-3.5 w-3.5" />
                {loading ? "Preparing..." : "Start Daily Challenge"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
