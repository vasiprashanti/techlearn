// API Service Layer for TechLearn Solutions
// This handles all communication with the backend

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Debug logging
console.log('🔧 API Configuration Debug:');
console.log('Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Final API_BASE:', API_BASE);
console.log('Mode:', import.meta.env.MODE);
console.log('All env vars:', import.meta.env);

// Helper function to handle API responses
const handleResponse = async (response) => {
  console.log('🌐 Response received:', {
    status: response.status,
    statusText: response.statusText,
    url: response.url,
    headers: Object.fromEntries(response.headers.entries())
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    console.error('❌ API Error:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      error
    });
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  // Primary token key used by AuthContext
  const token = localStorage.getItem('token');

  // Also check for 'authToken' key as backup for legacy compatibility
  const backupToken = localStorage.getItem('authToken');

  const finalToken = token || backupToken;

  return {
    'Content-Type': 'application/json',
    ...(finalToken && { Authorization: `Bearer ${finalToken}` })
  };
};

// Authentication API
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Login user
  login: async (credentials) => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },
};

// Course API
export const courseAPI = {
  // Get all courses
  getAllCourses: async () => {
    const url = `${API_BASE}/courses`;
    console.log('🚀 Making request to:', url);
    console.log('📋 Request headers:', getAuthHeaders());

    try {
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      const data = await handleResponse(response);
      console.log('✅ Courses data received:', data);
      // Backend returns { count, courses }, we need just the courses array
      return data.courses || [];
    } catch (error) {
      console.error('❌ getAllCourses failed:', error);
      throw error;
    }
  },

  // Get specific course by ID
  getCourse: async (courseId) => {
    const response = await fetch(`${API_BASE}/courses/${courseId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get quiz for specific topic
  getQuiz: async (courseId, topicId) => {
    const response = await fetch(`${API_BASE}/courses/${courseId}/topics/${topicId}/quiz`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Submit quiz answers (legacy - for full quiz submission)
  submitQuiz: async (courseId, quizData) => {
    const response = await fetch(`${API_BASE}/courses/${courseId}/quiz/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(quizData),
    });
    return handleResponse(response);
  },

  // Submit individual quiz answer (new flow)
  submitQuizAnswer: async (courseId, topicId, questionId, selectedOption, quizId = null) => {
    try {
      let actualQuizId = quizId;

      // If quizId is not provided, try to get it from course data
      if (!actualQuizId) {
        console.log('Quiz ID not provided, fetching from course data...');
        const courseData = await courseAPI.getCourse(courseId);
        const topic = courseData.topics?.find(t => t._id === topicId || t.topicId === topicId);
        actualQuizId = topic?.quizId;

        if (!actualQuizId) {
          console.error('Quiz ID not found in course data. Course topics:', courseData.topics);
          console.error('Looking for topicId:', topicId);
          throw new Error('Quiz ID not found for this topic. Please ensure the quiz data is properly seeded.');
        }
      }

      console.log('Submitting quiz answer:', { courseId, quizId: actualQuizId, questionId, selectedOption });

      // Submit the answer with the correct quizId
      const response = await fetch(`${API_BASE}/courses/${courseId}/quiz/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          quizId: actualQuizId,
          questionId,
          selectedOption
        }),
      });

      return handleResponse(response);
    } catch (error) {
      console.error('Error in submitQuizAnswer:', error);
      throw error;
    }
  },
};

// User Progress API
export const progressAPI = {
  // Get user progress (userId is extracted from JWT token on backend)
  getUserProgress: async () => {
    const response = await fetch(`${API_BASE}/user-progress`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return dataAdapters.adaptUserProgress(data);
  },
};

// Payment API
export const paymentAPI = {
  // Initiate payment - checks eligibility and returns payment permission
  initiatePayment: async (courseId) => {
    const response = await fetch(`${API_BASE}/certificate/${courseId}/initiate`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Submit payment for certification
  submitPayment: async (paymentData) => {
    const response = await fetch(`${API_BASE}/certificate/Pay`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
  },

  // Legacy - Check eligibility for certification (keeping for backward compatibility)
  checkEligibility: async (userId, courseId) => {
    const response = await fetch(`${API_BASE}/certificate/${userId}/${courseId}/status`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Legacy - Submit payment (keeping for backward compatibility)
  payCertificateFee: async (paymentData) => {
    const response = await fetch(`${API_BASE}/certificate/pay`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
  },

  // Get all payments (admin only)
  getAllPayments: async () => {
    const response = await fetch(`${API_BASE}/certificate/payments`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Certificate API
export const certificateAPI = {
  // Generate and email certificate
  generateCertificate: async (certificateData) => {
    const response = await fetch(`${API_BASE}/certification/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(certificateData),
    });
    return handleResponse(response);
  },
};

