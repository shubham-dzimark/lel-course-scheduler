import React from "react";
import { format } from "date-fns";
import "./StatisticsPanel.css";

const StatisticsPanel = ({ statistics }) => {
  if (!statistics) {
    return null;
  }

  const {
    totalAvailableSlots,
    slotsAfterScheduling,
    totalScheduledSessions,
    fullyBookedDates,
    utilizationPercentage,
  } = statistics;

  return (
    <div className="statistics-panel">
      <h2 className="statistics-title">Scheduling Statistics</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Available Slots</p>
            <p className="stat-value">{totalAvailableSlots}</p>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Sessions Scheduled</p>
            <p className="stat-value">{totalScheduledSessions}</p>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Remaining Slots</p>
            <p className="stat-value">{slotsAfterScheduling}</p>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div className="stat-content">
            <p className="stat-label">Utilization</p>
            <p className="stat-value">{utilizationPercentage}%</p>
          </div>
        </div>
      </div>

      {fullyBookedDates && fullyBookedDates.length > 0 && (
        <div className="fully-booked-section">
          <h3 className="section-title">
            Fully Booked Dates (100% Utilization)
          </h3>
          <div className="booked-dates-list">
            {fullyBookedDates.map((date, idx) => (
              <div key={idx} className="booked-date-item">
                <svg
                  className="check-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>{format(date, "MM-dd-yyyy (EEEE)")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPanel;
