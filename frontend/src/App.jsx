import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
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
import { courseAPI, progressAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useAuthModalContext } from "../../context/AuthModalContext";

// mock mcqs
const mockQuestions = [
  {
    id: "q1_variables",
    text: "What will be the output of the following Python code?\n\nx = 5\ny = '5'\nprint(x == y)",
    options: ["True", "False", "Error", "5"],
    correctAnswer: 1,
    explanation: "x is an integer (5) and y is a string ('5'). When comparing with ==, Python checks both value and type, so 5 == '5' returns False."
  },
  {
    id: "q2_functions",
    text: "Which of the following is the correct way to define a function in Python?",
    options: [
      "function square(x): return x * x",
      "def square(x): return x * x",
      "def square(x) -> return x * x", 
      "square(x) = x * x"
    ],
    correctAnswer: 1,
    explanation: "In Python, functions are defined using the 'def' keyword followed by the function name and parameters."
  },
  {
    id: "q3_loops",
    text: "What will be printed by this code?\n\nfor i in range(3):\n    if i == 1:\n        continue\n    print(i)",
    options: ["0 1 2", "0 2", "1 2", "0 1"],
    correctAnswer: 1,
    explanation: "The continue statement skips the rest of the loop iteration when i equals 1, so only 0 and 2 are printed."
  },
  {
    id: "q4_classes",
    text: "In Python classes, what does the 'self' parameter represent?",
    options: [
      "The class itself",
      "The current instance of the class",
      "The parent class",
      "A static method"
    ],
    correctAnswer: 1,
    explanation: "'self' refers to the current instance of the class and is used to access instance variables and methods."
  },
  {
    id: "q5_general",
    text: "What is the correct way to create a comment in Python?",
    options: [
      "// This is a comment",
      "/* This is a comment */",
      "# This is a comment",
      "-- This is a comment"
    ],
    correctAnswer: 2,
    explanation: "In Python, comments are created using the # symbol. Everything after # on that line is ignored by the Python interpreter."
  }
];

