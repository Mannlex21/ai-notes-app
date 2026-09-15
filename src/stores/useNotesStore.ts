import { ref } from "vue";
import { defineStore } from "pinia";
import { sql } from "../lib/neon";
import { useAuthStore } from "./useAuthStore";
import type { Note } from "../types";
import { useAiStore } from "./useAiStore";
import { useUserConfigStore } from "./useUserConfigStore";

export const useNotesStore = defineStore("notes", () => {
	const notes = ref<Note[]>([]);
	const searchQuery = ref("");
	const archivedNotes = ref<Note[]>([]);
	const loading = ref(false);
	const aiLoading = ref(false);
	const error = ref<string | null>(null);

	const authStore = useAuthStore();
	const aiStore = useAiStore();
	const configStore = useUserConfigStore();
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

			// Normalizamos el formato de cada nota al obtenerlas de PostgreSQL
			const formattedRows: Note[] = rows.map((n: any) => ({
				...n,
				tags: n.tags || [],
				color: n.color || "#f7f4ea",
				is_pinned: Boolean(n.is_pinned),
				is_archived: Boolean(n.is_archived),
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

		let finalTags = payload.tags ? [...payload.tags] : [];
		const noteColor = payload.color || "#f2eee3";
		if (finalTags.length === 0 && configStore.autoTagging) {
			const fullText =
				`${payload.title || ""} ${payload.content || ""}`.trim();
			if (fullText) {
				const result = await aiStore.suggestTagsForText(fullText);
				finalTags = result.tags;
			}
		}

		try {
			const vector = await aiStore.getEmbeddingVector(
				`${payload.title || ""} ${payload.content || ""}`,
			);

			const [inserted] = await sql`
			INSERT INTO notes (user_id, title, content, tags, color, is_pinned, embedding)
			VALUES (
				${userId}, 
				${payload.title || ""}, 
				${payload.content || ""}, 
				${finalTags}, 
				${noteColor}, 
				${payload.is_pinned || false},
				${vector}::vector
			)
			RETURNING id, created_at, updated_at;
		`;

			const newNote: Note = {
				id: inserted.id,
				user_id: userId,
				title: payload.title || "",
				content: payload.content || "",
				tags: finalTags,
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
		payload: {
			title: string;
			content: string;
			tags?: string[];
			color?: string;
		},
	) => {
		const userId = getUserId();
		if (!userId) return;

		const noteColor = payload.color || "#f2eee3";

		try {
			const vector = await aiStore.getEmbeddingVector(
				`${payload.title || ""} ${payload.content || ""}`,
			);

			await sql`
			UPDATE notes
			SET title = ${payload.title}, 
				content = ${payload.content}, 
				tags = ${payload.tags || []},
				color = ${noteColor}, 
				embedding = ${vector}::vector,
				updated_at = NOW()
			WHERE id = ${id} AND user_id = ${userId};
		`;

			const note =
				notes.value.find((n) => n.id === id) ||
				archivedNotes.value.find((n) => n.id === id);

			if (note) {
				note.title = payload.title;
				note.content = payload.content;
				if (payload.tags) note.tags = payload.tags;
				note.color = noteColor;
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
				// Mover de Activas -> Archivadas
				const [archivedNote] = notes.value.splice(noteIndexInActive, 1);
				archivedNote.is_archived = true;
				archivedNote.is_pinned = false;
				archivedNotes.value.unshift(archivedNote);

				await sql`
				UPDATE notes SET is_archived = TRUE, is_pinned = FALSE, updated_at = NOW()
				WHERE id = ${id} AND user_id = ${userId};
			`;
			} else {
				// Mover de Archivadas -> Activas
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
		searchQuery,
	};
});
