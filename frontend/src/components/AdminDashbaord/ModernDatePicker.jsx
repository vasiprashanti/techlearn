import { useEffect, useMemo, useRef, useState } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import '../../styles/modernDatePicker.css';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const toDateOnly = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

const formatIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date) =>
  new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);

const parseManualDate = (value) => {
  const text = value.trim();
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return isValidDate(date) && formatIsoDate(date) === `${y}-${m}-${d}` ? date : null;
  }

  const dmyMatch = text.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return isValidDate(date) ? date : null;
  }

  return null;
};

const inRange = (date, minDate, maxDate) => {
  const d = toDateOnly(date);
  if (minDate && d < toDateOnly(minDate)) return false;
  if (maxDate && d > toDateOnly(maxDate)) return false;
  return true;
};

const isSameDate = (a, b) =>
  Boolean(a && b) &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const buildCalendarCells = (viewDate) => {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const totalSlots = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  const cells = [];

  for (let i = 0; i < totalSlots; i += 1) {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), i - startWeekday + 1);
    cells.push({
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      date,
      inCurrentMonth: date.getMonth() === viewDate.getMonth(),
    });
  }

  return cells;
};

const VIEWPORT_MARGIN = 12;
const POPUP_GAP_BELOW = 12;
const POPUP_GAP_ABOVE = 6;
const POPUP_VERTICAL_NUDGE = 12;
const DEFAULT_DESKTOP_POPUP_WIDTH = 252;
const DEFAULT_DESKTOP_POPUP_HEIGHT = 270;
const DEFAULT_PAST_YEAR_SPAN = 35;
const DEFAULT_FUTURE_YEAR_SPAN = 25;

