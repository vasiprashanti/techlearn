import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-6">
      <div className="w-full max-w-3xl rounded-2xl border border-white/30 bg-white/80 p-8 shadow-lg backdrop-blur-xl dark:border-gray-700/30 dark:bg-gray-900/70">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daily Challenge Instructions</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {challenge?.title || "Read all instructions before starting the challenge."}
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-gray-600 dark:text-gray-300">Loading instructions...</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-500">{error}</p>
        ) : (
          <>
            <ul className="mt-6 space-y-3 text-sm text-gray-700 dark:text-gray-200">
              <li>• Timer limit: <b>{timerLimitMinutes} minutes</b></li>
              <li>• Maximum runs per question: <b>{rules.runLimitPerQuestion || 5}</b></li>
              <li>• Submission limit: <b>{rules.submitLimitPerQuestion || 1}</b></li>
            </ul>

            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/20">
              <h2 className="text-sm font-semibold text-blue-700 dark:text-blue-200">Anti-cheat rules</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-blue-700/90 dark:text-blue-200/90">
                {(rules.antiCheatRules || defaultRules.antiCheatRules).map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={startTest}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {loading ? "Preparing..." : "Start Daily Challenge"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
