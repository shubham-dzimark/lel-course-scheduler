import React from "react";
import { format } from "date-fns";
import "./CalendarView.css";

const CalendarView = ({ calendarData, scheduledSessions }) => {
  if (!calendarData || !scheduledSessions || scheduledSessions.length === 0) {
    return (
      <div className="calendar-empty">
        <p>
          No schedule generated yet. Upload a cadence file and generate the
          schedule.
        </p>
      </div>
    );
  }

  const { dates, timeSlots, grid } = calendarData;

  // Group sessions by date for easier lookup
  const sessionsByDate = {};
  scheduledSessions.forEach((session) => {
    const dateKey = format(session.date, "yyyy-MM-dd");
    if (!sessionsByDate[dateKey]) {
      sessionsByDate[dateKey] = [];
    }
    sessionsByDate[dateKey].push(session);
  });

  // Filter to only show dates that have sessions
  const datesWithSessions = dates.filter((date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return sessionsByDate[dateKey] && sessionsByDate[dateKey].length > 0;
  });

  return (
    <div className="calendar-view-container">
      <div className="calendar-hint">
        <svg
          className="hint-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Scroll down to view all scheduled dates</span>
      </div>
      <div className="calendar-scroll-wrapper">
        <table className="calendar-table">
          <thead>
            <tr>
              <th className="date-header-cell">Date</th>
              {timeSlots.map((timeSlot, index) => (
                <th key={index} className="time-slot-header">
                  {timeSlot}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datesWithSessions.map((date, dateIndex) => {
              const dateKey = format(date, "yyyy-MM-dd");
              const dayName = format(date, "EEEE");
              const dateDisplay = format(date, "MM-dd-yyyy");

              return (
                <tr key={dateIndex}>
                  <td className="date-cell">
                    <div className="date-cell-content">
                      <span className="day-name">{dayName}</span>
                      <span className="date-number">{dateDisplay}</span>
                    </div>
                  </td>
                  {timeSlots.map((timeSlot, slotIndex) => {
                    const sessions = grid[dateKey]?.[timeSlot] || [];
                    return (
                      <td key={slotIndex} className="session-cell">
                        {sessions.map((session, sessionIndex) => (
                          <div key={sessionIndex} className="session-item">
                            <span className="session-course">
                              {session.course}
                            </span>
                            <span className="session-number">
                              Session {session.sessionNumber}
                            </span>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CalendarView;
