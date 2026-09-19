import { ref } from "vue";
import { defineStore } from "pinia";
import { sql } from "../lib/neon";
import { useAuthStore } from "./useAuthStore";
import { useUserConfigStore } from "./useUserConfigStore";
import { ai, GEMINI_MODEL, EMBEDDING_MODEL } from "../lib/gemini";
import type { Note } from "../types";
import { useNotesStore } from "./useNotesStore";

export const useAiStore = defineStore("ai", () => {
	const notes = ref<Note[]>([]);
	const searchQuery = ref("");
	const archivedNotes = ref<Note[]>([]);
	const loading = ref(false);
	const aiLoading = ref(false);
	const error = ref<string | null>(null);

	const authStore = useAuthStore();
	const configStore = useUserConfigStore();
	const noteStore = useNotesStore();

	const getUserId = () => authStore.user?.id;

	// Helper para validar y consumir un prompt antes de llamar a la API
	const checkAndConsumePrompt = async (): Promise<boolean> => {
		if (configStore.isLimitReached) {
			error.value = "Has alcanzado tu límite diario de peticiones de IA.";
			return false;
		}
		return await configStore.incrementPromptUsage();
	};

	// ----------------------------------------------------
	// FUNCIONALIDADES DE IA (BAJO DEMANDA)
	// ----------------------------------------------------

	// FEAT 1: Autocategorización y Etiquetas
	const suggestTagsForText = async (
		text: string,
	): Promise<{ tags: string[]; color?: string }> => {
		if (!text.trim()) return { tags: [] };
		if (configStore.isLimitReached) {
			error.value = "Límite diario alcanzado";
			throw new Error("Límite diario de peticiones de IA alcanzado");
		}

		aiLoading.value = true;
		error.value = null;

		try {
			const canProceed = await checkAndConsumePrompt();
			if (!canProceed)
				throw new Error("No fue posible consumir la petición de IA");

			const response = await ai.models.generateContent({
				model: GEMINI_MODEL,
				contents: `Analiza el siguiente texto y devuelve entre 1 y 4 etiquetas cortas en español descriptivas para categorizarlo (sin el símbolo #).\n\nTexto: "${text}"`,
				config: {
					temperature: configStore.aiTemperature,
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
		} catch (err: any) {
			console.error("Error al generar etiquetas sugeridas:", err);
			error.value =
				err?.message || "Error al generar etiquetas sugeridas";
			throw err;
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 2: Generación / Expansión de Texto
	const expandText = async (promptText: string): Promise<string> => {
		if (!promptText.trim()) return "";
		if (configStore.isLimitReached) {
			error.value = "Límite diario alcanzado";
			throw new Error("Límite diario de peticiones de IA alcanzado");
		}

		aiLoading.value = true;
		error.value = null;

		try {
			const canProceed = await checkAndConsumePrompt();
			if (!canProceed)
				throw new Error("No fue posible consumir la petición de IA");

			const response = await ai.models.generateContent({
				model: GEMINI_MODEL,
				contents: `Continúa redactando de forma natural y fluida el siguiente borrador de nota sin repetir el texto original:\n\n"${promptText}"`,
				config: {
					temperature: configStore.aiTemperature,
				},
			});

			const generatedText = response.text?.trim() || "";
			const needsSpace =
				!promptText.endsWith(" ") &&
				!generatedText.startsWith(" ") &&
				!generatedText.startsWith(",");

			return `${promptText}${needsSpace ? " " : ""}${generatedText}`;
		} catch (err: any) {
			console.error("Error al expandir borrador:", err);
			error.value = err?.message || "Error al expandir borrador";
			throw err;
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 3: Mejora de Estilo y Gramática
	const refineStyleOptions = async (
		currentText: string,
		tone: "formal" | "conciso" | "casual",
	): Promise<string[]> => {
		if (!currentText.trim()) return [];
		if (configStore.isLimitReached) {
			error.value = "Límite diario alcanzado";
			throw new Error("Límite diario de peticiones de IA alcanzado");
		}

		const tonePrompts = {
			formal: "Reescribe el texto corrigiendo la gramática y adaptándolo a un tono profesional, claro y pulido.",
			conciso:
				"Resume y simplifica el texto manteniendo únicamente la información imprescindible.",
			casual: "Reescribe el texto para que suene natural, fresco y conversacional.",
		};

		aiLoading.value = true;
		error.value = null;

		try {
			const canProceed = await checkAndConsumePrompt();
			if (!canProceed)
				throw new Error("No fue posible consumir la petición de IA");

			const response = await ai.models.generateContent({
				model: GEMINI_MODEL,
				contents: `Instrucción: Genera 3 variantes distintas reescritas según el tono solicitado.\n\nObjetivo: ${tonePrompts[tone]}\n\nTexto original:\n"${currentText}"`,
				config: {
					temperature: configStore.aiTemperature,
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
		} catch (err: any) {
			console.error("Error al generar opciones de estilo:", err);
			error.value = err?.message || "Error al generar opciones de estilo";
			throw err;
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 4: Smart Search / RAG (Búsqueda Semántica)
	const searchNotesSemantics = async (query: string) => {
		if (!query.trim()) return await noteStore.fetchNotes();

		loading.value = true;
		error.value = null;

		try {
			const queryVector = await getEmbeddingVector(query);
			if (!queryVector) return;

			const rows = await sql`
				SELECT id, user_id, title, content, summary, tags, color, is_pinned, is_archived, created_at, updated_at,
						1 - (embedding <=> ${queryVector}::vector) AS similarity
				FROM notes
				WHERE user_id = ${getUserId()}
					AND embedding IS NOT NULL
					AND 1 - (embedding <=> ${queryVector}::vector) >= 0.50
				ORDER BY similarity DESC
				LIMIT 5;
			`;

			if (rows.length > 0) {
				// Obtenemos la similitud de la nota más acertada (la primera)
				const topScore = Number(rows[0].similarity);

				// Conservamos solo las notas que estén dentro de un margen del 10% respecto a la mejor
				// (Ejemplo: si la top es 0.73, mantendrá las que tengan >= 0.63)
				const MARGIN = 0.1;
				const filteredRows = rows.filter(
					(n: any) => Number(n.similarity) >= topScore - MARGIN,
				);

				noteStore.notes = filteredRows
					.map((n: any) => ({
						...n,
						tags: n.tags || [],
						color: n.color || "#f7f4ea",
					}))
					.filter((n) => !n.is_archived);
			} else {
				noteStore.notes = [];
			}
		} catch (err: any) {
			console.error("Error en búsqueda semántica:", err);
			error.value = err?.message || "Error en búsqueda semántica";
			await noteStore.fetchNotes();
			throw err;
		} finally {
			loading.value = false;
		}
	};

	// Helper interno para generar vectores de embedding (sin restricción de prompts)
	const getEmbeddingVector = async (text: string): Promise<string | null> => {
		if (!text.trim()) return null;
		try {
			const res = await ai.models.embedContent({
				model: EMBEDDING_MODEL,
				contents: text,
				config: {
					outputDimensionality: 768,
				},
			});
			const values = res.embeddings?.[0]?.values;
			return values ? `[${values.join(",")}]` : null;
		} catch (err: any) {
			console.error("Error al generar embedding:", err);
			error.value = err?.message || "Error al generar embedding";
			throw err;
		}
	};

	// FEAT 5: Resumir Puntos Clave
	const summarizeDraft = async (currentText: string): Promise<string> => {
		if (!currentText.trim()) return "";
		if (configStore.isLimitReached) {
			error.value = "Límite diario alcanzado";
			throw new Error("Límite diario de peticiones de IA alcanzado");
		}

		aiLoading.value = true;
		error.value = null;

		try {
			const canProceed = await checkAndConsumePrompt();
			if (!canProceed)
				throw new Error("No fue posible consumir la petición de IA");

			const response = await ai.models.generateContent({
				model: GEMINI_MODEL,
				contents: `Analiza el siguiente texto y genera un resumen conciso usando listas HTML directamente (sin frases introductorias ni etiquetas de markdown como ** o #). 

Usa etiquetas HTML como <ul>, <li>, <strong> para destacar conceptos clave.

Texto:
"${currentText}"`,
				config: {
					temperature: configStore.aiTemperature,
				},
			});

			return response.text?.trim() || currentText;
		} catch (err: any) {
			console.error("Error al resumir borrador:", err);
			error.value = err?.message || "Error al resumir borrador";
			throw err;
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 6: Extraer Tareas para Checklist
	const extractActionItems = async (text: string): Promise<string[]> => {
		if (!text.trim()) return [];
		if (configStore.isLimitReached) {
			error.value = "Límite diario alcanzado";
			throw new Error("Límite diario de peticiones de IA alcanzado");
		}

		aiLoading.value = true;
		error.value = null;

		try {
			const canProceed = await checkAndConsumePrompt();
			if (!canProceed)
				throw new Error("No fue posible consumir la petición de IA");

			const response = await ai.models.generateContent({
				model: GEMINI_MODEL,
				contents: `Analiza el siguiente texto, identifica compromisos, pendientes, llamadas o acciones a realizar y extráelos como una lista de tareas cortas y concisas en español.\n\nTexto: "${text}"`,
				config: {
					temperature: configStore.aiTemperature,
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
		} catch (err: any) {
			console.error("Error al extraer tareas con IA:", err);
			error.value = err?.message || "Error al extraer tareas con IA";
			throw err;
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
		if (configStore.isLimitReached) {
			error.value = "Límite diario alcanzado";
			throw new Error("Límite diario de peticiones de IA alcanzado");
		}

		aiLoading.value = true;
		error.value = null;

		try {
			const canProceed = await checkAndConsumePrompt();
			if (!canProceed)
				throw new Error("No fue posible consumir la petición de IA");

			const prompt = targetLanguage
				? `Traduce el siguiente texto al idioma ${targetLanguage}. Devuelve ÚNICAMENTE la traducción, sin notas ni explicaciones:\n\n"${text}"`
				: `Analiza el siguiente texto. Si está en español, tradúcelo al inglés. Si está en inglés o en otro idioma, tradúcelo al español. Devuelve ÚNICAMENTE la traducción resultante, sin explicaciones ni comillas:\n\n"${text}"`;

			const response = await ai.models.generateContent({
				model: GEMINI_MODEL,
				contents: prompt,
				config: {
					temperature: configStore.aiTemperature,
				},
			});

			return response.text?.trim() || text;
		} catch (err: any) {
			console.error("Error al traducir texto con IA:", err);
			error.value = err?.message || "Error al traducir texto con IA";
			throw err;
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 8: Auto-Título Inteligente
	const generateTitle = async (content: string): Promise<string> => {
		if (!content.trim()) return "";
		if (configStore.isLimitReached) {
			error.value = "Límite diario alcanzado";
			throw new Error("Límite diario de peticiones de IA alcanzado");
		}

		aiLoading.value = true;
		error.value = null;

		try {
			const canProceed = await checkAndConsumePrompt();
			if (!canProceed)
				throw new Error("No fue posible consumir la petición de IA");

			const response = await ai.models.generateContent({
				model: GEMINI_MODEL,
				contents: `Genera un título muy corto, atractivo y conciso (máximo 5 palabras) en español que resuma el siguiente contenido. Devuelve ÚNICAMENTE el texto del título, sin comillas, sin punto final ni explicaciones adicionales.\n\nContenido: "${content}"`,
				config: {
					temperature: configStore.aiTemperature,
				},
			});

			return response.text?.trim() || "";
		} catch (err: any) {
			console.error("Error al generar título con IA:", err);
			error.value = err?.message || "Error al generar título con IA";
			throw err;
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
