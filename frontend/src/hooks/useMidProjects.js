import { useState, useEffect } from "react";
import axios from "axios";

const useMidProjects = () => {
  const [midProjects, setMidProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/mid-projects/build/mid-projects`)
      .then((res) => {
        console.log("Fetched mid-projects:", res.data);
        setMidProjects(res.data)})
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { midProjects, loading, error };
};

export default useMidProjects;
