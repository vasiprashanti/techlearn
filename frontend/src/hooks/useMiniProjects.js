import { useEffect, useState } from "react";
import axios from "axios";

const useMiniProjects = () => {
  const [miniProjects, setMiniProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/mini-projects`)
      .then((res) => setMiniProjects(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { miniProjects, loading, error };
};

export default useMiniProjects;
