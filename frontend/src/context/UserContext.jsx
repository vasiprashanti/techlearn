import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL;

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const {
    user: authUser,
    token: authToken,
    isAuthenticated,
    logout: authLogout,
  } = useAuth();

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

  const normalizeUser = (rawUser) => {
    if (!rawUser || typeof rawUser !== 'object') return null;

    const firstName = rawUser.firstName || rawUser.name?.split(' ')[0] || 'User';
    const lastName = rawUser.lastName || rawUser.name?.split(' ').slice(1).join(' ') || '';

    return {
      ...rawUser,
      firstName,
      lastName,
      email: rawUser.email || '',
    };
  };

  // Load user data from localStorage and validate structure
  const loadUserFromStorage = () => {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return false;

    try {
      const localUser = JSON.parse(userDataStr);
      const normalized = normalizeUser(localUser);
      if (!normalized) return false;

      setUser(normalized);
      return true;
    } catch (e) {
      console.error('Failed to parse userData:', e);
      return false;
    }
  };

  // Calculate total XP from courseXP object
  const calculateTotalXP = (courseXP) => {
    if (!courseXP || typeof courseXP !== 'object') return 0;
    
    return Object.values(courseXP).reduce((total, xpValue) => {
      return total + (typeof xpValue === 'number' ? xpValue : 0);
    }, 0);
  };

  // Fetch user + dashboard data from API
  const fetchUserData = async (overrideToken) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = overrideToken || localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const { data } = await axios.get(`${BASE_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update user data if API returns it
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('userData', JSON.stringify(data.user));
      }

      // Calculate total XP from courseXP field
      const totalXP = calculateTotalXP(data.courseXP);
      setXp(totalXP);

      // Set recent exercises from completedExercises
      const exercises = Array.isArray(data.completedExercises) ? data.completedExercises : [];
      setRecentExercises(exercises);

      // Set calendar activities
      setActivities(data.calendarActivity || {});

      // Update progress with correct field mappings
      setProgress({
        courseProgress: data.totalCourseProgress?.progressPercent || 0,
        goalsProgress: 40, // Placeholder
        totalExercises: data.exerciseProgress?.totalExercises || 0,
        completedExercises: data.exerciseProgress?.completedExercises || 0,
        exerciseProgressPercent: data.exerciseProgress?.progressPercent || 0
      });

    } catch (err) {
      const status = err?.response?.status;
      const apiMessage =
        err?.response?.data?.message || err?.response?.data?.error;

      // If the token is missing/expired/invalid, clear session and treat as guest.
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');

        if (typeof authLogout === 'function') {
          authLogout();
        } else {
          setUser({ firstName: 'Guest', lastName: '', email: '' });
        }

        setError(null);
        return;
      }

      setError(apiMessage || err.message);
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize user data
  useEffect(() => {
    const initializeUser = async () => {
      const hasLocalUser = loadUserFromStorage();
      const existingToken = localStorage.getItem('token');

      if (existingToken) {
        await fetchUserData(existingToken); // Sync with backend
      } else {
        if (!hasLocalUser) {
          setUser({ firstName: 'Guest', lastName: '', email: '' });
        }
        // Important: if we don't fetch, we must stop the loading state.
        setIsLoading(false);
      }
      setIsReady(true);
    };

    initializeUser();
  }, []);

  // When auth state changes (e.g. user logs in from a modal while already on /dashboard),
  // sync the UserContext immediately so the dashboard doesn't stay stuck in a loading state.
  useEffect(() => {
    if (!isAuthenticated || !authToken) return;

    const normalized = normalizeUser(authUser);
    if (normalized) {
      setUser(normalized);
      localStorage.setItem('userData', JSON.stringify(normalized));
    } else {
      // Fallback if AuthContext hasn't populated user yet
      loadUserFromStorage();
    }

    fetchUserData(authToken);
  }, [isAuthenticated, authToken, authUser]);

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