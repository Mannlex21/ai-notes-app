// api/ai/summarize.ts
import { ai, GEMINI_MODEL } from "../gemini.js";

interface SummarizePayload {
	currentText?: string;
	temperature?: number;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as SummarizePayload;
		const { currentText = "", temperature } = body;

		const response = await ai.models.generateContent({
			model: GEMINI_MODEL,
			contents: `Analiza el siguiente texto y genera un resumen conciso usando listas HTML directamente (sin frases introductorias ni etiquetas de markdown como ** o #). 

Usa etiquetas HTML como <ul>, <li>, <strong> para destacar conceptos clave.

Texto:
"${currentText}"`,
			config: { temperature },
		});

		const summary = response.text?.trim() || currentText;
		return Response.json({ summary });
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
