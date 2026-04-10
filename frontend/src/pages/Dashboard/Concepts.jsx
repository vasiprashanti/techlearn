import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import Sidebar from "../../components/Dashboard/Sidebar";
import CourseCard from "../../components/Dashboard/CourseCard";
import { conceptsData } from "../../api/coursesData";

const Concepts = () => {
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  const isDarkMode = theme === "dark";

  useEffect(() => {
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
    <div
      className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${
        isDarkMode ? "dark" : "light"
      }`}
    >
      <div
        className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
          isDarkMode
            ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]"
            : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"
        }`}
      />

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main
        className={`flex-1 transition-all duration-700 ease-in-out z-10 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        } pt-24 pb-12 px-6 md:px-12 lg:px-16 overflow-auto`}
      >
        <div style={{ padding: "28px 32px" }}>
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

          <div style={{ marginBottom: "24px" }}>
            <input
              type="text"
              placeholder="Search concepts..."
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
              onFocus={(e) => {
                e.target.style.borderColor = "#1a73e8";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
              }}
            />
          </div>

          {loading && (
            <p style={{ color: "#718096", fontSize: "14px" }}>
              Loading concepts...
            </p>
          )}

          {error && (
            <p style={{ color: "#e53e3e", fontSize: "14px" }}>
              Failed to load concepts. Please try again.
            </p>
          )}

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
      </main>
    </div>
  );
};

export default Concepts;
