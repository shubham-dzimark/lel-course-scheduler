import React from 'react';
import { getQuarterOptions } from '../utils/quarterUtils';
import './QuarterSelector.css';

const QuarterSelector = ({ selectedQuarter, selectedYear, onQuarterChange, onYearChange }) => {
  const quarters = getQuarterOptions();
  const currentYear = new Date().getFullYear();
  
  // Generate financial year options (e.g., 2025-26)
  const financialYears = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear + i;
    return {
      value: year,
      label: `${year}-${String(year + 1).slice(-2)}` // e.g., "2025-26"
    };
  });

  return (
    <div className="quarter-selector-container">
      <div className="selector-group">
        <label htmlFor="quarter-select" className="selector-label">
          Quarter
        </label>
        <select
          id="quarter-select"
          value={selectedQuarter}
          onChange={(e) => onQuarterChange(e.target.value)}
          className="selector-input"
        >
          <option value="">Select Quarter</option>
          {quarters.map((q) => (
            <option key={q.value} value={q.value}>
              {q.label}
            </option>
          ))}
        </select>
      </div>

      <div className="selector-group">
        <label htmlFor="year-select" className="selector-label">
          Financial Year
        </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="selector-input"
        >
          <option value="">Select Year</option>
          {financialYears.map((fy) => (
            <option key={fy.value} value={fy.value}>
              {fy.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default QuarterSelector;