// Exercise API
export const exerciseAPI = {
  // Get all exercises for a course
  getExercises: async (courseId) => {
    const response = await fetch(`${API_BASE}/exercises/${courseId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get a single exercise (helper function that fetches all and filters)
  getExercise: async (courseId, exerciseId) => {
    const exercises = await exerciseAPI.getExercises(courseId);
    const exercise = exercises.find(ex => ex._id === exerciseId);
    if (!exercise) {
      throw new Error('Exercise not found');
    }
    return exercise;
  },

  // Submit exercise
  submitExercise: async (courseId, exerciseId) => {
    const response = await fetch(`${API_BASE}/exercises/${courseId}/${exerciseId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Submit code for execution (exercise-specific)
  submitCode: async (courseId, exerciseId, codeData) => {
    const response = await fetch(`${API_BASE}/exercises/${courseId}/${exerciseId}/submit-code`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(codeData),
    });
    return handleResponse(response);
  },
};

// Compiler API
export const compilerAPI = {
  // Compile and execute code
  compileCode: async (codeData) => {
    const response = await fetch(`${API_BASE}/compiler/compile`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(codeData),
    });
    return handleResponse(response);
  },
};



// Data Adapters - Transform backend data to frontend format
export const dataAdapters = {
  // Adapt course data from backend to frontend format
  adaptCourse: (backendCourse) => {
    // Default gradients, icons, and images for different course types
    const getDefaultVisuals = (title) => {
      const titleLower = title.toLowerCase();
      if (titleLower.includes('java') && !titleLower.includes('javascript')) {
        return {
          gradient: 'from-blue-500 via-cyan-400 to-teal-400',
          icon: '☕',
          image: '/java.png'
        };
      } else if (titleLower.includes('python')) {
        return {
          gradient: 'from-blue-500 via-cyan-400 to-teal-400',
          icon: '🐍',
          image: '/python.png'
        };
      } else if (titleLower.includes('dsa') || titleLower.includes('data structures') || titleLower.includes('algorithms')) {
        return {
          gradient: 'from-blue-500 via-cyan-400 to-teal-400',
          icon: '🧠',
          image: '/dsa.png'
        };
      } else if (titleLower.includes('mysql') || titleLower.includes('database')) {
        return {
          gradient: 'from-blue-500 via-cyan-400 to-teal-400',
          icon: '🗄️',
          image: '/mysql.png'
        };
      } else if (titleLower.includes('javascript')) {
        return {
          gradient: 'from-blue-500 via-cyan-400 to-teal-400',
          icon: '⚡',
          image: '/js.png'
        };
      } else if (titleLower.includes('c++')) {
        return {
          gradient: 'from-blue-500 via-cyan-400 to-teal-400',
          icon: '⚙️',
          image: '/c.png'
        };
      } else if (titleLower.includes('c ') || titleLower.includes('c programming')) {
        return {
          gradient: 'from-blue-500 via-cyan-400 to-teal-400',
          icon: '🔧',
          image: '/c.png'
        };
      } else if (titleLower.includes('html') || titleLower.includes('css')) {
        return {
          gradient: 'from-blue-500 via-cyan-400 to-teal-400',
          icon: '🌐',
          image: '/html.png'
        };
      } else {
        return {
          gradient: 'from-blue-500 via-cyan-400 to-teal-400',
          icon: '📚',
          image: '/python.png' // Default fallback
        };
      }
    };

    const visuals = getDefaultVisuals(backendCourse.title);

    // Determine course status and pricing based on title
    const getCourseStatus = (title) => {
      const titleLower = title.toLowerCase();
      if (titleLower.includes('java') || titleLower.includes('python')) {
        return {
          status: 'available',
          price: '₹1499',
          certificationPrice: 1499,
          certificationDiscountedPrice: 999,
          xpDiscount: 500,
          requiredXP: 1000
        };
      } else {
        return {
          status: 'coming_soon',
          price: 'Coming Soon',
          certificationPrice: null,
          certificationDiscountedPrice: null,
          xpDiscount: null,
          requiredXP: null
        };
      }
    };

    const courseStatus = getCourseStatus(backendCourse.title);

    return {
      id: backendCourse._id,
      title: backendCourse.title,
      description: backendCourse.description || 'Learn programming concepts and build practical skills',
      level: backendCourse.level,
      gradient: visuals.gradient,
      icon: visuals.icon,
      image: visuals.image,
      status: courseStatus.status,
      price: courseStatus.price,
      certificationPrice: courseStatus.certificationPrice,
      certificationDiscountedPrice: courseStatus.certificationDiscountedPrice,
      xpDiscount: courseStatus.xpDiscount,
      requiredXP: courseStatus.requiredXP,
      difficulty: backendCourse.level, // Add difficulty alias for filtering
      topics: backendCourse.topics?.map(topic => ({
        id: topic.topicId || topic._id,
        title: topic.title,
        quizId: topic.quizId,
        exerciseId: topic.exerciseId,
        notesId: topic.notesId,
      })) || [],
      createdAt: backendCourse.createdAt,
      updatedAt: backendCourse.updatedAt,
    };
  },

  // Adapt quiz data from backend to frontend format
  adaptQuiz: (backendQuiz) => ({
    topic: backendQuiz.topic,
    questions: backendQuiz.questions?.map(question => ({
      id: question._id,
      question: question.question,
      options: question.options,
      correct: question.correctAnswer, // Transform property name
      explanation: question.explanation,
    })) || [],
  }),

  // Adapt user progress data
  adaptUserProgress: (backendProgress) => ({
    userId: backendProgress.userId,
    courseXP: backendProgress.courseXP || {},
    exerciseXP: backendProgress.exerciseXP || {},
    totalCourseXP: backendProgress.totalCourseXP || 0,
    totalExerciseXP: backendProgress.totalExerciseXP || 0,
    // Note: Backend /user-progress endpoint doesn't return these fields
    // They exist in the model but are not included in the response
    completedQuizzes: backendProgress.completedQuizzes || [],
    completedExercises: backendProgress.completedExercises || [],
    answeredQuestions: backendProgress.answeredQuestions || {},
  }),
};

// API Status checker
export const apiStatus = {
  // Check if backend is running
  checkHealth: async () => {
    try {
      const healthUrl = `${API_BASE.replace('/api', '')}/`;
      console.log('🏥 Health check URL:', healthUrl);

      const response = await fetch(healthUrl, {
        method: 'GET',
      });

      console.log('🏥 Health check response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🏥 Health check data:', data);
      }

      return response.ok;
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      return false;
    }
  },
};

// Error types for better error handling
export const API_ERRORS = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
};

export default {
  authAPI,
  courseAPI,
  progressAPI,
  exerciseAPI,
  paymentAPI,
  compilerAPI,
  dataAdapters,
  apiStatus,
  API_ERRORS,
};
