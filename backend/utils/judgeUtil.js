import axios from "axios";

// Unified Judge0 paid plan config resolver
export const getJudge0Config = () => {
  const url = process.env.JUDGE0_API_URL || "https://ce.judge0.com";
  const headers = { "Content-Type": "application/json" };
  
  const key = process.env.JUDGE0_API_KEY || process.env.JUDGE0_AUTH_TOKEN;
  if (key) {
    headers["X-Auth-Token"] = key;
  }
  
  return { url, headers };
};

export const isJudge0Configured = () => {
  return !!getJudge0Config().url;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isJudge0TerminalStatus = (statusId) => Number(statusId) > 2;

const executeCodeWithJudge0 = async ({
  sourceCode,
  languageId,
  stdin = "",
  timeoutMs = 45000,
  pollIntervalMs = 1000,
}) => {
  const { url, headers } = getJudge0Config();
  const baseUrl = url.replace(/\/+$/, "");
  const createEndpoint = `${baseUrl}/submissions?base64_encoded=false`;

  const createResponse = await axios.post(
    createEndpoint,
    {
      source_code: sourceCode,
      language_id: languageId,
      stdin,
    },
    {
      headers,
      timeout: 15000,
    }
  );

  if (createResponse.data?.status?.id) {
    return createResponse.data;
  }

  const token = createResponse.data?.token;
  if (!token) {
    throw new Error("Judge0 did not return a submission token.");
  }

  const resultEndpoint = `${baseUrl}/submissions/${token}?base64_encoded=false`;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const resultResponse = await axios.get(resultEndpoint, {
      headers,
      timeout: 15000,
    });

    const statusId = resultResponse.data?.status?.id;
    if (isJudge0TerminalStatus(statusId)) {
      return resultResponse.data;
    }

    await sleep(pollIntervalMs);
  }

  throw new Error("Judge0 execution timed out before returning a final result.");
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
  sql: 82,
  sqlite: 82,
  postgresql: 83,
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
    const result = await executeCodeWithJudge0({
      sourceCode,
      languageId,
      stdin: input || "",
    });

    const { stdout, stderr, status, compile_output } = result;

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
      executionTime: result.time || null, // Add execution time if available
      memory: result.memory || null, // Add execution memory if available
    };
  } catch (error) {
    console.error("Judge0 API Error:", error.message);
    const statusCode = error.response?.status;
    const apiMessage = error.response?.data?.message || error.message;
    const isRateLimited = statusCode === 429;
    return {
      success: false,
      passed: false, // Always false on error
      outputMatches: false,
      actualOutput: "",
      expectedOutput,
      error: isRateLimited
        ? "Compiler service is rate limited right now. Please wait a minute and try again."
        : `API Error: ${apiMessage}`,
      statusId: null,
      statusDescription: isRateLimited ? "Compiler Rate Limited" : "API Error",
      executionTime: null,
      memory: null,
    };
  }
};

export { testCodeWithJudge0, executeCodeWithJudge0, normalizeOutput, LANGUAGE_IDS };

