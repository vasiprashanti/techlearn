# CODING TYPE SYSTEM + SUBMISSION TRACKING
## Approval Document

---

## 1. BACKEND SCHEMA STRUCTURE

### 1.1 Question Bank - Coding Question Schema
**Model:** `Question` (Enhanced Content Subdocument)

```javascript
// For categoryType = "Coding":
{
  _id: ObjectId,
  categoryId: ObjectId (ref: Category),
  categoryType: "Coding",
  
  // Content subdocument specific to Coding questions
  content: {
    constraints: String,                    // e.g., "1 <= n <= 10^5"
    visibleTestCases: [
      {
        input: String,
        output: String,
        explanation: String
      }
    ],
    hiddenTestCases: [                      // select: false by default
      {
        input: String,
        output: String
      }
    ],
    timeLimit: Number,                      // milliseconds, default: 1000
    memoryLimit: Number,                    // MB, default: 256
    starterCode: Map<String, String>,       // { "cpp": "int main() {}", "py": "def solve():" }
    referenceSolution: String,              // select: false by default
  },
  
  // Legacy fields (preserved for backward compatibility)
  title: String,
  description: String,
  difficulty: Enum ["Easy", "Medium", "Hard"],
  tags: [String],
  status: Enum ["Active", "Draft", "Archived"],
  isActive: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

### 1.2 Extended Submission Schema (ENHANCED)
**Model:** `Submission` (Extended)

**Approach:** Extend existing `Submission` model to support Question Bank submissions.

```javascript
{
  _id: ObjectId,
  
  // Core references (existing)
  studentId: ObjectId (ref: Student, required, indexed),
  questionId: ObjectId (ref: Question, required, indexed),
  batchId: ObjectId (ref: Batch, required, indexed),
  trackId: ObjectId (ref: Track, required, indexed),
  
  // Question Bank references (NEW)
  categoryId: ObjectId (ref: Category, indexed),
  categoryType: Enum ["Coding", "MCQ", "Notes"],
  
  // CodingRound integration (existing)
  codingRoundId: ObjectId (ref: CodingRound, default: null),
  attemptId: ObjectId (ref: DailyChallengeAttempt, default: null),
  
  // Submission lifecycle (NEW for Question Bank)
  startTime: Date,                          // When student initiated attempt
  endTime: Date,                            // When student submitted final code
  timeSpent: Number,                        // milliseconds from start to final submit
  
  // Submission details (Coding-specific)
  submittedCode: String,                    // Final submitted code
  language: String,                         // e.g., "cpp", "python", "java"
  languageId: Number,                       // Judge0 language ID (from LANGUAGE_IDS mapping)
  runCount: Number (default: 0),            // Total run attempts (visible test cases)
  
  // Scoring (existing fields - reuse)
  totalScore: Number,
  accuracyScore: Number,                    // Percentage of test cases passed
  efficiencyScore: Number,                  // Based on time/memory vs constraints
  disciplineScore: Number,                  // Code quality metrics
  
  // Status (existing - extended)
  status: Enum [
    "Pending",        // Not yet submitted
    "Passed",         // All test cases passed
    "Failed",         // Some test cases failed
    "PartialPass",    // Partial success
    "Timeout",        // Execution timeout
    "CompileError",   // Compilation error
    "RuntimeError",   // Runtime error
    "Error"           // General error (existing)
  ],
  
  // Final submission evaluation (NEW)
  finalSubmissionResults: {
    passedTestCases: Number,                // Count of passed test cases
    totalTestCases: Number,                 // Total visible + hidden
    testCaseDetails: [
      {
        index: Number,
        visible: Boolean,                   // Was this a visible test case?
        passed: Boolean,
        executionTime: Number,              // milliseconds
        memoryUsed: Number,                 // MB
        expectedOutput: String,
        actualOutput: String                // Only for failed tests
      }
    ],
    compileOutput: String,                  // Compile error message if any
    runtimeError: String,                   // Runtime error if any
    evaluatedAt: Date
  },
  
  // Question snapshot (for versioning)
  questionVersionId: Number,                // Question version at time of submission
  snapshotConstraints: String,              // Snapshot of constraints at submission time
  
  // Metadata
  submissionType: Enum ["coding", "track_question", "daily_challenge"],
  challengeType: Enum [
    "track_question",
    "daily_challenge"
  ],
  workingDay: Number,
  
  // Timestamps (existing)
  submittedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Enhancement Strategy:**
- Keep all existing Submission fields intact
- Add new fields with defaults to maintain backward compatibility
- Use sparse indexes for optional Question Bank fields
- Existing CodingRound submissions work as before
- New Question Bank submissions extend the same model

**Indexes (UPDATED):**
```javascript
// Existing (unchanged)
{ studentId: 1, workingDay: 1 }
{ batchId: 1, workingDay: 1 }
{ batchId: 1, trackId: 1 }
{ attemptId: 1 }, { unique: true, sparse: true }

// New Question Bank indexes
{ categoryId: 1, status: 1 }, { sparse: true }
{ studentId: 1, categoryId: 1 }, { sparse: true }
{ batchId: 1, categoryId: 1 }, { sparse: true }
{ questionVersionId: 1 }, { sparse: true }
```

---

### 1.3 CodingRound Integration Strategy (CLARIFIED)

**Architecture Decision:** Question Bank Coding Questions are **master entities**. Reuse compiler/services only.

**What We Reuse:**
- ✅ `testCodeWithJudge0()` utility function
- ✅ Judge0 API integration and language mappings (`LANGUAGE_IDS`)
- ✅ Test case evaluation logic
- ✅ Scoring algorithms (accuracy, efficiency, discipline)
- ✅ Error handling and compilation feedback

**What We Do NOT Do:**
- ❌ Auto-create separate `CodingRound` records for Question Bank submissions
- ❌ Maintain dual submission tracking systems
- ❌ Require CodingRound intermediary

**Data Flow:**
```
Student attempts Question Bank Coding Question
  ↓
Create Submission record (categoryId, categoryType, questionVersionId set)
  ↓
Call testCodeWithJudge0() directly (compiler reuse)
  ↓
Store results in Submission.finalSubmissionResults
  ↓
Query/Analytics via Submission model (single source of truth)
```

**Exception: CodingRound Legacy Support**
- Existing CodingRound submissions continue to work unchanged
- `codingRoundId` remains optional in Submission schema
- New Question Bank flow bypasses CodingRound completely
- No cross-linking required

---

---

## 1A. MULTI-LANGUAGE STRUCTURE (CLARIFIED)

### Language-Based Starter Code & Reference Solution

Replace loose `Map<String, String>` with explicit schemas:

```javascript
// starterCodeSchema
{
  cpp: {
    code: String,
    version: Number (default: 1)
  },
  python: {
    code: String,
    version: Number (default: 1)
  },
  java: {
    code: String,
    version: Number (default: 1)
  },
  javascript: {
    code: String,
    version: Number (default: 1)
  }
  // ... other supported languages
}

// Applied in contentSchema:
const contentSchema = {
  // ... other fields
  starterCode: {
    type: new mongoose.Schema(
      {
        cpp: { code: String, version: { type: Number, default: 1 } },
        python: { code: String, version: { type: Number, default: 1 } },
        java: { code: String, version: { type: Number, default: 1 } },
        javascript: { code: String, version: { type: Number, default: 1 } },
        // ... extend as needed
      },
      { _id: false }
    ),
    default: {}
  },
  referenceSolution: {
    type: new mongoose.Schema(
      {
        cpp: { code: String, version: { type: Number, default: 1 } },
        python: { code: String, version: { type: Number, default: 1 } },
        java: { code: String, version: { type: Number, default: 1 } },
        javascript: { code: String, version: { type: Number, default: 1 } },
        // ... extend as needed
      },
      { _id: false, select: false }  // Hide reference solutions by default
    ),
    default: {}
  }
}
```

**Supported Language Whitelist:**
```javascript
const SUPPORTED_LANGUAGES = {
  cpp: 54,          // Judge0 language ID
  python: 71,
  java: 62,
  javascript: 63,
  c: 50,
  csharp: 51,
  go: 60,
  rust: 73
}
```

**Validation Rules:**
- At least one language must have starter code
- Language must be in SUPPORTED_LANGUAGES whitelist
- Code size must not exceed 10KB per language
- All specified languages must have equivalent versions

---

## 1C. QUESTION VERSIONING STRATEGY (CLARIFIED)

**Problem:** What happens if test cases or constraints are edited after students submit?

**Solution:** Snapshot approach with versioning support.

### Question Model Enhancement
```javascript
{
  // existing fields
  title: String,
  description: String,
  
  // NEW: Versioning support
  version: {
    type: Number,
    default: 1,
    index: true
  },
  versionHistory: [
    {
      version: Number,
      changedAt: Date,
      changedBy: ObjectId (ref: User),
      changes: {
        description: String,           // What changed
        fieldsModified: [String]      // Which fields were modified
      }
    }
  ],
  
  // Content with version tracking
  content: {
    // ... other fields
    visibleTestCases: [{...}],
    hiddenTestCases: [{...}],
    constraints: String,
    contentVersion: {
      type: Number,
      default: 1
    }
  }
}
```

### Submission Snapshot Fields
```javascript
{
  // In Submission model
  questionVersionId: Number,                // Question.version at submission time
  contentVersionId: Number,                 // Question.content.contentVersion
  
  // Snapshot critical fields to handle post-submission edits
  snapshotConstraints: String,
  snapshotVisibleTestCases: [{...}],
  snapshotHiddenTestCases: [{...}],        // Isolated for security
  snapshotTimeLimit: Number,
  snapshotMemoryLimit: Number
}
```

**Versioning Rules:**
1. Increment `Question.version` when title/description changes
2. Increment `content.contentVersion` when test cases/constraints/timeLimit/memoryLimit change
3. Every submission captures version IDs + critical snapshots
4. Evaluation uses snapshots (not live question data)
5. Allow question edits; submissions are immutable point-in-time records

**Consequence:**
- Students who submitted before an edit are evaluated against old test cases
- New students see new test cases
- Full traceability and fairness maintained

---

## 2. CODING FORM FIELDS (Frontend)

When `category.categoryType === "Coding"`:

### Admin Create/Edit Coding Question
```
- Question Title (required, string)
- Description (required, textarea)
- Difficulty (dropdown: Easy, Medium, Hard)
- Constraints (textarea)
- Starter Code (code editor, multiLanguage: cpp, python, java, etc.)
- Reference Solution (code editor, hidden from students)
- Time Limit (number input, default: 1000ms)
- Memory Limit (number input, default: 256MB)
- Visible Test Cases (dynamic form array)
  - Input (textarea)
  - Output (textarea)
  - Explanation (optional, textarea)
- Hidden Test Cases (dynamic form array)
  - Input (textarea)
  - Output (textarea)
- Tags (multi-select)
- Status (dropdown: Active, Draft, Archived)
```

### Student Attempt Coding Question
```
- Problem Statement (title + description + constraints)
- Visible Test Cases (display only)
- Code Editor (multiLanguage support: cpp, python, java, etc.)
- Language Selector (dropdown)
- Run Code Button (tests against visible test cases)
- Submit Button (submit for evaluation against all test cases)
- Submission Results Display
```

---

## 3. SUBMISSION LIFECYCLE & STORAGE STRATEGY (CLARIFIED)

### 3.1 Submission Lifecycle Approach

**Design Decision:** ONE submission document per attempt with immutable final results.

**Lifecycle Flow:**

```
[Student Initiates Attempt]
  ↓
POST /api/question-bank/questions/:questionId/submissions/start
  - Create ONE Submission record per student per question per session
  - Set: startTime, categoryId, categoryType, questionVersionId, snapshotFields
  - status = "Pending"
  - Response: { submissionId, questionId, questionVersionId, ... }
  
[Student Works on Code - Multiple Runs]
  ↓
POST /api/question-bank/submissions/:submissionId/run (call N times)
  - Run code against VISIBLE test cases only
  - Update: runCount++
  - DO NOT PERSIST detailed run results (only increment counter)
  - Response: { runCount, feedback, passingTestCases }
  - Submission doc NOT updated with individual run results

[Student Submits Final Solution]
  ↓
POST /api/question-bank/submissions/:submissionId/submit
  - Execute code against ALL test cases (visible + hidden)
  - Calculate finalSubmissionResults with full details
  - Update Submission:
    - status (Passed | Failed | PartialPass | Timeout | CompileError)
    - submittedCode (final code)
    - finalSubmissionResults (detailed test results + snapshots)
    - submittedAt (timestamp)
    - timeSpent (endTime - startTime)
  - Mark as IMMUTABLE
  - Response: { submissionId, status, scores, results }

[Submission Complete]
  - This Submission doc is final and archived
  - If student wants to retry: create NEW Submission (new session)
  - No updates allowed after final submit
```

**Key Properties:**
- ✅ One Submission doc per attempt
- ✅ Light updates during "Run" phase (only increment runCount)
- ✅ Heavy update on final "Submit" (full test results, scores)
- ✅ Immutable after final submit
- ✅ Multiple attempts = Multiple Submission docs
- ✅ Enables accurate tracking of attempt history

### Run Results Storage Strategy

```javascript
// DURING "Run Code" Phase:
// NO STORAGE of detailed test results
POST /run response: {
  runCount: 5,
  feedback: "2/3 visible test cases passed",
  passingCount: 2,
  totalVisibleTestCases: 3
}
// Submission record only updated: { runCount: 5 }

// AFTER "Submit" Phase:
// FULL STORAGE of evaluation
{
  finalSubmissionResults: {
    passedTestCases: 8,
    totalTestCases: 10,
    testCaseDetails: [
      {
        index: 0,
        visible: true,
        passed: true,
        executionTime: 45,
        memoryUsed: 12
      },
      // ... detailed results for ALL test cases
    ],
    compileOutput: null,
    evaluatedAt: Date
  }
}
```

**Storage Optimization:**
- Run phase: O(1) update (increment only)
- Submit phase: O(n) storage where n = total test cases
- No intermediate test results persisted
- Reduces database bloat significantly
- Improves query performance

---

### 3.2 API Routes

**Base:** `/api/question-bank/submissions`

#### Student Routes (Authenticated)

```
POST   /questions/:questionId/submissions/start
  - Start a submission attempt
  - Body: { languageId, batchId? }
  - Response: { submissionId, questionId, categoryId, timeLimit }

POST   /:submissionId/run
  - Run code against visible test cases
  - Body: { code, language }
  - Response: { 
      submissionId, 
      runCount, 
      testCaseResults: [{ passed, expectedOutput, actualOutput, executionTime }],
      feedback: "2/3 test cases passed"
    }

POST   /:submissionId/submit
  - Submit final solution (tests against all cases)
  - Body: { code, language }
  - Response: { 
      submissionId, 
      status: "Passed" | "Failed" | "PartialPass",
      totalScore, 
      accuracyScore, 
      efficiencyScore,
      testCaseResults,
      timeSpent
    }

GET    /:submissionId
  - Get submission details
  - Response: { submissionId, questionId, studentId, status, scores, results }
```

---

#### Admin Routes (Protected: admin + protect middleware)

```
GET    /batch/:batchId
  - Get all submissions for a batch
  - Query params: ?categoryId=X&status=Y&page=1&limit=20
  - Response: { 
      submissions: [{
        submissionId, studentId, studentName, questionId,
        categoryId, status, totalScore, accuracyScore,
        submittedAt, timeSpent
      }],
      pagination: { total, page, limit }
    }

GET    /student/:studentId
  - Get all submissions by a student
  - Query params: ?batchId=X&categoryId=Y&status=Z&page=1&limit=20
  - Response: { 
      submissions: [{ submissionId, questionId, categoryId, status, totalScore, submittedAt }],
      pagination: { total, page, limit }
    }

GET    /category/:categoryId
  - Get all submissions for questions in a category
  - Query params: ?batchId=X&page=1&limit=20
  - Response: { 
      submissions: [{ submissionId, studentId, questionId, status, totalScore, submittedAt }],
      pagination: { total, page, limit }
    }

GET    /batch/:batchId/stats
  - Batch submission analytics
  - Response: {
      totalSubmissions,
      totalStudents,
      averageScore,
      statusBreakdown: { Passed, Failed, PartialPass, ... },
      topPerformers: [ { studentId, studentName, submissions, avgScore } ],
      categoryStats: [{
        categoryId, categoryTitle, categoryType,
        submissions, avgScore, passPercentage
      }],
      timingAnalytics: {
        avgTimeSpent,
        avgRunsPerQuestion,
        submissionsPerDay
      }
    }

GET    /student/:studentId/progress
  - Student progress dashboard
  - Response: {
      studentId, studentName,
      totalAttempts,
      passed, failed, partialPass,
      totalScore, averageScore,
      categoryProgress: [{
        categoryId, categoryTitle,
        attempted, completed, avgScore
      }]
    }

GET    /stats/analytics
  - Platform-wide submission analytics
  - Query params: ?batchId=X&startDate=Y&endDate=Z
  - Response: {
      totalSubmissions, uniqueStudents,
      submissionsByStatus: { Passed, Failed, ... },
      submissionsByCategory: [{categoryId, count, avgScore}],
      topStudents: [...],
      submissionTrends: {
        byDay: [{date, count, avgScore}],
        byCategory: [...]
      }
    }
```

---

## 4. REQUEST/RESPONSE FORMAT

### 4.1 Start Submission
**Request:**
```json
POST /api/question-bank/questions/65a1b2c3d4e5f6g7h8i9j0k1/submissions/start
{
  "languageId": "cpp",
  "batchId": "65a1b2c3d4e5f6g7h8i9j0k2"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "submissionId": "65b2c3d4e5f6g7h8i9j0k1l2",
    "questionId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "categoryId": "65a1b2c3d4e5f6g7h8i9j0k0",
    "categoryType": "Coding",
    "questionTitle": "Two Sum",
    "timeLimit": 1000,
    "memoryLimit": 256,
    "starterCode": {
      "cpp": "int main() {\n  // Your code here\n  return 0;\n}"
    },
    "startTime": "2025-05-15T10:30:00Z"
  }
}
```

---

### 4.2 Run Code (Against Visible Test Cases)
**Request:**
```json
POST /api/question-bank/submissions/65b2c3d4e5f6g7h8i9j0k1l2/run
{
  "code": "int main() {\n  cout << \"Hello\";\n  return 0;\n}",
  "language": "cpp"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "submissionId": "65b2c3d4e5f6g7h8i9j0k1l2",
    "runCount": 1,
    "testCaseResults": [
      {
        "testCaseIndex": 0,
        "passed": true,
        "expectedOutput": "Hello",
        "actualOutput": "Hello",
        "executionTime": 45
      },
      {
        "testCaseIndex": 1,
        "passed": false,
        "expectedOutput": "World",
        "actualOutput": "Hello",
        "executionTime": 40
      }
    ],
    "feedback": "2/3 test cases passed",
    "compileOutput": null
  }
}
```

---

### 4.3 Submit Final Solution
**Request:**
```json
POST /api/question-bank/submissions/65b2c3d4e5f6g7h8i9j0k1l2/submit
{
  "code": "int main() {\n  cout << \"Hello World\";\n  return 0;\n}",
  "language": "cpp"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "submissionId": "65b2c3d4e5f6g7h8i9j0k1l2",
    "status": "Passed",
    "totalScore": 100,
    "accuracyScore": 100,
    "efficiencyScore": 95,
    "disciplineScore": 85,
    "timeSpent": 300000,
    "runCount": 3,
    "testCaseResults": [
      {
        "testCaseIndex": 0,
        "passed": true,
        "executionTime": 45,
        "memoryUsed": 12
      },
      {
        "testCaseIndex": 1,
        "passed": true,
        "executionTime": 50,
        "memoryUsed": 14
      },
      {
        "testCaseIndex": 2,
        "passed": true,
        "executionTime": 48,
        "memoryUsed": 13
      }
    ],
    "submittedAt": "2025-05-15T10:35:00Z"
  }
}
```

---

### 4.4 Batch Submissions Analytics
**Request:**
```json
GET /api/question-bank/submissions/batch/65a1b2c3d4e5f6g7h8i9j0k2/stats
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "batchId": "65a1b2c3d4e5f6g7h8i9j0k2",
    "batchName": "Batch A",
    "totalSubmissions": 245,
    "uniqueStudents": 50,
    "averageScore": 78.5,
    "statusBreakdown": {
      "Passed": 150,
      "Failed": 65,
      "PartialPass": 25,
      "Timeout": 5
    },
    "topPerformers": [
      {
        "studentId": "65a1b2c3d4e5f6g7h8i9j0k5",
        "studentName": "John Doe",
        "submissions": 25,
        "averageScore": 95
      }
    ],
    "categoryStats": [
      {
        "categoryId": "65a1b2c3d4e5f6g7h8i9j0k0",
        "categoryTitle": "DSA",
        "categoryType": "Coding",
        "submissions": 120,
        "averageScore": 82,
        "passPercentage": 65
      }
    ],
    "timingAnalytics": {
      "averageTimeSpent": 420000,
      "averageRunsPerQuestion": 3.2,
      "submissionsPerDay": 24.5
    }
  }
}
```

---

## 5. INTEGRATION POINTS

### 5.1 Question Bank → Practice
When student attempts a Coding question from Practice module:
- Create Submission record (extended model with categoryId, categoryType)
- Link via `questionId` and `categoryId`
- Track in batch submissions

### 5.2 Question Bank → Track Templates
When Coding question is part of a Track Template:
- Submissions automatically linked to `trackId`
- Daily progress tracked
- Contribute to Track completion

### 5.3 Question Bank → Daily Challenges
When a Coding question is set as Daily Challenge:
- Create Submission record with categoryId, categoryType, and optional attemptId reference
- Reuse existing daily challenge services/utilities (rate limits, attempt tracking)
- Do NOT create separate CodingRound entities; Question Bank question is the master entity
- Apply daily challenge rate limits (max runs, time window)
- Track in daily challenge analytics

---

## 6. CORE INTEGRATIONS

### 6.1 Reuse Existing Coding Round Logic
✅ **Compiler Flow:** Use existing `testCodeWithJudge0()` from `utils/judgeUtil.js`
✅ **Language Support:** Leverage existing `LANGUAGE_IDS` mapping
✅ **Test Case Logic:** Reuse visible/hidden test case structure
✅ **Score Calculation:** Apply existing accuracy/efficiency/discipline scoring

### 6.2 Connection to Central Question Bank
- Every Coding submission tracks: `questionId`, `categoryId`, `categoryType`
- Enables unified reporting across Practice, Tracks, Daily Challenges
- Question Bank becomes the master reference system

---

## 6A. EXECUTION & SECURITY CONSTRAINTS (CLARIFIED)

### Timeout Enforcement
```javascript
const EXECUTION_CONSTRAINTS = {
  // Per question: override with Question.content.timeLimit
  // Default for single test case: 1000ms
  // Judge0 enforces via cpu_time_limit parameter
  maxTimePerTestCase: 1000,      // milliseconds (1 second)
  maxTotalExecutionTime: 10000,  // 10 seconds max for all test cases in submit
  graceTime: 50                  // milliseconds buffer before timeout
}

// Implementation: Pass to testCodeWithJudge0()
await testCodeWithJudge0({
  code,
  languageId,
  input: testCase.input,
  expectedOutput: testCase.output,
  timeLimit: question.content.timeLimit || 1000,  // Use question-specific limit
  memoryLimit: question.content.memoryLimit || 256  // MB
})
```

### Memory Limits
```javascript
const MEMORY_CONSTRAINTS = {
  // Per question: override with Question.content.memoryLimit
  // Default: 256MB
  maxMemoryPerTest: 256,         // MB (megabytes)
  totalMemoryAllowed: 512,       // For entire submission (run + submit)
  hardLimit: 1024                // Absolute max, circuit breaker
}

// Judge0 enforces via memory_limit parameter (bytes)
memoryLimit: (question.content.memoryLimit || 256) * 1024 * 1024  // Convert to bytes
```

### Supported Language Whitelist
```javascript
const ALLOWED_LANGUAGES = {
  cpp: { id: 54, name: "C++ (GCC 9.2.0)" },
  python: { id: 71, name: "Python (3.8.1)" },
  java: { id: 62, name: "Java (OpenJDK 13.0.1)" },
  javascript: { id: 63, name: "JavaScript (Node.js 12.14.0)" },
  c: { id: 50, name: "C (GCC 9.2.0)" },
  csharp: { id: 51, name: "C# (Mono 6.6.0.161)" },
  go: { id: 60, name: "Go (1.13.5)" },
  rust: { id: 73, name: "Rust (1.40.0)" }
}

// Validation: Reject any language not in this list at submission time
if (!ALLOWED_LANGUAGES[language]) {
  throw new Error(`Language ${language} is not supported`)
}
```

### Infinite Loop & Excessive Resource Protection
```javascript
const PROTECTION_STRATEGIES = {
  // 1. Judge0 timeout handles most infinite loops
  timeout: 1000,  // Code execution aborts after 1 second
  
  // 2. Memory limit catches excessive allocations
  memoryLimit: 256 * 1024 * 1024,  // 256MB
  
  // 3. Input validation: reject suspiciously large inputs
  maxInputSize: 1024 * 1024,  // 1MB max per test case input
  
  // 4. Output validation: truncate excessive outputs
  maxOutputSize: 10 * 1024,  // 10KB max expected output
  
  // 5. Pre-submission code analysis (optional, future)
  // Could scan for known patterns: while(1), fork bombs, etc.
  
  // 6. Execution watchdog: safety net for runaway processes
  processTimeout: 2000  // Kill process if still running after 2 seconds
}

// Implementation:
if (input.length > PROTECTION_STRATEGIES.maxInputSize) {
  return { error: "Input too large", status: "Error" }
}
if (actualOutput.length > PROTECTION_STRATEGIES.maxOutputSize) {
  actualOutput = actualOutput.substring(0, PROTECTION_STRATEGIES.maxOutputSize) + "..."
}
```

### Rate Limiting Strategy
```javascript
const RATE_LIMITS = {
  // Student run limit per question per day
  runsPerQuestion: {
    interval: 24 * 60 * 60 * 1000,  // 24 hours
    max: 10                          // 10 runs maximum per day per question
  },
  
  // Submission limit (final submits)
  submitsPerQuestion: {
    interval: 24 * 60 * 60 * 1000,
    max: 5                           // 5 final submissions per day
  },
  
  // Global rate limit per student (across all questions)
  globalRuns: {
    interval: 60 * 1000,            // 1 minute window
    max: 20                         // Max 20 runs across all questions per minute
  },
  
  // Batch-specific override
  batchOverrides: {
    // Can be configured per batch/track for contests
    // E.g., daily_challenge: { runsPerQuestion: 3, submitsPerQuestion: 1 }
  }
}

// Implementation: Use express-rate-limit middleware
const runRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.runsPerQuestion.interval,
  max: RATE_LIMITS.runsPerQuestion.max,
  keyGenerator: (req) => `${req.user._id}:${req.params.questionId}:run`
})

app.post('/submissions/:submissionId/run', runRateLimiter, async (req, res) => {
  // handle run request
})
```

### Max Code Size Limits
```javascript
const CODE_SIZE_LIMITS = {
  maxCodeLength: 50000,           // 50KB max per submission
  maxStarterCodeLength: 10000,    // 10KB per language starter
  maxReferenceSolutionLength: 20000,  // 20KB per language
  
  // Reject unusual code patterns
  bannedPatterns: [
    // Could include: exec, eval, system calls, file I/O
    // Depends on judge environment security policies
  ]
}

// Validation at submission:
if (code.length > CODE_SIZE_LIMITS.maxCodeLength) {
  return { error: "Code too large (max 50KB)", status: "Error" }
}
```

### Security Summary
```javascript
const SECURITY_CHECKLIST = {
  ✅ Timeout: Judge0 enforces, configurable per question
  ✅ Memory: Judge0 enforces, configurable per question
  ✅ Languages: Whitelist-only, no arbitrary commands
  ✅ Input Size: Validated, truncated if excessive
  ✅ Output Size: Truncated to prevent log bloat
  ✅ Rate Limiting: Per-student, per-question, global
  ✅ Code Size: Max 50KB, prevents bloat
  ✅ Execution Watchdog: Process termination safety net
  ✅ Question Versioning: Snapshot protection (see 1C)
  ✅ Hidden Test Cases: Never exposed to students
}
```

---

## 7. SCORING SYSTEM ALIGNMENT (CLARIFIED)

**Design Decision:** Keep scoring aligned with existing Coding Round implementation. Do NOT introduce new scoring dimensions.

### Scoring Formula (Existing)
```javascript
const SCORING_FORMULA = {
  // Reuse existing Coding Round scoring
  
  accuracy: {
    // Percentage of test cases passed
    formula: (passedTestCases / totalTestCases) * 100,
    range: [0, 100],
    weight: 0.5
  },
  
  efficiency: {
    // Based on execution time vs time limit
    // Penalize if closer to timeout
    formula: Math.max(0, 100 - (executionTime / timeLimit) * 100),
    range: [0, 100],
    weight: 0.3
  },
  
  discipline: {
    // Code quality metrics (optional)
    // Based on: code size, execution time consistency, memory usage
    formula: calculateDisciplineScore(code, metrics),
    range: [0, 100],
    weight: 0.2
  }
}

// Total Score
totalScore = (
  accuracy * SCORING_FORMULA.accuracy.weight +
  efficiency * SCORING_FORMULA.efficiency.weight +
  discipline * SCORING_FORMULA.discipline.weight
)
```

**Why Align With Existing?**
- Consistency across platform (Coding Round, Track questions, Daily Challenges)
- Students understand scoring uniformly
- Admin reporting aggregates meaningfully
- No new formula bugs or edge cases

**Scoring Storage:**
```javascript
{
  // Store all components for detailed analysis
  accuracyScore: 85,        // 85% test cases passed
  efficiencyScore: 90,      // 90% of time limit used
  disciplineScore: 88,      // Code quality score
  totalScore: 87.7          // Weighted average
}
```

---

## 8. IMPLEMENTATION CHECKLIST (UPDATED)

## 8. IMPLEMENTATION CHECKLIST (UPDATED)

**Before Approval:**
- [ ] Schema structures approved (including versioning and multi-language)
- [ ] Submission lifecycle approach approved (one doc per attempt, immutable final results)
- [ ] Execution & security constraints approved
- [ ] Run results storage strategy approved (light during run, heavy on submit)
- [ ] API routes approved
- [ ] Request/response formats approved
- [ ] Integration points clear

**After Approval - Implementation Steps:**
1. ✅ Extend `Submission` model with Question Bank fields (categoryId, categoryType, snapshotFields, finalSubmissionResults)
2. ✅ Update `Question` model with versioning (version, versionHistory, contentVersion)
3. ✅ Refactor multi-language structure (starterCode, referenceSolution with language-specific schemas)
4. Create submission controller with lifecycle logic:
   - `POST /submissions/start` - Initialize submission
   - `POST /submissions/:submissionId/run` - Run against visible test cases (light update)
   - `POST /submissions/:submissionId/submit` - Final evaluation (full storage)
5. Create admin analytics controllers:
   - Batch-wise submissions
   - Student-wise submissions
   - Category-wise submissions
   - Platform-wide analytics
6. Wire routes at `/api/question-bank/submissions`
7. Integrate with Judge0 compiler (reuse `testCodeWithJudge0`)
8. Implement rate limiting middleware per constraints
9. Add snapshot validation and versioning logic
10. Test end-to-end coding submission flow
11. Connect to existing Practice/Track/Daily Challenge modules

---

## 9. REVISED APPROVAL QUESTIONS

**Decision 1: Submission Model Architecture**
- ❌ Old: Create new `QuestionBankSubmission` model
- ✅ New: Extend existing `Submission` model with Question Bank fields (categoryId, categoryType, snapshotFields)
- Rationale: Avoid dual submission systems, backward compatibility, single source of truth

**Decision 2: CodingRound Integration**
- ❌ Old: Auto-create CodingRound records
- ✅ New: Reuse only compiler/services; Question Bank is master entity
- Rationale: Simplified architecture, cleaner data lineage, avoid redundant records

**Decision 3: Multi-Language Support**
- ❌ Old: Loose Map<String, String> structure
- ✅ New: Explicit language-specific schemas with version tracking
- Rationale: Type safety, clear field structure, version management per language

**Decision 4: Question Versioning**
- ❌ Old: No versioning strategy
- ✅ New: Snapshot approach with version IDs and immutable submission records
- Rationale: Fair evaluation, edit tolerance, full traceability

**Decision 5: Submission Lifecycle**
- ❌ Old: Multiple submission docs per attempt
- ✅ New: ONE submission document per attempt; immutable after final submit
- Rationale: Clearer lifecycle, easier to query, prevents duplicate entries

**Decision 6: Run Results Storage**
- ❌ Old: Persist detailed results for every "Run Code" action
- ✅ New: Only increment runCount during run phase; persist full results on final submit
- Rationale: Reduces storage overhead, improves query performance, maintains full audit trail

**Decision 7: Security Constraints**
- ✅ Added comprehensive execution documentation:
  - Timeout enforcement (Judge0)
  - Memory limits (configurable)
  - Language whitelist (8 languages)
  - Infinite loop protection
  - Rate limiting (runs, submits, global)
  - Code size limits (50KB)
- Rationale: Production-ready, prevents abuse, clear constraints for students

**Decision 8: Scoring System**
- ❌ Old: Introduce new scoring dimensions
- ✅ New: Keep aligned with existing Coding Round implementation
- Rationale: Consistency, no new formula complexity, uniform student experience

---

**APPROVAL PACKET COMPLETE. Ready for implementation approval.**

All 8 feedback points have been incorporated and clarified above.

Next Step: Confirm approval, then proceed with implementation.
