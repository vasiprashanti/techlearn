import axios from "axios";

const JUDGE0_API =
  "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true";

const HEADERS = {
  "Content-Type": "application/json",
  "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
};

const LANGUAGE_IDS = {
  python: 71,
  java: 62,
};

export const compileCode = async (req, res) => {
  const { language, source_code, stdin } = req.body;

  const language_id = LANGUAGE_IDS[language];
  if (!language_id)
    return res.status(400).json({ error: "Invalid language selected" });

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
