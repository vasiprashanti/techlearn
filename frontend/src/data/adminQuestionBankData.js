export const questionCategories = [
  {
    id: 1,
    slug: 'data-structures-algorithms',
    title: 'Data Structures & Algorithms',
    subtitle: 'Core DSA concepts',
    total: 4,
    active: 4,
    icon: 'code',
    topTint: 'bg-[#d9ddee] dark:bg-[#223454]',
    iconBg: 'bg-[#e6ebf5] dark:bg-[#2f4466]',
    iconColor: 'text-[#3c83f6] dark:text-blue-300',
  },
  {
    id: 2,
    slug: 'web-development',
    title: 'Web Development',
    subtitle: 'Full-stack web development',
    total: 3,
    active: 3,
    icon: 'globe',
    topTint: 'bg-[#d2e9e5] dark:bg-[#204744]',
    iconBg: 'bg-[#e4f4f1] dark:bg-[#285954]',
    iconColor: 'text-[#129775] dark:text-emerald-300',
  },
  {
    id: 3,
    slug: 'python-programming',
    title: 'Python Programming',
    subtitle: 'Python fundamentals to advanced',
    total: 1,
    active: 1,
    icon: 'terminal',
    topTint: 'bg-[#efe6d2] dark:bg-[#4f4228]',
    iconBg: 'bg-[#f8f0df] dark:bg-[#625133]',
    iconColor: 'text-[#d17d00] dark:text-amber-300',
  },
  {
    id: 4,
    slug: 'database-management',
    title: 'Database Management',
    subtitle: 'SQL and NoSQL databases',
    total: 1,
    active: 1,
    icon: 'database',
    topTint: 'bg-[#e7def3] dark:bg-[#3a2f58]',
    iconBg: 'bg-[#f1eafb] dark:bg-[#4a3b73]',
    iconColor: 'text-[#8c4df4] dark:text-violet-300',
  },
  {
    id: 5,
    slug: 'machine-learning',
    title: 'Machine Learning',
    subtitle: 'ML fundamentals and applications',
    total: 1,
    active: 1,
    icon: 'brain',
    topTint: 'bg-[#f1dbe4] dark:bg-[#5a3042]',
    iconBg: 'bg-[#faeaf0] dark:bg-[#6f3b50]',
    iconColor: 'text-[#df2f64] dark:text-rose-300',
  },
];

const rawQuestionBankQuestions = {
  'data-structures-algorithms': [
    {
      id: 'q-101',
      title: 'Two Sum',
      difficulty: 'Easy',
      track: 'Data Structures & Algorithms',
      created: '2024-03-01',
      status: 'Active',
    },
    {
      id: 'q-102',
      title: 'Reverse Linked List',
      difficulty: 'Medium',
      track: 'Data Structures & Algorithms',
      created: '2024-03-05',
      status: 'Active',
    },
    {
      id: 'q-103',
      title: 'Binary Tree Level Order Traversal',
      difficulty: 'Medium',
      track: 'Data Structures & Algorithms',
      created: '2024-04-10',
      status: 'Active',
    },
    {
      id: 'q-104',
      title: 'Maximum Subarray Sum',
      difficulty: 'Easy',
      track: 'Data Structures & Algorithms',
      created: '2024-05-10',
      status: 'Active',
    },
  ],
  'web-development': [
    {
      id: 'q-201',
      title: 'Create Responsive Navbar',
      difficulty: 'Easy',
      track: 'Web Development',
      created: '2024-03-06',
      status: 'Active',
    },
    {
      id: 'q-202',
      title: 'Debounced Search in React',
      difficulty: 'Medium',
      track: 'Web Development',
      created: '2024-04-01',
      status: 'Active',
    },
    {
      id: 'q-203',
      title: 'JWT Protected Route Setup',
      difficulty: 'Medium',
      track: 'Web Development',
      created: '2024-05-11',
      status: 'Active',
    },
  ],
  'python-programming': [
    {
      id: 'q-301',
      title: 'DataFrame Cleanup Pipeline',
      difficulty: 'Easy',
      track: 'Python Programming',
      created: '2024-03-12',
      status: 'Active',
    },
  ],
  'database-management': [
    {
      id: 'q-401',
      title: 'Optimized Join Query',
      difficulty: 'Medium',
      track: 'Database Management',
      created: '2024-03-19',
      status: 'Active',
    },
  ],
  'machine-learning': [
    {
      id: 'q-501',
      title: 'Linear Regression Baseline',
      difficulty: 'Medium',
      track: 'Machine Learning',
      created: '2024-04-02',
      status: 'Active',
    },
  ],
};

const questionDetailsByTitle = {
  'Two Sum': {
    tags: ['Array', 'Hash Map'],
    description: 'Given an array of integers, return indices of the two numbers that add up to a specific target.',
    inputFormat: 'Array of integers and target',
    outputFormat: 'Array of two indices',
    visibleTestCases: [
      { input: '[2,7,11,15], 9', output: '[0,1]', explanation: '' },
      { input: '[3,2,4], 6', output: '[1,2]', explanation: '' },
    ],
    hiddenTestCases: [
      { input: '[1,5,3,7], 8', output: '[0,3]', explanation: '' },
    ],
    timeLimit: '2',
    memoryLimit: '256',
    solved: '1,245',
    referenceLanguage: 'C++',
    solutionCode: 'vector<int> twoSum(vector<int>& nums, int target) {\n  unordered_map<int, int> seen;\n  for (int i = 0; i < nums.size(); i++) {\n    int rem = target - nums[i];\n    if (seen.count(rem)) return {seen[rem], i};\n    seen[nums[i]] = i;\n  }\n  return {};\n}',
    editorial: 'Use a hash map to store value to index while scanning once. Check complement before storing current value.',
  },
};

const buildMockDetails = (question) => {
  const explicit = questionDetailsByTitle[question.title];
  if (explicit) {
    return {
      ...question,
      ...explicit,
    };
  }

  const defaultsByDifficulty = {
    Easy: {
      timeLimit: '1',
      memoryLimit: '256',
      solved: '980',
    },
    Medium: {
      timeLimit: '2',
      memoryLimit: '256',
      solved: '640',
    },
    Hard: {
      timeLimit: '3',
      memoryLimit: '512',
      solved: '320',
    },
  };

  const defaults = defaultsByDifficulty[question.difficulty] || defaultsByDifficulty.Medium;

  return {
    ...question,
    tags: [(question.track || 'General').split(' ')[0], question.difficulty || 'Medium'],
    description: `Solve "${question.title || 'this problem'}" using an efficient approach and handle edge cases.`,
    inputFormat: 'Input constraints and parameters are provided as standard function arguments.',
    outputFormat: 'Return the expected output in the required format.',
    visibleTestCases: [
      { input: 'Sample input 1', output: 'Sample output 1', explanation: '' },
      { input: 'Sample input 2', output: 'Sample output 2', explanation: '' },
    ],
    hiddenTestCases: [
      { input: 'Hidden input 1', output: 'Hidden output 1', explanation: '' },
    ],
    timeLimit: defaults.timeLimit,
    memoryLimit: defaults.memoryLimit,
    solved: defaults.solved,
    referenceLanguage: 'C++',
    solutionCode: '// Add reference solution here',
    editorial: 'Add explanation/editorial for this question.',
  };
};

export const questionBankQuestions = Object.fromEntries(
  Object.entries(rawQuestionBankQuestions).map(([slug, questions]) => [
    slug,
    questions.map((question) => buildMockDetails(question)),
  ])
);

export const getQuestionCategoryBySlug = (slug) =>
  questionCategories.find((category) => category.slug === slug);
