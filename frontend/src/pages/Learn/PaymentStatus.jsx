import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Clock, AlertCircle, ArrowRight, RotateCcw, Home, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function PaymentStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const state = location.state || {};
  const searchParams = new URLSearchParams(location.search);
  const status = state.status || searchParams.get("status") || "failed"; // 'success', 'pending', 'failed'
  const programName = state.programName || searchParams.get("program") || (status === "success" ? "Placement Monthly Test" : status === "pending" ? "Placement Annual Test" : "Placement Monthly Test");
  const amount = state.amount || searchParams.get("amount") || (status === "success" ? "1" : status === "pending" ? "2" : "1");
  const programId = state.programId || searchParams.get("programId") || "6abea6f4b7bfa57af73efc61";
  
  const message = state.message || searchParams.get("message") || (status === "success" 
    ? "Your payment was confirmed. You're enrolled and your curriculum is ready." 
    : status === "pending" 
    ? "Razorpay is finalizing the transaction. Your dashboard will unlock once confirmed."
    : "The payment wasn't completed. No amount was deducted, or the checkout was closed.");

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative font-sans ${isDarkMode ? "bg-[#080d25]" : "bg-[#ceeefd]"}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Press+Start+2P&display=swap');
        .press-start-font {
          font-family: 'Press Start 2P', cursive !important;
        }
      `}</style>

      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-none" />

      {/* TechLearn Themed Modal */}
      <div className="relative z-10 w-full max-w-[440px] rounded-3xl bg-white dark:bg-[#071330] p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-black/5 dark:border-[#15366f]/50 transition-all text-slate-900 dark:text-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={() => navigate(status === "success" ? `/learn/program/${programId}` : "/learn")}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="text-center pt-2 pb-1">
          
          {/* Natural clean icon without fake generic badges */}
          <div className="mb-4 flex justify-center">
            {status === "success" && (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#89c638]/15 dark:bg-[#a3e635]/15 text-[#6fa329] dark:text-[#a3e635]">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            )}
            {status === "pending" && (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 animate-pulse">
                <Clock className="h-8 w-8" />
              </div>
            )}
            {status === "failed" && (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500">
                <AlertCircle className="h-8 w-8" />
              </div>
            )}
          </div>

          {/* Clean natural title */}
          <h2 className="press-start-font text-[13px] sm:text-[14px] uppercase tracking-wider text-[#00113b] dark:text-[#8fd9ff] leading-relaxed mb-2.5">
            {status === "success" && "Enrollment Active"}
            {status === "pending" && "Payment In Review"}
            {status === "failed" && "Checkout Cancelled"}
          </h2>

          {/* Description */}
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto mb-5">
            {message}
          </p>

          {/* Summary Box with clean design */}
          {(programName || amount) && (
            <div className="w-full mb-6 p-3.5 rounded-2xl bg-[#03185a]/5 dark:bg-[#020d4b]/60 border border-slate-200 dark:border-[#15366f]/60 flex items-center justify-between text-left">
              <div className="min-w-0 pr-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Offering
                </p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                  {programName}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Fee
                </p>
                <p className="text-sm sm:text-base font-extrabold text-[#02107a] dark:text-[#7ec9ff] font-mono mt-0.5">
                  ₹{amount}
                </p>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="w-full flex flex-col gap-2.5">
            {status === "success" && (
              <>
                {programId ? (
                  <Link
                    to={`/learn/program/${programId}`}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#a3e635] hover:bg-[#86efac] py-3 press-start-font text-[10px] font-bold text-[#0a1128] shadow-md shadow-[#a3e635]/25 transition cursor-pointer gap-2"
                  >
                    <span>GO TO CURRICULUM</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
                <Link
                  to="/dashboard"
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-semibold transition text-center flex items-center justify-center gap-1.5"
                >
                  <Home className="h-3.5 w-3.5 opacity-70" />
                  <span>Go to Dashboard</span>
                </Link>
              </>
            )}

            {status === "pending" && (
              <>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 py-3 press-start-font text-[10px] font-bold text-[#0a1128] shadow-md shadow-amber-500/25 transition cursor-pointer gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>REFRESH STATUS</span>
                </button>
                <Link
                  to="/dashboard"
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-semibold transition text-center flex items-center justify-center gap-1.5"
                >
                  <Home className="h-3.5 w-3.5 opacity-70" />
                  <span>Go to Dashboard</span>
                </Link>
              </>
            )}

            {status === "failed" && (
              <>
                {programId ? (
                  <Link
                    to={`/learn/programs/${programId}`}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#a3e635] hover:bg-[#86efac] py-3 press-start-font text-[10px] font-bold text-[#0a1128] shadow-md shadow-[#a3e635]/25 transition cursor-pointer gap-2"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>TRY AGAIN</span>
                  </Link>
                ) : null}
                <Link
                  to="/learn"
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-semibold transition text-center"
                >
                  Explore Programs
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
