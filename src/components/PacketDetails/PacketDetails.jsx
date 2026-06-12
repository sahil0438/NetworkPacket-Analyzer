import React from 'react';

const PacketDetails = ({ selectedPacket }) => {
  return (
    <div className="bg-gray-800 rounded-lg">
      <div className="bg-gray-700 px-4 py-2 text-sm font-medium border-b border-gray-600">
        Packet Details
      </div>
      
      {selectedPacket ? (
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-blue-400 mb-2">General Information</h3>
            <div className="space-y-1 text-xs">
              <div><span className="text-gray-400">Time:</span> {selectedPacket.timestamp}</div>
              <div><span className="text-gray-400">Protocol:</span> {selectedPacket.protocol}</div>
              <div><span className="text-gray-400">Length:</span> {selectedPacket.length} bytes</div>
              <div><span className="text-gray-400">Source:</span> {selectedPacket.sourceIP}:{selectedPacket.sourcePort}</div>
              <div><span className="text-gray-400">Destination:</span> {selectedPacket.destIP}:{selectedPacket.destPort}</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-blue-400 mb-2">Info</h3>
            <div className="text-xs text-gray-300 bg-gray-900 p-2 rounded">
              {selectedPacket.info}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-blue-400 mb-2">Hex Data</h3>
            <div className="text-xs font-mono text-gray-300 bg-gray-900 p-2 rounded max-h-40 overflow-auto">
              <pre>{selectedPacket.data}</pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-400">
          Select a packet to view details
        </div>
      )}
    </div>
  );
};

export default PacketDetails;