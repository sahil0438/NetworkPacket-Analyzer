// src/components/ControlPanel.jsx

import React from 'react';
import { Play, Square, Trash2, Download, Upload } from 'lucide-react';
import FilterBar from '../FilterBar';
import StatusIndicator from '../StatusIndicator';

const ControlPanel = ({
  isCapturing,
  packetCount,
  packets,
  filter,
  setFilter,
  startCapture,
  stopCapture,
  clearPackets,
  exportPackets,
  isImporting,
  importPcap,
  isExporting
  // Removed: availableInterfaces, selectedInterface, setSelectedInterface
}) => {
  const handlePcapFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      importPcap(file);
    }
    event.target.value = null; // Clear the input so same file can be selected again
  };

  // Combined state for operations that block other 'start' related actions
  const isBlockingStart = isCapturing || isImporting || isExporting;

  // 'Clear' and 'Import/Export' buttons might be disabled if another non-capture operation is active.
  const isNonCaptureOperationInProgress = isImporting || isExporting;

  // Start button disabled only if any blocking operation is in progress
  const isStartDisabled = isBlockingStart; 

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Removed: Interface Selection Dropdown */}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {/* Start Button: Disabled if any blocking operation is active */}
          <button
            onClick={startCapture}
            disabled={isStartDisabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              isStartDisabled
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Play size={16} />
            Start
          </button>

          {/* Stop Button: Enabled ONLY if capturing is true */}
          <button
            onClick={stopCapture}
            disabled={!isCapturing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              !isCapturing
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <Square size={16} />
            Stop
          </button>

          {/* Clear Button: Enabled during capture. Disabled only during import/export. */}
          <button
            onClick={clearPackets}
            disabled={isNonCaptureOperationInProgress}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              isNonCaptureOperationInProgress
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            <Trash2 size={16} />
            Clear
          </button>

          {/* Export PCAP Button */}
          <button
            onClick={() => exportPackets('pcap')}
            disabled={packets.length === 0 || isBlockingStart}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              packets.length === 0 || isBlockingStart
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Download size={16} />
            {isExporting ? 'Exporting...' : 'Export PCAP'}
          </button>
        </div>

        {/* Import PCAP Button */}
        <label
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
            isBlockingStart
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          <Upload size={16} />
          {isImporting ? 'Importing...' : 'Import PCAP'}
          <input
            type="file"
            accept=".pcap,.cap,.pcapng"
            onChange={handlePcapFileChange}
            disabled={isBlockingStart}
            className="hidden"
          />
        </label>

        {/* Filter Bar */}
        <FilterBar filter={filter} setFilter={setFilter} />

        {/* Status Indicator */}
        <StatusIndicator isCapturing={isCapturing} packetCount={packetCount} isImporting={isImporting} isExporting={isExporting} />
      </div>
    </div>
  );
};

export default ControlPanel;