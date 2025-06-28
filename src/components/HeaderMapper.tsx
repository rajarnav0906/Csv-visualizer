// src/components/HeaderMapper.tsx
'use client';
import React, { useEffect, useState } from 'react';

interface HeaderMapperProps {
  data: Record<string, any[]>;
  onMappingDone: (mapped: Record<string, any[]>) => void;
}

const HeaderMapper: React.FC<HeaderMapperProps> = ({ data, onMappingDone }) => {
  const [mappedHeaders, setMappedHeaders] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const initialMapping: Record<string, string[]> = {};

    Object.entries(data).forEach(([sheet, rows]) => {
      const headers = Object.keys(rows[0] || {});
      const suggestions = headers.map((h) =>
        h.toLowerCase().includes('name') ? 'Full Name' :
        h.toLowerCase().includes('email') ? 'Email Address' :
        h.toLowerCase().includes('phone') ? 'Phone Number' :
        h.toLowerCase().includes('id') ? h.replace(/\s+/g, '') :
        h
      );
      initialMapping[sheet] = suggestions;
    });

    setMappedHeaders(initialMapping);
  }, [data]);

  const handleChange = (sheet: string, index: number, value: string) => {
    const updated = { ...mappedHeaders };
    updated[sheet][index] = value;
    setMappedHeaders(updated);
  };

  const handleApply = () => {
    const finalMappedData: Record<string, any[]> = {};

    Object.entries(data).forEach(([sheet, rows]) => {
      const headers = Object.keys(rows[0] || []);
      const mapped = mappedHeaders[sheet] || [];

      const updatedRows = rows.map((row) => {
        const newRow: Record<string, any> = {};
        mapped.forEach((newKey, idx) => {
          const oldKey = headers[idx];
          newRow[newKey] = row[oldKey];
        });
        return newRow;
      });

      finalMappedData[sheet] = updatedRows;
    });

    onMappingDone(finalMappedData);
  };

  return (
    <div className="mt-6 p-4 bg-gray-800 rounded-lg">
      <h3 className="text-xl mb-3 text-blue-400">🧠 AI-Suggested Header Mapping</h3>

      {Object.entries(data).map(([sheet, rows]) => {
        const headers = Object.keys(rows[0] || []);
        return (
          <div key={sheet} className="mb-6">
            <h4 className="text-lg font-semibold mb-1 text-gray-300">{sheet}</h4>
            <div className="overflow-auto">
              <table className="border border-collapse border-gray-600 w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="border px-3 py-2 text-left text-gray-300">Original</th>
                    <th className="border px-3 py-2 text-left text-gray-300">Suggested</th>
                    <th className="border px-3 py-2 text-left text-gray-300">Sample</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((header, index) => (
                    <tr key={index} className="hover:bg-gray-700/50">
                      <td className="border px-3 py-2 text-gray-300">{header}</td>
                      <td className="border px-3 py-2">
                        <input
                          value={mappedHeaders[sheet]?.[index] || ''}
                          onChange={(e) => handleChange(sheet, index, e.target.value)}
                          className="border p-1 w-full bg-gray-800 text-gray-300 border-gray-600 rounded"
                        />
                      </td>
                      <td className="border px-3 py-2 text-gray-400 text-sm">
                        {rows[0]?.[header] ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <button
        onClick={handleApply}
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
      >
        ✅ Confirm Mapping
      </button>
    </div>
  );
};

export default HeaderMapper;