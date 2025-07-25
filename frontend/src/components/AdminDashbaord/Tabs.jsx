import React from "react";

export default function Tabs({ activeTab, setActiveTab }) {
  const tabs = ["Courses", "Projects", "Registered Users"];
  return (
    <div className="flex space-x-8 border-b mb-7 mt-2">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`pb-2 text-base md:text-lg transition font-semibold ${
            activeTab === tab
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-400 hover:text-blue-600"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}