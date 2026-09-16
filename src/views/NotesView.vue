<!-- views/NotesView.vue -->
<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import NoteInput from "../components/notes/NoteInput.vue";
import NoteCard from "../components/notes/NoteCard.vue";
import NoteModal from "../components/notes/NoteModal.vue";
import { useNotesStore } from "../stores/useNotesStore";
import { useUserConfigStore } from "../stores/useUserConfigStore";
import type { Note } from "../types";

const notesStore = useNotesStore();
const configStore = useUserConfigStore();

const isEditModalOpen = ref(false);
const noteToEdit = ref<Note | null>(null);

onMounted(() => {
	notesStore.fetchNotes();
	configStore.fetchUserConfig();
});

const containerLayoutClass = computed(() => {
	return configStore.currentView === "grid"
		? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
		: "flex flex-col gap-3 max-w-3xl mx-auto";
});

const handleOpenEdit = (note: Note) => {
	noteToEdit.value = note;
	isEditModalOpen.value = true;
};

const handleSaveModal = async (payload: {
	id?: string;
	title: string;
	content: string;
	tags: string[];
	color: string;
}) => {
	if (payload.id) {
		await notesStore.updateNote(payload.id, {
			title: payload.title,
			content: payload.content,
			tags: payload.tags,
			color: payload.color,
		});
	} else {
		await notesStore.addNote({
			title: payload.title,
			content: payload.content,
			tags: payload.tags,
			color: payload.color,
		});
	}
};
</script>

<template>
	<div class="space-y-8">
		<!-- Disparador para crear notas -->
		<NoteInput @save-note="notesStore.addNote" />

		<!-- Contenedor dinámico -->
		<div :class="containerLayoutClass">
			<NoteCard
				v-for="note in notesStore.notes"
				:key="note.id"
				:note="note"
				@click-card="handleOpenEdit"
				@delete="notesStore.deleteNote"
				@toggle-pin="notesStore.togglePin"
				@archive="notesStore.toggleArchiveNote"
			/>
		</div>

		<!-- Modal Reutilizable -->
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
