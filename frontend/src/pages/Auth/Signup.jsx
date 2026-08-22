import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { register } from '../../api/authService';
import { navigateUserByProgram } from '../../utils/navigation';
import { programLearningAPI } from '../../services/programLearningApi';
import { auth } from '../../config/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  signInWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';

export default function Signup({ onClose, onSwitchToLogin, onSwitchToSignup, initialMode = 'signup' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const { refetchUserData } = useUser();

  const [screen, setScreen] = useState('auth');
  const [isLoginMode, setIsLoginMode] = useState(initialMode === 'login');
  const [activeStep, setActiveStep] = useState(1);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [isEnrolledShortOnboarding, setIsEnrolledShortOnboarding] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    setIsLoginMode(initialMode === 'login');
  }, [initialMode]);

  // Auth fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  // Onboarding Step 1: Education
  const [college, setCollege] = useState('');
  const [collegeOther, setCollegeOther] = useState('');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [graduationYear, setGraduationYear] = useState('');

  // Onboarding Step 2: Goal
  const [goal, setGoal] = useState('');

  // Onboarding Step 3: Conditional Questions
  const [skills, setSkills] = useState([]);
  const [targetRole, setTargetRole] = useState('');
  const [targetRoleOther, setTargetRoleOther] = useState('');
  const [placementCategory, setPlacementCategory] = useState('');
  const [targetCompanies, setTargetCompanies] = useState([]);
  const [placementTimeline, setPlacementTimeline] = useState('');

  // Onboarding Step 4: Recommendation
  const [learningPath, setLearningPath] = useState('');

  // Welcome screen typewriter state
  const [welcomeFirstName, setWelcomeFirstName] = useState('');
  const [typewriterText, setTypewriterText] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);

  // Live password validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const getFirstName = (rawName, rawEmail) => {
    if (rawName && rawName.trim().length > 0) {
      return rawName.trim().split(' ')[0];
    }
    if (rawEmail && rawEmail.includes('@')) {
      const namePart = rawEmail.split('@')[0];
      const cleanName = namePart.split('.')[0].split('_')[0].split('-')[0];
      return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    }
    return 'Techlete';
  };

  const getApiBase = () => {
    const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const cleanBase = rawBase.replace(/\/+$/, '');
    return cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;
  };

  const buildOnboardingPayload = (complete = false) => ({
    collegeName: college === 'Other' ? collegeOther : college,
    degree,
    branch,
    graduationYear,
    learningGoal: goal,
    skills,
    targetRole: targetRole === 'Other' ? targetRoleOther : targetRole,
    targetRoleOther,
    placementCategory,
    targetCompanies,
    placementTimeline,
    learningPath,
    completeOnboarding: complete,
  });

  const saveDraftToServer = async (payload = buildOnboardingPayload(false)) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`${getApiBase()}/users/onboarding/draft`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      // Local draft persistence remains available when the API is temporarily
      // unavailable; the next step or login will retry the server save.
      console.warn('Unable to persist onboarding draft:', error);
    }
  };

  useEffect(() => {
    let savedDraft = null;
    try {
      savedDraft = JSON.parse(localStorage.getItem('techlearn-onboarding-draft') || 'null');
    } catch {
      savedDraft = null;
    }

    if (savedDraft && typeof savedDraft === 'object') {
      if (savedDraft.collegeName) setCollege(savedDraft.collegeName);
      if (savedDraft.collegeOther) setCollegeOther(savedDraft.collegeOther);
      if (savedDraft.degree) setDegree(savedDraft.degree);
      if (savedDraft.branch) setBranch(savedDraft.branch);
      if (savedDraft.graduationYear) setGraduationYear(savedDraft.graduationYear);
      if (savedDraft.learningGoal) setGoal(savedDraft.learningGoal);
      if (Array.isArray(savedDraft.skills)) setSkills(savedDraft.skills);
      if (savedDraft.targetRole) setTargetRole(savedDraft.targetRole);
      if (savedDraft.targetRoleOther) setTargetRoleOther(savedDraft.targetRoleOther);
      if (savedDraft.placementCategory) setPlacementCategory(savedDraft.placementCategory);
      if (Array.isArray(savedDraft.targetCompanies)) setTargetCompanies(savedDraft.targetCompanies);
      if (savedDraft.placementTimeline) setPlacementTimeline(savedDraft.placementTimeline);
      if (savedDraft.learningPath) setLearningPath(savedDraft.learningPath);
    }

    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem('userData') || 'null');
    } catch {
      storedUser = null;
    }

    if (location.state?.resumeOnboarding && localStorage.getItem('token') && storedUser?.onboardingCompleted === false) {
      const fname = getFirstName(storedUser.firstName || storedUser.name, storedUser.email);
      setFullName(storedUser.name || [storedUser.firstName, storedUser.lastName].filter(Boolean).join(' '));
      setEmail(storedUser.email || '');
      setIsGoogleAuth(['google', 'firebase'].includes(storedUser.authProvider));
      triggerWelcomeScreen(fname);
    }

    setDraftLoaded(true);
  }, [location.state?.resumeOnboarding]);

  useEffect(() => {
    if (!draftLoaded || ['auth', 'verify-email', 'complete'].includes(screen)) return undefined;

    const draft = {
      ...buildOnboardingPayload(false),
      collegeOther,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('techlearn-onboarding-draft', JSON.stringify(draft));
    } catch {
      // Browser storage is a convenience; server persistence is authoritative.
    }

    const timeoutId = window.setTimeout(() => saveDraftToServer(draft), 350);
    return () => window.clearTimeout(timeoutId);
  }, [draftLoaded, screen, college, collegeOther, degree, branch, graduationYear, goal, skills, targetRole, targetRoleOther, placementCategory, targetCompanies, placementTimeline, learningPath]);

  const handleClose = () => {
    if (onClose) onClose();
    else navigate('/');
  };

  const handlePendingAssessmentIfPresent = async () => {
    const pendingRaw = sessionStorage.getItem('pending_assessment');
    if (pendingRaw) {
      try {
        const pending = JSON.parse(pendingRaw);
        sessionStorage.removeItem('pending_assessment');
        setLoading(true);
        const response = await programLearningAPI.startFreeAssessment(pending);
        if (response?.success && response?.programId) {
          handleClose();
          navigate(`/free-assessment/${response.programId}`);
          return true;
        }
      } catch (e) {
        console.error('Failed to start pending assessment:', e);
      } finally {
        setLoading(false);
      }
    }
    return false;
  };

  const toggleAuthMode = () => {
    setIsLoginMode(prev => !prev);
    setEmail('');
    setPassword('');
    setFullName('');
    setStatusMsg({ text: '', type: '' });
  };

  // Google Auth Handler (Seamless & Robust Flow)
  const handleGoogleAuth = async () => {
    setStatusMsg({ text: '', type: '' });
    setLoading(true);
    setIsGoogleAuth(true);

    if (auth) {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const fname = getFirstName(user.displayName, user.email);
        const userEmail = user.email || '';
        const userName = user.displayName || fname;

        setEmail(userEmail);
        setFullName(userName);

        let authPayload = null;
        const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const cleanBase = rawBase.replace(/\/+$/, '');
        const apiBase = cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;

        try {
          const idToken = await user.getIdToken();

          // Stage 1: Try /auth/firebase
          try {
            const resFirebase = await fetch(`${apiBase}/auth/firebase`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken, email: userEmail })
            });
            if (resFirebase.ok) {
              const resData = await resFirebase.json();
              if (resData?.token && resData?.user) {
                authPayload = resData;
              }
            }
          } catch (e) {
            console.warn('Firebase endpoint note:', e);
          }

          // Stage 2: Fallback to /auth/google-check if stage 1 did not return payload
          if (!authPayload) {
            try {
              const resCheck = await fetch(`${apiBase}/auth/google-check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: idToken, email: userEmail })
              });
              if (resCheck.ok) {
                const checkData = await resCheck.json();
                if (checkData?.token && checkData?.user) {
                  authPayload = checkData;
                }
              }
            } catch (e) {
              console.warn('Google check note:', e);
            }
          }

          // Stage 3: Fallback to /auth/google if stage 1 & 2 did not return payload
          if (!authPayload) {
            try {
              const resGoogle = await fetch(`${apiBase}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: idToken, email: userEmail })
              });
              if (resGoogle.ok) {
                const gData = await resGoogle.json();
                if (gData?.token && gData?.user) {
                  authPayload = gData;
                }
              }
            } catch (e) {
              console.warn('Google route note:', e);
            }
          }

          // Handle returned authentication payload
          if (authPayload && authPayload.user && authPayload.token) {
            localStorage.setItem('token', authPayload.token);
            localStorage.setItem('userData', JSON.stringify(authPayload.user));
            if (setSession) setSession(authPayload.user, authPayload.token);
            if (refetchUserData) await refetchUserData();

            if (await handlePendingAssessmentIfPresent()) {
              return;
            }

            if (authPayload.user?.onboardingCompleted) {
              setLoading(false);
              handleClose();
              navigateUserByProgram(authPayload.user, navigate);
              return;
            } else {
              // Pre-fill existing imported student or user information
              if (authPayload.user?.collegeName) setCollege(authPayload.user.collegeName);
              if (authPayload.user?.degree) setDegree(authPayload.user.degree);
              if (authPayload.user?.branch) setBranch(authPayload.user.branch);
              if (authPayload.user?.graduationYear) setGraduationYear(authPayload.user.graduationYear);
              if (authPayload.user?.learningGoal) setGoal(authPayload.user.learningGoal);
              if (authPayload.user?.targetRole) setTargetRole(authPayload.user.targetRole);
              if (authPayload.user?.otherTargetRole) setTargetRoleOther(authPayload.user.otherTargetRole);
              if (authPayload.user?.placementCategory) setPlacementCategory(authPayload.user.placementCategory);
              if (authPayload.user?.targetCompanies?.length) setTargetCompanies(authPayload.user.targetCompanies);
              if (authPayload.user?.placementTimeline) setPlacementTimeline(authPayload.user.placementTimeline);
              if (authPayload.user?.skills?.length) setSkills(authPayload.user.skills);

              setLoading(false);
              triggerWelcomeScreen(fname);
              return;
            }
          }
        } catch (e) {
          console.warn('Google login verification note:', e);
        }

        // Truly new user -> Direct to welcome text card
        setLoading(false);
        triggerWelcomeScreen(fname);
      } catch (err) {
        console.error('Google Sign In Error:', err);
        if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
          setStatusMsg({ text: 'Google sign-in popup closed.', type: 'info' });
        } else {
          setStatusMsg({ text: err.message || 'Google Auth Failed', type: 'error' });
        }
      } finally {
        setLoading(false);
      }
    } else {
      const fallbackName = fullName.trim() || 'Peter Parker';
      const fallbackEmail = email.trim() || 'peter.parker@gmail.com';
      setFullName(fallbackName);
      setEmail(fallbackEmail);
      const fname = getFirstName(fallbackName, fallbackEmail);
      triggerWelcomeScreen(fname);
      setLoading(false);
    }
  };

  // Normal Email/Password Submit Handler
  const handleEmailAuth = async () => {
    setStatusMsg({ text: '', type: '' });
    if (!email || !password || (!isLoginMode && !fullName)) {
      setStatusMsg({ text: 'Please complete all required fields.', type: 'error' });
      return;
    }

    // Front-end email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setStatusMsg({ text: 'Please enter a valid email address.', type: 'error' });
      return;
    }

    // Front-end password validation on signup (strictly enforcing all 4 criteria)
    if (!isLoginMode) {
      if (!hasMinLength || !hasUppercase || !hasNumber || !hasSpecialChar) {
        setStatusMsg({
          text: 'Password must meet all 4 requirements: at least 8 characters, an uppercase letter, a number, and a special character.',
          type: 'error'
        });
        return;
      }
    }


    setIsGoogleAuth(false);
    setLoading(true);


    if (isLoginMode) {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const endpoint = baseUrl.endsWith('/api') ? `${baseUrl}/auth/login` : `${baseUrl.replace(/\/+$/, '')}/api/auth/login`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok && data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('userData', JSON.stringify(data.user));
          if (setSession) setSession(data.user, data.token);
          if (refetchUserData) refetchUserData();

          if (await handlePendingAssessmentIfPresent()) {
            return;
          }

          // Check persistent onboardingCompleted state
          if (data.user?.onboardingCompleted) {
            handleClose();
            navigateUserByProgram(data.user, navigate);
            return;
          } else {
            // Pre-fill existing user/imported student details into onboarding UI state
            if (data.user?.collegeName) setCollege(data.user.collegeName);
            if (data.user?.degree) setDegree(data.user.degree);
            if (data.user?.branch) setBranch(data.user.branch);
            if (data.user?.graduationYear) setGraduationYear(data.user.graduationYear);
            if (data.user?.learningGoal) setGoal(data.user.learningGoal);
            if (data.user?.targetRole) setTargetRole(data.user.targetRole);
            if (data.user?.otherTargetRole) setTargetRoleOther(data.user.otherTargetRole);
            if (data.user?.placementCategory) setPlacementCategory(data.user.placementCategory);
            if (data.user?.targetCompanies?.length) setTargetCompanies(data.user.targetCompanies);
            if (data.user?.placementTimeline) setPlacementTimeline(data.user.placementTimeline);
            if (data.user?.skills?.length) setSkills(data.user.skills);

            const fname = getFirstName(data.user?.firstName || fullName, data.user?.email || email);
            triggerWelcomeScreen(fname);
            return;
          }
        } else {
          setStatusMsg({ text: data.message || 'Invalid email or password.', type: 'error' });
        }
      } catch (err) {
        console.error('Login error:', err);
        setStatusMsg({ text: 'Network error or unable to reach server. Please try again.', type: 'error' });
      } finally {
        setLoading(false);
      }
    } else {
      // Normal Create Account -> Send verification email & show verify page
      try {
        if (auth) {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          await updateProfile(user, { displayName: fullName });
          await sendEmailVerification(user);
        }
      } catch (err) {
        console.warn('Firebase user registration note:', err.message);
        // If account already exists in Firebase, sign in to send verification email
        if (err.code === 'auth/email-already-in-use' && auth) {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.emailVerified) {
              await sendEmailVerification(userCredential.user);
            }
          } catch (signInErr) {
            console.warn('Firebase sign-in resend note:', signInErr.message);
          }
        } else if (err.code === 'auth/weak-password' || err.code === 'auth/invalid-email') {
          setLoading(false);
          setStatusMsg({ text: err.message || 'Invalid details provided.', type: 'error' });
          return;
        }
      }

      setLoading(false);
      setStatusMsg({ text: '', type: '' });
      setScreen('verify-email');
    }
  };

  const ensureDraftAccount = async () => {
    if (localStorage.getItem('token')) return true;

    const draftPassword = isGoogleAuth ? 'GoogleAuthNoPassword123!' : password;
    const response = await register({
      fullName,
      email,
      password: draftPassword,
      confirmPassword: draftPassword,
      isGoogleUser: isGoogleAuth,
      authProvider: isGoogleAuth ? 'google' : 'email',
      ...buildOnboardingPayload(false),
    });

    if (!response?.data?.token) {
      throw new Error(response?.data?.message || 'Unable to save your account before onboarding.');
    }

    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userData', JSON.stringify(response.data.user));
    if (setSession) setSession(response.data.user, response.data.token);
    return true;
  };

  // Email Verification Handlers
  const handleCheckVerification = async () => {
    setStatusMsg({ text: '', type: '' });
    setVerifying(true);
    try {
      if (auth && auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          if (await handlePendingAssessmentIfPresent()) {
            return;
          }
          await ensureDraftAccount();
          const fname = getFirstName(fullName || auth.currentUser.displayName, email || auth.currentUser.email);
          triggerWelcomeScreen(fname);
          return;
        } else {
          setStatusMsg({ text: 'Email not verified yet. Please check your inbox and click the verification link.', type: 'error' });
        }
      } else {
        await ensureDraftAccount();
        const fname = getFirstName(fullName, email);
        triggerWelcomeScreen(fname);
      }
    } catch (err) {
      setStatusMsg({ text: err.message || 'Error checking verification status.', type: 'error' });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    setStatusMsg({ text: '', type: '' });
    setResending(true);
    try {
      if (auth && auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setStatusMsg({ text: `Verification link resent to ${email || auth.currentUser.email}.`, type: 'info' });
      } else {
        setStatusMsg({ text: `Verification link resent to ${email}.`, type: 'info' });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || 'Error resending verification email.', type: 'error' });
    } finally {
      setResending(false);
    }
  };

  // Welcome Retro Typewriter Screen
  const triggerWelcomeScreen = (fname) => {
    setStatusMsg({ text: '', type: '' });
    setWelcomeFirstName(fname);
    setScreen('welcome');
    setTypewriterText('');
    setIsTypingDone(false);

    const fullText = `Most students spend months wondering where to start.\n\nWe'd rather spend the next few minutes making sure you never have to.\n\nAnswer a few quick questions, and we'll build a learning experience tailored just for you.\n\nReady?\n\nYou're officially a Techlete from today.\n\n— Team TechLearn`;

    let index = 0;
    const speed = 12;
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setTypewriterText(fullText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsTypingDone(true);
      }
    }, speed);
  };

  const startOnboardingFromWelcome = () => {
    setActiveStep(1);
    setScreen('step-education');
  };

  const updateOnboardingStep = (stepNum) => {
    setActiveStep(stepNum);
    if (stepNum === 1) setScreen('step-education');
    else if (stepNum === 2) setScreen('step-goals');
    else if (stepNum === 3) setScreen('step-followup');
    else if (stepNum === 4) setScreen('step-recommendation');
  };

  const navigateOnboarding = (direction) => {
    setStatusMsg({ text: '', type: '' });
    if (activeStep === 1 && direction === -1) {
      setScreen('welcome');
      return;
    }

    if (activeStep === 2 && direction === 1 && goal === 'Exploring TechLearn') {
      updateOnboardingStep(4);
      return;
    }

    if (activeStep === 3 && direction === 1 && goal === 'Exploring TechLearn') {
      updateOnboardingStep(4);
      return;
    }

    if (activeStep === 4 && direction === -1 && goal === 'Exploring TechLearn') {
      updateOnboardingStep(2);
      return;
    }

    updateOnboardingStep(activeStep + direction);
  };

  // Step 1 Save
  const saveEducationAndNext = () => {
    if (!college || (college === 'Other' && !collegeOther.trim()) || !degree || !branch || !graduationYear) {
      setStatusMsg({ text: 'Please select all education details.', type: 'error' });
      return;
    }
    setStatusMsg({ text: '', type: '' });
    navigateOnboarding(1);
  };

  // Step 2 Select Goal
  const selectMission = (selectedGoal) => {
    setGoal(selectedGoal);
    setStatusMsg({ text: '', type: '' });
    if (selectedGoal === 'Exploring TechLearn') {
      updateOnboardingStep(4);
    } else {
      updateOnboardingStep(3);
    }
  };

  // Step 3 Save Follow Up
  const saveFollowUpAndNext = () => {
    if (goal === 'Learn New Skills') {
      if (skills.length === 0) {
        setStatusMsg({ text: 'Please select at least one skill.', type: 'error' });
        return;
      }
    } else if (goal === 'Get Placed') {
      if (!targetRole) {
        setStatusMsg({ text: 'Please select a target role.', type: 'error' });
        return;
      }
      if (!placementCategory) {
        setStatusMsg({ text: 'Please select target company category.', type: 'error' });
        return;
      }
      if (!placementTimeline) {
        setStatusMsg({ text: 'Please select placement timeline.', type: 'error' });
        return;
      }
    }
    setStatusMsg({ text: '', type: '' });

    if (isEnrolledShortOnboarding) {
      setLoading(true);
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const endpoint = baseUrl.endsWith('/api') ? `${baseUrl}/users/preferences` : `${baseUrl.replace(/\/+$/, '')}/api/users/preferences`;
      fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetRole: targetRole === 'Other' ? targetRoleOther : targetRole,
          placementCategory,
          targetCompanies,
          placementTimeline
        })
      }).finally(() => {
        setLoading(false);
        handleClose();
        navigate('/dashboard');
      });
      return;
    }

    navigateOnboarding(1);
  };

  // Step 4 Complete Setup
  const completeOnboarding = async (pathChoice) => {
    const selectedPath = pathChoice || learningPath;
    if (!selectedPath) {
      setStatusMsg({ text: 'Please choose a learning path (Free or Member).', type: 'error' });
      return;
    }

    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      // Email verification and Google sign-in create only a draft account.
      // Complete the profile through the preferences endpoint so onboarding
      // becomes the single source of truth and no default batch is assigned.
      if (!localStorage.getItem('token') && !(await ensureDraftAccount())) {
        throw new Error('Your account could not be created. Please try again.');
      }

      const payload = {
        ...buildOnboardingPayload(true),
        learningPath: selectedPath,
      };
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiBase()}/users/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Unable to complete onboarding.');
      }

      const canonicalUser = data.user || data.profile || {};
      localStorage.setItem('userData', JSON.stringify(canonicalUser));
      if (setSession) setSession(canonicalUser, token);
      if (refetchUserData) await refetchUserData();
      localStorage.removeItem('techlearn-onboarding-draft');

      if (await handlePendingAssessmentIfPresent()) {
        return;
      }

      setLoading(false);
      setScreen('complete');
      setTimeout(async () => {
        const continuation = location.state || {};
        handleClose();
        if (selectedPath === 'Free' && continuation.freeProgramId) {
          try {
            const enrollResponse = await fetch(`${getApiBase()}/programs/${continuation.freeProgramId}/free-enroll`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            const enrollData = await enrollResponse.json().catch(() => ({}));
            if (!enrollResponse.ok) throw new Error(enrollData.message || 'Unable to start this program.');
            navigate(`/learn/program/${continuation.freeProgramId}`);
          } catch (error) {
            console.error('Program continuation after onboarding failed:', error);
            navigate('/learn');
          }
          return;
        }
        if (continuation.waitlistProgramId) {
          try {
            const waitlistResponse = await fetch(`${getApiBase()}/programs/${continuation.waitlistProgramId}/waitlist`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!waitlistResponse.ok) {
              const waitlistData = await waitlistResponse.json().catch(() => ({}));
              throw new Error(waitlistData.message || 'Unable to join the waitlist.');
            }
          } catch (error) {
            console.error('Waitlist continuation after onboarding failed:', error);
          }
          navigate('/learn');
          return;
        }
        if (selectedPath === 'Member') {
          navigate('/onboarding/programs', {
            state: {
              targetRole: payload.targetRole,
              skills: payload.skills,
              learningGoal: payload.learningGoal,
            }
          });
        } else {
          navigate('/dashboard');
        }
      }, 1800);
    } catch (e) {
      console.error('Onboarding completion error:', e);
      const errMsg = e.response?.data?.message || e.message || 'Unable to complete onboarding. Please check your information and try again.';
      setStatusMsg({ text: errMsg, type: 'error' });
      setLoading(false);
    }
  };

  const progressPercent = { 1: 25, 2: 50, 3: 75, 4: 100 }[activeStep] || 0;
  const isWideScreen = ['step-followup', 'step-recommendation'].includes(screen);

  return (
    <div style={styles.overlay}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Poppins:wght@400;500;600;700&family=Press+Start+2P&display=swap');

        .su-root * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .su-card {
          background: #ffffff !important;
          width: 100% !important;
          max-width: 500px !important;
          max-height: calc(100vh - 32px) !important;
          border-radius: 24px !important;
          padding: 24px !important;
          box-shadow: 0 12px 32px rgba(0,0,0,0.25) !important;
          display: flex !important;
          flex-direction: column !important;
          position: relative !important;
          transition: max-width 0.3s ease !important;
          overflow: hidden !important;
          color: #111111 !important;
        }

        .su-card.wide {
          max-width: 580px !important;
        }

        .su-top-bar {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          margin-bottom: 16px !important;
          flex-shrink: 0 !important;
          width: 100% !important;
        }

        .su-progress-track {
          flex: 1 !important;
          height: 6px !important;
          background-color: #f2f2f7 !important;
          border-radius: 3px !important;
          overflow: hidden !important;
        }

        .su-progress-bar {
          height: 100% !important;
          background-color: #a3e635 !important;
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .su-close-btn {
          background: transparent !important;
          border: none !important;
          font-size: 22px !important;
          color: #8e8e93 !important;
          cursor: pointer !important;
          line-height: 1 !important;
          margin-left: auto !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0 4px !important;
        }

        .su-close-btn:hover {
          color: #1c1c1e !important;
        }

        .su-h2 {
          font-family: 'Press Start 2P', cursive !important;
          font-size: 14px !important;
          font-weight: 400 !important;
          line-height: 1.4 !important;
          margin-bottom: 6px !important;
          color: #000000 !important;
          text-align: center !important;
          letter-spacing: 1px !important;
        }

        .su-description {
          font-size: 12px !important;
          font-weight: 400 !important;
          color: #666666 !important;
          line-height: 1.4 !important;
          margin-bottom: 14px !important;
          text-align: center !important;
          letter-spacing: 1px !important;
        }

        .su-form-group {
          margin-bottom: 12px !important;
          position: relative !important;
        }

        .su-label {
          display: block !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          margin-bottom: 4px !important;
          color: #333333 !important;
          padding-left: 2px !important;
        }

        .su-input,
        .su-select {
          width: 100% !important;
          height: 44px !important;
          padding: 0 14px !important;
          border-radius: 12px !important;
          border: 1px solid #e5e5ea !important;
          font-size: 14px !important;
          outline: none !important;
          background-color: #ffffff !important;
          color: #1c1c1e !important;
          appearance: none !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }

        .su-select {
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%3a8e8e93' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
          background-repeat: no-repeat !important;
          background-position: right 12px center !important;
          background-size: 14px !important;
        }

        .su-input::placeholder {
          color: #a7a7a7 !important;
        }

        .su-input:focus, .su-select:focus {
          border-color: #1c1c1e !important;
          box-shadow: 0 0 0 3px rgba(28, 28, 30, 0.08) !important;
        }

        .su-password-wrapper {
          position: relative !important;
        }

        .su-toggle-password {
          position: absolute !important;
          right: 12px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          cursor: pointer !important;
          color: #8e8e93 !important;
          display: flex !important;
          align-items: center !important;
        }

        .su-password-requirements {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 6px !important;
          margin-top: 8px !important;
          overflow: hidden !important;
        }

        .su-req-item {
          font-size: 10px !important;
          color: #8e8e93 !important;
          display: flex !important;
          align-items: center !important;
          gap: 4px !important;
        }

        .su-req-bullet {
          font-size: 11px !important;
          color: #a3e635 !important;
          font-weight: bold !important;
        }

        .su-btn-primary {
          width: 100% !important;
          height: 44px !important;
          border-radius: 12px !important;
          border: none !important;
          background-color: #a3e635 !important;
          color: #000000 !important;
          font-family: 'Press Start 2P', cursive !important;
          font-size: 10px !important;
          font-weight: 400 !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-transform: uppercase !important;
          transition: opacity 0.2s, transform 0.1s !important;
        }

        .su-btn-primary:hover {
          opacity: 0.95 !important;
        }

        .su-btn-row {
          display: flex !important;
          gap: 10px !important;
          width: 100% !important;
          margin-top: auto !important;
          padding-top: 8px !important;
        }

        .su-btn-row .su-btn-primary,
        .su-btn-row .su-btn-secondary {
          flex: 1 1 0% !important;
          width: 50% !important;
        }

        .su-btn-secondary {
          height: 44px !important;
          border-radius: 12px !important;
          border: none !important;
          background-color: #f2f2f7 !important;
          color: #1c1c1e !important;
          font-family: 'Press Start 2P', cursive !important;
          font-size: 10px !important;
          font-weight: 400 !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-transform: uppercase !important;
          transition: opacity 0.2s, transform 0.1s !important;
        }

        .su-btn-secondary-full {
          width: 100% !important;
          height: 44px !important;
          border-radius: 12px !important;
          border: none !important;
          background-color: #f2f2f7 !important;
          color: #1c1c1e !important;
          font-family: 'Press Start 2P', cursive !important;
          font-size: 10px !important;
          font-weight: 400 !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-transform: uppercase !important;
          transition: opacity 0.2s, transform 0.1s !important;
        }

        .su-btn-secondary-full:hover {
          opacity: 0.9 !important;
        }

        .su-btn-google {
          width: 100% !important;
          height: 44px !important;
          border-radius: 12px !important;
          border: 1.5px solid #e5e5ea !important;
          background: #ffffff !important;
          color: #1c1c1e !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 10px !important;
          cursor: pointer !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          transition: background-color 0.2s, border-color 0.2s !important;
        }

        .su-btn-google:hover {
          background-color: #f8f9fa !important;
          border-color: #1c1c1e !important;
        }

        .su-divider {
          display: flex !important;
          align-items: center !important;
          margin: 14px 0 !important;
        }

        .su-divider::before,
        .su-divider::after {
          content: "" !important;
          flex: 1 !important;
          height: 1px !important;
          background: #eee !important;
        }

        .su-divider span {
          margin: 0 10px !important;
          color: #8e8e93 !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
        }

        .su-toggle-auth {
          text-align: center !important;
          margin-top: 12px !important;
          font-size: 11px !important;
          color: #666666 !important;
        }

        .su-link-btn {
          color: #000000 !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          text-decoration: underline !important;
        }

        .su-select-card {
          padding: 14px !important;
          border-radius: 14px !important;
          border: 1.5px solid #e5e5ea !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          background: #ffffff !important;
          margin-bottom: 10px !important;
        }

        .su-select-card:hover {
          border-color: #1c1c1e !important;
          transform: translateY(-1px) !important;
        }

        .su-select-card.selected {
          border-color: #a3e635 !important;
          background-color: #f7fee7 !important;
          box-shadow: 0 0 0 1px #a3e635 !important;
        }

        .su-select-card h4 {
          font-size: 13px !important;
          font-weight: 600 !important;
          color: #1c1c1e !important;
          margin-bottom: 2px !important;
        }

        .su-select-card p {
          font-size: 11px !important;
          color: #666666 !important;
          line-height: 1.3 !important;
          font-weight: 400 !important;
        }

        .su-chip {
          padding: 6px 12px !important;
          border-radius: 12px !important;
          border: 1px solid #e5e5ea !important;
          font-size: 11px !important;
          font-weight: 400 !important;
          cursor: pointer !important;
          background: #ffffff !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 4px !important;
          user-select: none !important;
        }

        .su-chip.selected {
          background-color: #a3e635 !important;
          border-color: #a3e635 !important;
          color: #000000 !important;
          font-weight: 600 !important;
        }

        .su-followup-card {
          background: #f8f9fa !important;
          border: 1px solid #e9ecef !important;
          border-radius: 14px !important;
          padding: 12px 14px !important;
          margin-bottom: 10px !important;
        }

        .su-followup-card h3 {
          font-size: 11px !important;
          font-weight: 600 !important;
          color: #333333 !important;
          margin-bottom: 8px !important;
        }

        .su-terminal-frame {
          width: 100% !important;
          height: 310px !important;
          background: #0d1117 !important;
          border: 2px solid #1f2937 !important;
          border-radius: 14px !important;
          overflow: hidden !important;
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
        }

        .su-terminal-body {
          padding: 16px !important;
          color: #a3e635 !important;
          font-family: 'Fira Code', monospace !important;
          text-align: left !important;
          overflow-y: hidden !important;
          height: 100% !important;
        }

        .su-status-msg {
          padding: 8px 12px !important;
          border-radius: 10px !important;
          font-size: 11px !important;
          margin-top: 8px !important;
          margin-bottom: 8px !important;
        }
        .su-status-msg.error {
          background-color: #ffe5e5 !important;
          color: #d32f2f !important;
        }
        .su-status-msg.info {
          background-color: #e3f2fd !important;
          color: #1976d2 !important;
        }

        @keyframes suBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes suFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .su-cursor {
          display: inline-block;
          width: 6px;
          height: 12px;
          background-color: #a3e635;
          vertical-align: middle;
          margin-left: 2px;
          animation: suBlink 0.8s infinite;
        }
      `}</style>

      <div className={`su-root su-card ${isWideScreen ? 'wide' : ''}`}>
        
        {/* Top Bar Row */}
        <div className="su-top-bar">
          {['step-education', 'step-goals', 'step-followup', 'step-recommendation'].includes(screen) ? (
            <div className="su-progress-track">
              <div className="su-progress-bar" style={{ width: `${progressPercent}%` }} />
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {screen !== 'welcome' && (
            <button type="button" className="su-close-btn" onClick={handleClose}>
              &times;
            </button>
          )}
        </div>

        {/* Status Messages */}
        {statusMsg.text && (
          <div className={`su-status-msg ${statusMsg.type}`}>
            {statusMsg.text}
          </div>
        )}

        {/* 1. AUTH SCREEN */}
        {screen === 'auth' && (
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <h2 className="su-h2">{isLoginMode ? 'Welcome back' : 'Create Account'}</h2>
            <p className="su-description">
              {isLoginMode ? 'Welcome back! Enter your credentials to continue.' : "The future doesn't wait. So shouldn't you."}
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth(); }}>
              {!isLoginMode && (
                <div className="su-form-group">
                  <label className="su-label">Full Name</label>
                  <input
                    type="text"
                    className="su-input"
                    placeholder="Peter Parker"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              )}

              <div className="su-form-group">
                <label className="su-label">Email Address</label>
                <input
                  type="email"
                  className="su-input"
                  placeholder="peter.parker@gmail.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="su-form-group">
                <label className="su-label">Password</label>
                <div className="su-password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="su-input"
                    placeholder="Min. 8 characters"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span className="su-toggle-password" onClick={() => setShowPassword(!showPassword)}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </span>
                </div>

                {!isLoginMode && password.length > 0 && (
                  <div className="su-password-requirements">
                    {!hasMinLength && (
                      <div className="su-req-item">
                        <span className="su-req-bullet">✓</span> Minimum 8 characters
                      </div>
                    )}
                    {!hasSpecialChar && (
                      <div className="su-req-item">
                        <span className="su-req-bullet">✓</span> One special character
                      </div>
                    )}
                    {!hasUppercase && (
                      <div className="su-req-item">
                        <span className="su-req-bullet">✓</span> One uppercase letter
                      </div>
                    )}
                    {!hasNumber && (
                      <div className="su-req-item">
                        <span className="su-req-bullet">✓</span> One number
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button type="submit" className="su-btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
                {isLoginMode ? 'LOG IN' : 'CREATE ACCOUNT'}
              </button>
            </form>

            <div className="su-divider"><span>OR</span></div>

            <button type="button" className="su-btn-google" onClick={handleGoogleAuth}>
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </button>

            <div className="su-toggle-auth">
              {isLoginMode ? (
                <span>Don't have an account? <span className="su-link-btn" onClick={toggleAuthMode}>Create Account</span></span>
              ) : (
                <span>Already have an account? <span className="su-link-btn" onClick={toggleAuthMode}>Log In</span></span>
              )}
            </div>
          </div>
        )}

        {/* 1.5 EMAIL VERIFICATION SCREEN */}
        {screen === 'verify-email' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ marginBottom: '14px', color: '#8e8e93', display: 'flex', justifyContent: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>

            <h2 className="su-h2">Verify your email</h2>
            <p className="su-description" style={{ marginBottom: '20px' }}>
              We sent a verification link to your email. Click it and come back.
            </p>

            <button
              type="button"
              className="su-btn-primary"
              onClick={handleCheckVerification}
              disabled={verifying}
              style={{ marginBottom: '10px' }}
            >
              {verifying ? 'CHECKING...' : 'CHECK VERIFICATION'}
            </button>

            <button
              type="button"
              className="su-btn-secondary-full"
              onClick={handleResendEmail}
              disabled={resending}
            >
              {resending ? 'SENDING...' : 'RESEND EMAIL'}
            </button>
          </div>
        )}

        {/* 2. WELCOME RETRO COMPUTER SCREEN */}
        {screen === 'welcome' && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div className="su-terminal-frame">
              <div className="su-terminal-body">
                <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '11px', color: '#a3e635', marginBottom: '8px', letterSpacing: '1px' }}>
                  HELLO, {welcomeFirstName.toUpperCase() || 'PETER'}
                </div>

                <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', lineHeight: '1.4', color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {typewriterText}
                  <span className="su-cursor" />
                </div>
              </div>
            </div>

            {isTypingDone && (
              <div style={{ marginTop: '14px', animation: 'suFadeIn 0.4s ease-out forwards' }}>
                <button type="button" className="su-btn-primary" onClick={startOnboardingFromWelcome}>
                  START ONBOARDING
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. STEP 1: EDUCATION */}
        {screen === 'step-education' && (
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <h2 className="su-h2">Let's know you better</h2>
            <p className="su-description">Tell us a little about your academic background.</p>

            <div className="su-form-group">
              <label className="su-label">College</label>
              <select className="su-select" value={college} onChange={(e) => setCollege(e.target.value)}>
                <option value="">Select College</option>
                <option value="Manipal University Jaipur">Manipal University Jaipur</option>
                <option value="Vidya Jyothi Institute of Technology">Vidya Jyothi Institute of Technology</option>
                <option value="VNR VJIET">VNR VJIET</option>
                <option value="University of Hyderabad">University of Hyderabad</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {college === 'Other' && (
              <div className="su-form-group">
                <label className="su-label">College Name</label>
                <input
                  type="text"
                  className="su-input"
                  placeholder="Enter your college name"
                  value={collegeOther}
                  onChange={(e) => setCollegeOther(e.target.value)}
                />
              </div>
            )}

            <div className="su-form-group">
              <label className="su-label">Degree</label>
              <select className="su-select" value={degree} onChange={(e) => setDegree(e.target.value)}>
                <option value="">Select Degree</option>
                <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="su-form-group">
              <label className="su-label">Branch / Specialization</label>
              <select className="su-select" value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="">Select Branch</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Electrical">Electrical</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="su-form-group">
              <label className="su-label">Graduation Year</label>
              <select className="su-select" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)}>
                <option value="">Select Graduation Year</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="su-btn-row">
              <button type="button" className="su-btn-secondary" onClick={() => navigateOnboarding(-1)}>BACK</button>
              <button type="button" className="su-btn-primary" onClick={saveEducationAndNext}>CONTINUE</button>
            </div>
          </div>
        )}

        {/* 4. STEP 2: GOALS */}
        {screen === 'step-goals' && (
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <h2 className="su-h2">What brings you here?</h2>
            <p className="su-description">Pick your mission.</p>

            <div className="su-select-card-grid" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              {[
                { id: 'Get Placed', title: 'Get Placed', desc: 'Prepare for campus placements and tech interviews.' },
                { id: 'Learn New Skills', title: 'Learn New Skills', desc: 'Build strong foundations and learn in-demand skills.' },
                { id: 'Exploring TechLearn', title: 'Exploring TechLearn', desc: 'Discover programs, courses and career paths.' }
              ].map(g => (
                <div
                  key={g.id}
                  className={`su-select-card ${goal === g.id ? 'selected' : ''}`}
                  onClick={() => selectMission(g.id)}
                >
                  <h4>{g.title}</h4>
                  <p>{g.desc}</p>
                </div>
              ))}
            </div>

            <div className="su-btn-row">
              <button type="button" className="su-btn-secondary" onClick={() => navigateOnboarding(-1)}>BACK</button>
              <button type="button" className="su-btn-primary" onClick={() => {
                if (!goal) setStatusMsg({ text: 'Please select what brings you here.', type: 'error' });
                else navigateOnboarding(1);
              }}>CONTINUE</button>
            </div>
          </div>
        )}

        {/* 5. STEP 3: CONDITIONAL FOLLOW-UP */}
        {screen === 'step-followup' && (
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <h2 className="su-h2">{goal === 'Learn New Skills' ? 'What do you want to learn?' : 'Tell us more'}</h2>
            <p className="su-description" style={{ fontStyle: 'italic' }}>
              {goal === 'Learn New Skills' ? 'Select all that apply.' : 'Select all that apply.'}
            </p>

            {goal === 'Learn New Skills' && (
              <div className="su-followup-card">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['Java', 'Python', 'DSA', 'Web Development', 'SQL', 'AI/ML', 'GenAI', 'Aptitude'].map(s => {
                    const isSelected = skills.includes(s);
                    return (
                      <div
                        key={s}
                        className={`su-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (isSelected) setSkills(skills.filter(k => k !== s));
                          else setSkills([...skills, s]);
                        }}
                      >
                        {s}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {goal === 'Get Placed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="su-followup-card">
                  <h3>1. Target Role</h3>
                  <select className="su-select" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                    <option value="">Select Target Role</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="Java Developer">Java Developer</option>
                    <option value="Python Developer">Python Developer</option>
                    <option value="Data Analyst">Data Analyst</option>
                    <option value="QA Engineer">QA Engineer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="DevOps Engineer">DevOps Engineer</option>
                    <option value="Other">Other</option>
                  </select>

                  {targetRole === 'Other' && (
                    <div style={{ marginTop: '8px' }}>
                      <label className="su-label">Don't see your role? Type it below:</label>
                      <input
                        type="text"
                        className="su-input"
                        placeholder="e.g. Cybersecurity Engineer, Mobile App Dev..."
                        value={targetRoleOther}
                        onChange={(e) => setTargetRoleOther(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="su-followup-card">
                  <h3>2. Target Companies</h3>
                  <p style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>What type of opportunity are you preparing for?</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {['Campus Placements', 'Product Companies', 'Service Companies'].map(cat => (
                      <div
                        key={cat}
                        className={`su-chip ${placementCategory === cat ? 'selected' : ''}`}
                        onClick={() => {
                          setPlacementCategory(cat);
                          setTargetCompanies([]);
                        }}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>

                  {placementCategory && (
                    <div>
                      <p style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px', fontStyle: 'italic' }}>
                        Select your target companies:
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {({
                          'Campus Placements': ['Deloitte', 'Cognizant', 'Infosys', 'TCS', 'Capgemini', 'Wipro', 'Accenture', 'HCLTech', 'Tech Mahindra', 'IBM'],
                          'Product Companies': ['Google', 'Microsoft', 'Amazon', 'Apple', 'Adobe', 'Atlassian', 'Salesforce', 'Oracle', 'NVIDIA', 'Uber'],
                          'Service Companies': ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'Capgemini', 'HCLTech', 'Tech Mahindra', 'LTIMindtree']
                        }[placementCategory] || []).map(comp => {
                          const isSelected = targetCompanies.includes(comp);
                          return (
                            <div
                              key={comp}
                              className={`su-chip ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                if (isSelected) setTargetCompanies(targetCompanies.filter(c => c !== comp));
                                else setTargetCompanies([...targetCompanies, comp]);
                              }}
                            >
                              {comp}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="su-followup-card">
                  <h3>3. Placement Timeline</h3>
                  <p style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>When are you planning to get placed?</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['Within 3 Months', '3–6 Months', '6–12 Months', 'More than 1 Year', 'Just Preparing'].map(t => (
                      <div
                        key={t}
                        className={`su-chip ${placementTimeline === t ? 'selected' : ''}`}
                        onClick={() => setPlacementTimeline(t)}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="su-btn-row">
              <button type="button" className="su-btn-secondary" onClick={() => navigateOnboarding(-1)}>BACK</button>
              <button type="button" className="su-btn-primary" onClick={saveFollowUpAndNext}>CONTINUE</button>
            </div>
          </div>
        )}

        {/* 6. STEP 4: RECOMMENDATION */}
        {screen === 'step-recommendation' && (
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <h2 className="su-h2">Choose your learning path</h2>
            <p className="su-description" style={{ fontStyle: 'italic' }}>Select the plan that fits your goals.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px', alignItems: 'stretch' }}>
              {/* Card 1: Free Access */}
              <div
                className={`su-select-card ${learningPath === 'Free' ? 'selected' : ''}`}
                onClick={() => setLearningPath('Free')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '18px 16px',
                  borderRadius: '18px',
                  border: learningPath === 'Free' ? '2px solid #a3e635' : '1px solid #e2e8f0',
                  background: learningPath === 'Free' ? '#f7fee7' : '#ffffff',
                  cursor: 'pointer',
                  position: 'relative',
                  height: '100%'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.6px', marginBottom: '4px' }}>
                    Standard Access
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', lineHeight: '1.2' }}>
                    Free Access
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', fontSize: '11px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.3' }}>
                      <span style={{ color: '#65a30d', fontWeight: 'bold', fontSize: '12px' }}>✓</span> Essential foundational courses
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.3' }}>
                      <span style={{ color: '#65a30d', fontWeight: 'bold', fontSize: '12px' }}>✓</span> Standard learning dashboard
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.3' }}>
                      <span style={{ color: '#65a30d', fontWeight: 'bold', fontSize: '12px' }}>✓</span> Self-paced quizzes & practice
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLearningPath('Free'); completeOnboarding('Free'); }}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: learningPath === 'Free' ? '#a3e635' : '#f8fafc',
                    color: '#0f172a',
                    fontWeight: '600',
                    fontSize: '11px',
                    cursor: 'pointer',
                    marginTop: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Start for Free
                </button>
              </div>

              {/* Card 2: TechLearn Membership */}
              <div
                className={`su-select-card ${learningPath === 'Member' ? 'selected' : ''}`}
                onClick={() => setLearningPath('Member')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  padding: '18px 16px',
                  borderRadius: '18px',
                  border: learningPath === 'Member' ? '2px solid #a3e635' : '2px solid #3b82f6',
                  background: learningPath === 'Member' ? '#f7fee7' : '#f0f9ff',
                  cursor: 'pointer',
                  position: 'relative',
                  height: '100%'
                }}
              >
                <div style={{ position: 'absolute', top: '-10px', right: '12px', background: '#3b82f6', color: '#ffffff', fontSize: '9px', fontWeight: '700', padding: '3px 10px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)' }}>
                  Recommended
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.6px', marginBottom: '4px' }}>
                    Full Suite
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', lineHeight: '1.2' }}>
                    TechLearn Membership
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', fontSize: '11px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.3' }}>
                      <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '12px' }}>✓</span> All premium placement tracks
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.3' }}>
                      <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '12px' }}>✓</span> Full DSA & System Design suite
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.3' }}>
                      <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '12px' }}>✓</span> Priority mentor & placement support
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.3' }}>
                      <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '12px' }}>✓</span> Verified completion certificates
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLearningPath('Member'); completeOnboarding('Member'); }}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '10px',
                    border: 'none',
                    background: learningPath === 'Member' ? '#a3e635' : '#2563eb',
                    color: learningPath === 'Member' ? '#0f172a' : '#ffffff',
                    fontWeight: '600',
                    fontSize: '11px',
                    cursor: 'pointer',
                    marginTop: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Become a Member
                </button>
              </div>
            </div>

            <div className="su-btn-row">
              <button type="button" className="su-btn-secondary" onClick={() => navigateOnboarding(-1)}>BACK</button>
              <button type="button" className="su-btn-primary" onClick={() => completeOnboarding(learningPath || 'Free')} disabled={loading}>
                {loading ? 'SAVING...' : 'CONTINUE'}
              </button>
            </div>
          </div>
        )}

        {/* 7. COMPLETION */}
        {screen === 'complete' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚀</div>
            <h2 className="su-h2">All Set!</h2>
            <p className="su-description">Your profile is customized. Redirecting you to your dashboard...</p>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    padding: '16px'
  }
};
