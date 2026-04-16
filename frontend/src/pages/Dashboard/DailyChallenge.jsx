import { Link } from 'react-router-dom';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';

export default function DailyChallenge() {
  return (
    <UserSidebarLayout maxWidthClass="max-w-6xl">
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/40">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Daily Challenge
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Pick a practice area to continue. (Challenge compiler pages open in focused mode.)
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/dashboard/practice/dsa"
            className="rounded-2xl border border-white/20 bg-white/60 p-5 shadow-sm backdrop-blur-xl transition hover:bg-white/70 dark:border-gray-700/20 dark:bg-gray-900/30 dark:hover:bg-gray-900/40"
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white">DSA</div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              Problems + compiler
            </div>
          </Link>

          <Link
            to="/dashboard/practice/sql"
            className="rounded-2xl border border-white/20 bg-white/60 p-5 shadow-sm backdrop-blur-xl transition hover:bg-white/70 dark:border-gray-700/20 dark:bg-gray-900/30 dark:hover:bg-gray-900/40"
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white">SQL</div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">Question bank</div>
          </Link>

          <Link
            to="/dashboard/practice/core-cs"
            className="rounded-2xl border border-white/20 bg-white/60 p-5 shadow-sm backdrop-blur-xl transition hover:bg-white/70 dark:border-gray-700/20 dark:bg-gray-900/30 dark:hover:bg-gray-900/40"
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Core CS</div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">MCQ practice</div>
          </Link>

          <Link
            to="/dashboard/practice/company-based"
            className="rounded-2xl border border-white/20 bg-white/60 p-5 shadow-sm backdrop-blur-xl transition hover:bg-white/70 dark:border-gray-700/20 dark:bg-gray-900/30 dark:hover:bg-gray-900/40"
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Company Based</div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">Assessments</div>
          </Link>
        </div>
      </div>
    </UserSidebarLayout>
  );
}
