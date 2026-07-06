import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { dailyChallengeAPI } from "../../services/dailyChallengeApi";
import {
  getDailyChallengeSession,
  setDailyChallengeSession,
} from "../../lib/dailyChallengeSession";
import pixelQuestionImg from '../../assets/pixel-question.png';

export default function DailyChallengeAccess() {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

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
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
    setNotice("");

    try {
      await dailyChallengeAPI.sendOtp(linkId, email.trim().toLowerCase());
      setOtpSent(true);
      setDailyChallengeSession(linkId, {
        studentEmail: email.trim().toLowerCase(),
      });
      setNotice("OTP sent. You can use any recent OTP from your email.");
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!email || resending) return;
    setResending(true);
    setError("");
    setNotice("");

    try {
      await dailyChallengeAPI.sendOtp(linkId, email.trim().toLowerCase());
      setOtpSent(true);
      setNotice("New OTP sent. Your recent OTPs remain valid for a short time.");
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  const normalizeOtp = (value) => String(value || "").replace(/\D/g, "").slice(0, 6);

  const verifyOtp = async () => {
    const cleanOtp = normalizeOtp(otp);
    if (!cleanOtp) {
      setError("Please enter OTP.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await dailyChallengeAPI.verifyOtp(
        linkId,
        email.trim().toLowerCase(),
        cleanOtp
      );

      const responseChallenge = response?.codingRound || response?.data?.codingRound || existingSession?.challenge;
      const responseAttempt = response?.attempt || response?.data?.attempt || null;
      const nextLinkId = responseChallenge?.linkId || linkId;

      setDailyChallengeSession(linkId, {
        studentEmail: email.trim().toLowerCase(),
        challenge: responseChallenge,
        attempt: responseAttempt,
        isVerified: true,
        verifiedAt: new Date().toISOString(),
      });

      if (nextLinkId !== linkId) {
        setDailyChallengeSession(nextLinkId, {
          studentEmail: email.trim().toLowerCase(),
          challenge: responseChallenge,
          attempt: responseAttempt,
          isVerified: true,
          verifiedAt: new Date().toISOString(),
        });
      }

      navigate(`/daily-challenge/${nextLinkId}/instructions`, { replace: true });
    } catch (err) {
      setError(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="relative w-full max-w-lg rounded-xl border border-black/5 bg-white/40 p-5 pt-10 text-center shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] md:p-6 md:pt-11">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-xl border border-white/70 bg-white/80 p-3 shadow-md dark:border-[#15366f]/45 dark:bg-[#06183d]">
          <img
            src={pixelQuestionImg}
            alt="Daily Challenge Access"
            className="h-14 w-14 object-contain pixel-icon select-none"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <div className="mt-8 space-y-3">
          <h3 className="font-press-start text-[9px] leading-relaxed tracking-wider text-[#00113b] dark:text-[#8fd9ff] uppercase">
            DAILY CHALLENGE ACCESS
          </h3>
          <p className="text-sm font-semibold leading-relaxed text-[#00113b] dark:text-white md:text-base">
            {challengeTitle}
          </p>
          
          <p className="text-xs leading-relaxed text-[#00113b]/70 dark:text-[#81bde6] md:text-sm">
            {otpSent 
              ? "An OTP has been sent to your registered email address. Please enter it below to proceed."
              : "To ensure a secure environment, click the button below to get an OTP on your registered email address."
            }
          </p>

          <div className="space-y-3 pt-2">
            {otpSent && (
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(normalizeOtp(event.target.value))}
                onPaste={(event) => {
                  event.preventDefault();
                  const pastedOtp = normalizeOtp(event.clipboardData.getData("text"));
                  setOtp(pastedOtp);
                  setError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !loading) {
                    event.preventDefault();
                    verifyOtp();
                  }
                }}
                placeholder="Enter OTP"
                className="w-full rounded-md border border-[#86c4ff]/40 bg-[#f2faff]/90 px-3 py-2 text-sm text-[#001862] outline-none transition placeholder:text-[#6f8fb7] focus:border-[#2d7fe8]/70 focus:ring-4 focus:ring-[#76c7ff]/20 dark:border-[#6bb8ec]/25 dark:bg-[#0a2f6f]/60 dark:text-[#9cd6ff] dark:placeholder:text-[#77afd8] dark:focus:border-[#8fd9ff]/70"
              />
            )}

            {notice && <p className="text-xs font-semibold text-emerald-500 md:text-sm">{notice}</p>}
            {error && <p className="text-xs font-semibold text-red-500 md:text-sm">{error}</p>}

            {!otpSent ? (
              <button
                type="button"
                onClick={sendOtp}
                disabled={loading}
                className="flex w-full items-center justify-center rounded-md bg-white px-4 py-2.5 font-press-start text-[9px] font-bold text-[#0a1128] shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-100 active:translate-y-0 active:bg-slate-200 disabled:opacity-60"
              >
                {loading ? "Sending OTP..." : "Get OTP"}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-md bg-white px-4 py-2.5 font-press-start text-[9px] font-bold text-[#0a1128] shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-100 active:translate-y-0 active:bg-slate-200 disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={loading || resending}
                  className="text-xs font-semibold text-[#00113b]/70 underline-offset-4 hover:underline disabled:opacity-60 dark:text-[#8fd9ff]"
                >
                  {resending ? "Resending OTP..." : "Resend OTP"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
