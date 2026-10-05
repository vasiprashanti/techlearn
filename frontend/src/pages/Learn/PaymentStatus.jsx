import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

export default function PaymentStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const state = location.state || {};
  const status = state.status || "failed"; // 'success', 'pending', 'failed'
  const message = state.message || (status === "success" 
    ? "Your payment was processed successfully!" 
    : status === "pending" 
    ? "Your payment is currently being verified. Dashboard access will activate shortly."
    : "Payment was not completed. Please try again.");
  const programId = state.programId;
  const programName = state.programName;
  const amount = state.amount;

  return (
    <div className={`min-h-screen pt-28 pb-16 px-4 flex items-center justify-center ${isDarkMode ? "bg-[#080d25] text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className={`max-w-md w-full p-8 rounded-2xl border text-center shadow-xl ${isDarkMode ? "bg-[#0d153a] border-white/10" : "bg-white border-slate-200"}`}>
        
        {/* Status Icon */}
        <div className="mb-6 flex justify-center">
          {status === "success" && (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-3xl font-bold animate-bounce">
              ✓
            </div>
          )}
          {status === "pending" && (
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-3xl font-bold animate-pulse">
              ⏳
            </div>
          )}
          {status === "failed" && (
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center text-3xl font-bold">
              ✕
            </div>
          )}
        </div>

        {/* Status Title */}
        <h1 className="text-2xl font-black mb-2">
          {status === "success" && "Payment Successful!"}
          {status === "pending" && "Payment Pending Verification"}
          {status === "failed" && "Payment Incomplete"}
        </h1>

        {/* Program and Amount info */}
        {(programName || amount) && (
          <div className={`my-4 p-3 rounded-xl text-sm ${isDarkMode ? "bg-white/5" : "bg-slate-100"}`}>
            {programName && <p className="font-semibold">{programName}</p>}
            {amount && <p className="opacity-80">Amount: ₹{amount}</p>}
          </div>
        )}

        {/* Status Message */}
        <p className={`text-sm mb-8 leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {status === "success" && (
            <>
              {programId ? (
                <Link
                  to={`/learn/program/${programId}`}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all text-sm tracking-wide shadow-md"
                >
                  START PROGRAM
                </Link>
              ) : null}
              <Link
                to="/dashboard"
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all border ${
                  isDarkMode 
                    ? "border-white/20 hover:bg-white/10 text-white" 
                    : "border-slate-300 hover:bg-slate-100 text-slate-800"
                }`}
              >
                GO TO DASHBOARD
              </Link>
            </>
          )}

          {status === "pending" && (
            <>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-500 transition-all text-sm tracking-wide shadow-md"
              >
                CHECK STATUS
              </button>
              <Link
                to="/dashboard"
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all border ${
                  isDarkMode 
                    ? "border-white/20 hover:bg-white/10 text-white" 
                    : "border-slate-300 hover:bg-slate-100 text-slate-800"
                }`}
              >
                GO TO DASHBOARD
              </Link>
            </>
          )}

          {status === "failed" && (
            <>
              {programId ? (
                <Link
                  to={`/learn/programs/${programId}`}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all text-sm tracking-wide shadow-md"
                >
                  RETRY PAYMENT
                </Link>
              ) : null}
              <Link
                to="/learn"
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all border ${
                  isDarkMode 
                    ? "border-white/20 hover:bg-white/10 text-white" 
                    : "border-slate-300 hover:bg-slate-100 text-slate-800"
                }`}
              >
                EXPLORE PROGRAMS
              </Link>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
