import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import '../../styles/markdown.css';
import {
  BookOpen, Code2, Trophy, PanelLeft, Play, CheckCircle,
  Clock, ArrowRight, FileText, Lightbulb, ChevronLeft, ChevronRight,
  Menu, X, AlertCircle
} from "lucide-react";
import ScrollProgress from "../../components/ScrollProgress";
import LoadingScreen from "../../components/LoadingScreen";
import useInViewport from "../../hooks/useInViewport";
import Navbar from "../../components/Navbar";
import { courseAPI, progressAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useAuthModalContext } from "../../context/AuthModalContext";

const CourseTopics = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState(0); // Changed to index-based selection
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [titleRef, isTitleInViewport] = useInViewport();

  // Authentication hooks
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModalContext();

  // Backend data state
  const [backendCourse, setBackendCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProgress, setUserProgress] = useState(null);

  // Modal state for quiz already attempted
  const [quizAlreadyAttempted, setQuizAlreadyAttempted] = useState({
    show: false,
    title: '',
    isCompleted: false
  });

  // Fetch course data from backend to get real topic IDs
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await courseAPI.getCourse(courseId);
        console.log('Course response in CourseTopics:', response);

        // Extract the course data from the response
        const courseData = response.course || response;
        console.log('Extracted course data:', courseData);

        setBackendCourse(courseData);
        setError(null);
      } catch (error) {
        console.error('Error fetching course for topics:', error);
        setError(error.message);
        setBackendCourse(null);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  // Fetch user progress to check completed quizzes
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!isAuthenticated) return;

      try {
        console.log('Fetching user progress for quiz completion check...');
        const progress = await progressAPI.getUserProgress();
        console.log('User progress received in CourseTopics:', progress);
        setUserProgress(progress);
      } catch (error) {
        console.error('Error fetching user progress in CourseTopics:', error);
        setUserProgress(null);
      }
    };

    fetchUserProgress();
  }, [isAuthenticated]);



  // Course topics data
  const courseTopicsData = {
    "python": {
      title: "Python Programming",
      description: "Master Python fundamentals with hands-on coding exercises",
      topics: [
        {
          id: "variables",
          title: "Variables & Data Types",
          description: "Learn about Python variables, data types, and basic operations",
          exercises: 5,
          maxXP: 50,
          completed: false,
          content: {
            theory: "Variables are containers for storing data values. In Python, you don't need to declare variables explicitly - they are created automatically when you assign a value to them.\n\nPython has several built-in data types:\n• Integers (int): Whole numbers like 42, -17, 0\n• Floats (float): Decimal numbers like 3.14, -2.5\n• Strings (str): Text like \"Hello\", 'Python'\n• Booleans (bool): True or False values",
            codeExample: `# Creating variables
name = "Alice"        # String
age = 25             # Integer  
height = 5.6         # Float
is_student = True    # Boolean

# You can check the type of a variable
print(type(name))        # <class 'str'>
print(type(age))         # <class 'int'>
print(type(height))      # <class 'float'>
print(type(is_student))  # <class 'bool'>`,
            keyPoints: [
              "Variables are created when you assign a value",
              "Python is dynamically typed - no need to declare types",
              "Use descriptive variable names for better code readability",
              "Variable names are case-sensitive",
              "Cannot start with numbers or contain spaces"
            ]
          }
        },
        {
          id: "functions",
          title: "Functions",
          description: "Create reusable code blocks with functions",
          exercises: 4,
          maxXP: 40,
          completed: false,
          content: {
            theory: "Functions are reusable blocks of code that perform specific tasks. They help organize code, avoid repetition, and make programs more modular and easier to maintain.",
            codeExample: `# Defining a function
def greet(name):
    return f"Hello, {name}!"

# Calling the function
message = greet("Alice")
print(message)  # Output: Hello, Alice!

# Function with multiple parameters
def calculate_area(length, width):
    area = length * width
    return area

result = calculate_area(5, 3)
print(f"Area: {result}")  # Output: Area: 15`,
            keyPoints: [
              "Use 'def' keyword to define functions",
              "Functions can accept parameters and return values",
              "Good function names describe what they do",
              "Functions promote code reusability",
              "Use docstrings to document your functions"
            ]
          }
        },
        {
          id: "loops",
          title: "Loops & Iterations",
          description: "Master for loops, while loops, and iteration patterns",
          exercises: 6,
          maxXP: 60,
          completed: false,
          content: {
            theory: "Loops allow you to repeat code multiple times. Python has two main types of loops: 'for' loops for iterating over sequences, and 'while' loops for repeating until a condition is false.",
            codeExample: `# For loop example
fruits = ["apple", "banana", "orange"]
for fruit in fruits:
    print(f"I like {fruit}")

# While loop example
count = 0
while count < 5:
    print(f"Count: {count}")
    count += 1

# Range function with for loop
for i in range(1, 6):
    print(f"Number: {i}")`,
            keyPoints: [
              "For loops iterate over sequences (lists, strings, etc.)",
              "While loops continue until condition becomes False",
              "Use range() to generate number sequences",
              "Break and continue statements control loop flow",
              "Avoid infinite loops by ensuring conditions change"
            ]
          }
        },
        {
          id: "classes",
          title: "Classes & Objects",
          description: "Object-oriented programming with classes and objects",
          exercises: 5,
          maxXP: 50,
          completed: false,
          content: {
            theory: "Classes are blueprints for creating objects. They encapsulate data (attributes) and functions (methods) that work on that data. This is the foundation of object-oriented programming.",
            codeExample: `# Defining a class
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def introduce(self):
        return f"Hi, I'm {self.name} and I'm {self.age} years old"
    
    def have_birthday(self):
        self.age += 1

# Creating objects
person1 = Person("Alice", 25)
person2 = Person("Bob", 30)

print(person1.introduce())  # Hi, I'm Alice and I'm 25 years old
person1.have_birthday()
print(f"Alice is now {person1.age}")  # Alice is now 26`,
            keyPoints: [
              "Classes define the structure and behavior of objects",
              "__init__ method initializes new objects",
              "self refers to the current instance",
              "Methods are functions defined inside classes",
              "Objects are instances of classes"
            ]
          }
        }
      ]
    },
    "data-science": {
      title: "Data Science",
      description: "Master data analysis and visualization techniques",
      topics: [
        {
          id: "pandas-basics",
          title: "Pandas Fundamentals",
          description: "Learn data manipulation with Pandas DataFrames",
          exercises: 4,
          maxXP: 40,
          completed: false,
          content: {
            theory: "Pandas is the most important library for data manipulation in Python. It provides DataFrames - powerful data structures for handling structured data.",
            codeExample: `import pandas as pd

# Creating a DataFrame
data = {
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35],
    'city': ['New York', 'London', 'Tokyo']
}
df = pd.DataFrame(data)

# Basic operations
print(df.head())        # Show first 5 rows
print(df.info())        # Data types and info
print(df.describe())    # Statistical summary`,
            keyPoints: [
              "DataFrames are like Excel spreadsheets in Python",
              "Use .head() and .tail() to preview data",
              "Filter data with boolean indexing",
              "Group data with .groupby()",
              "Handle missing data with .fillna() and .dropna()"
            ]
          }
        }
      ]
    }
  };

  // Create a hybrid course object using backend data when available
  const currentCourse = (() => {
    if (backendCourse && backendCourse.topics) {
      // Use backend course data with placeholder content for now
      return {
        title: backendCourse.title,
        description: `Master ${backendCourse.title} fundamentals with hands-on coding exercises`,
        topics: backendCourse.topics.map((topic, index) => {
          const topicId = topic._id || topic.topicId || topic.id || `topic_${index}`;

          // Clean the title by removing numbers and patterns
          const cleanTitle = (() => {
            let title = topic.title || '';
            // Remove "CORE JAVA NOTES - 02" pattern and extract just the subject
            title = title.replace(/^CORE\s+(\w+)\s+NOTES\s*[-–]\s*\d+$/i, '$1');
            // Remove other number patterns
            title = title.replace(/^\d+\.\s*/, '').replace(/\s*[-–]\s*\d+$/, '');
            return title;
          })();

          return {
            id: topicId,
            title: cleanTitle,
            description: `Learn about ${cleanTitle} concepts and applications`,
            exercises: 5,
            maxXP: 50,
            completed: false,
            hasNotes: !!topic.notesId, // Check if this topic has notes in the backend
            notesContent: topic.notes, // Store the actual notes content (backend returns it as 'notes')
            content: {
              theory: topic.notes || `Learn the fundamentals of ${cleanTitle}. This topic covers essential concepts and practical applications.`,
              codeExample: `// Example code for ${cleanTitle}\nconsole.log("Learning ${cleanTitle}");`,
              keyPoints: [
                `Understand ${cleanTitle} basics`,
                "Apply concepts in practical scenarios",
                "Master key techniques",
                "Build real-world applications"
              ]
            }
          };
        })
      };
    }

    // Fallback to hardcoded data for simple course IDs
    return courseTopicsData[courseId];
  })();

  const currentTopic = currentCourse?.topics[selectedTopic];

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  // Loading state
  if (loading) {
    return (
      <LoadingScreen
        showMessage={false}
        size={48}
        duration={800}
      />
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Course</h1>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              setTimeout(() => navigate('/learn/courses'), 100);
            }}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  // Course not found state
  if (!currentCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Course Not Found</h1>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              setTimeout(() => navigate('/learn/courses'), 100);
            }}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const handleTakeQuiz = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    // Use real backend topic ID if available, otherwise fallback to hardcoded
    let topicId = null;
    let topicTitle = 'Quiz';
    let quizId = null;

    if (backendCourse && backendCourse.topics && backendCourse.topics[selectedTopic]) {
      // Use real backend topic ID
      const backendTopic = backendCourse.topics[selectedTopic];
      topicId = backendTopic._id || backendTopic.topicId || backendTopic.id;
      topicTitle = backendTopic.title;
      quizId = backendTopic.quizId; // Get quiz ID for completion check
      console.log('Using backend topic ID:', topicId, 'for topic:', topicTitle);
      console.log('Quiz ID for completion check:', quizId);
      console.log('Backend topic object:', backendTopic);
    } else {
      // Fallback to hardcoded data
      const currentTopicData = currentCourse?.topics[selectedTopic];
      if (!currentTopicData) {
        console.error('No topic selected for quiz');
        return;
      }
      topicId = `topic_${currentTopicData.id}`;
      topicTitle = currentTopicData.title;
      console.log('Using fallback topic ID:', topicId, 'for topic:', topicTitle);
    }

    if (!topicId) {
      console.error('Could not determine topic ID for quiz');
      return;
    }

    // Check if quiz is already completed (only block if fully completed)
    if (quizId && userProgress) {
      const isFullyCompleted = userProgress.completedQuizzes?.some(
        completedQuizId => completedQuizId.toString() === quizId.toString()
      );

      // Check if any questions have been answered for this quiz (for logging purposes)
      const answeredQuestions = userProgress.answeredQuestions?.[quizId.toString()] || [];
      const hasPartialProgress = answeredQuestions.length > 0 && !isFullyCompleted;

      console.log('Quiz access check in CourseTopics:', {
        quizId,
        completedQuizzes: userProgress.completedQuizzes,
        answeredQuestions: answeredQuestions,
        isFullyCompleted,
        hasPartialProgress,
        shouldBlockAccess: isFullyCompleted // Only block if fully completed
      });

      // Only block access if quiz is fully completed
      if (isFullyCompleted) {
        setQuizAlreadyAttempted({
          show: true,
          title: topicTitle,
          isCompleted: true
        });
        return;
      }

      // If there's partial progress, allow access (quiz will show resume option)
      if (hasPartialProgress) {
        console.log(`Quiz has partial progress (${answeredQuestions.length} questions answered). Allowing access to resume.`);
      }
    }

    // Scroll to top before navigating to quiz
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    // Small delay to ensure scroll completes before navigation
    setTimeout(() => {
      navigate(`/learn/courses/${courseId}/quiz?topicId=${topicId}`, {
        state: { topicId, topicTitle }
      });
    }, 100);
  };

  const handleStartPractice = () => {
    // Scroll to top before navigating to exercises
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    // Small delay to ensure scroll completes before navigation
    setTimeout(() => {
      // Navigate to exercises page (to be implemented)
      navigate(`/learn/exercises/${courseId}`);
    }, 100);
  };

  const handleToggleSidebar = () => {
    console.log('Toggling sidebar from:', sidebarCollapsed, 'to:', !sidebarCollapsed);
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <ScrollProgress />
      <Navbar />
      
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <motion.div
          initial={false}
          animate={{
            width: sidebarCollapsed ? "120px" : "320px",
            transition: { duration: 0.3, ease: "easeInOut" }
          }}
          className="hidden lg:flex flex-col bg-white/20 dark:bg-gray-900/40 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/20 relative z-40"
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/10 dark:border-gray-700/20 pt-24 relative z-50">
            <div className="flex items-center justify-between relative z-50">
              <AnimatePresence mode="wait">
                {!sidebarCollapsed && (
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="font-poppins font-semibold text-gray-900 dark:text-white text-sm"
                  >
                    Course Topics
                  </motion.h3>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={handleToggleSidebar}
                onMouseDown={(e) => {
                  console.log('Mouse down on toggle button');
                  e.preventDefault();
                }}
                className="p-3 rounded-lg bg-blue-500/20 dark:bg-blue-600/20 hover:bg-blue-500/30 dark:hover:bg-blue-600/30 transition-all duration-200 border-2 border-blue-500/50 dark:border-blue-400/50 flex-shrink-0 cursor-pointer z-[60] relative shadow-lg active:scale-95"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                )}
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {currentCourse.topics.map((topic, index) => (
                <motion.button
                  key={topic.id}
                  onClick={() => {
                    setSelectedTopic(index);
                    // Scroll to top when changing topics
                    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                  }}
                  whileHover={{ scale: sidebarCollapsed ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative w-full text-left rounded-xl transition-all duration-300 ${
                    selectedTopic === index
                      ? 'bg-blue-500/20 border-2 border-blue-500/50 text-blue-700 dark:text-blue-300 shadow-lg'
                      : 'bg-white/40 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/60 dark:hover:bg-gray-700/50 hover:shadow-md'
                  } ${sidebarCollapsed ? 'p-3 mx-1' : 'p-4'}`}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className={`${sidebarCollapsed ? 'w-10 h-8' : 'w-8 h-8'} rounded-lg flex items-center justify-center ${
                      topic.completed ? 'bg-green-500 shadow-sm' : 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 shadow-sm'
                    } ${sidebarCollapsed ? 'border border-white/10 dark:border-gray-500/20' : ''}`}>
                      {topic.completed ? (
                        <CheckCircle className={`${sidebarCollapsed ? 'w-4 h-4' : 'w-4 h-4'} text-white`} />
                      ) : (
                        <span className={`${sidebarCollapsed ? 'text-sm' : 'text-xs'} font-bold ${
                          sidebarCollapsed ? 'text-gray-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {index + 1}
                        </span>
                      )}
                    </div>

                    <AnimatePresence mode="wait">
                      {!sidebarCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 min-w-0"
                        >
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1 truncate">
                            {topic.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {topic.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {topic.title}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden fixed top-20 right-4 z-40 p-3 bg-blue-500/90 hover:bg-blue-600/90 backdrop-blur-sm rounded-full border border-blue-400/30 shadow-lg transition-all duration-200 hover:scale-105"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />

              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/20 z-50 flex flex-col"
              >
                {/* Mobile Header */}
                <div className="p-4 border-b border-white/10 dark:border-gray-700/20 pt-24">
                  <div className="flex items-center justify-between">
                    <h3 className="font-poppins font-semibold text-gray-900 dark:text-white">
                      Course Topics
                    </h3>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-700/50 transition-all duration-200"
                    >
                      <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Mobile Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {currentCourse.topics.map((topic, index) => (
                      <button
                        key={topic.id}
                        onClick={() => {
                          setSelectedTopic(index);
                          setMobileMenuOpen(false);
                          // Scroll to top when changing topics on mobile
                          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                        }}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                          selectedTopic === index
                            ? 'bg-blue-500/20 border-2 border-blue-500/50 text-blue-700 dark:text-blue-300'
                            : 'bg-white/40 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/60 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            topic.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}>
                            {topic.completed ? (
                              <CheckCircle className="w-4 h-4 text-white" />
                            ) : (
                              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{topic.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
                          {topic.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 relative min-w-0">
          <div className="relative z-10 pt-24 pb-12">
            <div className={`container mx-auto max-w-6xl transition-all duration-300 ${
              sidebarCollapsed ? 'px-6' : 'px-6 lg:px-8'
            }`}>
              


              {/* Header */}
              <div className="border-b border-gray-200/20 dark:border-gray-700/30 bg-white/40 dark:bg-gray-900/20 backdrop-blur-sm rounded-2xl p-8 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      
                      <h1
                        ref={titleRef}
                        className={`Marquee-title-no-border ${isTitleInViewport ? 'in-viewport' : ''} mb-4`}
                      >
                        {currentTopic?.title}
                      </h1>
                      
                      <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
                        {currentTopic?.description}
                      </p>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:w-64">
                      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Code2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {currentTopic?.exercises}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Exercises</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {currentTopic?.maxXP}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Max XP</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>



              {/* Content Sections */}
              <div className="space-y-8">
                {/* Theory Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 dark:border-gray-700/20"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-poppins font-semibold text-gray-900 dark:text-white">Notes</h2>
                  </div>

                  <div className="max-w-none">
                    {currentTopic?.hasNotes && currentTopic?.notesContent ? (
                      <div className="markdown-content bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50">
                        <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:text-blue-600 dark:prose-headings:text-blue-400 prose-code:text-emerald-600 dark:prose-code:text-emerald-400 prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                          components={{
                            h1: ({children}) => null, // Hide h1 headings
                            h2: ({children}) => null, // Hide h2 headings
                            h3: ({children}) => {
                              // Remove numbers and dashes from h3 headings
                              const cleanText = typeof children === 'string'
                                ? children.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '')
                                : Array.isArray(children)
                                  ? children.map(child =>
                                      typeof child === 'string'
                                        ? child.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '')
                                        : child
                                    )
                                  : children;
                              return <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-3 mt-6">{cleanText}</h3>;
                            },
                            h4: ({children}) => {
                              // Remove numbers and dashes from h4 headings
                              const cleanText = typeof children === 'string'
                                ? children.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '')
                                : Array.isArray(children)
                                  ? children.map(child =>
                                      typeof child === 'string'
                                        ? child.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '')
                                        : child
                                    )
                                  : children;
                              return <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2 mt-4">{cleanText}</h4>;
                            },
                            h5: ({children}) => {
                              // Remove numbers and dashes from h5 headings
                              const cleanText = typeof children === 'string'
                                ? children.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '')
                                : Array.isArray(children)
                                  ? children.map(child =>
                                      typeof child === 'string'
                                        ? child.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '')
                                        : child
                                    )
                                  : children;
                              return <h5 className="text-base font-semibold text-blue-600 dark:text-blue-400 mb-2 mt-3">{cleanText}</h5>;
                            },
                            h6: ({children}) => {
                              // Remove numbers and dashes from h6 headings
                              const cleanText = typeof children === 'string'
                                ? children.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '')
                                : Array.isArray(children)
                                  ? children.map(child =>
                                      typeof child === 'string'
                                        ? child.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '')
                                        : child
                                    )
                                  : children;
                              return <h6 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 mt-3">{cleanText}</h6>;
                            },
                            code: ({inline, className, children, ...props}) => {
                              if (inline) {
                                return <code className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded text-sm font-mono" {...props}>{children}</code>
                              }
                              return <code className={className} {...props}>{children}</code>
                            },
                            pre: ({children}) => <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto my-4">{children}</pre>,
                            p: ({children}) => <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{children}</p>,
                            ul: ({children}) => <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">{children}</ol>,
                            li: ({children}) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
                            blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4">{children}</blockquote>,
                            strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
                            table: ({children}) => (
                              <div className="overflow-x-auto -mx-2 sm:mx-0 my-4">
                                <table className="min-w-full">{children}</table>
                              </div>
                            )
                          }}
                          >
                            {currentTopic.notesContent}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ) : currentTopic?.hasNotes ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <AlertCircle className="w-8 h-8 text-blue-500 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400 mb-2">Detailed notes are available for this topic!</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500">Notes feature is being integrated. Coming soon...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                        {currentTopic?.content.theory}
                      </div>
                    )}
                  </div>
                </motion.div>





                {/* Quick Actions Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex justify-center"
                >
                  <button
                    onClick={handleTakeQuiz}
                    className="flex items-center gap-3 px-6 py-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-800 dark:text-blue-200 rounded-xl transition-all duration-300 hover:shadow-md border border-blue-200/50 dark:border-blue-700/50"
                  >
                    <Trophy className="w-5 h-5" />
                    <span className="font-medium">Take Quiz</span>
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Already Attempted Modal */}
      <AnimatePresence>
        {quizAlreadyAttempted.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setQuizAlreadyAttempted({ show: false, title: '', isCompleted: false })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setQuizAlreadyAttempted({ show: false, title: '', isCompleted: false })}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>

              {/* Icon */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Quiz Already {quizAlreadyAttempted.isCompleted ? 'Completed' : 'Started'}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  You have already {quizAlreadyAttempted.isCompleted ? 'completed' : 'started'} the quiz for{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    "{quizAlreadyAttempted.title}"
                  </span>
                  . Each quiz can only be attempted once to maintain the integrity of your progress.
                </p>
              </div>

              {/* Action button */}
              <button
                onClick={() => setQuizAlreadyAttempted({ show: false, title: '', isCompleted: false })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseTopics;
