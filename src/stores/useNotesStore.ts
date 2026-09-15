import { ref } from "vue";
import { defineStore } from "pinia";
import { sql } from "../lib/neon";
import { useAuthStore } from "./useAuthStore";
import { ai, GEMINI_MODEL, EMBEDDING_MODEL } from "../lib/gemini";
import type { Note } from "../types";

export const useNotesStore = defineStore("notes", () => {
	const notes = ref<Note[]>([]);
	const archivedNotes = ref<Note[]>([]);
	const loading = ref(false);
	const aiLoading = ref(false);
	const error = ref<string | null>(null);

	const authStore = useAuthStore();
	const getUserId = () => authStore.user?.id;

	// ----------------------------------------------------
	// OPERACIONES CRUD EXISTENTES
	// ----------------------------------------------------
	const fetchNotes = async () => {
		const userId = getUserId();
		if (!userId) return;

		loading.value = true;
		error.value = null;

		try {
			const rows = await sql`
				SELECT id, user_id, title, content, summary, tags, color, is_pinned, is_archived, created_at, updated_at
				FROM notes
				WHERE user_id = ${userId}
				ORDER BY is_pinned DESC, created_at DESC;
			`;

			const formattedRows: Note[] = rows.map((n: any) => ({
				...n,
				tags: n.tags || [],
				color: n.color || "#f7f4ea",
			}));

			notes.value = formattedRows.filter((n) => !n.is_archived);
			archivedNotes.value = formattedRows.filter((n) => n.is_archived);
		} catch (err) {
			console.error("Error al obtener notas:", err);
			error.value = "No se pudieron cargar las notas.";
		} finally {
			loading.value = false;
		}
	};

	const addNote = async (payload: {
		title: string;
		content: string;
		tags?: string[];
		color?: string;
		is_pinned?: boolean;
	}) => {
		const userId = getUserId();
		if (!userId) return;

		const noteTags = payload.tags || [];
		const noteColor = payload.color || "#f7f4ea";

		try {
			const [inserted] = await sql`
            INSERT INTO notes (user_id, title, content, tags, color, is_pinned)
            VALUES (
                ${userId}, 
                ${payload.title || ""}, 
                ${payload.content || ""}, 
                ${noteTags}, 
                ${noteColor}, 
                ${payload.is_pinned || false}
            )
            RETURNING id, created_at, updated_at;
        `;

			const newNote: Note = {
				id: inserted.id,
				user_id: userId,
				title: payload.title || "",
				content: payload.content || "",
				tags: noteTags,
				color: noteColor,
				is_pinned: payload.is_pinned || false,
				is_archived: false,
				created_at: inserted.created_at,
				updated_at: inserted.updated_at,
			};

			notes.value.unshift(newNote);
		} catch (err) {
			console.error("Error al agregar nota:", err);
			error.value = "Error al crear la nota.";
		}
	};

	const updateNote = async (
		id: string,
		payload: { title: string; content: string; color?: string },
	) => {
		const userId = getUserId();
		if (!userId) return;

		try {
			await sql`
				UPDATE notes
				SET title = ${payload.title}, content = ${payload.content}, color = ${payload.color || "#f7f4ea"}, updated_at = NOW()
				WHERE id = ${id} AND user_id = ${userId};
			`;

			const note =
				notes.value.find((n) => n.id === id) ||
				archivedNotes.value.find((n) => n.id === id);
			if (note) {
				note.title = payload.title;
				note.content = payload.content;
				if (payload.color) note.color = payload.color;
				note.updated_at = new Date().toISOString();
			}
		} catch (err) {
			console.error("Error al actualizar nota:", err);
			error.value = "Error al modificar la nota.";
		}
	};

	const togglePin = async (id: string) => {
		const userId = getUserId();
		if (!userId) return;

		const note = notes.value.find((n) => n.id === id);
		if (!note) return;

		const previousState = note.is_pinned;
		const newState = !previousState;

		try {
			note.is_pinned = newState;
			notes.value.sort(
				(a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0),
			);

			await sql`
				UPDATE notes SET is_pinned = ${newState}, updated_at = NOW()
				WHERE id = ${id} AND user_id = ${userId};
			`;
		} catch (err) {
			console.error("Error al cambiar pin:", err);
			note.is_pinned = previousState;
		}
	};

	const toggleArchiveNote = async (id: string) => {
		const userId = getUserId();
		if (!userId) return;

		const noteIndexInActive = notes.value.findIndex((n) => n.id === id);
		const isCurrentlyActive = noteIndexInActive !== -1;

		try {
			if (isCurrentlyActive) {
				const [archivedNote] = notes.value.splice(noteIndexInActive, 1);
				archivedNote.is_archived = true;
				archivedNote.is_pinned = false;
				archivedNotes.value.unshift(archivedNote);

				await sql`
					UPDATE notes SET is_archived = TRUE, is_pinned = FALSE, updated_at = NOW()
					WHERE id = ${id} AND user_id = ${userId};
				`;
			} else {
				const noteIndexInArchived = archivedNotes.value.findIndex(
					(n) => n.id === id,
				);
				if (noteIndexInArchived !== -1) {
					const [restoredNote] = archivedNotes.value.splice(
						noteIndexInArchived,
						1,
					);
					restoredNote.is_archived = false;
					notes.value.unshift(restoredNote);

					await sql`
						UPDATE notes SET is_archived = FALSE, updated_at = NOW()
						WHERE id = ${id} AND user_id = ${userId};
					`;
				}
			}
		} catch (err) {
			console.error("Error al archivar/desarchivar:", err);
			await fetchNotes();
		}
	};

	const deleteNote = async (id: string) => {
		const userId = getUserId();
		if (!userId) return;

		try {
			notes.value = notes.value.filter((n) => n.id !== id);
			archivedNotes.value = archivedNotes.value.filter(
				(n) => n.id !== id,
			);

			await sql`DELETE FROM notes WHERE id = ${id} AND user_id = ${userId};`;
		} catch (err) {
			console.error("Error al eliminar nota:", err);
			error.value = "No se pudo eliminar la nota.";
			await fetchNotes();
		}
	};

	// ----------------------------------------------------
	// FUNCIONALIDADES DE IA (BAJO DEMANDA)
	// ----------------------------------------------------

	// Helper para persistir cambios de IA en Neon
	const saveNoteAiData = async (
		id: string,
		data: { summary?: string; tags?: string[]; color?: string },
	) => {
		const userId = getUserId();
		if (!userId) return;

		try {
			const note =
				notes.value.find((n) => n.id === id) ||
				archivedNotes.value.find((n) => n.id === id);
			if (!note) return;

			if (data.summary !== undefined) note.summary = data.summary;
			if (data.tags !== undefined) note.tags = data.tags;
			if (data.color !== undefined) note.color = data.color;

			await sql`
				UPDATE notes
				SET 
					summary = ${data.summary ?? note.summary ?? null},
					tags = ${data.tags ?? note.tags ?? []},
					color = ${data.color ?? note.color ?? "#f7f4ea"},
					updated_at = NOW()
				WHERE id = ${id} AND user_id = ${userId};
			`;
		} catch (err) {
			console.error("Error al guardar datos de IA:", err);
		}
	};

	// FEAT 1: Resumen Automático (3 viñetas)
	const summarizeNote = async (id: string) => {
		const note = notes.value.find((n) => n.id === id);
		if (!note || !note.content) return;

		aiLoading.value = true;
		try {
			const response = await ai.models.generateContent({
				model: GEMINI_MODEL,
				contents: `Condensa el siguiente texto en exactamente 3 puntos clave muy breves (usa formato de viñetas '- '):\n\n${note.content}`,
			});

			const summary = response.text?.trim();
			if (summary) {
				await saveNoteAiData(id, { summary });
			}
		} catch (err) {
			console.error("Error al resumir nota:", err);
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 2: Autocategorización y Etiquetas (JSON estructurado)
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

	// FEAT 3: Generación / Expansión de Texto (para NoteInput)
	async function expandText(promptText: string): Promise<string> {
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
	}

	// FEAT 4: Mejora de Estilo y Gramática (Genera variantes para el Modal)
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

	// FEAT 5: Smart Search / RAG (Búsqueda Semántica con Embeddings)
	const searchNotesSemantics = async (query: string) => {
		if (!query.trim()) return await fetchNotes();

		loading.value = true;
		try {
			const embeddingRes = await ai.models.embedContent({
				model: EMBEDDING_MODEL,
				contents: query,
			});

			const values = embeddingRes.embeddings?.[0]?.values;
			if (!values) return;

			const queryVector = `[${values.join(",")}]`;

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
			await fetchNotes();
		} finally {
			loading.value = false;
		}
	};

	// FEAT 6: Resumir Puntos Clave para Borrador (NoteInput)
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

	// FEAT 7: Smart Action Items / Extraer Tareas para Checklist
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

	// FEAT 8: Traductor Integrado
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

	return {
		notes,
		archivedNotes,
		loading,
		aiLoading,
		error,
		fetchNotes,
		addNote,
		updateNote,
		togglePin,
		toggleArchiveNote,
		deleteNote,
		summarizeNote,
		suggestTagsForText,
		expandText,
		refineStyleOptions,
		searchNotesSemantics,
		summarizeDraft,
		extractActionItems,
		translateText,
	};
});
