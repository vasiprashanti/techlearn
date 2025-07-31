import React, { useState, useEffect } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import CoursesTable from "../../components/AdminDashbaord/CoursesTable";
import NewCourseForm from "../../components/AdminDashbaord/NewCourseForm";
import { useNavigate } from "react-router-dom";

// Backend API base
const BASE_URL = "";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load all courses initially
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch(`${BASE_URL}/courses`);
        const data = await res.json();
        setCourses(data.courses || []);
      } catch {
        setCourses([]);
      }
      setLoading(false);
    }
    fetchCourses();
  }, []);

  const handleAddCourse = async (course) => {
    // Expects title, description, topics, level
    try {
      const res = await fetch(`${BASE_URL}/course-initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(course),
      });
      if (!res.ok) throw new Error("Failed to create course");
      const { courseId } = await res.json();
      setCourses([{ ...course, _id: courseId, topics: course.topics || 0 }, ...courses]);
      navigate(`/admin/upload-topics?courseId=${courseId}`);
    } catch (err) {
      alert("Could not create course. Please try again.");
    }
  };

  const handleView = (course) => alert(`View course: ${course.title}`);
  const handleEdit = (course) => alert(`Edit course: ${course.title}`);

  const handleDelete = async (course) => {
    if (
      window.confirm(
        `⚠️ Deleting course "${course.title}" will also remove all notes, quizzes, and exercises for this course! Are you sure?`
      )
    ) {
      try {
        await fetch(`${BASE_URL}/courses/${course._id || course.courseId || course.id}`, {
          method: "DELETE",
        });
        setCourses(courses.filter((c) => (c._id || c.courseId) !== (course._id || course.courseId)));
      } catch {
        alert("Deletion failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] transition-all duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col mt-10 sm:mt-12 md:mt-16 lg:mt-10 px-4 sm:px-8 lg:px-8 xl:px-16">
        <main className="flex-1 max-w-full lg:max-w-6xl mx-auto w-full px-0 sm:px-8 lg:px-0 py-4 sm:py-8 pt-32 sm:pt-8 ">
          <div className="space-y-6 sm:space-y-8">
            <NewCourseForm onAdd={handleAddCourse} />
            <div className="w-full">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 px-2 sm:px-0 brand-heading-primary">All Courses</h2>
              {loading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="mt-2">Loading courses...</p>
                </div>
              ) : (
                <div className="w-full overflow-hidden">
                  <CoursesTable
                    courses={courses}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}