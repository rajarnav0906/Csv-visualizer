import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  const { headers, sampleRows, expectedFields } = await req.json();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  const prompt = `
You're an AI assistant. Map spreadsheet headers to known fields.

Standard Fields: ${JSON.stringify(expectedFields)}
User Headers: ${JSON.stringify(headers)}
Sample Rows: ${JSON.stringify(sampleRows)}

Return a JSON mapping: { "OriginalHeader": "MappedField" }
Use "Unknown" if there's no good match.
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");

    return new Response(JSON.stringify({ success: true, mappedHeaders: json }));
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, error: "Mapping failed" }),
      { status: 500 }
    );
  }
}
