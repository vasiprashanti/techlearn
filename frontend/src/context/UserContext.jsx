import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [xp, setXp] = useState(0);
  const [recentExercises, setRecentExercises] = useState([]);
  const [progress, setProgress] = useState({
    courseProgress: 0,
    goalsProgress: 0,
    totalExercises: 0,
    completedExercises: 0,
  });
  const [activities, setActivities] = useState({});
  const [isReady, setIsReady] = useState(false);

  // Load user data from localStorage and validate structure
  const loadUserFromStorage = () => {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return false;

    try {
      const localUser = JSON.parse(userDataStr);
      if (!localUser || typeof localUser !== 'object') return false;

      // Ensure required fields exist
      const firstName = localUser.firstName || localUser.name?.split(' ')[0] || 'User';
      const lastName = localUser.lastName || localUser.name?.split(' ').slice(1).join(' ') || '';

      setUser({
        ...localUser,
        firstName,
        lastName,
        email: localUser.email || '',
      });
      return true;
    } catch (e) {
      console.error('Failed to parse userData:', e);
      return false;
    }
  };

  // Fetch user + dashboard data from API
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const { data } = await axios.get('https://tl-final.onrender.com/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update user data if API returns it
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('userData', JSON.stringify(data.user));
      }

      // Update other dashboard data (xp, progress, etc.)
      setXp(data.xpPoints?.totalXP || 0);
      setRecentExercises(Array.isArray(data.recentExercises) ? data.recentExercises : []);
      setActivities(data.calendarActivity || {});
      setProgress({
        courseProgress: data.courseProgress?.progressPercent || 0,
        goalsProgress: 40, // Placeholder
        totalExercises: data.exerciseProgress?.totalExercises || 0,
        completedExercises: data.exerciseProgress?.completedExercises || 0,
      });

    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize user data
  useEffect(() => {
    const initializeUser = async () => {
      const hasLocalUser = loadUserFromStorage();
      if (localStorage.getItem('token')) {
        await fetchUserData(); // Sync with backend
      } else if (!hasLocalUser) {
        setUser({ firstName: 'Guest', lastName: '', email: '' });
      }
      setIsReady(true);
    };

    initializeUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        error,
        xp,
        recentExercises,
        progress,
        activities,
        isReady,
        updateXp: (newXp) => setXp(newXp),
        markActivity: (date, status) =>
          setActivities((prev) => ({ ...prev, [date]: status })),
        refetchUserData: fetchUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);