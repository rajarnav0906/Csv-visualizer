'use client';
import React, { useEffect, useState } from 'react';

interface HeaderMapperProps {
  headers: string[];
  sampleRows: any[];
  onMappingDone: (mapped: string[]) => void;
}

const HeaderMapper: React.FC<HeaderMapperProps> = ({
  headers,
  sampleRows,
  onMappingDone
}) => {
  const [mappedHeaders, setMappedHeaders] = useState<string[]>([]);

  // Simulate smart mapping using a basic logic or Gemini API later
  useEffect(() => {
    if (!headers || headers.length === 0) return;

    const suggestions = headers.map(h =>
      h.toLowerCase().includes('name') ? 'Full Name' :
      h.toLowerCase().includes('email') ? 'Email Address' :
      h.toLowerCase().includes('phone') ? 'Phone Number' :
      h // fallback to original
    );

    setMappedHeaders(suggestions);
  }, [headers]);

  const handleChange = (index: number, value: string) => {
    const updated = [...mappedHeaders];
    updated[index] = value;
    setMappedHeaders(updated);
  };

  const handleApply = () => {
    onMappingDone(mappedHeaders);
  };

  return (
    <div className="mt-6">
      <h3 className="text-xl mb-2">🧠 AI-Suggested Header Mapping</h3>
      <table className="border border-collapse border-gray-300">
        <thead>
          <tr>
            <th className="border px-2 py-1">Original</th>
            <th className="border px-2 py-1">Suggested</th>
            <th className="border px-2 py-1">Sample</th>
          </tr>
        </thead>
        <tbody>
          {headers.map((header, index) => (
            <tr key={index}>
              <td className="border px-2 py-1">{header}</td>
              <td className="border px-2 py-1">
                <input
                  value={mappedHeaders[index] || ''}
                  onChange={e => handleChange(index, e.target.value)}
                  className="border p-1 w-full"
                />
              </td>
              <td className="border px-2 py-1">
                {sampleRows?.[0]?.[header] ?? ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleApply}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
      >
        ✅ Confirm Mapping
      </button>
    </div>
  );
};

export default HeaderMapper;
