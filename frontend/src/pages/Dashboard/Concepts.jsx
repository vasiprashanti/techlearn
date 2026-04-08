// pages/Concepts.jsx
import React, { useState, useEffect } from "react";
import CourseCard from "../components/CourseCard";
import { conceptsData } from "../data/coursesData";

/**
 * Concepts page — /concepts
 *
 * MERN Integration note:
 * Replace static import + state initializer with:
 *
 *   useEffect(() => {
 *     axios.get("/api/concepts")
 *       .then((res) => setCourses(res.data))
 *       .catch((err) => { setError(true); console.error(err); })
 *       .finally(() => setLoading(false));
 *   }, []);
 */

const Concepts = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // --- Placeholder for API call ---
    // axios.get("/api/concepts").then(...).catch(...).finally(...)
    const timer = setTimeout(() => {
      setCourses(conceptsData);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

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
          Important Concepts
        </h1>
        <p style={{ fontSize: "14px", color: "#718096", margin: 0 }}>
          Core CS concepts every engineer must know
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Search concepts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "320px",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1.5px solid #e2e8f0",
            fontSize: "13px",
            color: "#1a202c",
            outline: "none",
            background: "#ffffff",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#1a73e8")}
          onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
        />
      </div>

      {/* States */}
      {loading && (
        <p style={{ color: "#718096", fontSize: "14px" }}>Loading concepts…</p>
      )}

      {error && (
        <p style={{ color: "#e53e3e", fontSize: "14px" }}>
          Failed to load concepts. Please try again.
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
            {filtered.length} topic{filtered.length !== 1 ? "s" : ""}
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
          {filtered.length === 0 && (
            <p style={{ color: "#a0aec0", fontSize: "14px", marginTop: "8px" }}>
              No concepts match "{search}".
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default Concepts;
