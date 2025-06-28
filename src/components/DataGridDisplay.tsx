// src/components/DataGridDisplay.tsx
"use client";

import React, { useState } from "react";
import { ValidationError, AIFeedback } from "@/types";

type Props = {
  data: Record<string, any[]>;
  validationResults: Record<string, ValidationError[]>;
  aiFeedback?: AIFeedback;
  onDataChange: (
    sheetName: string,
    rowIndex: number,
    field: string,
    value: any
  ) => void;
  onApplyFix: (
    fixes: Array<{
      sheetName: string;
      rowIndex: number;
      changes: Record<string, any>;
    }>
  ) => void;
};

const DataGridDisplay: React.FC<Props> = ({
  data,
  validationResults,
  aiFeedback,
  onDataChange,
  onApplyFix,
}) => {
  const [currentSheet, setCurrentSheet] = useState<string>(
    Object.keys(data)[0] || ""
  );
  const [editCell, setEditCell] = useState<{ row: number; col: string } | null>(
    null
  );
  const [editValue, setEditValue] = useState<any>("");
  const [selectedFixes, setSelectedFixes] = useState<Record<string, boolean>>({});
  const [bulkFixMode, setBulkFixMode] = useState(false);

  const startEditing = (rowIndex: number, colName: string, value: any) => {
    setEditCell({ row: rowIndex, col: colName });
    setEditValue(value);
  };

  const saveEdit = () => {
    if (editCell) {
      onDataChange(currentSheet, editCell.row, editCell.col, editValue);
      setEditCell(null);
    }
  };

  const getCellErrors = (
    rowIndex: number,
    columnName: string
  ): ValidationError[] => {
    return (
      validationResults[currentSheet]?.filter(
        (error) =>
          error.rowIndex === rowIndex && error.columnName === columnName
      ) || []
    );
  };

  const toggleFixSelection = (fixIndex: number) => {
    setSelectedFixes((prev) => ({
      ...prev,
      [fixIndex]: !prev[fixIndex],
    }));
  };

  const applySelectedFixes = () => {
    if (!aiFeedback?.suggestedFixes) return;

    const fixesToApply = aiFeedback.suggestedFixes
      .filter((_, index: number) => selectedFixes[index])
      .flatMap((fix) => {
        if (fix.affectedRows) {
          return fix.affectedRows.map((rowIndex: number) => ({
            sheetName: currentSheet,
            rowIndex,
            changes: fix.changes,
          }));
        }
        return {
          sheetName: currentSheet,
          rowIndex: fix.appliesTo?.rowIndex || 0,
          changes: fix.changes,
        };
      });

    onApplyFix(fixesToApply);
    setSelectedFixes({});
    setBulkFixMode(false);
  };

  if (!currentSheet || !data[currentSheet]?.length) {
    return <div className="p-4 text-gray-400">No data available</div>;
  }

  const rows = data[currentSheet];
  const columns = Object.keys(rows[0] || {});

  return (
    <div className="space-y-4 text-gray-100">
      {/* Sheet Selection */}
      <div className="flex gap-2">
        {Object.keys(data).map((sheet) => (
          <button
            key={sheet}
            onClick={() => setCurrentSheet(sheet)}
            className={`px-3 py-1 rounded transition-colors ${
              currentSheet === sheet
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {sheet}
          </button>
        ))}
      </div>

      {/* Validation Summary */}
      {validationResults[currentSheet]?.length > 0 && (
        <div className="bg-red-900/30 border border-red-700/50 rounded p-3">
          <h3 className="font-bold text-red-400 mb-2">
            Found {validationResults[currentSheet].length} issues
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(
              new Set(validationResults[currentSheet].map((e) => e.type))
            ).map((type) => (
              <span
                key={type}
                className="bg-red-900/40 text-red-300 px-2 py-1 rounded text-sm"
              >
                {type} (
                {validationResults[currentSheet].filter((e) => e.type === type).length}
                )
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Fix Suggestions */}
      {aiFeedback?.suggestedFixes && aiFeedback.suggestedFixes.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-yellow-400">
              <span className="mr-2">🔧</span> Suggested Fixes
            </h2>
            {bulkFixMode ? (
              <div className="flex gap-2">
                <button
                  onClick={applySelectedFixes}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                  disabled={
                    Object.values(selectedFixes).filter(Boolean).length === 0
                  }
                >
                  Apply Selected (
                  {Object.values(selectedFixes).filter(Boolean).length})
                </button>
                <button
                  onClick={() => setBulkFixMode(false)}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setBulkFixMode(true)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                Bulk Fix Mode
              </button>
            )}
          </div>

          <div className="space-y-3">
            {aiFeedback.suggestedFixes.map((fix, index: number) => (
              <div
                key={index}
                className={`p-3 rounded border ${
                  bulkFixMode && selectedFixes[index]
                    ? "border-yellow-400 bg-yellow-900/20"
                    : "border-gray-700 bg-gray-700/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {bulkFixMode && (
                    <input
                      type="checkbox"
                      checked={!!selectedFixes[index]}
                      onChange={() => toggleFixSelection(index)}
                      className="mt-1"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-300">
                      {fix.description}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Affects: {fix.affectedRows?.length || 1} row(s)
                    </div>
                    <pre className="text-xs bg-gray-800 p-2 mt-2 rounded overflow-x-auto">
                      {JSON.stringify(fix.changes, null, 2)}
                    </pre>
                    {!bulkFixMode && (
                      <button
                        className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                        onClick={() => {
                          const fixes = fix.affectedRows
                            ? fix.affectedRows.map((rowIndex: number) => ({
                                sheetName: currentSheet,
                                rowIndex,
                                changes: fix.changes,
                              }))
                            : [
                                {
                                  sheetName: currentSheet,
                                  rowIndex: fix.appliesTo?.rowIndex || 0,
                                  changes: fix.changes,
                                },
                              ];
                          onApplyFix(fixes);
                        }}
                      >
                        Apply Fix
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-auto border border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 text-left text-sm font-medium text-gray-300"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-800">
            {rows.map((row, rowIndex: number) => (
              <tr
                key={rowIndex}
                className={
                  validationResults[currentSheet]?.some(
                    (e) => e.rowIndex === rowIndex
                  )
                    ? "bg-red-900/10 hover:bg-red-900/20"
                    : "hover:bg-gray-800"
                }
              >
                {columns.map((col) => {
                  const cellErrors = getCellErrors(rowIndex, col);
                  const isEditing =
                    editCell?.row === rowIndex && editCell?.col === col;

                  return (
                    <td
                      key={col}
                      onClick={() => startEditing(rowIndex, col, row[col])}
                      className={`px-4 py-2 text-sm relative ${
                        cellErrors.length ? "bg-red-900/20" : ""
                      }`}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                          autoFocus
                          className="w-full bg-gray-700 text-white border border-blue-500 rounded px-2"
                        />
                      ) : (
                        <>
                          <span
                            className={
                              cellErrors.length
                                ? "text-red-300"
                                : "text-gray-300"
                            }
                          >
                            {row[col] ?? ""}
                          </span>
                          {cellErrors.length > 0 && (
                            <span className="ml-1 text-red-400">
                              ({cellErrors.length})
                            </span>
                          )}
                        </>
                      )}

                      {/* Error Tooltip */}
                      {cellErrors.length > 0 && (
                        <div className="absolute z-10 mt-1 w-80 bg-gray-800 shadow-lg border border-gray-700 rounded p-2">
                          <h4 className="font-bold text-red-400">Data Issues:</h4>
                          <ul className="text-sm space-y-2 mt-1">
                            {cellErrors.map((error, i) => (
                              <li
                                key={i}
                                className="border-b border-gray-700 pb-2 last:border-0"
                              >
                                <div className="font-medium text-red-300">
                                  {error.type}
                                </div>
                                <div className="text-gray-400">
                                  <p>{error.message}</p>
                                  {error.suggestedFix?.explanation && (
                                    <p className="mt-1 text-yellow-300">
                                      {error.suggestedFix.explanation}
                                    </p>
                                  )}
                                </div>
                                {error.suggestedFix?.value !== undefined && (
                                  <div className="mt-2 flex gap-2 items-center">
                                    <span className="text-xs text-gray-400">Suggested value:</span>
                                    <code className="text-xs bg-gray-700 p-1 rounded">
                                      {JSON.stringify(error.suggestedFix.value)}
                                    </code>
                                    <button
                                      className="ml-auto text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onApplyFix([{
                                          sheetName: currentSheet,
                                          rowIndex,
                                          changes: { [col]: error.suggestedFix?.value }
                                        }]);
                                      }}
                                    >
                                      Apply Fix
                                    </button>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Feedback Section */}
      {aiFeedback && (
        <div className="bg-gray-800 border border-gray-700 rounded p-4">
          <h2 className="text-lg font-bold text-blue-400 mb-3">
            <span className="mr-2">🤖</span> AI Analysis
          </h2>

          <div className="mb-4">
            <h3 className="font-semibold text-gray-300 mb-1">Summary:</h3>
            <p className="whitespace-pre-line text-gray-400">
              {aiFeedback.analysisSummary}
            </p>
          </div>

          {aiFeedback.potentialIssues && aiFeedback.potentialIssues.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-300 mb-1">
                Potential Issues:
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-400">
                {aiFeedback.potentialIssues.map((issue, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 mt-1 text-yellow-400">⚠️</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {aiFeedback.generalRecommendations && aiFeedback.generalRecommendations.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-300 mb-1">
                Recommendations:
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-400">
                {aiFeedback.generalRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 mt-1 text-blue-400">💡</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataGridDisplay;