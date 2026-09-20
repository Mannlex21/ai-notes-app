// api/ai/translate.ts
import { ai, GEMINI_MODEL } from "../_lib/gemini";

interface TranslatePayload {
	text?: string;
	targetLanguage?: string;
	temperature?: number;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as TranslatePayload;
		const { text = "", targetLanguage, temperature } = body;

		const prompt = targetLanguage
			? `Traduce el siguiente texto al idioma ${targetLanguage}. Devuelve ÚNICAMENTE la traducción, sin notas ni explicaciones:\n\n"${text}"`
			: `Analiza el siguiente texto. Si está en español, tradúcelo al inglés. Si está en inglés o en otro idioma, tradúcelo al español. Devuelve ÚNICAMENTE la traducción resultante, sin explicaciones ni comillas:\n\n"${text}"`;

		const response = await ai.models.generateContent({
			model: GEMINI_MODEL,
			contents: prompt,
			config: { temperature },
		});

		const translation = response.text?.trim() || text;
		return Response.json({ translation });
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
