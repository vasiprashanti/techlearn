import { useUser } from '../../context/UserContext';

const UserGreeting = () => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="user-greeting mt-4 ml-14 md:ml-4">
        <h1 className="text-4xl font-poppins font text-gray-600 dark:text-gray-400 hover-gradient-text">
          Loading...
        </h1>
      </div>
    );
  }

  return (
    <div className="user-greeting mt-4 ml-14 md:ml-4">
      <h1 className="text-4xl font-poppins font text-gray-600 dark:text-gray-400 hover-gradient-text">
        Hi, {user?.firstName ? user.firstName : 'Guest'}{user?.lastName ? ` ${user.lastName}` : ''}
      </h1>
    </div>
  );
};

export default UserGreeting;