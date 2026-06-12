// src/hooks/usePacketCapture.js

import { useState, useEffect, useRef, useCallback } from 'react';
import { saveAs } from 'file-saver';
import { exportPacketsToFile, exportToCSV } from '../utils/packetExporter';

export const usePacketCapture = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [packets, setPackets] = useState([]);
  const [packetCount, setPacketCount] = useState(0);
  const [filter, setFilter] = useState('');
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  // Removed: availableInterfaces, selectedInterface, setSelectedInterface (as per previous decision)

  const wsRef = useRef(null);

  const filteredPackets = useCallback(() => {
    if (!filter) {
      return packets;
    }
    const lowerCaseFilter = filter.toLowerCase();
    return packets.filter(packet =>
      (packet.protocol && packet.protocol.toLowerCase().includes(lowerCaseFilter)) ||
      (packet.sourceIP && packet.sourceIP.toLowerCase().includes(lowerCaseFilter)) ||
      (packet.destIP && packet.destIP.toLowerCase().includes(lowerCaseFilter)) ||
      (packet.info && packet.info.toLowerCase().includes(lowerCaseFilter))
    );
  }, [packets, filter]);

  useEffect(() => {
    // This effect handles the WebSocket connection
    // Ensure the WebSocket URL is also correct
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      console.log('FRONTEND LOG: Attempting to establish new WebSocket connection...');
      // IMPORTANT: Ensure this WebSocket URL is correct
      const ws = new WebSocket('ws://localhost:5000/ws'); 
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('FRONTEND LOG: WebSocket connection OPENED successfully!');
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'packet') {
          setPackets((prevPackets) => {
            // Prepend new packet for most recent at top
            const newPackets = [message.data, ...prevPackets];
            return newPackets;
          });
          setPacketCount((prevCount) => prevCount + 1);
        } else if (message.type === 'error') {
          console.error('FRONTEND LOG: Server error:', message.message);
          alert(`Server Error: ${message.message}`);
          // Consider stopping capture if a critical server error occurs
          setIsCapturing(false); 
        }
      };

      ws.onclose = (event) => {
        console.log('FRONTEND LOG: WebSocket DISCONNECTED. Code:', event.code, 'Reason:', event.reason);
        // If connection closes while capturing, stop capturing state
        setIsCapturing(false); 
      };

      ws.onerror = (error) => {
        console.error('FRONTEND LOG: WebSocket ERROR:', error);
        // If an error occurs, stop capturing state
        setIsCapturing(false);
        alert('WebSocket connection error. Check console for details.');
      };
    }

    // Cleanup function for useEffect
    return () => {
      console.log('FRONTEND LOG: Running useEffect cleanup. Current wsRef state:', wsRef.current?.readyState);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('FRONTEND LOG: Closing WebSocket explicitly during cleanup.');
        wsRef.current.close(1000, "Component unmounted or effect re-ran");
      } else if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        console.log('FRONTEND LOG: WebSocket not open, but not closed. Attempting to close.');
        // If for some reason it's not OPEN but not CLOSED, try to close it anyway
        wsRef.current.close();
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  const startCapture = async () => {
    // The interface is now hardcoded in server.py, so we don't send it from here.
    try {
      // IMPORTANT: Correct the fetch URL here!
      const response = await fetch('http://localhost:5000/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // This is crucial for Flask's request.json
        },
        body: JSON.stringify({
          // These parameters are still sent, but 'interface' is no longer expected by server.py for sniffing.
          enableLiveSave: false, // Default value, modify if you add UI for it
          maxFileSize: 5,        // Default value
          filenamePrefix: "live_capture" // Default value
        }),
      });
      if (response.ok) {
        setIsCapturing(true);
        console.log('FRONTEND LOG: Capture started via API');
      } else {
        const errorText = await response.text(); // Get detailed error message from backend
        console.error('FRONTEND LOG: Failed to start capture via API:', response.status, errorText);
        alert(`Failed to start capture: ${errorText || 'Server error'}`);
      }
    } catch (error) {
      console.error('FRONTEND LOG: Error starting capture API:', error);
      alert('Error starting capture. Check console for details (e.g., server not running or wrong URL).');
    }
  };

  const stopCapture = async () => {
    try {
      // IMPORTANT: Correct the fetch URL here!
      const response = await fetch('http://localhost:5000/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Send JSON even if body is empty for consistency
        },
        body: JSON.stringify({}), // Sending an empty JSON object
      });
      if (response.ok) {
        setIsCapturing(false);
        console.log('FRONTEND LOG: Capture stopped via API');
      } else {
        const errorText = await response.text();
        console.error('FRONTEND LOG: Failed to stop capture via API:', response.status, errorText);
        alert(`Failed to stop capture: ${errorText || 'Server error'}`);
      }
    } catch (error) {
      console.error('FRONTEND LOG: Error stopping capture API:', error);
      alert('Error stopping capture. Check console for details.');
    }
  };

  const clearPackets = () => {
    setPackets([]);
    setPacketCount(0);
    setSelectedPacket(null);
    console.log('FRONTEND LOG: Packets cleared');
  };

  const exportPackets = async (format) => {
    const dataToExport = filteredPackets(); // Use filtered packets for export

    if (dataToExport.length === 0) {
      alert('No packets to export!');
      return;
    }

    const filename = `packets_export_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'json') {
      // Client-side JSON export
      exportPacketsToFile(dataToExport);
      console.log('FRONTEND LOG: Exported to JSON via client-side utility.');
    } else if (format === 'csv') {
      // Client-side CSV export
      exportToCSV(dataToExport);
      console.log('FRONTEND LOG: Exported to CSV via client-side utility.');
    } else if (format === 'pcap') {
      // Server-side PCAP export
      setIsExporting(true);
      try {
        // IMPORTANT: Correct the fetch URL here!
        const response = await fetch('http://localhost:5000/export_pcap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToExport),
        });

        if (response.ok) {
          const blob = await response.blob();
          saveAs(blob, `${filename}.pcap`);
          console.log('FRONTEND LOG: PCAP file exported successfully (server-side)');
        } else {
          const errorText = await response.text();
          console.error('FRONTEND LOG: Failed to export PCAP via server:', response.status, errorText);
          alert(`Failed to export PCAP: ${errorText || 'Server error'}`);
        }
      } catch (error) {
        console.error('FRONTEND LOG: Error during server-side PCAP export:', error);
        alert('Error exporting PCAP file. Check console for details.');
      } finally {
        setIsExporting(false);
      }
    }
  };

  const importPcap = async (file) => {
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // IMPORTANT: Correct the fetch URL here!
      const response = await fetch('http://localhost:5000/upload_pcap', {
        method: 'POST',
        body: formData, // FormData automatically sets Content-Type: multipart/form-data
      });

      if (response.ok) {
        const data = await response.json();
        console.log('FRONTEND LOG:', data.status);
        // Packets are streamed via WebSocket, so no need to update state from here directly
      } else {
        const errorData = await response.json();
        console.error('FRONTEND LOG: PCAP import failed:', errorData.error);
        alert(`Failed to import PCAP: ${errorData.error}`);
      }
    } catch (error) {
      console.error('FRONTEND LOG: Error importing PCAP:', error);
      alert('Error importing PCAP file. Check console for details.');
    } finally {
      setIsImporting(false);
    }
  };

  return {
    isCapturing,
    packets,
    packetCount,
    filter,
    setFilter,
    selectedPacket,
    setSelectedPacket,
    startCapture,
    stopCapture,
    clearPackets,
    exportPackets,
    filteredPackets: filteredPackets(), // Pass the memoized filtered packets
    wsRef,
    isImporting,
    importPcap,
    isExporting,
    // Removed: availableInterfaces, selectedInterface, setSelectedInterface
  };
};