// Simple Question Component
const QuestionComponent = ({ question, onAnswer, isAnswering }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleSubmit = () => {
    if (selectedOption !== null) {
      setShowAnswer(true);
      onAnswer && onAnswer(question.id, selectedOption);
    }
  };

  if (!question) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-6 p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl shadow-lg"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-white" />
        </div>
        <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
          Quick Check
        </h4>
      </div>

      <div className="text-gray-700 dark:text-gray-300 mb-4 font-medium whitespace-pre-line">
        {question.text}
      </div>

      <div className="space-y-3 mb-4">
        {question.options.map((option, index) => {
          let optionClass = "w-full text-left p-3 rounded-lg border transition-all duration-200 ";

          if (showAnswer) {
            if (index === question.correctAnswer) {
              optionClass += 'bg-green-100 dark:bg-green-800/30 border-green-300 dark:border-green-600 text-green-800 dark:text-green-200';
            } else if (selectedOption === index) {
              optionClass += 'bg-red-100 dark:bg-red-800/30 border-red-300 dark:border-red-600 text-red-800 dark:text-red-200';
            } else {
              optionClass += 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400';
            }
          } else {
            if (selectedOption === index) {
              optionClass += 'bg-blue-100 dark:bg-blue-800/50 border-blue-300 dark:border-blue-600';
            } else {
              optionClass += 'bg-white dark:bg-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700';
            }
          }

          return (
            <button
              key={index}
              onClick={() => !showAnswer && setSelectedOption(index)}
              disabled={showAnswer}
              className={optionClass}
            >
              <span className="flex items-center gap-2">
                <span className="font-semibold">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span>{option}</span>
                {showAnswer && index === question.correctAnswer && (
                  <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {!showAnswer ? (
        <button
          onClick={handleSubmit}
          disabled={selectedOption === null || isAnswering}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
            selectedOption !== null && !isAnswering
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {isAnswering ? 'Submitting...' : 'Submit Answer'}
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700"
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-blue-700 dark:text-blue-300">Explanation:</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {question.explanation}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

const CourseTopics = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [titleRef, isTitleInViewport] = useInViewport();

  // Ref for the notes content container
  const notesContentRef = useRef(null);

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

  // SIMPLE question state
  const [questionCounter, setQuestionCounter] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [isAnswering, setIsAnswering] = useState(false);
  
  // Use ref instead of state to avoid re-render loops
  const paragraphCounterRef = useRef(0);

  // Get next question
  const getNextQuestion = () => {
    const availableQuestions = mockQuestions.filter((_, index) => !answeredQuestions.has(index));
    if (availableQuestions.length === 0) return null;
    return availableQuestions[0];
  };

  // Handle answer submission
  const handleAnswerSubmission = async (questionId, selectedAnswer) => {
    if (isAnswering) return;

    setIsAnswering(true);
    console.log('📝 Answer submitted:', { questionId, selectedAnswer });

    try {
      // Find question index and mark as answered
      const questionIndex = mockQuestions.findIndex(q => q.id === questionId);
      if (questionIndex !== -1) {
        setAnsweredQuestions(prev => new Set([...prev, questionIndex]));
      }

      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsAnswering(false);
    }
  };

  // Reset when topic changes
  useEffect(() => {
    console.log('🔄 Resetting questions for new topic');
    setQuestionCounter(0);
    setAnsweredQuestions(new Set());
    paragraphCounterRef.current = 0; // Reset ref counter
  }, [selectedTopic]);

  // Fetch course data from backend
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await courseAPI.getCourse(courseId);
        console.log('Course response in CourseTopics:', response);

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

  // Fetch user progress
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
            theory: "Variables are containers for storing data values. In Python, you don't need to declare variables explicitly - they are created automatically when you assign a value to them.\n\nPython has several built-in data types:\n• Integers (int): Whole numbers like 42, -17, 0\n• Floats (float): Decimal numbers like 3.14, -2.5\n• Strings (str): Text like \"Hello\", 'Python'\n• Booleans (bool): True or False values\n\nVariable Assignment Examples:\nYou can assign values to variables using the equals sign (=). Python automatically determines the data type based on the value you assign.\n\nNaming Rules:\n• Variable names must start with a letter or underscore\n• Can contain letters, numbers, and underscores\n• Case-sensitive (age and Age are different)\n• Cannot use Python keywords like 'if', 'for', 'while'\n\nType Checking:\nYou can check the type of any variable using the type() function. This is useful for debugging and understanding your data.\n\nDynamic Typing:\nPython is dynamically typed, meaning you can change the type of a variable by assigning it a new value of a different type.\n\nCommon Operations:\nYou can perform various operations on variables depending on their type. For example, you can add numbers, concatenate strings, and perform logical operations on booleans.\n\nBest Practices:\n• Use descriptive variable names\n• Follow naming conventions (snake_case)\n• Initialize variables before using them\n• Be mindful of variable scope\n• Use meaningful names that describe the data\n\nString Operations:\nStrings in Python are immutable, meaning they cannot be changed after creation. However, you can create new strings based on existing ones using various string methods.\n\nNumeric Operations:\nPython supports various numeric operations including addition, subtraction, multiplication, division, and more. You can also use mathematical functions from the math module.\n\nBoolean Logic:\nBoolean values are essential for control flow in programming. They represent True or False states and are used in conditional statements and loops.",
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
            theory: "Functions are reusable blocks of code that perform specific tasks. They help organize code, avoid repetition, and make programs more modular and easier to maintain.\n\nFunction Definition:\nFunctions are defined using the 'def' keyword followed by the function name and parameters in parentheses. The code block within every function starts with a colon (:) and is indented.\n\nParameters and Arguments:\nParameters are variables listed inside the parentheses in the function definition. Arguments are the values passed to the function when it is called.\n\nReturn Statement:\nFunctions can return values using the 'return' statement. If no return statement is used, the function returns None by default.\n\nFunction Benefits:\n• Code reusability\n• Better organization\n• Easier testing and debugging\n• Modular programming approach\n\nFunction Scope:\nVariables defined inside a function have local scope, meaning they are only accessible within that function. Variables defined outside functions have global scope.\n\nDefault Parameters:\nYou can provide default values for function parameters. If no argument is provided for a parameter with a default value, the default is used.\n\nKeyword Arguments:\nYou can call functions using keyword arguments, which allows you to specify arguments by parameter name rather than position.\n\nVariable-Length Arguments:\nPython allows functions to accept a variable number of arguments using *args for positional arguments and **kwargs for keyword arguments.\n\nDocstrings:\nIt's good practice to include docstrings in your functions to document what they do, their parameters, and return values.",
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
        }
      ]
    }
  };

  // Create hybrid course object
  const currentCourse = (() => {
    if (backendCourse && backendCourse.topics) {
      return {
        title: backendCourse.title,
        description: `Master ${backendCourse.title} fundamentals with hands-on coding exercises`,
        topics: backendCourse.topics.map((topic, index) => {
          const topicId = topic._id || topic.topicId || topic.id || `topic_${index}`;

          const cleanTitle = (() => {
            let title = topic.title || '';
            title = title.replace(/^CORE\s+(\w+)\s+NOTES\s*[-–]\s*\d+$/i, '$1');
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
            hasNotes: !!topic.notesId,
            notesContent: topic.notes,
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

  const handleStartPractice = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    setTimeout(() => {
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

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <motion.div
          initial={false}
          animate={{
            width: sidebarCollapsed ? "80px" : "320px",
            transition: { duration: 0.3, ease: "easeInOut" }
          }}
          className="hidden lg:flex flex-col bg-transparent backdrop-blur-xl sticky top-0 h-screen z-40 overflow-hidden sidebar-container"
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
                    className="font-poppins font-semibold text-2xl motion-div text-blue-900 dark:text-white/80"
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
                className="p-2 rounded-xl bg-transparent hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex-shrink-0 cursor-pointer z-[60] relative active:scale-95"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-5 h-5 text-blue-900" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-blue-900" />
                )}
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-hide">
            <div className="space-y-3">
              {currentCourse.topics.map((topic, index) => (
                <motion.button
                  key={topic.id}
                  onClick={() => {
                    setSelectedTopic(index);
                    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                  }}
                  whileHover={{ scale: sidebarCollapsed ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative w-full text-left rounded-xl transition-all duration-300 overflow-hidden ${
                    selectedTopic === index
                      ? 'bg-blue-500/20 border-2 border-blue-500/50 text-blue-700 dark:text-blue-300 shadow-lg'
                      : 'bg-white/40 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/60 dark:hover:bg-gray-700/50 hover:shadow-md'
                  } ${sidebarCollapsed ? 'p-3 mx-1' : 'p-4'}`}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                    {topic.completed ? (
                      <div className={`${sidebarCollapsed ? 'w-10 h-8' : 'w-8 h-8'} rounded-lg flex items-center justify-center bg-green-500 shadow-sm ${sidebarCollapsed ? 'border border-white/10 dark:border-gray-500/20' : ''}`}>
                        <CheckCircle className={`${sidebarCollapsed ? 'w-4 h-4' : 'w-4 h-4'} text-white`} />
                      </div>
                    ) : (
                      <span className={`${sidebarCollapsed ? 'text-sm' : 'text-xs'} font-bold text-gray-700 dark:text-gray-300`}>
                        {index + 1}
                      </span>
                    )}

                    <AnimatePresence mode="wait">
                      {!sidebarCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 min-w-0 motion-div"
                        >
                          <h4 className="font-medium brand-heading-primary truncate">
                            {topic.title}
                          </h4>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 max-w-xs truncate">
                      {topic.title}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

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
                className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] backdrop-blur-xl border-r border-white/20 dark:border-gray-700/20 z-50 flex flex-col"
              >
                <div className="p-4 border-b border-white/10 dark:border-gray-700/20 pt-24">
                  <div className="flex items-center justify-between">
                    <h3 className="font-poppins text-lg font-semibold text-blue-900 dark:text-white/80">
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

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {currentCourse.topics.map((topic, index) => (
                      <button
                        key={topic.id}
                        onClick={() => {
                          setSelectedTopic(index);
                          setMobileMenuOpen(false);
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
                              <span className="text-xs font-bold text-blue-950 dark:text-gray-300">
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-blue-800 dark:text-white/60">{topic.title}</h4>
                        </div>
                        <p className="text-sm text-blue-500 dark:text-white/60 ml-11">
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
              <div className="border-b border-gray-200/20 dark:border-gray-700/30 bg-white/40 dark:bg-gray-900/20 backdrop-blur-sm rounded-2xl p-8 mb-2 mt-2">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex flex-col gap-0">
                    <div className="flex-1">
                      <div className="lg:hidden flex items-center gap-3 mb-4">
                        <button
                          onClick={() => setMobileMenuOpen(true)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-sm rounded-lg border border-blue-400/30 shadow-sm transition-all duration-200 hover:scale-105"
                        >
                          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Course Topics</span>
                      </div>

                      <h1
                        ref={titleRef}
                        className={`Marquee-title-no-border ${isTitleInViewport ? 'in-viewport' : ''} mb-4 text-center lg:text-left`}
                      >
                        {currentTopic?.title}
                      </h1>
                    </div>
                  </div>
                </motion.div>

                {/* Content Sections */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="lg:bg-transparent lg:h-[90vh] lg:flex lg:flex-col"
                >
                  <div className="max-w-none px-[5px] lg:px-8 lg:py-1 lg:flex-1 lg:overflow-hidden">
                    {currentTopic?.hasNotes && currentTopic?.notesContent ? (
                      <div 
                        ref={notesContentRef}
                        className="h-full lg:overflow-y-auto scrollbar-hide"
                      >
                        <div className="markdown-content lg:bg-transparent">
                          <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:text-blue-600 dark:prose-headings:text-blue-400 prose-code:text-emerald-600 dark:prose-code:text-emerald-400 prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                              components={{
                                h1: ({children}) => null,
                                h2: ({children}) => null,
                                h3: ({children}) => {
                                  const cleanText = typeof children === 'string'
                                    ? children.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '')
                                    : Array.isArray(children)
                                      ? children.map(child =>
                                          typeof child === 'string'
                                            ? child.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '')
                                            : child
                                        )
                                      : children;

                                  return (
                                    <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-3 mt-6">
                                      {cleanText}
                                    </h3>
                                  );
                                },
                                h4: ({children}) => {
                                  const cleanText = typeof children === 'string'
                                    ? children.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '')
                                    : Array.isArray(children)
                                      ? children.map(child =>
                                          typeof child === 'string'
                                            ? child.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '')
                                            : child
                                        )
                                      : children;

                                  return (
                                    <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2 mt-4">
                                      {cleanText}
                                    </h4>
                                  );
                                },
                                h5: ({children}) => {
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
                                p: ({children}) => {
                                  // Increment ref counter (no re-render)
                                  paragraphCounterRef.current++;
                                  
                                  // Show question after every 3rd paragraph
                                  const currentQuestion = getNextQuestion();
                                  const shouldShowQuestion = currentQuestion && 
                                    paragraphCounterRef.current > 0 && 
                                    paragraphCounterRef.current % 3 === 0 && 
                                    questionCounter < 3;

                                  return (
                                    <div>
                                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
                                      {shouldShowQuestion && (
                                        <div className="my-6">
                                          <QuestionComponent
                                            question={currentQuestion}
                                            onAnswer={(questionId, answer) => {
                                              handleAnswerSubmission(questionId, answer);
                                              setQuestionCounter(prev => prev + 1);
                                            }}
                                            isAnswering={isAnswering}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                },
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
                      </div>
                    ) : currentTopic?.hasNotes ? (
                      <div className="h-full lg:overflow-y-auto scrollbar-hide">
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <AlertCircle className="w-8 h-8 text-blue-500 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400 mb-2">Detailed notes are available for this topic!</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">Notes feature is being integrated. Coming soon...</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        ref={notesContentRef}
                        className="h-full lg:overflow-y-auto lg:custom-scrollbar"
                      >
                        <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line lg:bg-white/80 lg:dark:bg-gray-800/80 lg:backdrop-blur-sm lg:rounded-xl lg:p-6 lg:border lg:border-gray-200/50 lg:dark:border-gray-700/50">
                          {currentTopic?.content.theory}

                          {/* Show question after the theory content for fallback topics */}
                          {(() => {
                            const currentQuestion = getNextQuestion();
                            const shouldShowQuestion = currentQuestion && questionCounter < 1;

                            return shouldShowQuestion ? (
                              <div className="mt-8">
                                <QuestionComponent
                                  question={currentQuestion}
                                  onAnswer={(questionId, answer) => {
                                    handleAnswerSubmission(questionId, answer);
                                    setQuestionCounter(prev => prev + 1);
                                  }}
                                  isAnswering={isAnswering}
                                />
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
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
              <button
                onClick={() => setQuizAlreadyAttempted({ show: false, title: '', isCompleted: false })}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>

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
