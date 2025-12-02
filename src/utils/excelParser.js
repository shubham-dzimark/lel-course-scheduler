/**
 * Excel Parser
 * Handles reading cadence data from Excel and generating output Excel files
 */

import * as XLSX from 'xlsx';
import { format } from 'date-fns';

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
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Assume first sheet contains cadence data
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        // Parse and normalize course data
        const courses = jsonData.map(row => {
          // Extract cadence number (handle both numeric and text with numbers)
          let cadence = 0;
          // Note: Column name has a SPACE before the newline
          const cadenceValue = row['Delivery Cadence \n(The course begins every X weeks)'] || row['Delivery Cadence\n(The course begins every X weeks)'] || row['Delivery Cadence'] || row.cadence;
          
          if (typeof cadenceValue === 'number') {
            cadence = cadenceValue;
          } else if (typeof cadenceValue === 'string') {
            const match = cadenceValue.match(/\d+/);
            cadence = match ? parseInt(match[0]) : 0;
          }
          
          // Extract sessions number
          let sessions = 0;
          const sessionsValue = row['Number of Sessions in the Course'] || row['Number of Sessions in\nthe Course'] || row['Number of Sessions'] || row.sessions;
          if (typeof sessionsValue === 'number') {
            sessions = sessionsValue;
          } else if (typeof sessionsValue === 'string') {
            const match = sessionsValue.match(/\d+/);
            sessions = match ? parseInt(match[0]) : 0;
          }
          
          return {
            title: row['Course Title'] || row.title || '',
            cadence: cadence,
            sessions: sessions,
            lastSessionDate: row['Date of\nLast Session'] || row['Date of Last Session'] || row.lastSessionDate || null,
            notes: row['Scheduling Notes'] || row.notes || '',
          };
        }).filter(course => course.title && course.cadence > 0 && course.sessions > 0);
        
        resolve(courses);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Generate output Excel with two tabs
 * @param {Array} scheduledSessions - Array of scheduled session objects
 * @param {Object} calendarData - Calendar grid data
 * @param {string} quarter - Quarter name
 * @param {number} year - Year
 * @returns {Blob} Excel file blob
 */
export const generateOutputExcel = (scheduledSessions, calendarData, quarter, year) => {
  const workbook = XLSX.utils.book_new();

  // Tab 1: Calendar Grid
  const calendarSheet = createCalendarSheet(calendarData);
  XLSX.utils.book_append_sheet(workbook, calendarSheet, 'Calendar View');

  // Tab 2: Session List
  const sessionSheet = createSessionListSheet(scheduledSessions);
  XLSX.utils.book_append_sheet(workbook, sessionSheet, 'Session List');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Create calendar grid sheet
 * @param {Object} calendarData - Calendar data organized by date and time
 * @returns {Object} Worksheet object
 */
const createCalendarSheet = (calendarData) => {
  const { dates, timeSlots, grid } = calendarData;
  
  // Filter to only include dates that have sessions
  const datesWithSessions = dates.filter(date => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return grid[dateKey] && Object.keys(grid[dateKey]).length > 0;
  });
  
  // If no sessions, return empty sheet with just headers
  if (datesWithSessions.length === 0) {
    return XLSX.utils.aoa_to_sheet([['Time Slot', 'No sessions scheduled']]);
  }
  
  // Create header row with dates that have sessions
  const headers = ['Time Slot', ...datesWithSessions.map(date => format(date, 'MMM dd, yyyy'))];
  
  // Create data rows - only for time slots that have sessions
  const rows = timeSlots.map(timeSlot => {
    const row = [timeSlot];
    let hasSessionInThisSlot = false;
    
    datesWithSessions.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const sessions = grid[dateKey]?.[timeSlot] || [];
      if (sessions.length > 0) {
        hasSessionInThisSlot = true;
      }
      row.push(sessions.map(s => `${s.course} (S${s.sessionNumber})`).join('\n'));
    });
    
    // Only return row if it has at least one session
    return hasSessionInThisSlot ? row : null;
  }).filter(row => row !== null);

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
    'Date',
    'First Name',
    'Last Name',
    'Session Number',
    'Course Name',
    'Start Time',
    'End Time',
  ];

  const rows = sessions.map(session => [
    format(session.date, 'dd-MM-yyyy'),
    session.instructorFirstName || '',
    session.instructorLastName || '',
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
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
