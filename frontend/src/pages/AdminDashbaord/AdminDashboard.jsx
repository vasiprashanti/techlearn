import React, { useState } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import LoadingScreen from '../../components/Loader/Loader3D';
import {
  FaUsers,
  FaUserCheck,
  FaBookOpen,
  FaFolderOpen,
  FaUserFriends,
} from "react-icons/fa";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";


function getMonthDays(year, month) {
  const days = [];
  const lastDay = dayjs().year(year).month(month + 1).date(0);
  for (let i = 1; i <= lastDay.date(); i++) {
    days.push(dayjs().year(year).month(month).date(i));
  }
  return days;
}


const analytics = [
  {
    label: "Total Registered Users",
    value: 45,
    icon: <FaUsers className="text-2xl text-purple-400" />,
    bg: "bg-white/50 dark:bg-gray-800/70 from-purple-50 to-blue-50",
    isButton: false
  },
  {
    label: "Club Members Count",
    value: 32,
    icon: <FaUserFriends className="text-2xl text-purple-400" />,
    bg: "bg-white/50 dark:bg-gray-800/70 from-purple-50 to-blue-50",
    isButton: false
  },
  {
    label: "Active Users Today",
    value: 29,
    icon: <FaUserCheck className="text-2xl text-blue-400" />,
    bg: "bg-white/50 dark:bg-gray-800/70 from-blue-50 to-purple-50",
    isButton: false
  },
  {
    label: "Course Details",
    value: 12,
    icon: <FaBookOpen className="text-2xl text-purple-400" />,
    bg: "bg-white/50 dark:bg-gray-800/70 from-purple-50 to-blue-50",
    isButton: true,
    to: "/admin/courses"
  },
  {
    label: "Project Details",
    value: 9,
    icon: <FaFolderOpen className="text-2xl text-blue-400" />,
    bg: "bg-white/50 dark:bg-gray-800/70 from-blue-50 to-purple-50",
    isButton: true,
    to: "/admin/projects"
  }
];


export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  if (loading) {
    return (
      <LoadingScreen showMessage={false} fullScreen={true} size={40} duration={800} />
    );
  }


  const today = dayjs();
  const [calendarMonth, setCalendarMonth] = useState(today.month());
  const [calendarYear, setCalendarYear] = useState(today.year());
  const days = getMonthDays(calendarYear, calendarMonth);


  const weekdayShort = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const firstWeekday = dayjs()
    .year(calendarYear)
    .month(calendarMonth)
    .date(1)
    .day();


  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] transition-all duration-300">
      <Sidebar />


      <div className="flex-1 flex flex-col mt-6 lg:mt-10 px-4 sm:px-8 lg:px-8 xl:px-16">
        {/* Header */}
        <div className="flex justify-between items-center px-0 sm:px-8 lg:px-0 pt-8 pb-2">
          <h1 className="pt-16 pl-20 sm:pl-0 sm:pt-0 text-2xl sm:text-2xl md:text-4xl font-medium brand-heading-primary">
            Welcome, Admin!
          </h1>
        </div>


        {/* Main Content */}
        <main className="flex-1 max-w-full lg:max-w-[1280px] mx-auto w-full px-0 sm:px-8 lg:px-0 py-4 sm:py-8 flex flex-col">
          {/* Cards and calendar layout */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-stretch justify-between w-full mt-4 md:mt-5">
            {/* Cards Container */}
            <div className="flex flex-col gap-5 w-full md:max-w-xl">
              {analytics.map(({ label, value, icon, bg, isButton, to }) =>
                isButton ? (
                  <button
                    key={label}
                    type="button"
                    onClick={() => navigate(to)}
                    className={`rounded-2xl ${bg} shadow-md flex flex-row items-center min-w-0 px-4 py-3 sm:px-6 sm:py-4
                      duration-150 hover:scale-[1.02] hover:shadow-xl transition group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400`}
                    style={{
                      height: "72px",
                      minWidth: "280px",
                      maxWidth: "100%",
                    }}
                    tabIndex={0}
                  >
                    <div className="bg-white/80 group-hover:bg-white group-hover:scale-105 backdrop-blur rounded-full p-2 sm:p-3 mr-3 flex-shrink-0 transition">
                      {icon}
                    </div>
                    <div className="flex flex-col flex-grow text-left">
                      <span className="text-[11px] sm:text-xs font-medium text-gray-500 mb-0 dark:text-gray-300">
                        {label}
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-blue-200">
                        {value}
                      </span>
                    </div>
                  </button>
                ) : (
                  <div
                    key={label}
                    className={`rounded-2xl ${bg} shadow-md flex flex-row items-center min-w-0 px-4 py-3 sm:px-6 sm:py-4
                      duration-150 hover:scale-[1.02] hover:shadow-xl transition group`}
                    style={{
                      height: "72px",
                      minWidth: "280px",
                      maxWidth: "100%",
                    }}
                  >
                    <div className="bg-white/80 group-hover:bg-white group-hover:scale-105 backdrop-blur rounded-full p-2 sm:p-3 mr-3 flex-shrink-0 transition">
                      {icon}
                    </div>
                    <div className="flex flex-col flex-grow text-left">
                      <span className="text-[11px] sm:text-xs font-medium text-gray-500 mb-0 dark:text-gray-300">
                        {label}
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-blue-200">
                        {value}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>


            {/* Calendar Widget */}
            <div className="w-full md:w-[490px] flex flex-col items-center">
              <div className="bg-white/50 dark:bg-gray-800/70 rounded-2xl shadow-lg p-4 sm:p-0 w-full h-auto max-h-[490px] duration-150 hover:scale-[1.02] hover:shadow-xl transition overflow-auto lg:mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8 sm:mt-4 flex justify-center">
                  <span className="text-xl sm:text-2xl font-bold brand-heading-primary">
                    {dayjs().month(calendarMonth).format("MMMM")} {calendarYear}
                  </span>
                </div>
                {/* Weekday Names */}
                <div className="grid grid-cols-7 gap-1 mb-4 sm:mb-8 sm:ml-2 sm:mr-2 justify-items-center">
                  {weekdayShort.map((d) => (
                    <div
                      key={d}
                      className="text-xs sm:text-sm font-semibold font-poppins text-gray-600 dark:text-gray-400 text-center"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                {/* Days grid */}
                <div className="grid grid-cols-7 gap-4 sm:gap-3 sm:mb-2 sm:ml-3 sm:mr-3 justify-items-center">
                  {Array.from({ length: firstWeekday }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {days.map((date) => {
                    const isToday =
                      date.date() === today.date() &&
                      date.month() === today.month() &&
                      date.year() === today.year();


                    return (
                      <div
                        key={date.date()}
                        className={`
                          w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-md text-xs sm:text-base
                          transition cursor-pointer
                          ${
                            isToday
                              ? "bg-blue-500 text-white shadow"
                              : "text-light-text/70 dark:text-dark-text/70"
                          }
                        `}
                        style={isToday ? { fontWeight: 100 } : { fontWeight: 100 }}
                      >
                        {date.date()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
