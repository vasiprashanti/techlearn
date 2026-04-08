// components/CourseCard.jsx
import React from "react";

/**
 * CourseCard — reusable card for Languages and Concepts pages.
 * Props:
 *   title      {string}  — course name
 *   description{string}  — short blurb
 *   progress   {number}  — 0-100 completion %
 *   topics     {number}  — total topic count
 *   level      {string?} — "Beginner" | "Intermediate" | "Advanced" (optional)
 *   icon       {string}  — 2-char abbreviation displayed in the avatar circle
 *   color      {string}  — hex for the avatar background tint
 */

const levelConfig = {
  Beginner: {
    bg: "#e8f5e9",
    text: "#2e7d32",
    border: "#c8e6c9",
  },
  Intermediate: {
    bg: "#fff8e1",
    text: "#f57f17",
    border: "#ffe082",
  },
  Advanced: {
    bg: "#fce4ec",
    text: "#c62828",
    border: "#f48fb1",
  },
};

const CourseCard = ({ title, description, progress, topics, level, icon, color }) => {
  const lvl = level ? levelConfig[level] || levelConfig["Intermediate"] : null;

  // Progress bar color based on completion
  const progressColor =
    progress >= 75 ? "#4caf50" : progress >= 40 ? "#1a73e8" : "#ff9800";

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Header: icon + title + level badge */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* Avatar circle */}
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: color + "1a", // 10% opacity tint
            border: `1.5px solid ${color}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "600",
            fontSize: "13px",
            color: color,
            flexShrink: 0,
            letterSpacing: "0.02em",
          }}
        >
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: "600",
                color: "#1a202c",
                lineHeight: 1.3,
              }}
            >
              {title}
            </h3>
            {lvl && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "500",
                  padding: "2px 8px",
                  borderRadius: "20px",
                  background: lvl.bg,
                  color: lvl.text,
                  border: `1px solid ${lvl.border}`,
                  whiteSpace: "nowrap",
                }}
              >
                {level}
              </span>
            )}
          </div>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "12px",
              color: "#718096",
              lineHeight: "1.5",
            }}
          >
            {topics} topics
          </p>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          color: "#4a5568",
          lineHeight: "1.6",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {description}
      </p>

      {/* Progress section */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px",
          }}
        >
          <span style={{ fontSize: "12px", color: "#718096" }}>Progress</span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: progressColor,
            }}
          >
            {progress}%
          </span>
        </div>
        {/* Track */}
        <div
          style={{
            background: "#edf2f7",
            borderRadius: "999px",
            height: "6px",
            overflow: "hidden",
          }}
        >
          {/* Fill */}
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: "999px",
              background: progressColor,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* CTA */}
      <button
        style={{
          marginTop: "2px",
          width: "100%",
          padding: "8px 0",
          borderRadius: "8px",
          border: `1.5px solid ${color}44`,
          background: color + "0d",
          color: color,
          fontSize: "13px",
          fontWeight: "500",
          cursor: "pointer",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = color + "1f";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = color + "0d";
        }}
      >
        {progress > 0 ? "Continue" : "Start Learning"}
      </button>
    </div>
  );
};

export default CourseCard;
