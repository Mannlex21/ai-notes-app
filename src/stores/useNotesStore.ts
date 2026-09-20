import { ref } from "vue";
import { defineStore } from "pinia";
import { useAuthStore } from "./useAuthStore";
import type { Note } from "../types";
import { useAiStore } from "./useAiStore";
import { useUserConfigStore } from "./useUserConfigStore";

export const useNotesStore = defineStore("notes", () => {
	const notes = ref<Note[]>([]);
	const searchQuery = ref("");
	const archivedNotes = ref<Note[]>([]);
	const loading = ref(false);
	const isLoading = ref(false);
	const error = ref<string | null>(null);

	const authStore = useAuthStore();
	const aiStore = useAiStore();
	const configStore = useUserConfigStore();
	const getUserId = () => authStore.user?.id;

	const fetchNotes = async () => {
		const userId = getUserId();
		if (!userId) return;

		loading.value = true;
		error.value = null;

		try {
			const res = await fetch(`/api/notes?userId=${userId}`);
			const data = await res.json();

			if (!res.ok) throw new Error(data.error);

			const formattedRows: Note[] = data.notes;
			notes.value = formattedRows.filter((n) => !n.is_archived);
			archivedNotes.value = formattedRows.filter((n) => n.is_archived);
		} catch (err: any) {
			console.error("Error al obtener notas:", err);
			error.value = "No se pudieron cargar las notas.";
		} finally {
			loading.value = false;
		}
	};

	const searchNotes = async (query: string) => {
		const userId = getUserId();
		if (!userId) return;

		if (!query.trim()) {
			return await fetchNotes();
		}

		loading.value = true;
		error.value = null;

		try {
			const res = await fetch(
				`/api/notes?userId=${userId}&q=${encodeURIComponent(query)}`,
			);
			const data = await res.json();

			if (!res.ok) throw new Error(data.error);

			notes.value = data.notes;
		} catch (err: any) {
			console.error("Error al buscar notas:", err);
			error.value =
				"No se pudieron obtener los resultados de la búsqueda.";
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
				try {
					const result = await aiStore.suggestTagsForText(fullText);
					finalTags = result.tags;
				} catch (e) {
					console.warn("No se generaron auto-etiquetas:", e);
				}
			}
		}

		try {
			const res = await fetch("/api/notes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId,
					title: payload.title || "",
					content: payload.content || "",
					tags: finalTags,
					color: noteColor,
					is_pinned: payload.is_pinned || false,
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			notes.value.unshift(data.note);
		} catch (err: any) {
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
			const res = await fetch(`/api/notes/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId,
					title: payload.title,
					content: payload.content,
					tags: payload.tags || [],
					color: noteColor,
				}),
			});

			if (!res.ok) throw new Error("Error al modificar la nota");

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
		} catch (err: any) {
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

			const res = await fetch(`/api/notes/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId,
					is_pinned: newState,
				}),
			});

			if (!res.ok) throw new Error("Error al actualizar pin");
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

				await fetch(`/api/notes/${id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId,
						is_archived: true,
						is_pinned: false,
					}),
				});
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

					await fetch(`/api/notes/${id}`, {
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							userId,
							is_archived: false,
						}),
					});
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

			const res = await fetch(`/api/notes/${id}?userId=${userId}`, {
				method: "DELETE",
			});

			if (!res.ok) throw new Error("Error al eliminar nota");
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
		isLoading,
		error,
		fetchNotes,
		addNote,
		updateNote,
		togglePin,
		toggleArchiveNote,
		deleteNote,
		searchQuery,
		searchNotes,
	};
});
