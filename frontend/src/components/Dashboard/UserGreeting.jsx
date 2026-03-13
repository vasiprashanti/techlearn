import { useUser } from '../../context/UserContext';

const UserGreeting = () => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <h1 className="text-3xl font-light tracking-tight text-black/30 dark:text-white/30">
          Loading...
        </h1>
      </div>
    );
  }

  const firstName = user?.firstName ? user.firstName : 'Guest';
  const lastName = user?.lastName ? ` ${user.lastName}` : '';

  return (
    <div>
      <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-black dark:text-white">
        Hello, {firstName}{lastName}.
      </h1>
      <p className="text-sm tracking-widest uppercase text-black/40 dark:text-white/40 mt-4">
        Overview
      </p>
    </div>
  );
};

export default UserGreeting;