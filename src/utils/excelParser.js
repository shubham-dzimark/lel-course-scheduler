/**
 * Excel Parser
 * Handles reading cadence data from Excel and generating output Excel files
 */

import * as XLSX from "xlsx";
import { format } from "date-fns";

/**
 * Parse cadence Excel file
 * @param {File} file - Excel file
 * @returns {Promise<Array>} Array of course objects
 */
export const parseCadenceExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Assume first sheet contains cadence data
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Parse and normalize course data
        const courses = jsonData
          .map((row) => {
            // Extract cadence number (handle both numeric and text with numbers)
            let cadence = 0;
            // Note: Column name has a SPACE before the newline
            const cadenceValue =
              row["Delivery Cadence \n(The course begins every X weeks)"] ||
              row["Delivery Cadence\n(The course begins every X weeks)"] ||
              row["Delivery Cadence"] ||
              row.cadence;

            if (typeof cadenceValue === "number") {
              cadence = cadenceValue;
            } else if (typeof cadenceValue === "string") {
              const match = cadenceValue.match(/\d+/);
              cadence = match ? parseInt(match[0]) : 0;
            }

            // Extract sessions number
            let sessions = 0;
            const sessionsValue =
              row["Number of Sessions in the Course"] ||
              row["Number of Sessions in\nthe Course"] ||
              row["Number of Sessions"] ||
              row.sessions;
            if (typeof sessionsValue === "number") {
              sessions = sessionsValue;
            } else if (typeof sessionsValue === "string") {
              const match = sessionsValue.match(/\d+/);
              sessions = match ? parseInt(match[0]) : 0;
            }

            return {
              title: row["Course Title"] || row.title || "",
              cadence: cadence,
              sessions: sessions,
              lastSessionDate:
                row["Date of\nLast Session"] ||
                row["Date of Last Session"] ||
                row.lastSessionDate ||
                null,
              notes: row["Scheduling Notes"] || row.notes || "",
            };
          })
          .filter(
            (course) =>
              course.title && course.cadence > 0 && course.sessions > 0
          );

        resolve(courses);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Generate output Excel with multiple organized tabs
 * @param {Array} scheduledSessions - Array of scheduled session objects
 * @param {Object} calendarData - Calendar grid data
 * @param {string} quarter - Quarter name
 * @param {number} year - Year
 * @returns {Blob} Excel file blob
 */
