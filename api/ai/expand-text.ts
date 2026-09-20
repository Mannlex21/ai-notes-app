import { ai, GEMINI_MODEL } from "../_lib/gemini";

export async function POST(request: Request) {
	try {
		const { promptText, temperature } = await request.json();

		const response = await ai.models.generateContent({
			model: GEMINI_MODEL,
			contents: `Continúa redactando de forma natural y fluida el siguiente borrador de nota sin repetir el texto original:\n\n"${promptText}"`,
			config: { temperature },
		});

		const generatedText = response.text?.trim() || "";
		const needsSpace =
			!promptText.endsWith(" ") &&
			!generatedText.startsWith(" ") &&
			!generatedText.startsWith(",");

		return Response.json({
			expandedText: `${promptText}${needsSpace ? " " : ""}${generatedText}`,
		});
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
