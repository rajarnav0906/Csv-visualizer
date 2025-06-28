// src/validators/coreValidators.ts
import { ENTITY_DEFINITIONS } from '@/types';
import type { ValidationError } from '@/types';

export const coreValidators = {
  validateRequiredColumns(
    rows: Record<string, unknown>[],
    requiredFields: string[],
    sheetName: string
  ): ValidationError[] {
    if (rows.length === 0) return [];
    const missingColumns = requiredFields.filter(field => 
      !rows[0] || !(field in rows[0])
    );
    return missingColumns.map(column => ({
      type: 'missing_column',
      message: `Missing required column: ${column}`,
      sheetName,
      severity: 'critical'
    }));
  },

    validateEntityStructure(rows: Record<string, unknown>[], entityType: string, sheetName: string): ValidationError[] {
    const definition = ENTITY_DEFINITIONS[entityType];
    if (!definition) return [];
    
    return definition.requiredFields
      .filter(field => !rows[0] || !(field in rows[0]))
      .map(field => ({
        type: 'missing_column',
        message: `Required column '${field}' is missing`,
        sheetName,
        columnName: field,
        severity: 'critical',
        suggestedFix: {
          value: field === 'PriorityLevel' ? 3 : 
                field.includes('ID') ? `NEW_${field}` : '',
          explanation: `Add missing required column '${field}'`
        }
      }));
  },

  validateFieldTypes(rows: Record<string, unknown>[], entityType: string, sheetName: string): ValidationError[] {
    const definition = ENTITY_DEFINITIONS[entityType];
    if (!definition) return [];
    
    return rows.flatMap((row, rowIndex) => {
      return Object.entries(definition.fieldTypes)
        .filter(([field, validator]) => 
          field in row && !validator(row[field])
        )
        .map(([field]) => {
          const formatter = definition.fieldFormats[field];
          const suggestedValue = formatter ? formatter(row[field]) : undefined;
          
          return {
            type: 'invalid_format',
            message: `Invalid format for ${field}: ${row[field]}`,
            rowIndex,
            columnName: field,
            sheetName,
            severity: 'critical',
            suggestedFix: {
              value: suggestedValue,
              explanation: `Format ${field} according to requirements`
            }
          };
        });
    });
  },

  checkDuplicateIds(
    rows: Record<string, unknown>[],
    idField: string,
    sheetName: string
  ): ValidationError[] {
    const idMap = new Map<string, number[]>();
    rows.forEach((row, index) => {
      const id = String(row[idField] ?? '');
      if (!idMap.has(id)) idMap.set(id, []);
      idMap.get(id)?.push(index);
    });

    return Array.from(idMap.entries())
      .filter(([id, indexes]) => id && indexes.length > 1)
      .flatMap(([id, indexes]) => 
        indexes.map(rowIndex => ({
          type: 'duplicate_id',
          message: `Duplicate ${idField} found: ${id}`,
          rowIndex,
          columnName: idField,
          sheetName,
          severity: 'critical'
        }))
      );
  },

  validateNumberRange(
    rows: Record<string, unknown>[],
    field: string,
    min: number,
    max: number,
    sheetName: string
  ): ValidationError[] {
    return rows.flatMap((row, index) => {
      const value = row[field];
      const num = Number(value);
      if (isNaN(num)) {
        return [{
          type: 'invalid_number',
          message: `${field} must be a number, got ${value}`,
          rowIndex: index,
          columnName: field,
          sheetName,
          severity: 'critical'
        }];
      }
      if (num < min || num > max) {
        return [{
          type: 'out_of_range',
          message: `${field} must be between ${min}-${max}, got ${value}`,
          rowIndex: index,
          columnName: field,
          sheetName,
          severity: 'critical',
          suggestedFix: {
            value: Math.max(min, Math.min(max, num)),
            explanation: `Adjusted to valid range`
          }
        }];
      }
      return [];
    });
  },

  validateJSONField(
    rows: Record<string, unknown>[],
    field: string,
    sheetName: string
  ): ValidationError[] {
    return rows.flatMap((row, index) => {
      try {
        JSON.parse(String(row[field] ?? ''));
        return [];
      } catch (e) {
        return [{
          type: 'invalid_json',
          message: `Invalid JSON in ${field}: ${e instanceof Error ? e.message : String(e)}`,
          rowIndex: index,
          columnName: field,
          sheetName,
          severity: 'critical',
          suggestedFix: {
            value: '{}',
            explanation: 'Reset to empty JSON object'
          }
        }];
      }
    });
  },

  validateTaskReferences(
    sourceRows: Record<string, unknown>[],
    targetRows: Record<string, unknown>[],
    sourceField: string,
    targetField: string,
    sheetName: string
  ): ValidationError[] {
    if (!sourceRows?.length || !targetRows?.length) return [];
    
    const validTargets = new Set(targetRows.map(row => String(row[targetField] ?? '')));
    return sourceRows.flatMap((row, rowIndex) => {
      const refs = String(row[sourceField] ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      
      return refs
        .filter(ref => !validTargets.has(ref))
        .map(ref => ({
          type: 'invalid_reference',
          message: `Referenced ${targetField} '${ref}' not found`,
          rowIndex,
          columnName: sourceField,
          sheetName,
          severity: 'critical'
        }));
    });
  },

  validateWorkerOverload(workers: Record<string, unknown>[]): ValidationError[] {
    return workers.flatMap((worker, index) => {
      try {
        const slots = JSON.parse(String(worker.AvailableSlots ?? '[]'));
        const maxLoad = Number(worker.MaxLoadPerPhase ?? 1);
        
        if (!Array.isArray(slots)) return [{
          type: 'invalid_slots_format',
          message: 'AvailableSlots must be an array',
          rowIndex: index,
          columnName: 'AvailableSlots',
          sheetName: 'workers',
          severity: 'critical'
        }];
        
        if (slots.length < maxLoad) return [{
          type: 'worker_overload',
          message: `Worker only has ${slots.length} slots but max load is ${maxLoad}`,
          rowIndex: index,
          columnName: 'MaxLoadPerPhase',
          sheetName: 'workers',
          severity: 'critical',
          suggestedFix: {
            value: Math.min(maxLoad, slots.length),
            explanation: 'Adjusted to available slots'
          }
        }];
        
        return [];
      } catch (e) {
        return [{
          type: 'invalid_slots_format',
          message: `AvailableSlots must be valid JSON array: ${e instanceof Error ? e.message : String(e)}`,
          rowIndex: index,
          columnName: 'AvailableSlots',
          sheetName: 'workers',
          severity: 'critical'
        }];
      }
    });
  },

  validateSkillCoverage(
    tasks: Record<string, unknown>[],
    workers: Record<string, unknown>[]
  ): ValidationError[] {
    if (!tasks?.length || !workers?.length) return [];
    
    const allSkills = new Set<string>();
    workers.forEach(worker => {
      const skills = String(worker.Skills ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      skills.forEach(skill => allSkills.add(skill));
    });

    return tasks.flatMap((task, index) => {
      const requiredSkills = String(task.RequiredSkills ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      
      return requiredSkills
        .filter(skill => !allSkills.has(skill))
        .map(skill => ({
          type: 'missing_skill',
          message: `No worker has required skill: ${skill}`,
          rowIndex: index,
          columnName: 'RequiredSkills',
          sheetName: 'tasks',
          severity: 'critical'
        }));
    });
  },

  validatePhaseWindows(tasks: Record<string, unknown>[]): ValidationError[] {
    return tasks.flatMap((task, index) => {
      try {
        const phases = task.PreferredPhases 
          ? JSON.parse(String(task.PreferredPhases)) 
          : [];
        
        if (!Array.isArray(phases)) return [{
          type: 'invalid_phase_format',
          message: 'PreferredPhases must be a JSON array',
          rowIndex: index,
          columnName: 'PreferredPhases',
          sheetName: 'tasks',
          severity: 'critical'
        }];
        
        return [];
      } catch (e) {
        return [{
          type: 'invalid_phase_format',
          message: `PreferredPhases must be valid JSON: ${e instanceof Error ? e.message : String(e)}`,
          rowIndex: index,
          columnName: 'PreferredPhases',
          sheetName: 'tasks',
          severity: 'critical'
        }];
      }
    });
  },

  validateMaxConcurrency(
    tasks: Record<string, unknown>[],
    workers: Record<string, unknown>[]
  ): ValidationError[] {
    return tasks.flatMap((task, index) => {
      const requiredSkills = String(task.RequiredSkills ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      
      const qualifiedWorkers = workers.filter(worker => {
        const workerSkills = String(worker.Skills ?? '')
          .split(',')
          .map(s => s.trim());
        return requiredSkills.every(skill => workerSkills.includes(skill));
      }).length;
      
      const maxConcurrent = Number(task.MaxConcurrent ?? 1);
      if (qualifiedWorkers < maxConcurrent) {
        return [{
          type: 'insufficient_workers',
          message: `Only ${qualifiedWorkers} qualified workers for ${maxConcurrent} concurrent tasks`,
          rowIndex: index,
          columnName: 'MaxConcurrent',
          sheetName: 'tasks',
          severity: 'critical',
          suggestedFix: {
            value: Math.min(maxConcurrent, qualifiedWorkers),
            explanation: 'Adjusted to available workers'
          }
        }];
      }
      return [];
    });
  }
};