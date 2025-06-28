import { GoogleGenerativeAI } from "@google/generative-ai";
import { SearchResult } from "@/types";

export async function POST(req: Request) {
  const { query, data } = await req.json();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  const prompt = `Analyze this natural language query against spreadsheet data:

Query: "${query}"

Available Sheets and Columns:
${JSON.stringify(
    Object.keys(data).map(sheet => ({
      sheet,
      columns: Object.keys(data[sheet][0] || {})
    }))
  )}

For each match found, return:
- matchingSheet: sheet name
- matchingRows: array of row indices (0-based)
- explanation: why these rows match
- confidence: 0-1 match confidence
- suggestedQuery: improved query if applicable

Format response as JSON with { results: [...] }`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");

    return Response.json({
      success: true,
      results: json.results || []
    });
  } catch (err) {
    console.error("Search error:", err);
    return Response.json(
      {
        success: false,
        error: "Search failed",
        details: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
}
