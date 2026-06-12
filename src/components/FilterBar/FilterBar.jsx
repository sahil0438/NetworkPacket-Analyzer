import React from 'react';
import { Filter } from 'lucide-react';

const FilterBar = ({ filter, setFilter }) => {
  return (
    <div className="flex items-center gap-2">
      <Filter size={16} className="text-gray-400" />
      <input
        type="text"
        placeholder="Filter packets..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
      />
    </div>
  );
};

export default FilterBar;