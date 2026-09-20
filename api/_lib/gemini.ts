// api/_lib/gemini.ts
import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY!,
});

export const GEMINI_MODEL = "gemini-3.6-flash";
export const EMBEDDING_MODEL = "gemini-embedding-001";

export async function getEmbedding(text: string): Promise<number[]> {
	if (!text || !text.trim()) return [];

	const response = await ai.models.embedContent({
		model: EMBEDDING_MODEL,
		contents: text,
	});

	return response.embedding.values;
}
