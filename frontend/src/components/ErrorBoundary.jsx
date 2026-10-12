import React from "react";

/**
 * Catches render errors in the page below it so one broken screen does not
 * blank the whole app. The navbar stays usable, and the boundary resets when
 * `resetKey` (the current route) changes.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="flex min-h-[70vh] w-full items-center justify-center px-6 pt-28 pb-12">
        <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white/80 p-8 text-center shadow-lg dark:border-white/10 dark:bg-[#0a1238]">
          <h1 className="text-xl font-bold text-[#00113b] dark:text-white">Something went wrong</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            This page hit an unexpected problem. Reloading usually fixes it.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-[#b2e96a] px-5 py-2.5 text-sm font-semibold text-[#04103d]"
            >
              Reload page
            </button>
            <a href="/" className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold text-[#00113b] dark:border-white/20 dark:text-white">
              Go to home
            </a>
          </div>
        </div>
      </main>
    );
  }
}
