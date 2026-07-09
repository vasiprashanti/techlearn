import axios from "axios";
import { LANGUAGE_IDS, getJudge0Config, isJudge0Configured } from "../utils/judgeUtil.js";

const COMPILER_LANGUAGE_ALIASES = {
  sql: 82,
  sqlite: 82,
  postgresql: 83,
  postgres: 83,
};

const resolveCompilerLanguageId = (language) => {
  const normalizedLanguage = String(language || "").trim().toLowerCase();
  return LANGUAGE_IDS[normalizedLanguage] || COMPILER_LANGUAGE_ALIASES[normalizedLanguage];
};

export const compileCode = async (req, res) => {
  const { language, source_code, stdin } = req.body;

  const language_id = resolveCompilerLanguageId(language);
  if (!language_id)
    return res.status(400).json({ error: "Invalid language selected" });

  if (!isJudge0Configured()) {
    console.warn("WARNING: Paid Judge0 configuration is missing. Falling back to mock compiler output for testing.");
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

  const { url, headers } = getJudge0Config();
  const judgeUrl = `${url}/submissions?base64_encoded=false&wait=true`;

  try {
    const response = await axios.post(
      judgeUrl,
      {
        source_code,
        language_id,
        stdin,
      },
      { headers }
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
