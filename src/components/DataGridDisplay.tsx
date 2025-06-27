'use client';

import React, { useState } from 'react';

type Props = {
  data: { [sheetName: string]: any[] };
};

const DataGridDisplay: React.FC<Props> = ({ data }) => {
  const sheetNames = Object.keys(data);
  const [activeSheet, setActiveSheet] = useState(sheetNames[0]);

  const sheetData = data[activeSheet];
  if (!sheetData || sheetData.length === 0) {
    return <p className="text-gray-700 dark:text-gray-300">No data to display.</p>;
  }

  const headers = Object.keys(sheetData[0]);

  return (
    <div className="mt-4">
      {/* Sheet Tabs */}
      <div className="flex gap-2 mb-3">
        {sheetNames.map((sheet) => (
          <button
            key={sheet}
            onClick={() => setActiveSheet(sheet)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              sheet === activeSheet
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-gray-800'
            }`}
          >
            {sheet}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg shadow max-h-[500px] dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 text-gray-900 dark:text-gray-200">
            {sheetData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {headers.map((header) => (
                  <td
                    key={header}
                    className="px-4 py-2 border-b dark:border-gray-700 whitespace-pre-wrap max-w-xs"
                  >
                    {row[header] ?? ''}
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
