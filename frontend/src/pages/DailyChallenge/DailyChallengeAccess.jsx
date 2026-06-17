import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dailyChallengeAPI } from "../../services/dailyChallengeApi";
import {
  getDailyChallengeSession,
  setDailyChallengeSession,
} from "../../lib/dailyChallengeSession";
import pixelQuestionImg from '../../assets/pixel-question.png';

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
  const [email] = useState(existingSession?.studentEmail || userData?.email || "");
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
    if (!email) {
      setError("No registered email address found. Please log in.");
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
        attempt: response?.attempt || null,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-6 font-sans">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0a1128] border-2 border-[#3C83F6]/50 rounded-2xl p-6 md:p-8 shadow-2xl text-center border-b-8 border-b-[#3C83F6]">
        
        {/* Absolute Top Badge with pixelated solved question image */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#3C83F6] text-white p-3 rounded-full border-4 border-white dark:border-[#0a1128] shadow-lg">
          <img
            src={pixelQuestionImg}
            alt="Daily Challenge Access"
            className="w-10 h-10 object-contain pixel-icon select-none"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <div className="mt-8 space-y-4">
          <h3 className="font-pixel-header text-xs tracking-wider text-[#3C83F6] dark:text-[#8fd9ff] uppercase">
            DAILY CHALLENGE ACCESS
          </h3>
          <p className="text-base font-bold text-slate-800 dark:text-white leading-relaxed">
            {challengeTitle}
          </p>
          
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {otpSent 
              ? "An OTP has been sent to your registered email address. Please enter it below to proceed."
              : "To ensure a secure environment, click the button below to get an OTP on your registered email address."
            }
          </p>

          <div className="mt-6 space-y-4">
            {otpSent && (
              <input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter OTP"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            )}

            {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

            {!otpSent ? (
              <button
                type="button"
                onClick={sendOtp}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 shadow-lg shadow-blue-500/20"
              >
                {loading ? "Sending OTP..." : "Get OTP"}
              </button>
            ) : (
              <button
                type="button"
                onClick={verifyOtp}
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 shadow-lg shadow-emerald-500/20"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
