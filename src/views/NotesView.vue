<!-- views/NotesView.vue -->
<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import NoteInput from "../components/notes/NoteInput.vue";
import NoteCard from "../components/notes/NoteCard.vue";
import NoteModal from "../components/notes/NoteModal.vue";
import { useNotesStore } from "../stores/useNotesStore";
import { useUserConfigStore } from "../stores/useUserConfigStore";
import type { Note } from "../types";

const store = useNotesStore();
const configStore = useUserConfigStore();

const isEditModalOpen = ref(false);
const noteToEdit = ref<Note | null>(null);

onMounted(() => {
	store.fetchNotes();
	configStore.fetchUserConfig();
});

// Layout dinámico dependiente de la configuración
const containerLayoutClass = computed(() => {
	return configStore.currentView === "grid"
		? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
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
	color: string;
}) => {
	if (payload.id) {
		await store.updateNote(payload.id, {
			title: payload.title,
			content: payload.content,
			color: payload.color,
		});
	} else {
		await store.addNote(payload);
	}
};
</script>

<template>
	<div class="space-y-8">
		<!-- Disparador para crear notas -->
		<NoteInput @save-note="store.addNote" />

		<!-- Contenedor dinámico (Cuadrícula o Lista) -->
		<div :class="containerLayoutClass">
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
