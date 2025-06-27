'use client';

import React, { useState } from 'react';

type Props = {
  data: Record<string, any[]>;
};

const DataGridDisplay: React.FC<Props> = ({ data }) => {
  const sheetList = Object.keys(data);
  const [currentSheet, setCurrentSheet] = useState(sheetList[0]);

  const rows = data[currentSheet];

  if (!rows || rows.length === 0) {
    return <p className="text-gray-700 dark:text-gray-300">No data available.</p>;
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className="mt-4">
      {/* Sheet Switcher */}
      <div className="flex gap-2 mb-3">
        {sheetList.map((name) => (
          <button
            key={name}
            onClick={() => setCurrentSheet(name)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              name === currentSheet
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Table View */}
      <div className="overflow-x-auto border rounded-lg shadow max-h-[500px] dark:border-gray-700">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 text-gray-900 dark:text-gray-200">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-2 border-b dark:border-gray-700 whitespace-pre-wrap max-w-xs"
                  >
                    {row[col] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataGridDisplay;
