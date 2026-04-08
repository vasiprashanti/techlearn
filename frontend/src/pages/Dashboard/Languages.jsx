// pages/Languages.jsx
import React, { useState, useEffect } from "react";
import CourseCard from "../components/CourseCard";
import { languagesData } from "../data/coursesData";

/**
 * Languages page — /languages
 *
 * MERN Integration note:
 * Replace the static import + useState initializer below with an
 * axios GET call once your backend is ready:
 *
 *   useEffect(() => {
 *     axios.get("/api/languages")
 *       .then((res) => setCourses(res.data))
 *       .catch((err) => { setError(true); console.error(err); })
 *       .finally(() => setLoading(false));
 *   }, []);
 */

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

const Languages = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    // --- Placeholder for API call ---
    // axios.get("/api/languages").then(...).catch(...).finally(...)
    // For now, load static data with a tiny artificial delay
    const timer = setTimeout(() => {
      setCourses(languagesData);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered =
    filter === "All" ? courses : courses.filter((c) => c.level === filter);

  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Page header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "700",
            color: "#1a202c",
            margin: "0 0 4px",
          }}
        >
          Programming Languages
        </h1>
        <p style={{ fontSize: "14px", color: "#718096", margin: 0 }}>
          Build strong language fundamentals for technical interviews
        </p>
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {LEVELS.map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilter(lvl)}
            style={{
              padding: "6px 16px",
              borderRadius: "999px",
              border: "1.5px solid",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.15s ease",
              borderColor: filter === lvl ? "#1a73e8" : "#e2e8f0",
              background: filter === lvl ? "#1a73e8" : "#ffffff",
              color: filter === lvl ? "#ffffff" : "#4a5568",
            }}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* States */}
      {loading && (
        <p style={{ color: "#718096", fontSize: "14px" }}>Loading courses…</p>
      )}

      {error && (
        <p style={{ color: "#e53e3e", fontSize: "14px" }}>
          Failed to load courses. Please try again.
        </p>
      )}

      {/* Grid */}
      {!loading && !error && (
        <>
          <p
            style={{
              fontSize: "13px",
              color: "#a0aec0",
              marginBottom: "16px",
            }}
          >
            {filtered.length} course{filtered.length !== 1 ? "s" : ""}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {filtered.map((course) => (
              <CourseCard key={course.id} {...course} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Languages;
