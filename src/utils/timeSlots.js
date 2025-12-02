/**
 * Time Slots Configuration
 * Defines weekly schedule structure and special date handling with dynamic year support
 */

import { format } from 'date-fns';

// Time slot definitions for each day of the week
export const WEEKLY_SCHEDULE = {
  MONDAY: [
    { start: "06:00", end: "06:30" },
    { start: "07:00", end: "07:30" },
    // Skip 8am
    { start: "09:00", end: "09:30" },
    { start: "10:00", end: "10:30" },
    { start: "11:00", end: "11:30" },
    { start: "12:00", end: "12:30" },
    { start: "13:00", end: "13:30" },
    { start: "14:00", end: "14:30" },
    { start: "15:00", end: "15:30" },
    { start: "16:00", end: "16:30" },
    { start: "17:00", end: "17:30" },
    { start: "18:00", end: "18:30" },
    { start: "19:00", end: "19:30" },
    { start: "20:00", end: "20:30" },
  ], // 14 slots

  TUESDAY: [
    { start: "06:00", end: "06:30" },
    { start: "07:00", end: "07:30" },
    // Skip 8am
    { start: "09:00", end: "09:30" },
    { start: "10:00", end: "10:30" },
    { start: "11:00", end: "11:30" },
    { start: "12:00", end: "12:30" },
    { start: "13:00", end: "13:30" },
    { start: "14:00", end: "14:30" },
    { start: "15:00", end: "15:30" },
    { start: "16:00", end: "16:30" },
    { start: "17:00", end: "17:30" },
  ], // 11 slots

  WEDNESDAY: [
    { start: "06:00", end: "06:30" },
    { start: "07:00", end: "07:30" },
    { start: "08:00", end: "08:30" },
    { start: "09:00", end: "09:30" },
    { start: "10:00", end: "10:30" },
    { start: "11:00", end: "11:30" },
    { start: "12:00", end: "12:30" },
    { start: "13:00", end: "13:30" },
    { start: "14:00", end: "14:30" },
    { start: "15:00", end: "15:30" },
    { start: "16:00", end: "16:30" },
    { start: "17:00", end: "17:30" },
  ], // 12 slots

  THURSDAY: [
    { start: "06:00", end: "06:30" },
    { start: "07:00", end: "07:30" },
    { start: "08:00", end: "08:30" },
    { start: "09:00", end: "09:30" },
    { start: "10:00", end: "10:30" },
    { start: "11:00", end: "11:30" },
    { start: "12:00", end: "12:30" },
    { start: "13:00", end: "13:30" },
    { start: "14:00", end: "14:30" },
    { start: "15:00", end: "15:30" },
    { start: "16:00", end: "16:30" },
    { start: "17:00", end: "17:30" },
  ], // 12 slots

  FRIDAY: [
    { start: "06:00", end: "06:30" },
    { start: "07:00", end: "07:30" },
    { start: "08:00", end: "08:30" },
    { start: "09:00", end: "09:30" },
    { start: "10:00", end: "10:30" },
    { start: "11:00", end: "11:30" },
    { start: "12:00", end: "12:30" },
    { start: "13:00", end: "13:30" },
  ], // 7 slots (ends at 1:30pm)
};

// Day name mapping
export const DAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

/**
 * Calculate Thanksgiving date for a given year (4th Thursday of November)
 * @param {number} year - Year to calculate for
 * @returns {Date} Thanksgiving date
 */
const getThanksgivingDate = (year) => {
  const november = new Date(year, 10, 1); // November 1st
  let thursdayCount = 0;
  let date = new Date(november);
  
  while (thursdayCount < 4) {
    if (date.getDay() === 4) { // Thursday
      thursdayCount++;
      if (thursdayCount === 4) return new Date(date);
    }
    date.setDate(date.getDate() + 1);
  }
  return date;
};

/**
 * Get special dates for a given year (holidays and restricted dates)
 * @param {number} year - Year to get special dates for
 * @returns {Object} Special dates configuration
 */
const getSpecialDatesForYear = (year) => {
  return {
    // No sessions all day
    noSessionDates: [
      new Date(year, 0, 1),   // New Year's Day
      new Date(year, 6, 4),   // Fourth of July
      getThanksgivingDate(year), // Thanksgiving
      new Date(year, 11, 25), // Christmas
    ],
    
    // No sessions after specific times
    restrictedDates: [
      { date: new Date(year, 3, 17), afterTime: '08:30' },  // April 17 after 8:30am
      { date: new Date(year, 4, 22), afterTime: '08:30' },  // May 22 after 8:30am
      { date: new Date(year, 5, 19), afterTime: '08:30' },  // June 19 after 8:30am
      { date: new Date(year, 11, 24), afterTime: '13:00' }, // Christmas Eve after 1pm
      { date: new Date(year, 11, 31), afterTime: '13:00' }, // New Year's Eve after 1pm
    ]
  };
};

/**
 * Get available time slots for a specific date
 * @param {Date} date - The date to check
 * @returns {Array} Array of available time slots
 */
export const getAvailableTimeSlots = (date) => {
  const dayName = DAY_NAMES[date.getDay()];

  // Weekend - no slots
  if (dayName === "SUNDAY" || dayName === "SATURDAY") {
    return [];
  }

  const baseSlots = WEEKLY_SCHEDULE[dayName] || [];
  const year = date.getFullYear();
  const specialDates = getSpecialDatesForYear(year);
  const dateStr = format(date, 'yyyy-MM-dd');

  // Check if it's a no-session date
  for (const noSessionDate of specialDates.noSessionDates) {
    if (format(noSessionDate, 'yyyy-MM-dd') === dateStr) {
      return [];
    }
  }

  // Check for restricted dates
  for (const restricted of specialDates.restrictedDates) {
    if (format(restricted.date, 'yyyy-MM-dd') === dateStr) {
      return baseSlots.filter(slot => {
        const slotTime = slot.start.replace(':', '');
        const afterTime = restricted.afterTime.replace(':', '');
        return slotTime < afterTime;
      });
    }
  }

  return baseSlots;
};

/**
 * Get all unique time slots across all days
 * @returns {Array} Array of all possible time slots
 */
export const getAllTimeSlots = () => {
  const allSlots = new Set();

  Object.values(WEEKLY_SCHEDULE).forEach((daySlots) => {
    daySlots.forEach((slot) => {
      allSlots.add(`${slot.start} - ${slot.end}`);
    });
  });

  return Array.from(allSlots).sort();
};

/**
 * Calculate time difference in hours between two time strings
 * @param {string} time1 - First time (HH:MM format)
 * @param {string} time2 - Second time (HH:MM format)
 * @returns {number} Difference in hours
 */
export const getTimeDifferenceInHours = (time1, time2) => {
  const [h1, m1] = time1.split(":").map(Number);
  const [h2, m2] = time2.split(":").map(Number);

  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;

  return Math.abs(minutes1 - minutes2) / 60;
};

/**
 * Check if a time slot is valid for Financial Intelligence course
 * @param {string} dayName - Day of the week
 * @param {string} startTime - Start time (HH:MM format)
 * @returns {boolean} True if valid for Financial Intelligence
 */
export const isValidForFinancialIntelligence = (dayName, startTime) => {
  if (dayName !== "TUESDAY" && dayName !== "WEDNESDAY") {
    return false;
  }

  const [hour] = startTime.split(":").map(Number);
  return hour >= 10 && hour < 13;
};
