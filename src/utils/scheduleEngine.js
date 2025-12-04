/**
 * Schedule Engine
 * Core scheduling algorithm that generates course schedules based on cadence rules
 */

import {
  addWeeks,
  format,
  isSameDay,
  startOfDay,
  differenceInWeeks,
  addDays,
} from "date-fns";
import {
  getAvailableTimeSlots,
  DAY_NAMES,
  getTimeDifferenceInHours,
  isValidForFinancialIntelligence,
} from "./timeSlots";
import { getFinancialYearStart, getWeekdaysInQuarter } from "./quarterUtils";

/**
 * Generate schedule for a quarter
 * @param {Array} courses - Array of course objects from cadence file
 * @param {string} quarter - Quarter name (Q1, Q2, Q3, Q4)
 * @param {number} year - Year
 * @returns {Object} Scheduled sessions and calendar data
 */
export const generateSchedule = (courses, quarter, year) => {
  // The 'year' parameter represents the financial year start year
  // For FY 2025-26: year = 2025, so April 1, 2025 is the start
  const financialYearStart = getFinancialYearStart(year);
  const quarterDates = getWeekdaysInQuarter(quarter, year);

  // Initialize availability grid
  const availabilityGrid = initializeAvailabilityGrid(quarterDates);

  // Track course history for constraint checking
  const courseHistory = new Map();

  // Schedule all courses
  const scheduledSessions = [];

  courses.forEach((course) => {
    const sessions = scheduleCourse(
      course,
      financialYearStart,
      quarterDates,
      availabilityGrid,
      courseHistory
    );
    scheduledSessions.push(...sessions);
  });

  // Sort sessions by date and time
  scheduledSessions.sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) {
      return a.date - b.date;
    }
    return a.startTime.localeCompare(b.startTime);
  });

  // Generate calendar grid data
  const calendarData = generateCalendarGrid(scheduledSessions, quarterDates);

  return {
    scheduledSessions,
    calendarData,
    statistics: calculateStatistics(availabilityGrid, scheduledSessions),
  };
};

/**
 * Initialize availability grid for all dates and time slots
 * @param {Array<Date>} dates - Array of dates in the quarter
 * @returns {Map} Availability grid
 */
const initializeAvailabilityGrid = (dates) => {
  const grid = new Map();

  dates.forEach((date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const slots = getAvailableTimeSlots(date);

    grid.set(dateKey, {
      date,
      slots: slots.map((slot) => ({
        ...slot,
        available: true,
        session: null,
      })),
    });
  });

  return grid;
};

/**
 * Schedule a single course across the quarter
 * @param {Object} course - Course object
 * @param {Date} financialYearStart - Start of financial year (April 1)
 * @param {Array<Date>} quarterDates - Dates in the quarter
 * @param {Map} availabilityGrid - Availability grid
 * @param {Map} courseHistory - Course scheduling history
 * @returns {Array} Scheduled sessions for this course
 */
const scheduleCourse = (
  course,
  financialYearStart,
  quarterDates,
  availabilityGrid,
  courseHistory
) => {
  const sessions = [];
  const isFinancialIntelligence = course.title
    .toLowerCase()
    .includes("financial intelligence");

  // Calculate when course instances can start based on cadence from April 1
  const cadenceStartDates = calculateCadenceStartDates(
    course,
    financialYearStart,
    quarterDates
  );

  // For each cadence period, try to schedule the course on ALL available days/times
  cadenceStartDates.forEach((cadenceDate) => {
    // Get all weekdays in the quarter starting from this cadence date
    const availableDates = quarterDates.filter((date) => date >= cadenceDate);

    // Try to schedule on each available date
    for (const startDate of availableDates) {
      const scheduled = scheduleCourseSessions(
        course,
        startDate,
        quarterDates,
        availabilityGrid,
        courseHistory,
        isFinancialIntelligence
      );

      if (scheduled.length > 0) {
        sessions.push(...scheduled);

        // Update course history
        const history = courseHistory.get(course.title) || [];
        history.push({
          startDate,
          dayOfWeek: DAY_NAMES[startDate.getDay()],
          startTime: scheduled[0].startTime,
        });
        courseHistory.set(course.title, history);

        // Successfully scheduled, continue to try more dates in this cadence period
      }
    }
  });

  return sessions;
};

