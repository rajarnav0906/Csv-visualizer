// src/app/page.tsx
'use client';
import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import DataGridDisplay from '@/components/DataGridDisplay';
import { coreValidators } from '@/validators/coreValidators';
import { ENTITY_DEFINITIONS, type AIFeedback, type ValidationError, type SheetData, type AIFixSuggestion } from '@/types';

export default function HomePage() {
  const [data, setData] = useState<SheetData>({});
  const [validationResults, setValidationResults] = useState<Record<string, ValidationError[]>>({});
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDataProcessed = (fileData: SheetData) => {
    const formattedData: SheetData = {};
    
    Object.entries(fileData).forEach(([sheetName, rows]) => {
      const entityType = sheetName.toLowerCase().replace('.csv', '');
      const definition = ENTITY_DEFINITIONS[entityType];
      
      formattedData[sheetName] = rows.map(row => {
        const formattedRow = { ...row };
        
        if (definition) {
          Object.entries(definition.fieldFormats).forEach(([field, formatter]) => {
            if (row[field] !== undefined && row[field] !== null) {
              try {
                formattedRow[field] = formatter(row[field]);
              } catch (error) {
                console.error(`Formatting failed for ${field}:`, error);
                // Keep original value if formatting fails
              }
            }
          });
        }
        
        return formattedRow;
      });
    });
    
    setData(formattedData);
    validateData(formattedData);
  };

  const validateData = (dataToValidate: SheetData) => {
    const errors: Record<string, ValidationError[]> = {};
    
    Object.entries(dataToValidate).forEach(([sheetName, rows]) => {
      const entityType = sheetName.toLowerCase().replace('.csv', '');
      const definition = ENTITY_DEFINITIONS[entityType];
      const sheetErrors: ValidationError[] = [];
      
      if (definition) {
        sheetErrors.push(...coreValidators.validateRequiredColumns(rows, definition.requiredFields, sheetName));
        sheetErrors.push(...coreValidators.validateFieldTypes(rows, entityType, sheetName));
      }

      switch (entityType) {
        case 'clients':
          sheetErrors.push(...coreValidators.checkDuplicateIds(rows, 'ClientID', sheetName));
          sheetErrors.push(...coreValidators.validateNumberRange(rows, 'PriorityLevel', 1, 5, sheetName));
          sheetErrors.push(...coreValidators.validateJSONField(rows, 'AttributesJSON', sheetName));
          
          if (dataToValidate['tasks.csv']) {
            sheetErrors.push(...coreValidators.validateTaskReferences(
              rows,
              dataToValidate['tasks.csv'],
              'RequestedTaskIDs',
              'TaskID',
              sheetName
            ));
          }
          break;

        case 'workers':
          sheetErrors.push(...coreValidators.checkDuplicateIds(rows, 'WorkerID', sheetName));
          sheetErrors.push(...coreValidators.validateNumberRange(rows, 'MaxLoadPerPhase', 1, 10, sheetName));
          sheetErrors.push(...coreValidators.validateWorkerOverload(rows));
          break;

        case 'tasks':
          sheetErrors.push(...coreValidators.checkDuplicateIds(rows, 'TaskID', sheetName));
          sheetErrors.push(...coreValidators.validateNumberRange(rows, 'Duration', 1, Infinity, sheetName));
          sheetErrors.push(...coreValidators.validatePhaseWindows(rows));
          
          if (dataToValidate['workers.csv']) {
            sheetErrors.push(...coreValidators.validateSkillCoverage(
              rows,
              dataToValidate['workers.csv']
            ));
            sheetErrors.push(...coreValidators.validateMaxConcurrency(
              rows,
              dataToValidate['workers.csv']
            ));
          }
          break;
      }
      
      errors[sheetName] = sheetErrors;
    });
    
    setValidationResults(errors);
    generateAIFeedback(dataToValidate, errors);
  };

  const generateAIFeedback = (data: SheetData, errors: Record<string, ValidationError[]>) => {
    setTimeout(() => {
      const totalErrors = Object.values(errors).flat().length;
      const criticalErrorCount = Object.values(errors).flat()
        .filter(e => e.severity === 'critical').length;

      const suggestedFixes: AIFixSuggestion[] = Object.entries(errors).flatMap(([sheetName, sheetErrors]) => 
        sheetErrors.map(error => ({
          description: `Fix ${error.type} in ${sheetName}, Row ${(error.rowIndex ?? 0) + 1}` +
            (error.columnName ? `, Column "${error.columnName}"` : ''),
          changes: error.suggestedFix?.value ? { 
            [error.columnName ?? '']: error.suggestedFix.value 
          } : {},
          appliesTo: { 
            rowIndex: error.rowIndex ?? 0,
            columnName: error.columnName ?? '',
            sheetName
          },
          affectedRows: [error.rowIndex ?? 0],
          severity: error.severity ?? 'warning',
          explanation: error.suggestedFix?.explanation ?? `Fix ${error.type} issue`
        }))
      );

      const detailedAnalysis = Object.entries(errors).map(([sheetName, sheetErrors]) => ({
        sheetName,
        errorCount: sheetErrors.length,
        errorTypes: [...new Set(sheetErrors.map(e => e.type))],
        criticalCount: sheetErrors.filter(e => e.severity === 'critical').length,
        sampleIssues: sheetErrors.slice(0, 3).map(error => ({
          location: `Row ${(error.rowIndex ?? 0) + 1}` +
            (error.columnName ? `, Column ${error.columnName}` : ''),
          error: error.message,
          currentValue: error.columnName ? 
            data[sheetName]?.[error.rowIndex ?? 0]?.[error.columnName] : 'N/A',
          suggestedValue: error.suggestedFix?.value
        }))
      }));

      const feedback: AIFeedback = {
        analysisSummary: `Found ${totalErrors} issues (${criticalErrorCount} critical) across ${Object.keys(errors).length} sheets`,
        dataQualityScore: Math.max(0, 100 - (totalErrors * 2)),
        detailedAnalysis,
        criticalIssues: Object.entries(errors)
          .filter(([_, errs]) => errs.some(e => e.severity === 'critical'))
          .map(([sheet]) => `${sheet} has critical issues`),
        potentialIssues: [
          ...Object.entries(errors).map(([sheet, errs]) => 
            `${sheet}: ${errs.length} issues (${errs.filter(e => e.severity === 'critical').length} critical)`
          ),
          'Check cross-sheet references for consistency'
        ],
        generalRecommendations: [
          'Review all critical issues first',
          'Standardize ID formats across sheets',
          'Verify worker availability matches task requirements'
        ],
        suggestedFixes: suggestedFixes
          .sort((a, b) => (a.severity === 'critical' ? -1 : 1))
          .slice(0, 10)
      };

      setAiFeedback(feedback);
    }, 1500);
  };

  const handleCellEdit = (sheetName: string, rowIndex: number, field: string, value: unknown) => {
    setData(prev => {
      const newData = { ...prev };
      if (!newData[sheetName]) return newData;
      
      newData[sheetName] = [...newData[sheetName]];
      newData[sheetName][rowIndex] = { 
        ...newData[sheetName][rowIndex], 
        [field]: value 
      };
      
      return newData;
    });
    
    setTimeout(() => validateData(data), 100);
  };

  const handleApplyFix = (fixes: Array<{
    sheetName: string;
    rowIndex: number;
    changes: Record<string, unknown>;
  }>) => {
    setData(prev => {
      const newData = { ...prev };
      
      fixes.forEach(fix => {
        if (newData[fix.sheetName]?.[fix.rowIndex]) {
          newData[fix.sheetName][fix.rowIndex] = { 
            ...newData[fix.sheetName][fix.rowIndex], 
            ...fix.changes 
          };
        }
      });
      
      return newData;
    });
    
    setTimeout(() => validateData(data), 100);
  };

  const filteredData = Object.entries(data).reduce((acc, [sheetName, rows]) => {
    if (!searchQuery) {
      acc[sheetName] = rows;
      return acc;
    }
    
    const query = searchQuery.toLowerCase();
    const filteredRows = rows.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(query)
      )
    );
    
    if (filteredRows.length > 0) {
      acc[sheetName] = filteredRows;
    }
    
    return acc;
  }, {} as SheetData);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-blue-400">Spreadsheet Validator</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search data with natural language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-400"
          />
        </div>
        <div className="flex-1">
          <FileUpload onDataProcessed={handleDataProcessed} />
        </div>
      </div>

      {Object.keys(filteredData).length > 0 ? (
        <DataGridDisplay
          data={filteredData}
          validationResults={validationResults}
          aiFeedback={aiFeedback || undefined}
          onDataChange={handleCellEdit}
          onApplyFix={handleApplyFix}
        />
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded p-8 text-center">
          {Object.keys(data).length > 0 ? (
            <p className="text-gray-400">No results match your search</p>
          ) : (
            <>
              <p className="text-gray-400 mb-4">Upload a spreadsheet to begin validation</p>
              <p className="text-sm text-gray-500">
                Supported formats: CSV, XLSX. Expected files: clients.csv, workers.csv, tasks.csv
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}