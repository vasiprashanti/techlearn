/**
 * Navigates users based on role, enrollment status, and onboarding flow.
 *
 * Flow: Signup -> onboarding answers -> Program assignment -> /onboarding/programs -> Start -> /dashboard
 * 
 * @param {Object} user - The authenticated user object
 * @param {Function} navigate - The react-router-dom navigate function
 * @param {Object} options - Navigation options (e.g., isNewSignup: true)
 */
export const navigateUserByProgram = (user, navigate, options = {}) => {
  if (!user) {
    navigate('/');
    return;
  }

  if (user.role === 'admin') {
    navigate('/admin');
    return;
  }

  // Explicit new signup or missing primary programId -> /onboarding/programs
  if (options.isNewSignup || !user.programId) {
    navigate('/onboarding/programs');
    return;
  }

  // Active program already selected -> /dashboard
  navigate('/dashboard');
};
