/**
 * Navigates users to their respective dashboards based on their role and programSelection.
 * Keeps placeholders/comments for Placement, Project, and General users.
 * 
 * @param {Object} user - The authenticated user object
 * @param {Function} navigate - The react-router-dom navigate function
 */
export const navigateUserByProgram = (user, navigate) => {
  if (!user) {
    navigate('/');
    return;
  }

  if (user.role === 'admin') {
    navigate('/admin');
    return;
  }

  const program = user.programSelection;

  // Keep routing placeholders for:
  // 1. Placement Users
  // 2. Project Users
  // 3. General Users (implementation later)
  if (program === 'Placement Sprint') {
    // [PLACEHOLDER] Routing for Placement Users
    console.log("Routing Placement Sprint user to /dashboard");
    navigate('/dashboard');
  } else if (program === 'Full Stack Project Program') {
    // [PLACEHOLDER] Routing for Project Users
    console.log("Routing Project Program user to /dashboard");
    navigate('/dashboard');
  } else if (program === 'Both') {
    // [PLACEHOLDER] Routing for users enrolled in both programs
    console.log("Routing Both programs user to /dashboard");
    navigate('/dashboard');
  } else {
    // [PLACEHOLDER] Routing for General Users (implementation later)
    console.log("Routing General user (no program / other program) to /dashboard");
    navigate('/dashboard');
  }
};
