'use client';

import React, { useRef } from 'react';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

type Props = {
  onDataParsed: (sheetsData: { [sheetName: string]: any[] }) => void;
};

const FileUpload: React.FC<Props> = ({ onDataParsed }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          onDataParsed({ 'CSV Sheet': results.data as any[] });
        },
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetsData: { [sheetName: string]: any[] } = {};
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          sheetsData[sheetName] = jsonData;
        });

        onDataParsed(sheetsData);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Please upload a .csv or .xlsx file');
    }

    // Allow same file re-upload
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="my-4">
      <input
        type="file"
        accept=".csv, .xlsx, .xls"
        onChange={handleFileUpload}
        ref={fileInputRef}
        className="border border-gray-300 rounded px-3 py-2"
      />
    </div>
  );
};

export default FileUpload;
