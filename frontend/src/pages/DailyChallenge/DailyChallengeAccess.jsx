import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dailyChallengeAPI } from "../../services/dailyChallengeApi";
import {
  getDailyChallengeSession,
  setDailyChallengeSession,
} from "../../lib/dailyChallengeSession";

const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/;

export default function DailyChallengeAccess() {
  const { linkId } = useParams();
  const navigate = useNavigate();

  const existingSession = useMemo(() => getDailyChallengeSession(linkId), [linkId]);
  const userData = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [challengeTitle, setChallengeTitle] = useState(existingSession?.challenge?.title || "Daily Challenge");
  const [email, setEmail] = useState(existingSession?.studentEmail || userData?.email || "");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (existingSession?.isVerified) {
      navigate(`/daily-challenge/${linkId}/instructions`, { replace: true });
      return;
    }

    let cancelled = false;

    const loadChallenge = async () => {
      try {
        const response = await dailyChallengeAPI.getByLink(linkId);
        if (cancelled) return;

        const challenge = response?.data || null;
        if (challenge?.title) {
          setChallengeTitle(challenge.title);
          setDailyChallengeSession(linkId, { challenge });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load Daily Challenge details.");
        }
      }
    };

    loadChallenge();

    return () => {
      cancelled = true;
    };
  }, [existingSession?.isVerified, linkId, navigate]);

  const sendOtp = async () => {
    if (!emailPattern.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await dailyChallengeAPI.sendOtp(linkId, email.trim().toLowerCase());
      setOtpSent(true);
      setDailyChallengeSession(linkId, {
        studentEmail: email.trim().toLowerCase(),
      });
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      setError("Please enter OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await dailyChallengeAPI.verifyOtp(
        linkId,
        email.trim().toLowerCase(),
        otp.trim()
      );

      setDailyChallengeSession(linkId, {
        studentEmail: email.trim().toLowerCase(),
        challenge: response?.codingRound || existingSession?.challenge,
        isVerified: true,
        verifiedAt: new Date().toISOString(),
      });

      navigate(`/daily-challenge/${linkId}/instructions`, { replace: true });
    } catch (err) {
      setError(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/70 p-8 shadow-lg backdrop-blur-xl dark:border-gray-700/30 dark:bg-gray-900/60">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Challenge Access</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{challengeTitle}</p>

        <div className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />

          <input
            type="text"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            placeholder="Enter OTP"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          {!otpSent ? (
            <button
              type="button"
              onClick={sendOtp}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          ) : (
            <button
              type="button"
              onClick={verifyOtp}
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
