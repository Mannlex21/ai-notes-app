<!-- views/ArchiveView.vue -->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Archive, Loader2 } from "lucide-vue-next";
import { useNotesStore } from "../stores/useNotesStore";
import { useUserConfigStore } from "../stores/useUserConfigStore";
import NoteCard from "../components/notes/NoteCard.vue";
import NoteModal from "../components/notes/NoteModal.vue";
import type { Note } from "../types";

const notesStore = useNotesStore();
const configStore = useUserConfigStore();

const isEditModalOpen = ref(false);
const noteToEdit = ref<Note | null>(null);

const containerLayoutClass = computed(() => {
	return configStore.currentView === "grid"
		? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
		: "flex flex-col gap-3 max-w-3xl mx-auto";
});

onMounted(async () => {
	await notesStore.fetchNotes();
	await configStore.fetchUserConfig();
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
	}
};
</script>

<template>
	<div class="space-y-6">
		<!-- Encabezado -->
		<div
			class="flex items-center justify-between pb-4 border-b border-[#d8d3c5]"
		>
			<div class="flex items-center gap-2.5">
				<div class="p-2 rounded-lg bg-[#e8e3d5] text-[#3d3b37]">
					<Archive class="w-5 h-5" />
				</div>
				<div>
					<h1
						class="font-serif font-bold text-xl sm:text-2xl text-[#3d3b37]"
					>
						Notas Archivadas
					</h1>
					<p class="text-xs text-[#8c867a]">
						{{ notesStore.archivedNotes.length }}
						{{
							notesStore.archivedNotes.length === 1
								? "nota archivada"
								: "notas archivadas"
						}}
					</p>
				</div>
			</div>
		</div>

		<!-- Estado de Carga -->
		<div
			v-if="notesStore.loading"
			class="py-16 flex flex-col items-center justify-center text-[#8c867a] gap-3"
		>
			<Loader2 class="w-8 h-8 animate-spin text-[#e06c53]" />
			<p class="text-xs">Cargando archivo...</p>
		</div>

		<!-- Estado Vacío -->
		<div
			v-else-if="notesStore.archivedNotes.length === 0"
			class="p-10 border border-dashed border-[#d8d3c5] rounded-2xl text-center bg-[#f2eee3]/40 flex flex-col items-center justify-center space-y-3"
		>
			<div
				class="w-12 h-12 rounded-full bg-[#e8e3d5] text-[#8c867a] flex items-center justify-center"
			>
				<Archive class="w-6 h-6" />
			</div>
			<div>
				<h3 class="font-serif font-semibold text-base text-[#3d3b37]">
					No hay notas archivadas
				</h3>
				<p class="text-xs text-[#8c867a] mt-1">
					Las notas que archives aparecerán aquí.
				</p>
			</div>
		</div>

		<!-- Listado de Notas Archivadas -->
		<div v-else :class="containerLayoutClass">
			<NoteCard
				v-for="note in notesStore.archivedNotes"
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
