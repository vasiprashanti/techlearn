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
      "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
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

      const prevMonthDays = getDaysInMonth(year, month - 1);
      for (let i = 0; i < adjustedFirstDay; i++) {
        days.push({ day: prevMonthDays - adjustedFirstDay + i + 1, currentMonth: false, activity: null });
      }

      for (let i = 1; i <= daysInMonth; i++) {
        const dateKey = `${year}-${String(month + 1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        days.push({
          day: i,
          currentMonth: true,
          date: dateKey,
          activity: activities ? activities[dateKey] : null,
        });
      }

      const totalCells = Math.ceil(days.length / 7) * 7;
      for (let i = days.length; i < totalCells; i++) {
        days.push({ day: i - days.length + 1, currentMonth: false, activity: null });
      }

      return days;
    };

    const getActivityIndicator = (activity, isVisited) => {
      if (isVisited) return <div className="w-1 h-1 rounded-full bg-black dark:bg-white mt-1 absolute bottom-1" />;
      if (!activity) return null;
      const actStr = String(activity).toLowerCase();
      if (actStr === 'completed') return <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1 absolute bottom-1" />;
      if (actStr === 'attempted') return <div className="w-1 h-1 rounded-full bg-amber-500 mt-1 absolute bottom-1" />;
      return <div className="w-1 h-1 rounded-full bg-black/20 dark:bg-white/20 mt-1 absolute bottom-1" />;
    };

    const days = renderCalendar();
    const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
      <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 h-full">
        <div className="flex justify-between items-center mb-8">
          <span className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50">
            Activity
          </span>
          <div className="flex items-center gap-4">
            <button onClick={() => changeMonth(-1)} className="text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors">
              ←
            </button>
            <span className="text-xs tracking-widest uppercase font-medium text-black dark:text-white w-20 text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={() => changeMonth(1)} className="text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors">
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-[10px] tracking-widest uppercase mb-4 text-black/30 dark:text-white/30">
          {weekdays.map((day, i) => <div key={i}>{day}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
          {days.map((dayObj, index) => {
            const isVisited = dayObj.currentMonth && visitedDays.includes(dayObj.date);
            return (
              <div
                key={index}
                className={`aspect-square relative flex flex-col items-center justify-center text-xs transition-all duration-300
                  ${dayObj.currentMonth ? 'text-black dark:text-white' : 'text-black/20 dark:text-white/20'}
                `}
              >
                <span className="mb-2 font-light">{dayObj.day}</span>
                {getActivityIndicator(dayObj.activity, isVisited)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  export default Calendar;