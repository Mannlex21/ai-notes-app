import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
	console.warn(
		"VITE_GEMINI_API_KEY no está configurada en las variables de entorno.",
	);
}

const ai = new GoogleGenAI({ apiKey });

/**
 * Genera un resumen conciso de una nota
 */
export const summarizeText = async (text: string): Promise<string> => {
	if (!text.trim()) return "";

	try {
		const response = await ai.models.generateContent({
			model: "gemini-1.5-flash",
			contents: `Resume el siguiente texto en un máximo de 2 oraciones concisas en español:\n\n${text}`,
		});

		return response.text?.trim() || "";
	} catch (error) {
		console.error("Error al generar resumen con Gemini:", error);
		return "";
	}
};

/**
 * Genera etiquetas clave para clasificar la nota
 */
export const generateTags = async (
	title: string,
	content: string,
): Promise<string[]> => {
	if (!title.trim() && !content.trim()) return [];

	try {
		const response = await ai.models.generateContent({
			model: "gemini-1.5-flash",
			contents: `Analiza este título y contenido. Genera entre 1 y 4 etiquetas breves (palabras clave simples, sin espacios, sin #) separadas por comas.\n\nTítulo: ${title}\nContenido: ${content}`,
		});

		const rawTags = response.text || "";
		return rawTags
			.split(",")
			.map((tag) =>
				tag
					.trim()
					.toLowerCase()
					.replace(/[^a-z0-9áéíóúñ_-]/gi, ""),
			)
			.filter((tag) => tag.length > 0);
	} catch (error) {
		console.error("Error al generar etiquetas con Gemini:", error);
		return [];
	}
};
/**
 * Mejora, completa o resume el borrador actual en el NoteInput
 */
export const enhanceNoteDraft = async (
	title: string,
	content: string,
): Promise<{ title?: string; content?: string }> => {
	if (!title.trim() && !content.trim()) return {};

	try {
		const response = await ai.models.generateContent({
			model: "gemini-1.5-flash",
			contents: `Eres un asistente de notas. Toma el siguiente borrador y mejora su claridad, corrige gramática o complétalo manteniendo un tono conciso.\nDevuelve la respuesta en formato JSON estricto con las llaves "title" y "content".\n\nTítulo actual: ${title}\nContenido actual: ${content}`,
		});

		const rawText = response.text || "{}";
		const cleanedJson = rawText.replace(/```json|```/g, "").trim();
		return JSON.parse(cleanedJson);
	} catch (error) {
		console.error("Error al procesar borrador con IA:", error);
		return {};
	}
};

/**
 * Genera un resumen o análisis bajo demanda de una nota existente
 */
export const analyzeExistingNote = async (content: string): Promise<string> => {
	if (!content.trim()) return "";

	try {
		const response = await ai.models.generateContent({
			model: "gemini-1.5-flash",
			contents: `Resume esta nota en 2 oraciones clave o extrae los puntos de acción principales:\n\n${content}`,
		});

		return response.text?.trim() || "";
	} catch (error) {
		console.error("Error al analizar nota con IA:", error);
		return "";
	}
};
