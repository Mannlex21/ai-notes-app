// api/ai/suggest-tags.ts
import { ai, GEMINI_MODEL } from "../_lib/gemini.js";

interface SuggestTagsPayload {
	text?: string;
	temperature?: number;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as SuggestTagsPayload;
		const { text = "", temperature } = body;

		const response = await ai.models.generateContent({
			model: GEMINI_MODEL,
			contents: `Analiza el siguiente texto y devuelve entre 1 y 4 etiquetas cortas en español descriptivas para categorizarlo (sin el símbolo #).\n\nTexto: "${text}"`,
			config: {
				temperature,
				responseMimeType: "application/json",
				responseSchema: {
					type: "object",
					properties: {
						tags: { type: "array", items: { type: "string" } },
						color: { type: "string" },
					},
					required: ["tags"],
				},
			},
		});

		const data = JSON.parse(response.text || "{}");
		return Response.json(data);
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
