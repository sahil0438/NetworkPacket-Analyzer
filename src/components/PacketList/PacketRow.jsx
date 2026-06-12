import React from 'react';
import { getProtocolColor } from '../../utils/constants';

const PacketRow = ({ packet, index, packetNumber, isSelected, onClick }) => {
  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer hover:bg-gray-700 border-b border-gray-700 ${
        isSelected ? 'bg-blue-900 bg-opacity-50' : 
        index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'
      }`}
    >
      <td className="px-3 py-2 text-gray-300 font-mono">{packetNumber}</td>
      <td className="px-3 py-2 font-mono">{packet.timestamp}</td>
      <td className="px-3 py-2 font-mono">{packet.sourceIP}</td>
      <td className="px-3 py-2 font-mono">{packet.destIP}</td>
      <td className="px-3 py-2">
        <span className={`px-1 py-0.5 rounded text-xs font-medium ${getProtocolColor(packet.protocol)}`}>
          {packet.protocol}
        </span>
      </td>
      <td className="px-3 py-2 font-mono text-right">{packet.length}</td>
      <td className="px-3 py-2 text-gray-200">{packet.info}</td>
    </tr>
  );
};

export default PacketRow;
