/**
 * Quarter Utilities
 * Handles quarter definitions and date calculations
 * Calendar year starts in January
 */

import { startOfMonth, endOfMonth, addMonths } from "date-fns";

// Quarter definitions (Calendar year starts in January)
export const QUARTERS = {
  Q1: { name: "Q1", months: [1, 2, 3], label: "Q1 (Jan-Mar)" },
  Q2: { name: "Q2", months: [4, 5, 6], label: "Q2 (Apr-Jun)" },
  Q3: { name: "Q3", months: [7, 8, 9], label: "Q3 (Jul-Sep)" },
  Q4: { name: "Q4", months: [10, 11, 12], label: "Q4 (Oct-Dec)" },
};

/**
 * Get quarter date range
 * @param {string} quarter - Quarter name (Q1, Q2, Q3, Q4)
 * @param {number} year - Calendar year (e.g., 2025)
 * @returns {Object} Object with startDate and endDate
 */
export const getQuarterDateRange = (quarter, year) => {
  const quarterInfo = QUARTERS[quarter];
  if (!quarterInfo) {
    throw new Error(`Invalid quarter: ${quarter}`);
  }

  const [firstMonth, , lastMonth] = quarterInfo.months;

  // All quarters are in the same calendar year
  const startDate = startOfMonth(new Date(year, firstMonth - 1, 1));
  const endDate = endOfMonth(new Date(year, lastMonth - 1, 1));

  return { startDate, endDate };
};

/**
 * Get calendar year start date (January 1st)
 * @param {number} year - Calendar year
 * @returns {Date} Calendar year start date
 */
export const getFinancialYearStart = (year) => {
  return new Date(year, 0, 1); // January 1st (month is 0-indexed)
};

/**
 * Get all dates in a quarter
 * @param {string} quarter - Quarter name
 * @param {number} year - Year
 * @returns {Array<Date>} Array of all dates in the quarter
 */
export const getAllDatesInQuarter = (quarter, year) => {
  const { startDate, endDate } = getQuarterDateRange(quarter, year);
  const dates = [];

  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

/**
 * Get weekday dates in a quarter (Mon-Fri only)
 * @param {string} quarter - Quarter name
 * @param {number} year - Year
 * @returns {Array<Date>} Array of weekday dates
 */
export const getWeekdaysInQuarter = (quarter, year) => {
  const allDates = getAllDatesInQuarter(quarter, year);
  return allDates.filter((date) => {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday to Friday
  });
};

/**
 * Format quarter for display
 * @param {string} quarter - Quarter name
 * @param {number} year - Year
 * @returns {string} Formatted quarter string
 */
export const formatQuarter = (quarter, year) => {
  const quarterInfo = QUARTERS[quarter];
  if (!quarterInfo) return "";

  return `${quarterInfo.label} ${year}`;
};

/**
 * Get quarter options for dropdown
 * @returns {Array} Array of quarter options
 */
export const getQuarterOptions = () => {
  return Object.values(QUARTERS).map((q) => ({
    value: q.name,
    label: q.label,
  }));
};
