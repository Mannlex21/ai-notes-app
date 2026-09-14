import { ref } from "vue";
import { defineStore } from "pinia";
import { sql } from "../lib/neon";
import { useAuthStore } from "./useAuthStore";

export interface Note {
	id: string;
	user_id: string;
	title: string;
	content: string;
	summary?: string;
	tags: string[];
	color: string;
	is_pinned: boolean;
	is_archived: boolean;
	created_at: string;
	updated_at: string;
}

export const useNotesStore = defineStore("notes", () => {
	const notes = ref<Note[]>([]);
	const archivedNotes = ref<Note[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);

	const authStore = useAuthStore();

	const getUserId = () => authStore.user?.id;

	// ----------------------------------------------------
	// 1. READ: Cargar Notas Activas y Archivadas
	// ----------------------------------------------------
	const fetchNotes = async () => {
		const userId = getUserId();
		if (!userId) return;

		loading.value = true;
		error.value = null;

		try {
			const rows = await sql`
				SELECT 
					id, 
					user_id,
					title, 
					content, 
					summary, 
					tags, 
					color,
					is_pinned, 
					is_archived,
					created_at,
					updated_at
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

	// ----------------------------------------------------
	// 2. CREATE: Agregar Nueva Nota
	// ----------------------------------------------------
	const addNote = async (payload: {
		title: string;
		content: string;
		is_pinned?: boolean;
		color?: string;
	}) => {
		const userId = getUserId();
		if (!userId) return;

		try {
			const [inserted] = await sql`
				INSERT INTO notes (user_id, title, content, is_pinned, color)
				VALUES (
					${userId}, 
					${payload.title || ""}, 
					${payload.content || ""}, 
					${payload.is_pinned || false},
					${payload.color || "#f7f4ea"}
				)
				RETURNING id, created_at, updated_at;
			`;

			const newNote: Note = {
				id: inserted.id,
				user_id: userId,
				title: payload.title || "",
				content: payload.content || "",
				tags: [],
				color: payload.color || "#f7f4ea",
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

	// ----------------------------------------------------
	// 3. UPDATE: Actualizar Título y Contenido
	// ----------------------------------------------------
	const updateNote = async (
		id: string,
		payload: { title: string; content: string; color?: string },
	) => {
		const userId = getUserId();
		if (!userId) return;

		try {
			await sql`
				UPDATE notes
				SET 
					title = ${payload.title}, 
					content = ${payload.content}, 
					color = ${payload.color || "#f7f4ea"},
					updated_at = NOW()
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

	// ----------------------------------------------------
	// 4. UPDATE TOGGLES: Fijar / Desfijar Nota
	// ----------------------------------------------------
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
				UPDATE notes 
				SET is_pinned = ${newState}, updated_at = NOW()
				WHERE id = ${id} AND user_id = ${userId};
			`;
		} catch (err) {
			console.error("Error al cambiar pin de la nota:", err);
			note.is_pinned = previousState;
		}
	};

	// ----------------------------------------------------
	// 5. UPDATE TOGGLES: Archivar / Desarchivar
	// ----------------------------------------------------
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
					UPDATE notes 
					SET is_archived = TRUE, is_pinned = FALSE, updated_at = NOW()
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
						UPDATE notes 
						SET is_archived = FALSE, updated_at = NOW()
						WHERE id = ${id} AND user_id = ${userId};
					`;
				}
			}
		} catch (err) {
			console.error("Error al archivar/desarchivar nota:", err);
			await fetchNotes();
		}
	};

	// ----------------------------------------------------
	// 6. UPDATE IA: Guardar Resumen o Etiquetas
	// ----------------------------------------------------
	const saveNoteAiData = async (
		id: string,
		data: { summary?: string; tags?: string[] },
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

			await sql`
				UPDATE notes
				SET 
					summary = ${data.summary ?? note.summary ?? null},
					tags = ${data.tags ?? note.tags ?? []},
					updated_at = NOW()
				WHERE id = ${id} AND user_id = ${userId};
			`;
		} catch (err) {
			console.error("Error al guardar datos de IA:", err);
		}
	};

	// ----------------------------------------------------
	// 7. DELETE: Eliminar Nota Definitivamente
	// ----------------------------------------------------
	const deleteNote = async (id: string) => {
		const userId = getUserId();
		if (!userId) return;

		try {
			notes.value = notes.value.filter((n) => n.id !== id);
			archivedNotes.value = archivedNotes.value.filter(
				(n) => n.id !== id,
			);

			await sql`
				DELETE FROM notes 
				WHERE id = ${id} AND user_id = ${userId};
			`;
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
		error,
		fetchNotes,
		addNote,
		updateNote,
		togglePin,
		toggleArchiveNote,
		saveNoteAiData,
		deleteNote,
	};
});