/**
 * Calculate cadence-based start dates (when new course instances can begin)
 * @param {Object} course - Course object
 * @param {Date} financialYearStart - Start of financial year (April 1)
 * @param {Array<Date>} quarterDates - Dates in the quarter
 * @returns {Array<Date>} Cadence start dates
 */
const calculateCadenceStartDates = (
  course,
  financialYearStart,
  quarterDates
) => {
  const cadenceDates = [];

  // Calculate financial year end (March 31 of next year)
  const financialYearEnd = new Date(financialYearStart);
  financialYearEnd.setFullYear(financialYearEnd.getFullYear() + 1);
  financialYearEnd.setMonth(2); // March (0-indexed)
  financialYearEnd.setDate(31);

  // Find the first weekday on or after April 1st
  let currentDate = new Date(financialYearStart);
  while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
    currentDate = addDays(currentDate, 1);
  }

  // Generate cadence dates from the first weekday of financial year
  // These represent when NEW INSTANCES of the course can start
  while (currentDate <= financialYearEnd) {
    // Only include dates that fall within or before the quarter
    if (currentDate <= quarterDates[quarterDates.length - 1]) {
      cadenceDates.push(new Date(currentDate));
    }

    // Move to next cadence period
    currentDate = addWeeks(currentDate, course.cadence);
  }

  return cadenceDates;
};

/**
 * Schedule all sessions for a course instance
 * @param {Object} course - Course object
 * @param {Date} startDate - Proposed start date
 * @param {Array<Date>} quarterDates - Dates in the quarter
 * @param {Map} availabilityGrid - Availability grid
 * @param {Map} courseHistory - Course scheduling history
 * @param {boolean} isFinancialIntelligence - Special handling flag
 * @returns {Array} Scheduled sessions or empty array if couldn't schedule
 */
const scheduleCourseSessions = (
  course,
  startDate,
  quarterDates,
  availabilityGrid,
  courseHistory,
  isFinancialIntelligence
) => {
  const history = courseHistory.get(course.title) || [];

  // Find a suitable time slot
  const suitableSlot = findSuitableSlot(
    startDate,
    course,
    availabilityGrid,
    history,
    isFinancialIntelligence
  );

  if (!suitableSlot) {
    return [];
  }

  // Try to schedule all consecutive sessions
  const sessions = [];
  let currentSessionDate = new Date(startDate);

  for (let sessionNum = 1; sessionNum <= course.sessions; sessionNum++) {
    // Find the same day of week and time slot
    const sessionDate = findNextAvailableDate(
      currentSessionDate,
      suitableSlot.dayOfWeek,
      quarterDates
    );

    if (!sessionDate) {
      // Couldn't schedule all sessions, rollback
      rollbackSessions(sessions, availabilityGrid);
      return [];
    }

    const dateKey = format(sessionDate, "yyyy-MM-dd");
    const dayData = availabilityGrid.get(dateKey);

    if (!dayData) {
      rollbackSessions(sessions, availabilityGrid);
      return [];
    }

    const slotIndex = dayData.slots.findIndex(
      (s) => s.start === suitableSlot.startTime && s.available
    );

    if (slotIndex === -1) {
      // Slot not available, rollback
      rollbackSessions(sessions, availabilityGrid);
      return [];
    }

    // Mark slot as used
    dayData.slots[slotIndex].available = false;
    dayData.slots[slotIndex].session = {
      course: course.title,
      sessionNumber: sessionNum,
    };

    // Add to sessions
    sessions.push({
      date: sessionDate,
      courseName: course.title,
      sessionNumber: sessionNum,
      startTime: suitableSlot.startTime,
      endTime: suitableSlot.endTime,
      instructorFirstName: "",
      instructorLastName: "",
    });

    // Move to next week
    currentSessionDate = addWeeks(sessionDate, 1);
  }

  return sessions;
};

/**
 * Find a suitable time slot for a course
 * @param {Date} date - Proposed date
 * @param {Object} course - Course object
 * @param {Map} availabilityGrid - Availability grid
 * @param {Array} history - Previous instances of this course
 * @param {boolean} isFinancialIntelligence - Special handling flag
 * @returns {Object|null} Suitable slot or null
 */
