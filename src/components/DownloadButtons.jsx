import React from 'react';
import './DownloadButtons.css';

const DownloadButtons = ({ onDownloadExcel, onDownloadReport, disabled }) => {
  return (
    <div className="download-buttons-container">
      <button
        onClick={onDownloadExcel}
        disabled={disabled}
        className="download-btn excel-btn"
      >
        <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Download Excel</span>
      </button>

      <button
        onClick={onDownloadReport}
        disabled={disabled}
        className="download-btn report-btn"
      >
        <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Download Report</span>
      </button>
    </div>
  );
};

export default DownloadButtons;
