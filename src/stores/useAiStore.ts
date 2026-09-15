import { ref } from "vue";
import { defineStore } from "pinia";
import { sql } from "../lib/neon";
import { useAuthStore } from "./useAuthStore";
import { ai, GEMINI_MODEL, EMBEDDING_MODEL } from "../lib/gemini";
import type { Note } from "../types";
import { useNotesStore } from "./useNotesStore";

export const useAisStore = defineStore("ai", () => {
	const notes = ref<Note[]>([]);
	const searchQuery = ref("");
	const archivedNotes = ref<Note[]>([]);
	const loading = ref(false);
	const aiLoading = ref(false);
	const error = ref<string | null>(null);

	const authStore = useAuthStore();
	const getUserId = () => authStore.user?.id;
	const noteStore = useNotesStore();

	// ----------------------------------------------------
	// FUNCIONALIDADES DE IA (BAJO DEMANDA)
	// ----------------------------------------------------

	// FEAT 1: Autocategorización y Etiquetas (JSON estructurado)
	const suggestTagsForText = async (
		text: string,
	): Promise<{ tags: string[]; color?: string }> => {
		if (!text.trim()) return { tags: [] };

		aiLoading.value = true;
		try {
			const response = await ai.models.generateContent({
				model: GEMINI_MODEL,
				contents: `Analiza el siguiente texto y devuelve entre 1 y 4 etiquetas cortas en español descriptivas para categorizarlo (sin el símbolo #).\n\nTexto: "${text}"`,
				config: {
					responseMimeType: "application/json",
					responseSchema: {
						type: "object",
						properties: {
							tags: {
								type: "array",
								items: { type: "string" },
							},
							color: { type: "string" },
						},
						required: ["tags"],
					},
				},
			});

			const data = JSON.parse(response.text || "{}");
			return {
				tags: data.tags || [],
				color: data.color || "#f7f4ea",
			};
		} catch (err) {
			console.error("Error al generar etiquetas sugeridas:", err);
			return { tags: [] };
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 2: Generación / Expansión de Texto (para NoteInput)
	const expandText = async (promptText: string): Promise<string> => {
		if (!promptText.trim()) return "";
		aiLoading.value = true;
		try {
			const response = await ai.models.generateContent({
				model: GEMINI_MODEL,
				contents: `Continúa redactando de forma natural y fluida el siguiente borrador de nota sin repetir el texto original:\n\n"${promptText}"`,
			});

			const generatedText = response.text?.trim() || "";

			// Concatenación limpia
			const needsSpace =
				!promptText.endsWith(" ") &&
				!generatedText.startsWith(" ") &&
				!generatedText.startsWith(",");
			return `${promptText}${needsSpace ? " " : ""}${generatedText}`;
		} catch (error) {
			console.error("Error al expandir borrador:", error);
			return promptText;
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 3: Mejora de Estilo y Gramática (Genera variantes para el Modal)
	const refineStyleOptions = async (
		currentText: string,
		tone: "formal" | "conciso" | "casual",
	): Promise<string[]> => {
		if (!currentText.trim()) return [];

		const tonePrompts = {
			formal: "Reescribe el texto corrigiendo la gramática y adaptándolo a un tono profesional, claro y pulido.",
			conciso:
				"Resume y simplifica el texto manteniendo únicamente la información imprescindible.",
			casual: "Reescribe el texto para que suene natural, fresco y conversacional.",
		};

		aiLoading.value = true;
		try {
			const response = await ai.models.generateContent({
				model: GEMINI_MODEL,
				contents: `Instrucción: Genera 3 variantes distintas reescritas según el tono solicitado.\n\nObjetivo: ${tonePrompts[tone]}\n\nTexto original:\n"${currentText}"`,
				config: {
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
			return data.options || [currentText];
		} catch (err) {
			console.error("Error al generar opciones de estilo:", err);
			return [];
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 4: Smart Search / RAG (Búsqueda Semántica con Embeddings)
	const searchNotesSemantics = async (query: string) => {
		if (!query.trim()) return await noteStore.fetchNotes();

		loading.value = true;
		try {
			const queryVector = await getEmbeddingVector(query);
			if (!queryVector) return;

			const rows = await sql`
			SELECT id, user_id, title, content, summary, tags, color, is_pinned, is_archived, created_at, updated_at,
					1 - (embedding <=> ${queryVector}::vector) AS similarity
			FROM notes
			WHERE user_id = ${getUserId()}
				AND embedding IS NOT NULL
				AND 1 - (embedding <=> ${queryVector}::vector) > 0.25
			ORDER BY similarity DESC
			LIMIT 10;
		`;

			const formattedRows: Note[] = rows.map((n: any) => ({
				...n,
				tags: n.tags || [],
				color: n.color || "#f7f4ea",
			}));

			notes.value = formattedRows.filter((n) => !n.is_archived);
		} catch (err) {
			console.error("Error en búsqueda semántica:", err);
			await noteStore.fetchNotes();
		} finally {
			loading.value = false;
		}
	};

	// Helper interno para convertir texto a formato vector
	const getEmbeddingVector = async (text: string): Promise<string | null> => {
		if (!text.trim()) return null;
		try {
			const res = await ai.models.embedContent({
				model: EMBEDDING_MODEL,
				contents: text,
				config: {
					outputDimensionality: 768, // Reducir a 768 dimensiones para pgvector
				},
			});
			const values = res.embeddings?.[0]?.values;
			return values ? `[${values.join(",")}]` : null;
		} catch (err) {
			console.error("Error al generar embedding:", err);
			return null;
		}
	};

	// FEAT 5: Resumir Puntos Clave para Borrador (NoteInput)
	const summarizeDraft = async (currentText: string): Promise<string> => {
		if (!currentText.trim()) return "";

		aiLoading.value = true;
		try {
			const response = await ai.models.generateContent({
				model: GEMINI_MODEL,
				contents: `Analiza el siguiente texto y genera un resumen conciso usando listas HTML directamente (sin frases introductorias ni etiquetas de markdown como ** o #). 

Usa etiquetas HTML como <ul>, <li>, <strong> para destacar conceptos clave.

Texto:
"${currentText}"`,
			});

			return response.text?.trim() || currentText;
		} catch (err) {
			console.error("Error al resumir borrador:", err);
			return currentText;
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 6: Smart Action Items / Extraer Tareas para Checklist
	const extractActionItems = async (text: string): Promise<string[]> => {
		if (!text.trim()) return [];

		aiLoading.value = true;
		try {
			const response = await ai.models.generateContent({
				model: GEMINI_MODEL,
				contents: `Analiza el siguiente texto, identifica compromisos, pendientes, llamadas o acciones a realizar y extráelos como una lista de tareas cortas y concisas en español.\n\nTexto: "${text}"`,
				config: {
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
			return data.tasks || [];
		} catch (err) {
			console.error("Error al extraer tareas con IA:", err);
			return [];
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 7: Traductor Integrado
	const translateText = async (
		text: string,
		targetLanguage?: string,
	): Promise<string> => {
		if (!text.trim()) return "";

		aiLoading.value = true;
		try {
			const prompt = targetLanguage
				? `Traduce el siguiente texto al idioma ${targetLanguage}. Devuelve ÚNICAMENTE la traducción, sin notas ni explicaciones:\n\n"${text}"`
				: `Analiza el siguiente texto. Si está en español, tradúcelo al inglés. Si está en inglés o en otro idioma, tradúcelo al español. Devuelve ÚNICAMENTE la traducción resultante, sin explicaciones ni comillas:\n\n"${text}"`;

			const response = await ai.models.generateContent({
				model: GEMINI_MODEL,
				contents: prompt,
			});

			return response.text?.trim() || text;
		} catch (err) {
			console.error("Error al traducir texto con IA:", err);
			return text;
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 8: Auto-Título Inteligente
	const generateTitle = async (content: string): Promise<string> => {
		if (!content.trim()) return "";

		aiLoading.value = true;
		try {
			const response = await ai.models.generateContent({
				model: GEMINI_MODEL,
				contents: `Genera un título muy corto, atractivo y conciso (máximo 5 palabras) en español que resuma el siguiente contenido. Devuelve ÚNICAMENTE el texto del título, sin comillas, sin punto final ni explicaciones adicionales.\n\nContenido: "${content}"`,
			});

			return response.text?.trim() || "";
		} catch (err) {
			console.error("Error al generar título con IA:", err);
			return "";
		} finally {
			aiLoading.value = false;
		}
	};

	return {
		notes,
		archivedNotes,
		loading,
		aiLoading,
		error,
		suggestTagsForText,
		expandText,
		refineStyleOptions,
		searchNotesSemantics,
		summarizeDraft,
		extractActionItems,
		translateText,
		generateTitle,
		getEmbeddingVector,
		searchQuery,
	};
});
