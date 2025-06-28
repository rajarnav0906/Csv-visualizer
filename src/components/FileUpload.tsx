// src/components/FileUpload.tsx
'use client';

import * as XLSX from 'xlsx';
import { useState } from 'react';

interface FileUploadProps {
  onDataProcessed: (data: Record<string, any[]>) => void;
}

export default function FileUpload({ onDataProcessed }: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result: Record<string, any[]> = {};
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          result[sheetName] = XLSX.utils.sheet_to_json(worksheet);
        });

        onDataProcessed(result);
      } catch (error) {
        console.error('Error reading file:', error);
        onDataProcessed({});
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      setIsLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="mb-6">
      <label className="block mb-2 text-sm font-medium text-gray-400">
        Upload Spreadsheet
      </label>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        disabled={isLoading}
        className="block w-full text-sm text-gray-400
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-900/50 file:text-blue-400
          hover:file:bg-blue-900/70
          disabled:opacity-50
          transition-colors"
      />
      {isLoading && (
        <div className="mt-2 text-sm text-blue-400">Processing file...</div>
      )}
    </div>
  );
}