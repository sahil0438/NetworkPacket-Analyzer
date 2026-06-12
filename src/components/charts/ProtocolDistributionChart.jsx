// src/components/charts/ProtocolDistributionChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

const ProtocolDistributionChart = ({ packets }) => {
  // Process packets to count protocol occurrences
  const protocolData = packets.reduce((acc, packet) => {
    const protocol = packet.protocol || 'Unknown';
    const existing = acc.find(item => item.name === protocol);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: protocol, value: 1 });
    }
    return acc;
  }, []);

  // Sort data so 'TCP' and 'UDP' are usually at the beginning, others follow,
  // and then sort by value descending for less common ones.
  protocolData.sort((a, b) => {
    if (a.name === 'TCP') return -1;
    if (b.name === 'TCP') return 1;
    if (a.name === 'UDP') return -1;
    if (b.name === 'UDP') return 1;
    return b.value - a.value;
  });

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-4 text-blue-300">Protocol Distribution</h2>
      {packets.length === 0 ? (
        <p className="text-gray-400">No packets to display chart.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={protocolData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {protocolData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '5px' }} />
            <Legend layout="vertical" align="right" verticalAlign="middle" />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ProtocolDistributionChart;