'use client';
import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import HeaderMapper from '../components/HeaderMapper';

export default function HomePage() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<any[]>([]);
  const [fullData, setFullData] = useState<any[]>([]);
  const [mappedData, setMappedData] = useState<any[]>([]);

  const handleParsed = (headers: string[], samples: any[], full: any[]) => {
    if (
      Array.isArray(headers) &&
      Array.isArray(samples) &&
      Array.isArray(full) &&
      full.length > 0 &&
      full[0] &&
      typeof full[0] === 'object'
    ) {
      setHeaders(headers);
      setSampleRows(samples);
      setFullData(full);
    } else {
      setHeaders([]);
      setSampleRows([]);
      setFullData([]);
      setMappedData([]);
    }
  };

  const handleMappingDone = (newHeaders: string[]) => {
    const updated = fullData.map(row => {
      const newRow: Record<string, any> = {};
      newHeaders.forEach((newKey, i) => {
        const oldKey = headers[i];
        newRow[newKey] = row?.[oldKey] ?? '';
      });
      return newRow;
    });
    setMappedData(updated);
  };

  return (
    <main className="p-4">
      <h2 className="text-2xl mb-4">📁 Upload CSV + AI Smart Mapping</h2>
      <FileUpload onParsed={handleParsed} />

      {headers.length > 0 && (
        <HeaderMapper
          headers={headers}
          sampleRows={sampleRows}
          onMappingDone={handleMappingDone}
        />
      )}

      {mappedData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl mb-2">🔍 Mapped Data Preview</h3>
          <table className="border border-collapse border-gray-400">
            <thead>
              <tr>
                {Object.keys(mappedData[0] ?? {}).map((h, i) => (
                  <th key={i} className="border px-2 py-1 bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mappedData.slice(0, 5).map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val: unknown, j) => (
                    <td key={j} className="border px-2 py-1">
                      {typeof val === 'string' || typeof val === 'number' ? val : JSON.stringify(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
