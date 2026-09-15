<!-- components/notes/NoteCard.vue -->
<script setup lang="ts">
import { Tag, Sparkles } from "lucide-vue-next";
import { useNotesStore } from "../../stores/useNotesStore";
import type { Note } from "../../types";

const props = defineProps<{ note: Note }>();
const store = useNotesStore();

const handleAutoTag = async () => {
	await store.suggestTagsForText(props.note.id);
};
</script>

<template>
	<div
		class="p-4 rounded-xl border border-[#d8d3c5] transition-all flex flex-col justify-between"
		:style="{ backgroundColor: note.color || '#f7f4ea' }"
	>
		<!-- Contenido de la nota -->
		<div>
			<h3 class="font-semibold text-[#2a2926] mb-1">
				{{ note.title || "Sin título" }}
			</h3>
			<div
				class="text-xs text-[#59554d] leading-relaxed line-clamp-4"
				v-html="note.content"
			></div>
		</div>

		<!-- Badges de Etiquetas -->
		<div
			v-if="note.tags && note.tags.length > 0"
			class="flex flex-wrap gap-1 mt-3"
		>
			<span
				v-for="tag in note.tags"
				:key="tag"
				class="text-[10px] px-2 py-0.5 rounded-full bg-[#2a2926]/5 text-[#3d3b37] border border-[#2a2926]/10 font-medium"
			>
				#{{ tag }}
			</span>
		</div>

		<!-- Footer de la Tarjeta -->
		<div
			class="mt-3 pt-2 border-t border-[#2a2926]/10 flex items-center justify-between text-xs text-[#8c867a]"
		>
			<button
				@click.stop="handleAutoTag"
				:disabled="store.aiLoading"
				class="flex items-center gap-1 text-[11px] hover:text-[#e06c53] transition-colors disabled:opacity-50"
				title="Generar etiquetas y color con IA"
			>
				<Sparkles class="w-3.5 h-3.5 text-[#e06c53]" />
				<span>Categorizar</span>
			</button>
		</div>
	</div>
</template>
