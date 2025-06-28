import { GoogleGenerativeAI } from "@google/generative-ai";
import { coreValidators } from '@/validators/coreValidators';
import type { ValidationError, AIFeedback, DetailedIssue } from '@/types';

export async function POST(req: Request) {
  const { normalizedRows, sheetName, allData } = await req.json();

  // Type-safe validator functions
  const validatorFunctions = [
    (rows: Record<string, unknown>[]) => coreValidators.validateEntityStructure(rows, sheetName, sheetName),
    (rows: Record<string, unknown>[]) => coreValidators.validateFieldTypes(rows, sheetName, sheetName),
    (rows: Record<string, unknown>[]) => coreValidators.checkDuplicateIds(
      rows, 
      sheetName === 'tasks' ? 'TaskID' : 
      sheetName === 'workers' ? 'WorkerID' : 'ClientID',
      sheetName
    )
  ];
  
  const logicErrors = validatorFunctions.flatMap(v => v(normalizedRows));

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  
  const prompt = `Analyze spreadsheet data for issues:

Data Sample (first 10 rows):
${JSON.stringify(normalizedRows.slice(0, 10), null, 2)}

Existing Validation Errors:
${JSON.stringify(logicErrors, null, 2)}

For each issue provide:
- errorType: specific category
- location: {sheet, rowIndex, columnName}
- currentValue: problematic value  
- problem: clear explanation
- suggestedValue: proposed fix
- confidence: 0-1 certainty
- affectsMultiple: if similar issues exist

Return as JSON with { analysisSummary, detailedIssues, recommendedActions }`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Safe JSON parsing with proper fallback
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const aiResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      analysisSummary: "AI analysis failed to return valid JSON",
      detailedIssues: [],
      recommendedActions: ["Please try validating again"]
    };

    // Create properly typed AIFeedback
    const aiFeedback: AIFeedback = {
      analysisSummary: aiResponse.analysisSummary,
      detailedIssues: aiResponse.detailedIssues,
      recommendedActions: aiResponse.recommendedActions
    };

    // Type-safe enhanced feedback
    const enhancedFeedback = {
      ...aiFeedback,
      suggestedFixes: (aiFeedback.detailedIssues || []).map((issue) => ({
        description: `${issue.errorType}: ${issue.problem}`,
        changes: { [issue.location.columnName]: issue.suggestedValue },
        appliesTo: { 
          rowIndex: issue.location.rowIndex,
          columnName: issue.location.columnName,
          sheetName: issue.location.sheet
        },
        affectedRows: issue.affectsMultiple ? 
          normalizedRows
            .map((_row: Record<string, unknown>, idx: number) => idx) // Explicitly typed parameters
            .filter((idx: number) => 
              normalizedRows[idx][issue.location.columnName] === issue.currentValue
            ) : 
          [issue.location.rowIndex],
        confidence: issue.confidence,
        explanation: issue.problem
      })),
      logicErrors: [
        ...logicErrors,
        ...(aiFeedback.detailedIssues || []).map(issue => ({
          type: issue.errorType,
          message: issue.problem,
          rowIndex: issue.location.rowIndex,
          columnName: issue.location.columnName,
          sheetName: issue.location.sheet,
          suggestedFix: {
            value: issue.suggestedValue,
            explanation: issue.problem
          }
        }))
      ]
    };

    return Response.json({
      success: true,
      ...enhancedFeedback
    });
  } catch (err) {
    console.error('AI validation failed:', err);
    return Response.json({ 
      success: false, 
      error: 'AI validation failed',
      logicErrors,
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}