// src/utils/packetExporter.js

// No need to import Pcap from 'pcap-json' anymore

// Existing JSON export function
export const exportPacketsToFile = (packets) => {
  const dataStr = JSON.stringify(packets, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `packet_capture_${new Date().toISOString().slice(0, 19)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// Existing CSV export function
export const exportToCSV = (packets) => {
  const headers = ['No', 'Timestamp', 'Source', 'Destination', 'Protocol', 'Length', 'Info'];
  const csvContent = [
    headers.join(','),
    ...packets.map((packet, index) => [
      index + 1,
      packet.timestamp,
      packet.sourceIP,
      packet.destIP,
      packet.protocol,
      packet.length,
      `"${packet.info ? packet.info.replace(/"/g, '""') : ''}"` // Handle potential undefined info
    ].join(','))
  ].join('\n');

  const dataBlob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `packet_capture_${new Date().toISOString().slice(0, 19)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// Remove the parseJsonToPcap function entirely from this file.