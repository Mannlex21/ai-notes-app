// api/ai/refine-style.ts
import { ai, GEMINI_MODEL } from "../gemini.js";

interface RefineStylePayload {
	currentText?: string;
	tone?: "formal" | "conciso" | "casual" | string;
	temperature?: number;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as RefineStylePayload;
		const { currentText = "", tone, temperature } = body;

		const tonePrompts = {
			formal: "Reescribe el texto corrigiendo la gramática y adaptándolo a un tono profesional, claro y pulido.",
			conciso:
				"Resume y simplifica el texto manteniendo únicamente la información imprescindible.",
			casual: "Reescribe el texto para que suene natural, fresco y conversacional.",
		};

		const promptInstruction =
			tonePrompts[tone as keyof typeof tonePrompts] || tonePrompts.formal;

		const response = await ai.models.generateContent({
			model: GEMINI_MODEL,
			contents: `Instrucción: Genera 3 variantes distintas reescritas según el tono solicitado.\n\nObjetivo: ${promptInstruction}\n\nTexto original:\n"${currentText}"`,
			config: {
				temperature,
				responseMimeType: "application/json",
				responseSchema: {
					type: "object",
					properties: {
						options: {
							type: "array",
							items: { type: "string" },
							description:
								"Exactamente 3 variantes reescritas sin comentarios ni explicaciones adicionales.",
						},
					},
					required: ["options"],
				},
			},
		});

		const data = JSON.parse(response.text || "{}");
		return Response.json({ options: data.options || [currentText] });
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