const ModernDatePicker = ({
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  closeOnSelect = true,
  ariaLabel,
  popupPosition = 'auto',
}) => {
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parsed = parseManualDate(value);
    return parsed && isValidDate(parsed) ? parsed : null;
  }, [value]);

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(selectedDate ? formatDisplayDate(selectedDate) : '');
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  const [focusDate, setFocusDate] = useState(selectedDate || new Date());
  const [invalidInput, setInvalidInput] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [desktopPlacement, setDesktopPlacement] = useState({
    top: 0,
    left: 0,
    width: DEFAULT_DESKTOP_POPUP_WIDTH,
    direction: 'down',
  });

  const rootRef = useRef(null);
  const inputWrapRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    const evaluateLayout = () => setIsMobile(window.matchMedia('(max-width: 640px)').matches);
    evaluateLayout();
    window.addEventListener('resize', evaluateLayout);
    return () => window.removeEventListener('resize', evaluateLayout);
  }, []);

  useEffect(() => {
    setInputValue(selectedDate ? formatDisplayDate(selectedDate) : '');
    if (selectedDate) {
      setViewDate(selectedDate);
      setFocusDate(selectedDate);
    }
    setInvalidInput(false);
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isMobile) return;

    const updatePlacement = () => {
      const anchor = inputWrapRef.current;
      if (!anchor) return;

      const anchorRect = anchor.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const popupWidth = Math.min(DEFAULT_DESKTOP_POPUP_WIDTH, viewportWidth - VIEWPORT_MARGIN * 2);
      const popupHeight = dialogRef.current?.offsetHeight || DEFAULT_DESKTOP_POPUP_HEIGHT;

      const spaceBelow = viewportHeight - anchorRect.bottom - POPUP_GAP_BELOW;
      const spaceAbove = anchorRect.top - POPUP_GAP_ABOVE;
      const canFitBelow = spaceBelow >= popupHeight + VIEWPORT_MARGIN;
      const canFitAbove = spaceAbove >= popupHeight + VIEWPORT_MARGIN;

      let shouldOpenUp = false;
      if (popupPosition === 'top') {
        shouldOpenUp = true;
      } else if (popupPosition === 'bottom') {
        shouldOpenUp = false;
      } else {
        if (canFitBelow) {
          shouldOpenUp = false;
        } else if (canFitAbove) {
          shouldOpenUp = true;
        } else {
          shouldOpenUp = spaceAbove > spaceBelow;
        }
      }

      const preferredTop = shouldOpenUp
        ? anchorRect.top - popupHeight - POPUP_GAP_ABOVE
        : anchorRect.bottom + POPUP_GAP_BELOW;

      let top = preferredTop + POPUP_VERTICAL_NUDGE;
      const maxTop = viewportHeight - popupHeight - VIEWPORT_MARGIN;
      top = Math.max(VIEWPORT_MARGIN, Math.min(top, maxTop));

      let left = anchorRect.left;
      const maxLeft = viewportWidth - popupWidth - VIEWPORT_MARGIN;
      left = Math.max(VIEWPORT_MARGIN, Math.min(left, maxLeft));

      setDesktopPlacement({
        top,
        left,
        width: popupWidth,
        direction: shouldOpenUp ? 'up' : 'down',
      });
    };

    updatePlacement();
    const frame = window.requestAnimationFrame(updatePlacement);

    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [isOpen, isMobile, popupPosition]);

  const calendarCells = useMemo(() => buildCalendarCells(viewDate), [viewDate]);
  const minYear = minDate ? minDate.getFullYear() : new Date().getFullYear() - DEFAULT_PAST_YEAR_SPAN;
  const maxYear = maxDate ? maxDate.getFullYear() : new Date().getFullYear() + DEFAULT_FUTURE_YEAR_SPAN;
  const yearOptions = useMemo(() => {
    const years = [];
    for (let year = minYear; year <= maxYear; year += 1) years.push(year);
    return years;
  }, [minYear, maxYear]);

  const openPicker = () => {
    setIsOpen(true);
    const baseline = selectedDate || new Date();
    setViewDate(baseline);
    setFocusDate(baseline);
  };

  const closePicker = () => setIsOpen(false);

  const selectDate = (date) => {
    if (!inRange(date, minDate, maxDate)) return;
    onChange(formatIsoDate(date));
    setInputValue(formatDisplayDate(date));
    setInvalidInput(false);
    if (closeOnSelect) closePicker();
  };

  const shiftMonth = (offset) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const handleManualBlur = () => {
    const text = inputValue.trim();
    if (!text) {
      onChange('');
      setInvalidInput(false);
      return;
    }

    const parsed = parseManualDate(text);
    if (!parsed || !inRange(parsed, minDate, maxDate)) {
      setInvalidInput(true);
      return;
    }

    onChange(formatIsoDate(parsed));
    setInputValue(formatDisplayDate(parsed));
    setInvalidInput(false);
  };

  const handleCalendarKeyDown = (event) => {
    let delta = 0;
    if (event.key === 'ArrowLeft') delta = -1;
    if (event.key === 'ArrowRight') delta = 1;
    if (event.key === 'ArrowUp') delta = -7;
    if (event.key === 'ArrowDown') delta = 7;

    if (delta !== 0) {
      event.preventDefault();
      setFocusDate((prev) => {
        const next = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + delta);
        setViewDate(new Date(next.getFullYear(), next.getMonth(), 1));
        return next;
      });
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (inRange(focusDate, minDate, maxDate)) {
        selectDate(focusDate);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closePicker();
    }
  };

  const changeMonthFromSelect = (event) => {
    const month = Number(event.target.value);
    setViewDate((prev) => new Date(prev.getFullYear(), month, 1));
  };

  const changeYearFromSelect = (event) => {
    const year = Number(event.target.value);
    setViewDate((prev) => new Date(year, prev.getMonth(), 1));
  };

  const calendarContent = (
    <>
      <div className="mdp-header">
        <button type="button" className="mdp-nav-btn" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
          <FiChevronLeft />
        </button>

        <div className="mdp-header-selects">
          <select aria-label="Select month" value={viewDate.getMonth()} onChange={changeMonthFromSelect}>
            {MONTH_LABELS.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>
          <select aria-label="Select year" value={viewDate.getFullYear()} onChange={changeYearFromSelect}>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="mdp-nav-btn" aria-label="Next month" onClick={() => shiftMonth(1)}>
          <FiChevronRight />
        </button>
      </div>

      <div className="mdp-weekdays" role="row">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} role="columnheader">
            {label}
          </span>
        ))}
      </div>

      <div className="mdp-grid" role="grid">
        {calendarCells.map((cell) => {
          const disabled = !inRange(cell.date, minDate, maxDate);
          const selected = selectedDate && isSameDate(cell.date, selectedDate);
          const today = isSameDate(cell.date, new Date());
          const focused = isSameDate(cell.date, focusDate);

          return (
            <button
              type="button"
              key={cell.key}
              role="gridcell"
              aria-selected={selected ? 'true' : 'false'}
              aria-label={cell.date.toDateString()}
              className={`mdp-day${cell.inCurrentMonth ? '' : ' mdp-day-out'}${selected ? ' mdp-day-selected' : ''}${today ? ' mdp-day-today' : ''}${focused ? ' mdp-day-focused' : ''}`}
              disabled={disabled}
              onMouseEnter={() => setFocusDate(cell.date)}
              onClick={() => selectDate(cell.date)}
            >
              {cell.date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mdp-footer">
        <button
          type="button"
          className="mdp-today-btn"
          onClick={() => {
            const today = new Date();
            if (!inRange(today, minDate, maxDate)) return;
            setViewDate(today);
            setFocusDate(today);
            selectDate(today);
          }}
        >
          Today
        </button>
      </div>
    </>
  );

  const calendarBody = (directionClass = 'mdp-popover-down') => (
    <div
      className={`mdp-popover ${directionClass}`}
      role="dialog"
      aria-label={ariaLabel || 'Date picker'}
      aria-modal={isMobile ? 'true' : 'false'}
      ref={dialogRef}
      tabIndex={0}
      onKeyDown={handleCalendarKeyDown}
    >
      {calendarContent}
    </div>
  );

  return (
    <div className="mdp-root" ref={rootRef}>
      <div className={`mdp-input-wrap${invalidInput ? ' mdp-input-wrap-invalid' : ''}`} ref={inputWrapRef}>
        <input
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
            setInvalidInput(false);
          }}
          onFocus={openPicker}
          onClick={openPicker}
          onBlur={handleManualBlur}
          placeholder={placeholder}
          className="mdp-input"
          aria-invalid={invalidInput ? 'true' : 'false'}
          aria-haspopup="dialog"
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-label={ariaLabel || placeholder}
        />
        <button
          type="button"
          className="mdp-icon-btn"
          aria-label="Open calendar"
          onMouseDown={(event) => event.preventDefault()}
          onClick={openPicker}
        >
          <FiCalendar />
        </button>
      </div>

      {invalidInput && <p className="mdp-error">Enter a valid date (YYYY-MM-DD or DD/MM/YYYY).</p>}

      {isOpen &&
        (isMobile ? (
          <div className="mdp-mobile-layer" onMouseDown={(event) => event.target === event.currentTarget && closePicker()}>
            <div className="mdp-mobile-sheet">{calendarBody('mdp-popover-down')}</div>
          </div>
        ) : (
          <div
            className="mdp-desktop-layer"
            style={{
              top: `${desktopPlacement.top}px`,
              left: `${desktopPlacement.left}px`,
              width: `${desktopPlacement.width}px`,
            }}
          >
            {calendarBody(desktopPlacement.direction === 'up' ? 'mdp-popover-up' : 'mdp-popover-down')}
          </div>
        ))}
    </div>
  );
};

export default ModernDatePicker;
