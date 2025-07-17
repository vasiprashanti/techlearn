import { useEffect, useState } from "react";
import axios from "axios";

const useMajorProjects = () => {
  const [majorProjects, setMajorProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/major-projects/build/major-projects`)
      .then((res) => setMajorProjects(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { majorProjects, loading, error };
};

export default useMajorProjects;
