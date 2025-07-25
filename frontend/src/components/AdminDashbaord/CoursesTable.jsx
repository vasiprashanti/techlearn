import React from "react";

const statusClasses = {
  Published: "bg-blue-100 text-blue-700",
  Draft: "bg-gray-200 text-gray-600"
};

export default function CoursesTable({ courses }) {
  return (
    <div className="bg-white/80 rounded-xl shadow-md overflow-x-auto">
      <table className="min-w-full whitespace-nowrap text-left">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 font-semibold text-gray-900">Course Title</th>
            <th className="px-6 py-3 font-semibold text-gray-900">Category</th>
            <th className="px-6 py-3 font-semibold text-gray-900">Status</th>
            <th className="px-6 py-3 font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(course => (
            <tr key={course.title} className="border-b last:border-0 hover:bg-gray-100 transition">
              <td className="px-6 py-4">{course.title}</td>
              <td className="px-6 py-4">
                <span className="text-blue-600 underline cursor-pointer">{course.category}</span>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusClasses[course.status]}`}
                >
                  {course.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <button className="text-blue-600 hover:underline text-sm font-medium px-2 py-1 rounded">
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}