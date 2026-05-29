import { createContext, useContext, useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL;
const DASHBOARD_CACHE_KEY = 'techlearn-dashboard-cache-v1';
const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000;

const UserContext = createContext();

const readCachedDashboard = () => {
  try {
    const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || !parsed?.data) return null;
    if (Date.now() - parsed.timestamp > DASHBOARD_CACHE_TTL_MS) return null;

    return parsed.data;
  } catch {
    return null;
  }
};

const writeCachedDashboard = (data) => {
  try {
    localStorage.setItem(
      DASHBOARD_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Cache is a performance hint only.
  }
};

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
  const [latestDailyChallenge, setLatestDailyChallenge] = useState(null);

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

  // Calculate total XP from courseXP object
  const calculateTotalXP = (courseXP) => {
    if (!courseXP || typeof courseXP !== 'object') return 0;
    
    return Object.values(courseXP).reduce((total, xpValue) => {
      return total + (typeof xpValue === 'number' ? xpValue : 0);
    }, 0);
  };

  const applyDashboardData = (data) => {
    if (!data) return;

    // Update user data if API returns it
    if (data.user) {
      const storedUserData = localStorage.getItem('userData');
      let currentRole = 'student';
      try {
        if (storedUserData) {
          const parsed = JSON.parse(storedUserData);
          currentRole = parsed.role || 'student';
        }
      } catch (e) {
        console.error(e);
      }

      const updatedUser = {
        ...data.user,
        role: data.user.role || currentRole,
      };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
    }

    const totalXP = calculateTotalXP(data.courseXP);
    setXp(totalXP);

    const exercises = Array.isArray(data.completedExercises) ? data.completedExercises : [];
    setRecentExercises(exercises);

    setActivities(data.calendarActivity || {});

    setProgress({
      courseProgress: data.totalCourseProgress?.progressPercent || 0,
      goalsProgress: 40, // Placeholder
      totalExercises: data.exerciseProgress?.totalExercises || 0,
      completedExercises: data.exerciseProgress?.completedExercises || 0,
      exerciseProgressPercent: data.exerciseProgress?.progressPercent || 0
    });
    setLatestDailyChallenge(data.latestDailyChallenge || null);
  };

  // Fetch user + dashboard data from API
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${BASE_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({ message: 'Network error' }));

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      writeCachedDashboard(data);
      applyDashboardData(data);

    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize user data
  useEffect(() => {
    const initializeUser = async () => {
      const hasToken = Boolean(localStorage.getItem('token'));
      const hasLocalUser = loadUserFromStorage();

      if (hasLocalUser) {
        const cachedDashboard = readCachedDashboard();
        if (cachedDashboard) {
          applyDashboardData(cachedDashboard);
        }
        setIsLoading(false);
      }

      if (!hasToken && !hasLocalUser) {
        setUser({ firstName: 'Guest', lastName: '', email: '' });
        setIsLoading(false);
      }

      setIsReady(true);

      if (hasToken) {
        fetchUserData(); // Sync in the background after the shell becomes ready
      }
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
        latestDailyChallenge,
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
