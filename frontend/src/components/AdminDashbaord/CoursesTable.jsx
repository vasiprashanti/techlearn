import React, { useState } from "react";

function CollapsibleText({ text, limit = 50, onExpandChange }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  const isLong = text.length > limit;
  const displayText =
    !expanded && isLong ? text.substring(0, limit) + "..." : text;

  const toggle = () => {
    setExpanded((prev) => !prev);
    onExpandChange && onExpandChange(!expanded);
  };

  return (
    <div
      className={
        !expanded && isLong
          ? "flex items-center whitespace-nowrap overflow-hidden text-ellipsis"
          : "whitespace-normal"
      }
      style={!expanded && isLong ? { maxWidth: "100%" } : {}}
    >
      <span
        className={
          !expanded && isLong
            ? "overflow-hidden text-ellipsis whitespace-nowrap block min-w-0"
            : "block"
        }
        style={!expanded && isLong ? { maxWidth: "100%" } : {}}
      >
        {displayText}
      </span>
      {isLong && (
        <button
          onClick={toggle}
          className={
            !expanded
              ? "pl-1 text-blue-500 hover:text-blue-700 transition-colors text-sm whitespace-nowrap"
              : "mt-1 text-blue-500 hover:text-blue-700 transition-colors text-sm block"
          }
          style={{
            maxWidth: !expanded ? "5.5em" : undefined,
            overflow: !expanded ? "hidden" : undefined,
            textOverflow: !expanded ? "ellipsis" : undefined,
            display: !expanded ? "inline" : "block",
          }}
          title={expanded ? "Show less" : "Show more"}
        >
          {expanded ? "less.." : "more.."}
        </button>
      )}
    </div>
  );
}

export default function CoursesTable({ courses, onView, onEdit, onDelete }) {
  return (
    <div className="bg-white/50 dark:bg-gray-800/70 rounded-xl shadow-md overflow-hidden">
      <div
        className="overflow-x-auto lg:overflow-visible"
        style={{ paddingRight: "1.5rem", paddingBottom: "1rem" }}
      >
        <table className="min-w-[900px] whitespace-nowrap text-left">
          <thead>
            <tr>
              <th className="px-6 py-3 font-semibold text-light-text/100 dark:text-dark-text/70">Title</th>
              <th className="px-6 py-3 font-semibold text-light-text/100 dark:text-dark-text/70">Description</th>
              <th className="px-6 py-3 font-semibold text-light-text/100 dark:text-dark-text/70">Topics</th>
              <th className="px-6 py-3 font-semibold text-light-text/100 dark:text-dark-text/70">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400 italic">
                  No courses found.
                </td>
              </tr>
            )}
            {courses.map((course, idx) => (
              <tr
                key={idx}
                className="border-b last:border-0 hover:bg-gray-100/10 transition"
              >
                <td className="px-6 py-4 text-light-text/70 dark:text-dark-text/70">{course.title}</td>
                <td className="px-6 py-4 text-light-text/70 dark:text-dark-text/70">
                  <CollapsibleText
                    text={course.description}
                    limit={50}
                  />
                </td>
                <td className="px-6 py-4 text-light-text/70 dark:text-dark-text/70">{course.topics}</td>
                <td className="px-6 py-4 pr-8 pb-4 space-x-2">
                  <button className="text-blue-600 hover:underline" onClick={() => onView(course)}>View</button>
                  <button className="text-yellow-600 hover:underline" onClick={() => onEdit(course)}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={() => onDelete(course)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
