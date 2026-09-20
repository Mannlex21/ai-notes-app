// api/ai/generate-title.ts
import { ai, GEMINI_MODEL } from "../gemini.js";

interface GenerateTitlePayload {
	content?: string;
	temperature?: number;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as GenerateTitlePayload;
		const { content = "", temperature } = body;

		const response = await ai.models.generateContent({
			model: GEMINI_MODEL,
			contents: `Genera un título muy corto, atractivo y conciso (máximo 5 palabras) en español que resuma el siguiente contenido. Devuelve ÚNICAMENTE el texto del título, sin comillas, sin punto final ni explicaciones adicionales.\n\nContenido: "${content}"`,
			config: { temperature },
		});

		const title = response.text?.trim() || "";
		return Response.json({ title });
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
