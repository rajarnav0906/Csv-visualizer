// src/types.ts
export interface ValidationError {
  type: string;
  message: string;
  rowIndex?: number;
  columnName?: string;
  sheetName?: string;
  severity?: 'critical' | 'warning';
  suggestedFix?: {
    value?: unknown;
    action?: 'replace' | 'delete' | 'merge' | 'format';
    mergeWith?: number;
    explanation?: string;
    confidence?: number;
  };
}

// Add this to your types.ts file
export interface SearchResult {
  matchingSheet: string;
  matchingRows: number[];
  explanation: string;
  confidence: number;
  suggestedQuery?: string;
}

export interface IssueLocation {
  sheet: string;
  rowIndex: number;
  columnName: string;
}

export interface DetailedIssue {
  errorType: string;
  location: IssueLocation;
  currentValue: unknown;
  problem: string;
  suggestedValue?: unknown;
  confidence: number;
  affectsMultiple: boolean;
  relatedErrors?: string[];
}

export interface AIFixSuggestion {
  description: string;
  changes: Record<string, unknown>;
  appliesTo: {
    rowIndex: number;
    columnName?: string;
    sheetName?: string;
  };
  affectedRows?: number[];
  confidence?: number;
  explanation?: string;
  severity?: 'critical' | 'warning';
}

export interface SheetAnalysis {
  sheetName: string;
  errorCount: number;
  errorTypes: string[];
  criticalCount: number;
  sampleIssues: {
    location: string;
    error: string;
    currentValue: unknown;
    suggestedValue?: unknown;
  }[];
}

export interface AIFeedback {
  analysisSummary: string;
  detailedIssues?: DetailedIssue[];
  detailedAnalysis?: SheetAnalysis[]; // Add this line
  recommendedActions?: string[];
  potentialIssues?: string[];
  generalRecommendations?: string[];
  suggestedFixes?: AIFixSuggestion[];
  dataQualityScore?: number;
  criticalIssues?: string[];
}

export interface SheetData {
  [sheetName: string]: Record<string, unknown>[];
}

export interface EntityDefinition {
  requiredFields: string[];
  fieldTypes: Record<string, (value: unknown) => boolean>;
  fieldFormats: Record<string, (value: unknown) => unknown>;
  fieldDescriptions?: Record<string, string>;
}

export const ENTITY_DEFINITIONS: Record<string, EntityDefinition> = {
  clients: {
    requiredFields: ['ClientID', 'ClientName', 'PriorityLevel'],
    fieldTypes: {
      ClientID: (val: unknown) => typeof val === 'string' && val.length > 0,
      PriorityLevel: (val: unknown) => [1, 2, 3, 4, 5].includes(Number(val)),
      RequestedTaskIDs: (val: unknown) => {
        if (!val) return true;
        const strVal = String(val);
        const ids = strVal.split(',').map(s => s.trim());
        return ids.every(id => id.length > 0);
      },
      AttributesJSON: (val: unknown) => {
        try {
          JSON.parse(String(val));
          return true;
        } catch {
          return false;
        }
      }
    },
    fieldFormats: {
      PriorityLevel: (val: unknown) => Math.max(1, Math.min(5, Number(val) || 3)),
      RequestedTaskIDs: (val: unknown) => 
        val ? String(val).split(',').map(s => s.trim()).join(', ') : '',
      AttributesJSON: (val: unknown) => {
        try {
          return JSON.stringify(JSON.parse(String(val)), null, 2);
        } catch {
          return '{}';
        }
      }
    }
  },
  workers: {
    requiredFields: ['WorkerID', 'WorkerName', 'AvailableSlots', 'MaxLoadPerPhase'],
    fieldTypes: {
      WorkerID: (val: unknown) => typeof val === 'string' && val.length > 0,
      AvailableSlots: (val: unknown) => {
        try {
          const slots = JSON.parse(String(val));
          return Array.isArray(slots) && slots.every(n => Number.isInteger(n));
        } catch {
          return false;
        }
      },
      MaxLoadPerPhase: (val: unknown) => Number.isInteger(Number(val)) && Number(val) > 0,
      Skills: (val: unknown) => {
        if (!val) return true;
        const strVal = String(val);
        const skills = strVal.split(',').map(s => s.trim());
        return skills.every(skill => skill.length > 0);
      }
    },
    fieldFormats: {
      AvailableSlots: (val: unknown) => {
        try {
          const slots = JSON.parse(String(val));
          return JSON.stringify(Array.isArray(slots) ? slots : [1]);
        } catch {
          return JSON.stringify([1]);
        }
      },
      MaxLoadPerPhase: (val: unknown) => Math.max(1, Number(val) || 1),
      Skills: (val: unknown) => val ? String(val).split(',').map(s => s.trim()).join(', ') : ''
    }
  },
  tasks: {
    requiredFields: ['TaskID', 'TaskName', 'Duration', 'RequiredSkills'],
    fieldTypes: {
      TaskID: (val: unknown) => typeof val === 'string' && val.length > 0,
      Duration: (val: unknown) => Number(val) >= 1,
      RequiredSkills: (val: unknown) => {
        if (!val) return false;
        const strVal = String(val);
        const skills = strVal.split(',').map(s => s.trim());
        return skills.every(skill => skill.length > 0);
      },
      PreferredPhases: (val: unknown) => {
        if (!val) return true;
        try {
          const phases = JSON.parse(String(val));
          return Array.isArray(phases) && phases.every(n => Number.isInteger(n));
        } catch {
          if (typeof val === 'string' && val.includes('-')) {
            const [start, end] = val.split('-').map(Number);
            return !isNaN(start) && !isNaN(end) && start <= end;
          }
          return false;
        }
      },
      MaxConcurrent: (val: unknown) => Number.isInteger(Number(val)) && Number(val) > 0
    },
    fieldFormats: {
      Duration: (val: unknown) => Math.max(1, Number(val) || 1),
      RequiredSkills: (val: unknown) => String(val).split(',').map(s => s.trim()).join(', '),
      PreferredPhases: (val: unknown) => {
        try {
          return JSON.parse(String(val));
        } catch {
          if (typeof val === 'string' && val.includes('-')) {
            const [start, end] = val.split('-').map(Number);
            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
          }
          return [1];
        }
      },
      MaxConcurrent: (val: unknown) => Math.max(1, Number(val) || 1)
    }
  }
};