import axios from "axios";
import { LANGUAGE_IDS } from "../utils/judgeUtil.js";

const JUDGE0_API =
  "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true";

const HEADERS = {
  "Content-Type": "application/json",
  "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
};

export const compileCode = async (req, res) => {
  const { language, source_code, stdin } = req.body;

  const language_id = LANGUAGE_IDS[language];
  if (!language_id)
    return res.status(400).json({ error: "Invalid language selected" });

  if (!process.env.RAPIDAPI_KEY) {
    console.warn("WARNING: RAPIDAPI_KEY is not defined in .env. Falling back to mock compiler output for testing.");
    // Simulate successful output execution
    return res.json({
      stdout: `[Mock Execution Result]\nCompiled and executed successfully.\nLanguage: ${language}\nInput: ${stdin || "None"}\nSource length: ${source_code ? source_code.length : 0} characters.`,
      stderr: null,
      compile_output: null,
      status: {
        id: 3,
        description: "Accepted"
      }
    });
  }

  try {
    const response = await axios.post(
      JUDGE0_API,
      {
        source_code,
        language_id,
        stdin,
      },
      { headers: HEADERS }
    );

    const { stdout, stderr, compile_output, status } = response.data;
    return res.json({ stdout, stderr, compile_output, status });
  } catch (err) {
    console.error(
      "Compilation error:",
      err.response?.data || err.message || err
    );
    return res.status(500).json({ error: "Compilation failed" });
  }
};
