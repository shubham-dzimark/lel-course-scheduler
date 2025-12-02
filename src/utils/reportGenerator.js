/**
 * Report Generator
 * Generates Word document reports with scheduling statistics
 */

import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, HeadingLevel } from 'docx';
import { format } from 'date-fns';

/**
 * Generate Word document report
 * @param {Object} statistics - Scheduling statistics
 * @param {string} quarter - Quarter name
 * @param {number} year - Year
 * @returns {Promise<Blob>} Word document blob
 */
export const generateReport = async (statistics, quarter, year) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          text: `LEL Course Schedule Report`,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
        }),
        
        new Paragraph({
          text: `${quarter} ${year}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 400 },
        }),
        
        // Summary Section
        new Paragraph({
          text: 'Summary Statistics',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: 'Total Available Time Slots (without exceptions): ',
              bold: true,
            }),
            new TextRun({
              text: statistics.totalAvailableSlots.toString(),
            }),
          ],
          spacing: { after: 150 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: 'Available Time Slots (after special dates and exceptions): ',
              bold: true,
            }),
            new TextRun({
              text: statistics.totalAvailableSlots.toString(),
            }),
          ],
          spacing: { after: 150 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: 'Total Sessions Scheduled: ',
              bold: true,
            }),
            new TextRun({
              text: statistics.totalScheduledSessions.toString(),
            }),
          ],
          spacing: { after: 150 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: 'Remaining Available Slots: ',
              bold: true,
            }),
            new TextRun({
              text: statistics.slotsAfterScheduling.toString(),
            }),
          ],
          spacing: { after: 150 },
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: 'Utilization Percentage: ',
              bold: true,
            }),
            new TextRun({
              text: `${statistics.utilizationPercentage}%`,
            }),
          ],
          spacing: { after: 300 },
        }),
        
        // Fully Booked Dates Section
        new Paragraph({
          text: 'Dates with 100% Time Slot Utilization',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        ...(statistics.fullyBookedDates.length > 0
          ? statistics.fullyBookedDates.map(date =>
              new Paragraph({
                text: `• ${format(date, 'EEEE, MMMM dd, yyyy')}`,
                spacing: { after: 100 },
              })
            )
          : [new Paragraph({
              text: 'No dates with 100% utilization',
              italics: true,
            })]),
        
        // Additional Information
        new Paragraph({
          text: 'Notes',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        
        new Paragraph({
          text: '• All sessions are scheduled according to delivery cadence rules',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: '• Sessions for each course are consecutive weeks at the same time',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: '• Courses avoid same day/time as previous instances (minimum 3-hour gap)',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: '• Financial Intelligence courses are scheduled on Tuesday/Wednesday 10am-1pm',
          spacing: { after: 100 },
        }),
        
        new Paragraph({
          text: '• Special dates and holidays have been accounted for',
          spacing: { after: 100 },
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
};

/**
 * Download Word document
 * @param {Blob} blob - Word document blob
 * @param {string} filename - Filename for download
 */
export const downloadReport = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