const findSuitableSlot = (
  date,
  course,
  availabilityGrid,
  history,
  isFinancialIntelligence
) => {
  const dateKey = format(date, "yyyy-MM-dd");
  const dayData = availabilityGrid.get(dateKey);

  if (!dayData) return null;

  const dayOfWeek = DAY_NAMES[date.getDay()];

  // Check constraints from history
  const lastInstance = history[history.length - 1];

  for (const slot of dayData.slots) {
    if (!slot.available) continue;

    // Financial Intelligence special rule
    if (
      isFinancialIntelligence &&
      !isValidForFinancialIntelligence(dayOfWeek, slot.start)
    ) {
      continue;
    }

    // Check constraints if there's history
    if (lastInstance) {
      // Cannot be same day (except Financial Intelligence)
      if (!isFinancialIntelligence && dayOfWeek === lastInstance.dayOfWeek) {
        continue;
      }

      // Must be at least 3 hours different
      const timeDiff = getTimeDifferenceInHours(
        slot.start,
        lastInstance.startTime
      );
      if (timeDiff < 3) {
        continue;
      }
    }

    return {
      dayOfWeek,
      startTime: slot.start,
      endTime: slot.end,
    };
  }

  return null;
};

/**
 * Find next available date for a specific day of week
 * @param {Date} fromDate - Starting date
 * @param {string} targetDayOfWeek - Target day name
 * @param {Array<Date>} quarterDates - Dates in the quarter
 * @returns {Date|null} Next available date or null
 */
const findNextAvailableDate = (fromDate, targetDayOfWeek, quarterDates) => {
  const targetDayIndex = DAY_NAMES.indexOf(targetDayOfWeek);

  for (const date of quarterDates) {
    if (date >= fromDate && date.getDay() === targetDayIndex) {
      return date;
    }
  }

  return null;
};

/**
 * Rollback scheduled sessions
 * @param {Array} sessions - Sessions to rollback
 * @param {Map} availabilityGrid - Availability grid
 */
const rollbackSessions = (sessions, availabilityGrid) => {
  sessions.forEach((session) => {
    const dateKey = format(session.date, "yyyy-MM-dd");
    const dayData = availabilityGrid.get(dateKey);

    if (dayData) {
      const slotIndex = dayData.slots.findIndex(
        (s) => s.start === session.startTime
      );
      if (slotIndex !== -1) {
        dayData.slots[slotIndex].available = true;
        dayData.slots[slotIndex].session = null;
      }
    }
  });
};

/**
 * Generate calendar grid data for display
 * @param {Array} sessions - Scheduled sessions
 * @param {Array<Date>} quarterDates - Dates in the quarter
 * @returns {Object} Calendar grid data
 */
const generateCalendarGrid = (sessions, quarterDates) => {
  const grid = {};
  const allTimeSlots = new Set();

  sessions.forEach((session) => {
    const dateKey = format(session.date, "yyyy-MM-dd");
    const timeSlot = `${session.startTime} - ${session.endTime}`;

    if (!grid[dateKey]) {
      grid[dateKey] = {};
    }

    if (!grid[dateKey][timeSlot]) {
      grid[dateKey][timeSlot] = [];
    }

    grid[dateKey][timeSlot].push({
      course: session.courseName,
      sessionNumber: session.sessionNumber,
    });

    allTimeSlots.add(timeSlot);
  });

  return {
    dates: quarterDates,
    timeSlots: Array.from(allTimeSlots).sort(),
    grid,
  };
};

/**
 * Calculate scheduling statistics
 * @param {Map} availabilityGrid - Availability grid
 * @param {Array} sessions - Scheduled sessions
 * @returns {Object} Statistics
 */
const calculateStatistics = (availabilityGrid, sessions) => {
  let totalSlots = 0;
  let availableSlots = 0;
  const fullyBookedDates = [];

  availabilityGrid.forEach((dayData, dateKey) => {
    const dayTotalSlots = dayData.slots.length;
    const dayAvailableSlots = dayData.slots.filter((s) => s.available).length;

    totalSlots += dayTotalSlots;
    availableSlots += dayAvailableSlots;

    if (dayTotalSlots > 0 && dayAvailableSlots === 0) {
      fullyBookedDates.push(dayData.date);
    }
  });

  return {
    totalAvailableSlots: totalSlots,
    slotsAfterScheduling: availableSlots,
    totalScheduledSessions: sessions.length,
    fullyBookedDates,
    utilizationPercentage:
      totalSlots > 0
        ? (((totalSlots - availableSlots) / totalSlots) * 100).toFixed(2)
        : 0,
  };
};