export const generateOutputExcel = (
  scheduledSessions,
  calendarData,
  quarter,
  year
) => {
  const workbook = XLSX.utils.book_new();

  // Tab 1: Summary
  const summarySheet = createSummarySheet(scheduledSessions, quarter, year);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Tab 2: By Course (grouped by course name)
  const byCourseSheet = createByCourseSheet(scheduledSessions);
  XLSX.utils.book_append_sheet(workbook, byCourseSheet, "By Course");

  // Tab 3: By Month (grouped by month)
  const byMonthSheet = createByMonthSheet(scheduledSessions);
  XLSX.utils.book_append_sheet(workbook, byMonthSheet, "By Month");

  // Tab 4: By Week (grouped by week)
  const byWeekSheet = createByWeekSheet(scheduledSessions);
  XLSX.utils.book_append_sheet(workbook, byWeekSheet, "By Week");

  // Tab 5: Calendar Grid (optional - only if calendarData is provided)
  if (calendarData) {
    const calendarSheet = createCalendarSheet(calendarData);
    XLSX.utils.book_append_sheet(workbook, calendarSheet, "Calendar View");
  }

  // Tab 6: Full Session List
  const sessionSheet = createSessionListSheet(scheduledSessions);
  XLSX.utils.book_append_sheet(workbook, sessionSheet, "All Sessions");

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

/**
 * Create summary sheet with statistics
 * @param {Array} sessions - Array of scheduled sessions
 * @param {string} quarter - Quarter name
 * @param {number} year - Year
 * @returns {Object} Worksheet object
 */
const createSummarySheet = (sessions, quarter, year) => {
  const courseCount = new Set(sessions.map((s) => s.courseName)).size;
  const sessionsByDate = sessions.reduce((acc, s) => {
    const dateKey = format(s.date, "yyyy-MM-dd");
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {});

  const avgSessionsPerDay =
    Object.values(sessionsByDate).reduce((a, b) => a + b, 0) /
    Object.keys(sessionsByDate).length;

  const data = [
    ["LEL Course Schedule Summary"],
    [""],
    ["Quarter", quarter],
    ["Financial Year", `${year}-${String(year + 1).slice(-2)}`],
    [""],
    ["Total Sessions Scheduled", sessions.length],
    ["Unique Courses", courseCount],
    ["Days with Sessions", Object.keys(sessionsByDate).length],
    ["Average Sessions per Day", avgSessionsPerDay.toFixed(1)],
    [""],
    ["Top 5 Most Scheduled Courses"],
    ["Course Name", "Session Count"],
  ];

  // Count sessions by course
  const courseCounts = sessions.reduce((acc, s) => {
    acc[s.courseName] = (acc[s.courseName] || 0) + 1;
    return acc;
  }, {});

  // Sort and get top 5
  const topCourses = Object.entries(courseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  topCourses.forEach(([course, count]) => {
    data.push([course, count]);
  });

  return XLSX.utils.aoa_to_sheet(data);
};

/**
 * Create by-course sheet (grouped by course name)
 * @param {Array} sessions - Array of scheduled sessions
 * @returns {Object} Worksheet object
 */
const createByCourseSheet = (sessions) => {
  // Group sessions by course
  const sessionsByCourse = sessions.reduce((acc, session) => {
    if (!acc[session.courseName]) {
      acc[session.courseName] = [];
    }
    acc[session.courseName].push(session);
    return acc;
  }, {});

  const data = [
    ["Course Name", "Date", "Day", "Session #", "Start Time", "End Time"],
  ];

  // Sort courses alphabetically
  Object.keys(sessionsByCourse)
    .sort()
    .forEach((courseName) => {
      const courseSessions = sessionsByCourse[courseName].sort(
        (a, b) => a.date - b.date
      );

      courseSessions.forEach((session, index) => {
        data.push([
          index === 0 ? courseName : "", // Only show course name on first row
          format(session.date, "MMM dd, yyyy"),
          format(session.date, "EEE"),
          session.sessionNumber,
          session.startTime,
          session.endTime,
        ]);
      });

      // Add blank row between courses
      data.push(["", "", "", "", "", ""]);
    });

  return XLSX.utils.aoa_to_sheet(data);
};

/**
 * Create by-month sheet (grouped by month)
 * @param {Array} sessions - Array of scheduled sessions
 * @returns {Object} Worksheet object
 */
const createByMonthSheet = (sessions) => {
  // Group sessions by month
  const sessionsByMonth = sessions.reduce((acc, session) => {
    const monthKey = format(session.date, "yyyy-MM"); // e.g., "2025-04"
    const monthName = format(session.date, "MMMM yyyy"); // e.g., "April 2025"

    if (!acc[monthKey]) {
      acc[monthKey] = {
        monthName,
        sessions: [],
      };
    }
    acc[monthKey].sessions.push(session);
    return acc;
  }, {});

  const data = [["Month", "Date", "Day", "Course Name", "Session #", "Time"]];

  // Sort months chronologically
  Object.keys(sessionsByMonth)
    .sort()
    .forEach((monthKey) => {
      const { monthName, sessions: monthSessions } = sessionsByMonth[monthKey];
      const sortedSessions = monthSessions.sort((a, b) => {
        if (a.date.getTime() !== b.date.getTime()) return a.date - b.date;
        return a.startTime.localeCompare(b.startTime);
      });

      sortedSessions.forEach((session, index) => {
        data.push([
          index === 0 ? monthName : "",
          format(session.date, "MMM dd"),
          format(session.date, "EEE"),
          session.courseName,
          session.sessionNumber,
          `${session.startTime} - ${session.endTime}`,
        ]);
      });

      // Add blank row between months
      data.push(["", "", "", "", "", ""]);
    });

  return XLSX.utils.aoa_to_sheet(data);
};

/**
 * Create by-week sheet (grouped by week)
 * @param {Array} sessions - Array of scheduled sessions
 * @returns {Object} Worksheet object
 */
const createByWeekSheet = (sessions) => {
  // Group sessions by week
  const sessionsByWeek = sessions.reduce((acc, session) => {
    const weekStart = new Date(session.date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday of the week
    const weekKey = format(weekStart, "yyyy-MM-dd");

    if (!acc[weekKey]) {
      acc[weekKey] = {
        weekStart,
        sessions: [],
      };
    }
    acc[weekKey].sessions.push(session);
    return acc;
  }, {});

  const data = [
    ["Week Starting", "Date", "Day", "Course Name", "Session #", "Time"],
  ];

  // Sort weeks chronologically
  Object.keys(sessionsByWeek)
    .sort()
    .forEach((weekKey) => {
      const { weekStart, sessions: weekSessions } = sessionsByWeek[weekKey];
      const sortedSessions = weekSessions.sort((a, b) => {
        if (a.date.getTime() !== b.date.getTime()) return a.date - b.date;
        return a.startTime.localeCompare(b.startTime);
      });

      sortedSessions.forEach((session, index) => {
        data.push([
          index === 0 ? format(weekStart, "MMM dd, yyyy") : "",
          format(session.date, "MMM dd"),
          format(session.date, "EEE"),
          session.courseName,
          session.sessionNumber,
          `${session.startTime} - ${session.endTime}`,
        ]);
      });

      // Add blank row between weeks
      data.push(["", "", "", "", "", ""]);
    });

  return XLSX.utils.aoa_to_sheet(data);
};

/**
 * Create calendar grid sheet
 * @param {Object} calendarData - Calendar data organized by date and time
 * @returns {Object} Worksheet object
 */
const createCalendarSheet = (calendarData) => {
  const { dates, timeSlots, grid } = calendarData;

  // Filter to only include dates that have sessions
  const datesWithSessions = dates.filter((date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return grid[dateKey] && Object.keys(grid[dateKey]).length > 0;
  });

  // If no sessions, return empty sheet with just headers
  if (datesWithSessions.length === 0) {
    return XLSX.utils.aoa_to_sheet([["Time Slot", "No sessions scheduled"]]);
  }

  // Create header row with dates that have sessions
  const headers = [
    "Time Slot",
    ...datesWithSessions.map((date) => format(date, "MMM dd, yyyy")),
  ];

  // Create data rows - only for time slots that have sessions
  const rows = timeSlots
    .map((timeSlot) => {
      const row = [timeSlot];
      let hasSessionInThisSlot = false;

      datesWithSessions.forEach((date) => {
        const dateKey = format(date, "yyyy-MM-dd");
        const sessions = grid[dateKey]?.[timeSlot] || [];
        if (sessions.length > 0) {
          hasSessionInThisSlot = true;
        }
        row.push(
          sessions.map((s) => `${s.course} (S${s.sessionNumber})`).join("\n")
        );
      });

      // Only return row if it has at least one session
      return hasSessionInThisSlot ? row : null;
    })
    .filter((row) => row !== null);

  const data = [headers, ...rows];
  return XLSX.utils.aoa_to_sheet(data);
};

/**
 * Create session list sheet
 * @param {Array} sessions - Array of scheduled sessions
 * @returns {Object} Worksheet object
 */
const createSessionListSheet = (sessions) => {
  const headers = [
    "Date",
    "First Name",
    "Last Name",
    "Session Number",
    "Course Name",
    "Start Time",
    "End Time",
  ];

  const rows = sessions.map((session) => [
    format(session.date, "dd-MM-yyyy"),
    session.instructorFirstName || "",
    session.instructorLastName || "",
    session.sessionNumber,
    session.courseName,
    session.startTime,
    session.endTime,
  ]);

  const data = [headers, ...rows];
  return XLSX.utils.aoa_to_sheet(data);
};

/**
 * Download Excel file
 * @param {Blob} blob - Excel file blob
 * @param {string} filename - Filename for download
 */
export const downloadExcel = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
