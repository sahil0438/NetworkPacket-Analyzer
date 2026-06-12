// src/components/charts/TopTalkersChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TopTalkersChart = ({ packets }) => {
  // Process packets to count top talkers (source or destination IPs)
  const ipCounts = packets.reduce((acc, packet) => {
    if (packet.sourceIP && packet.sourceIP !== 'N/A') {
      acc[packet.sourceIP] = (acc[packet.sourceIP] || 0) + 1;
    }
    if (packet.destIP && packet.destIP !== 'N/A') {
      acc[packet.destIP] = (acc[packet.destIP] || 0) + 1;
    }
    return acc;
  }, {});

  // Convert to array, sort by count, and take top 10
  const topTalkersData = Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Get top 10

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-4 text-blue-300">Top Talkers (by Packet Count)</h2>
      {packets.length === 0 ? (
        <p className="text-gray-400">No packets to display chart.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={topTalkersData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
            <XAxis dataKey="ip" stroke="#999" angle={-45} textAnchor="end" height={80} interval={0} />
            <YAxis stroke="#999" />
            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '5px' }} />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TopTalkersChart;