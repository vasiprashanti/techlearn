import { LANGUAGE_IDS, executeCodeWithJudge0 } from "../utils/judgeUtil.js";

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

  try {
    const result = await executeCodeWithJudge0({
      sourceCode: source_code,
      languageId: language_id,
      stdin,
    });

    const { stdout, stderr, compile_output, status, time, memory } = result;
    return res.json({ stdout, stderr, compile_output, status, time, memory });
  } catch (err) {
    console.error(
      "Compilation error:",
      err.response?.data || err.message || err
    );
    const statusCode = err.response?.status;
    const upstreamMessage = err.response?.data?.message || err.response?.data?.error || err.message;
    return res.status(statusCode === 429 ? 429 : 500).json({
      error: statusCode === 429
        ? "Compiler service is rate limited right now. Please wait a minute and try again."
        : "Compilation failed",
      details: upstreamMessage,
    });
  }
};
