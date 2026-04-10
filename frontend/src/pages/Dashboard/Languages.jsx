import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import Sidebar from "../../components/Dashboard/Sidebar";
import CourseCard from "../../components/Dashboard/CourseCard";
import { languagesData } from "../../api/coursesData";

const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

const Languages = () => {
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("All");

  const isDarkMode = theme === "dark";

  useEffect(() => {
    const timer = setTimeout(() => {
      setCourses(languagesData);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered =
    filter === "All" ? courses : courses.filter((c) => c.level === filter);

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
              Programming Languages
            </h1>
            <p style={{ fontSize: "14px", color: "#718096", margin: 0 }}>
              Build strong language fundamentals for technical interviews
            </p>
          </div>

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

          {loading && (
            <p style={{ color: "#718096", fontSize: "14px" }}>
              Loading courses...
            </p>
          )}

          {error && (
            <p style={{ color: "#e53e3e", fontSize: "14px" }}>
              Failed to load courses. Please try again.
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
      </main>
    </div>
  );
};

export default Languages;
