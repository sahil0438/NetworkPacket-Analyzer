import React from 'react';
import PacketRow from './PacketRow';

const PacketList = ({
  packets,
  allPackets,
  selectedPacket,
  setSelectedPacket,
  isCapturing
}) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="bg-gray-700 px-4 py-2 text-sm font-medium border-b border-gray-600">
        Packet List ({packets.length})
      </div>
      
      <div className="overflow-auto max-h-screen">
        {packets.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {isCapturing ? 'Waiting for packets...' : 'No packets captured. Click Start to begin.'}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-gray-700 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left w-16">No.</th>
                <th className="px-3 py-2 text-left w-24">Time</th>
                <th className="px-3 py-2 text-left w-32">Source</th>
                <th className="px-3 py-2 text-left w-32">Destination</th>
                <th className="px-3 py-2 text-left w-20">Protocol</th>
                <th className="px-3 py-2 text-left w-16">Length</th>
                <th className="px-3 py-2 text-left">Info</th>
              </tr>
            </thead>
            <tbody>
              {packets.map((packet, index) => (
                <PacketRow
                  key={packet.id}
                  packet={packet}
                  index={index}
                  packetNumber={allPackets.length - allPackets.indexOf(packet)}
                  isSelected={selectedPacket?.id === packet.id}
                  onClick={() => setSelectedPacket(packet)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PacketList;