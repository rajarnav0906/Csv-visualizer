'use client';
import React from 'react';
import Papa from 'papaparse';

type Props = {
  onParsed: (headers: string[], sampleRows: any[], fullData: any[]) => void;
};

const FileUpload = ({ onParsed }: Props) => {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as any[];
        onParsed(headers, rows.slice(0, 3), rows); // pass sample and full data
      },
    });
  };

  return (
    <div className="my-4">
      <input type="file" accept=".csv" onChange={handleFile} />
    </div>
  );
};

export default FileUpload;
