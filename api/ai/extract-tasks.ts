// api/ai/extract-tasks.ts
import { ai, GEMINI_MODEL } from "../_lib/gemini.js";

interface ExtractTasksPayload {
	text?: string;
	temperature?: number;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as ExtractTasksPayload;
		const { text = "", temperature } = body;

		const response = await ai.models.generateContent({
			model: GEMINI_MODEL,
			contents: `Analiza el siguiente texto, identifica compromisos, pendientes, llamadas o acciones a realizar y extráelos como una lista de tareas cortas y concisas en español.\n\nTexto: "${text}"`,
			config: {
				temperature,
				responseMimeType: "application/json",
				responseSchema: {
					type: "object",
					properties: {
						tasks: {
							type: "array",
							items: { type: "string" },
							description:
								"Lista de tareas accionables extraídas del texto.",
						},
					},
					required: ["tasks"],
				},
			},
		});

		const data = JSON.parse(response.text || "{}");
		return Response.json({ tasks: data.tasks || [] });
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
