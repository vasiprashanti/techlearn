import React, { useState } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import Tabs from "../../components/AdminDashbaord/Tabs";
import CoursesTable from "../../components/AdminDashbaord/CoursesTable";
import profileImg from "../../../public/profile.png.jpg";

const COURSES = [
  { title: "Core Java", category: "Programing", status: "Published" },
  { title: "Core Python", category: "Programing", status: "Published" },
  { title: "Introduction to Programming", category: "Business", status: "Draft" },
  { title: "Graphic Design Basics", category: "Design", status: "Draft" },
  { title: "Project Management Principles", category: "Management", status: "Draft" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Courses");
  const [activeMenu, setActiveMenu] = useState("Courses");

  return (
    <div className="bg-gray-50 min-h-screen flex">
      {/* Sidebar */}
      <Sidebar active={activeMenu} setActive={setActiveMenu} />
      
      {/* Main Area */}
      <div className="flex-1 flex flex-col">

        {/* Top Bar with search and profile */}
        <div className="flex justify-end items-center h-20 px-8 py-2 border-b bg-white">
          <input
            type="search"
            placeholder="Search"
            className="px-3 py-1.5 w-64 mr-4 rounded-2xl border border-gray-200 bg-white/70 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <img
            src={profileImg}
            alt="User"
            className="h-9 w-9 rounded-full object-cover border border-gray-200"
          />
        </div>

        {/* Page Content */}
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-800">Admin Dashboard</h1>
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
          {activeTab === "Courses" && (
            <>
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Courses Overview</h2>
              <CoursesTable courses={COURSES} />
            </>
          )}
          {activeTab !== "Courses" && (
            <div className="h-40 flex items-center justify-center text-gray-300 text-lg italic">
              Content for &quot;{activeTab}&quot; coming soon.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}