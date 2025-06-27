'use client';

import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import DataGridDisplay from '../components/DataGridDisplay';

export default function HomePage() {
  const [parsedSheets, setParsedSheets] = useState<{ [sheetName: string]: any[] }>({});

  const handleDataParsed = (sheetsData: { [sheetName: string]: any[] }) => {
    setParsedSheets(sheetsData);
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Data Alchemist</h1>
      <FileUpload onDataParsed={handleDataParsed} />
      {Object.keys(parsedSheets).length > 0 && <DataGridDisplay data={parsedSheets} />}
    </main>
  );
}
