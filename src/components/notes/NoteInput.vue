<!-- components/notes/NoteInput.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { CheckSquare } from "lucide-vue-next";
import NoteModal from "./NoteModal.vue";

const emit = defineEmits(["save-note"]);
const isModalOpen = ref(false);

const openModal = () => {
	isModalOpen.value = true;
};

const handleSaveNote = (payload: any) => {
	emit("save-note", payload);
};
</script>

<template>
	<div class="max-w-2xl mx-auto mb-8">
		<!-- Trigger Bar -->
		<div
			class="bg-[#f2eee3] border border-[#d8d3c5] rounded-xl p-4 shadow-sm hover:border-[#8c867a] cursor-pointer transition-all duration-200 flex items-center justify-between"
			@click="openModal"
		>
			<span class="text-[#8c867a] text-sm font-medium"
				>Crear una nota...</span
			>
			<button
				@click.stop="openModal"
				class="p-1.5 hover:text-[#3d3b37] hover:bg-[#e8e3d5] rounded-md transition-colors text-[#8c867a]"
				title="Lista de verificación"
			>
				<CheckSquare class="w-4 h-4" />
			</button>
		</div>

		<!-- Modal de Creación -->
		<NoteModal
			:is-open="isModalOpen"
			@close="isModalOpen = false"
			@save="handleSaveNote"
		/>
	</div>
</template>
