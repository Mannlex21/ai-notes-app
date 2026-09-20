import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.GEMINI_API_KEY;

if (!apiKey) {
	console.warn(
		"GEMINI_API_KEY no está configurada en las variables de entorno.",
	);
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export const GEMINI_MODEL = "gemini-3.6-flash";
export const EMBEDDING_MODEL = "gemini-embedding-001";
