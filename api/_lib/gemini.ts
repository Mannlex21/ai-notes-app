import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY!,
});

export const GEMINI_MODEL = "gemini-1.5-flash";
export const EMBEDDING_MODEL = "text-embedding-004";

export async function getEmbedding(text: string): Promise<number[]> {
	if (!text || !text.trim()) return [];

	const response = await ai.models.embedContent({
		model: EMBEDDING_MODEL,
		contents: text,
	});

	const res = response as any;
	return res.embedding?.values || res.embeddings?.[0]?.values || [];
}
