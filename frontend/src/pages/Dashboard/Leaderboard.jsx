import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';

export default function Leaderboard() {
  return (
    <UserSidebarLayout maxWidthClass="max-w-6xl">
      <div className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/40">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Leaderboard
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Coming soon.</p>
      </div>
    </UserSidebarLayout>
  );
}
