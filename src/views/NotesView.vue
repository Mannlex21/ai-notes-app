<!-- views/NotesView.vue -->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import NoteInput from "../components/notes/NoteInput.vue";
import NoteCard from "../components/notes/NoteCard.vue";
import NoteModal from "../components/notes/NoteModal.vue";
import { useNotesStore } from "../stores/useNotesStore";
import type { Note } from "../types";

const store = useNotesStore();

const isEditModalOpen = ref(false);
const noteToEdit = ref<Note | null>(null);

onMounted(() => {
	store.fetchNotes();
});

const handleOpenEdit = (note: Note) => {
	noteToEdit.value = note;
	isEditModalOpen.value = true;
};

const handleSaveModal = async (payload: {
	id?: string;
	title: string;
	content: string;
	color: string;
}) => {
	if (payload.id) {
		// Modo edición
		await store.updateNote(payload.id, {
			title: payload.title,
			content: payload.content,
			color: payload.color,
		});
	} else {
		// Modo creación
		await store.addNote(payload);
	}
};
</script>

<template>
	<div class="space-y-8">
		<!-- Disparador para crear notas -->
		<NoteInput @save-note="store.addNote" />

		<!-- Grilla de notas activa -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			<NoteCard
				v-for="note in store.notes"
				:key="note.id"
				:note="note"
				@click-card="handleOpenEdit"
				@delete="store.deleteNote"
				@toggle-pin="store.togglePin"
				@archive="store.toggleArchiveNote"
			/>
		</div>

		<!-- Modal Reutilizable para Edición -->
		<NoteModal
			:is-open="isEditModalOpen"
			:initial-note="noteToEdit"
			@close="
				isEditModalOpen = false;
				noteToEdit = null;
			"
			@save="handleSaveModal"
		/>
	</div>
</template>
