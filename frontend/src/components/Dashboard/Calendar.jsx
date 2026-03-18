import { useState, useEffect } from 'react';

const Calendar = ({ activities }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visitedDays, setVisitedDays] = useState([]);

  useEffect(() => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    let storedDays = [];
    try {
      storedDays = JSON.parse(localStorage.getItem('visitedDays')) || [];
    } catch {
      storedDays = [];
    }

    if (!storedDays.includes(dateStr)) {
      storedDays.push(dateStr);
      localStorage.setItem('visitedDays', JSON.stringify(storedDays));
    }
    setVisitedDays(storedDays);
  }, []);

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const changeMonth = (increment) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + increment);
      return newDate;
    });
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    const days = [];

    // Previous month days
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ day: prevMonthDays - adjustedFirstDay + i + 1, currentMonth: false, activity: null });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${year}-${String(month + 1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
      days.push({
        day: i,
        currentMonth: true,
        date: dateKey,
        activity: activities ? activities[dateKey] : null,
      });
    }

    // Next month days (complete the last week)
    const totalCells = Math.ceil(days.length / 7) * 7;
    for (let i = days.length; i < totalCells; i++) {
      days.push({ day: i - days.length + 1, currentMonth: false, activity: null });
    }

    return days;
  };

  const getActivityClass = (activity, isVisited) => {
    if (isVisited) return 'bg-purple-900/80 text-white'; // Highlight visited days
    if (!activity) return ''; // No highlight when no activity and not visited
    const activityString = typeof activity === 'string' ? activity : String(activity);
    switch (activityString.toLowerCase()) {
      case 'completed': return 'bg-emerald-500/90 text-white';
      case 'attempted': return 'bg-amber-500/80 text-white';
      default: return 'bg-blue-900/30 text-white';
    }
  };

  const days = renderCalendar();
  const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 text-light-text dark:text-dark-text h-full shadow-md">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="glass-button p-2 rounded-lg hover:bg-blue-900/30 transition-colors text-light-text dark:text-dark-text">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 stroke-light-text dark:stroke-dark-text" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="text-xl font-semibold font-poppins text-gray-600 dark:text-gray-400 hover-gradient-text mb-4">
          {monthNames[currentDate.getMonth()]} <span className="text-light-text/80 dark:text-dark-text/80 ml-1">{currentDate.getFullYear()}</span>
        </h3>

        <button onClick={() => changeMonth(1)} className="glass-button p-2 rounded-lg hover:bg-blue-900/30 transition-colors text-light-text dark:text-dark-text">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 stroke-light-text dark:stroke-dark-text" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 text-center text-sm font-medium mb-3 text-light-text/70 dark:text-dark-text/70">
        {weekdays.map(day => <div key={day}>{day}</div>)}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((dayObj, index) => {
          const isVisited = dayObj.currentMonth && visitedDays.includes(dayObj.date);
          return (
            <div
              key={index}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-all
                ${dayObj.currentMonth ? 'text-light-text dark:text-dark-text' : 'text-light-text/40 dark:text-dark-text/40'}
                ${getActivityClass(dayObj.activity, isVisited)}
              `}
            >
              {dayObj.day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;