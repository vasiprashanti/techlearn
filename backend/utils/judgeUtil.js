import axios from "axios";

// Judge0 API configuration
const JUDGE0_API =
  "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true";
const JUDGE0_HEADERS = {
  "Content-Type": "application/json",
  "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
};

const LANGUAGE_IDS = {
  html: 43,
  css: 44,
  javascript: 63,
  js: 63,
  java: 62,
  python: 71,
  python3: 71,
  c: 50,
  cpp: 54,
  "c++": 54,
};

// Simple function to normalize output for comparison
const normalizeOutput = (output) => {
  if (!output) return "";
  return output.toString().trim();
};

// Test code against a test case using Judge0 API
const testCodeWithJudge0 = async (
  sourceCode,
  languageId,
  input,
  expectedOutput
) => {
  try {
    const response = await axios.post(
      JUDGE0_API,
      {
        source_code: sourceCode,
        language_id: languageId,
        stdin: input || "",
      },
      {
        headers: JUDGE0_HEADERS,
        timeout: 30000, // 30 second timeout
      }
    );

    const { stdout, stderr, status, compile_output } = response.data;

    // Check if execution was successful
    const isAccepted = status.id === 3; // Status 3 = Accepted

    // Normalize outputs for comparison
    const actualOutput = normalizeOutput(stdout);
    const expectedNormalized = normalizeOutput(expectedOutput);

    // Check if outputs match
    const outputMatches = actualOutput === expectedNormalized;

    return {
      success: isAccepted,
      passed: isAccepted && outputMatches, // Combined check for both execution success and output match
      outputMatches,
      actualOutput: stdout || "",
      expectedOutput,
      error: stderr || compile_output || "",
      statusId: status.id,
      statusDescription: status.description,
      executionTime: response.data.time || null, // Add execution time if available
    };
  } catch (error) {
    console.error("Judge0 API Error:", error.message);
    return {
      success: false,
      passed: false, // Always false on error
      outputMatches: false,
      actualOutput: "",
      expectedOutput,
      error: `API Error: ${error.message}`,
      statusId: null,
      statusDescription: "API Error",
      executionTime: null,
    };
  }
};

export { testCodeWithJudge0, normalizeOutput, LANGUAGE_IDS };
