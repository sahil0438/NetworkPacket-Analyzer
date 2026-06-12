// src/components/StatusIndicator.jsx

import React from 'react';

const StatusIndicator = ({ isCapturing, packetCount, isImporting, isExporting }) => { // Added isExporting
  const statusClass = isCapturing ? 'bg-green-500' : 'bg-red-500';
  const statusText = isCapturing ? 'Capturing' : 'Stopped';

  return (
    <div className="flex items-center gap-4 text-sm font-medium">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${statusClass}`}></span>
        <span className="text-gray-300">Status: {statusText}</span>
      </div>
      <div className="text-gray-300">Packets: {packetCount}</div>
      {isImporting && (
        <div className="text-yellow-400 animate-pulse">Importing PCAP...</div>
      )}
      {isExporting && ( // NEW: Display exporting status
        <div className="text-yellow-400 animate-pulse">Exporting PCAP...</div>
      )}
    </div>
  );
};

export default StatusIndicator;