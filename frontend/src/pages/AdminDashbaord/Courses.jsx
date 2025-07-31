import React, { useState, useEffect } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import CoursesTable from "../../components/AdminDashbaord/CoursesTable";
import NewCourseForm from "../../components/AdminDashbaord/NewCourseForm";
import { useNavigate } from "react-router-dom";

// Backend API base
const BASE_URL = import.meta.env.VITE_API_URL;

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load all courses initially
  useEffect(() => {
    async function fetchCourses() {
      try {
        setError(null);
        const res = await fetch(`${BASE_URL}/courses`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        // Ensure courses is always an array
        const coursesArray = Array.isArray(data.courses) ? data.courses : [];
        
        // Validate each course object has required string properties
        const validatedCourses = coursesArray.map(course => ({
          ...course,
          title: String(course.title || 'Untitled Course'),
          description: String(course.description || ''),
          level: String(course.level || ''),
          topics: Number(course.topics) || 0,
          _id: String(course._id || course.courseId || course.id || '')
        }));
        
        setCourses(validatedCourses);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError(err.message);
        setCourses([]);
      }
      setLoading(false);
    }
    fetchCourses();
  }, []);

  const handleAddCourse = async (course) => {
    // Validate course object before sending
    const validatedCourse = {
      title: String(course.title || ''),
      description: String(course.description || ''),
      topics: Number(course.topics) || 0,
      level: String(course.level || '')
    };

    try {
      const res = await fetch(`${BASE_URL}/course-initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedCourse),
      });
      
      if (!res.ok) throw new Error("Failed to create course");
      
      const responseData = await res.json();
      const courseId = String(responseData.courseId || '');
      
      const newCourse = {
        ...validatedCourse,
        _id: courseId,
        topics: validatedCourse.topics
      };
      
      setCourses(prevCourses => [newCourse, ...prevCourses]);
      navigate(`/admin/upload-topics?courseId=${courseId}`);
    } catch (err) {
      console.error('Error creating course:', err);
      alert("Could not create course. Please try again.");
    }
  };

  const handleView = (course) => {
    const courseTitle = String(course?.title || 'Unknown Course');
    alert(`View course: ${courseTitle}`);
  };

  const handleEdit = (course) => {
    const courseTitle = String(course?.title || 'Unknown Course');
    alert(`Edit course: ${courseTitle}`);
  };

  const handleDelete = async (course) => {
    const courseTitle = String(course?.title || 'Unknown Course');
    const courseId = String(course?._id || course?.courseId || course?.id || '');
    
    if (!courseId) {
      alert('Cannot delete course: Invalid course ID');
      return;
    }

    if (
      window.confirm(
        `⚠️ Deleting course "${courseTitle}" will also remove all notes, quizzes, and exercises for this course! Are you sure?`
      )
    ) {
      try {
        const res = await fetch(`${BASE_URL}/courses/${courseId}`, {
          method: "DELETE",
        });
        
        if (!res.ok) throw new Error('Delete request failed');
        
        setCourses(prevCourses => 
          prevCourses.filter(c => {
            const id = String(c._id || c.courseId || c.id || '');
            return id !== courseId;
          })
        );
      } catch (err) {
        console.error('Error deleting course:', err);
        alert("Deletion failed. Please try again.");
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] transition-all duration-300">
        <Sidebar />
        <div className="flex-1 flex flex-col mt-10 sm:mt-12 md:mt-16 lg:mt-10 px-4 sm:px-8 lg:px-8 xl:px-16">
          <main className="flex-1 max-w-full lg:max-w-6xl mx-auto w-full px-0 sm:px-8 lg:px-0 py-4 sm:py-8 pt-32 sm:pt-8">
            <div className="text-center py-8">
              <div className="text-red-500 dark:text-red-400 mb-4">
                <h2 className="text-xl font-semibold">Error Loading Courses</h2>
                <p className="mt-2">{error}</p>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] transition-all duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col mt-10 sm:mt-12 md:mt-16 lg:mt-10 px-4 sm:px-8 lg:px-8 xl:px-16">
        <main className="flex-1 max-w-full lg:max-w-6xl mx-auto w-full px-0 sm:px-8 lg:px-0 py-4 sm:py-8 pt-32 sm:pt-8">
          <div className="space-y-6 sm:space-y-8">
            <NewCourseForm onAdd={handleAddCourse} />
            <div className="w-full">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 px-2 sm:px-0 brand-heading-primary">
                All Courses ({courses.length})
              </h2>
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