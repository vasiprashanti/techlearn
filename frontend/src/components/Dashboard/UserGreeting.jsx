import { useUser } from '../../context/UserContext'; // Adjust the import path as needed

const UserGreeting = () => {
  const { user, isLoading, error } = useUser();

  if (isLoading) {
    return (
      <div className="user-greeting">
        <h1 className="text-4xl font bg-gradient-to-r from-blue-600 via-blue-800 to-purple-600 bg-clip-text text-transparent">
          Loading...
        </h1>
      </div>
    );
  }

 
  return (
    <div className="user-greeting">
      <h1 className="text-4xl font bg-gradient-to-r from-blue-600 via-blue-800 to-purple-600 bg-clip-text text-transparent">
        Hi, {user?.firstName ? user.firstName : 'Guest'}{user?.lastName ? ` ${user.lastName}` : ''}
      </h1>
    </div>
  );
};

export default UserGreeting;