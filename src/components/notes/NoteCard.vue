<!-- components/notes/NoteCard.vue -->
<script setup lang="ts">
import {
	Sparkles,
	Pin,
	Archive,
	ArchiveRestore,
	Trash2,
} from "lucide-vue-next";
import { useNotesStore } from "../../stores/useNotesStore";
import type { Note } from "../../types";

const props = defineProps<{ note: Note }>();

const emit = defineEmits<{
	(e: "click-card", note: Note): void;
	(e: "delete", id: string): void;
	(e: "toggle-pin", id: string): void;
	(e: "archive", id: string): void;
}>();

const store = useNotesStore();

const handleAutoTag = async () => {
	if (!props.note.content && !props.note.title) return;

	const fullText = `${props.note.title || ""} ${props.note.content || ""}`;
	const result = await store.suggestTagsForText(fullText);

	if (result.tags || result.color) {
		await store.updateNote(props.note.id, {
			title: props.note.title,
			content: props.note.content,
			tags: Array.from(
				new Set([...(props.note.tags || []), ...(result.tags || [])]),
			),
			color: result.color || props.note.color,
		});
	}
};
</script>

<template>
	<div
		@click="emit('click-card', note)"
		class="group relative border border-[#d8d3c5] rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
		:style="{ backgroundColor: note.color || '#f2eee3' }"
	>
		<!-- Botón Fijar (Pin) -->
		<button
			@click.stop="store.togglePin(note.id)"
			class="absolute top-3 right-3 p-1.5 rounded-lg text-[#8c867a] hover:text-[#2a2926] hover:bg-[#2a2926]/10 transition-colors"
			:class="{ 'text-[#e06c53] fill-[#e06c53]': note.is_pinned }"
			:title="note.is_pinned ? 'Desfijar nota' : 'Fijar nota'"
		>
			<Pin class="w-4 h-4" :class="{ 'rotate-45': note.is_pinned }" />
		</button>

		<!-- Contenido de la nota -->
		<div class="pr-6">
			<h3 class="font-semibold text-[#2a2926] mb-1">
				{{ note.title || "Sin título" }}
			</h3>
			<div
				class="text-xs text-[#59554d] leading-relaxed line-clamp-4 prose prose-sm max-w-none"
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

		<!-- Footer de la Tarjeta con Acciones CRUD -->
		<div
			class="mt-3 pt-2 border-t border-[#2a2926]/10 flex items-center justify-between text-xs text-[#8c867a]"
		>
			<!-- Acciones con IA -->
			<button
				@click.stop="handleAutoTag"
				:disabled="store.aiLoading"
				class="flex items-center gap-1 text-[11px] hover:text-[#e06c53] transition-colors disabled:opacity-50"
				title="Generar etiquetas y color con IA"
			>
				<Sparkles class="w-3.5 h-3.5 text-[#e06c53]" />
				<span>Categorizar</span>
			</button>

			<!-- Controles CRUD / Estado -->
			<div
				class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
			>
				<!-- Archivar / Desarchivar -->
				<button
					@click.stop="store.toggleArchiveNote(note.id)"
					class="p-1 hover:text-[#2a2926] hover:bg-[#2a2926]/10 rounded transition-colors"
					:title="note.is_archived ? 'Desarchivar' : 'Archivar'"
				>
					<ArchiveRestore
						v-if="note.is_archived"
						class="w-3.5 h-3.5"
					/>
					<Archive v-else class="w-3.5 h-3.5" />
				</button>

				<!-- Eliminar -->
				<button
					@click.stop="emit('delete', note.id)"
					class="p-1 hover:text-[#c94a29] hover:bg-[#c94a29]/10 rounded transition-colors"
					title="Eliminar nota"
				>
					<Trash2 class="w-3.5 h-3.5" />
				</button>
			</div>
		</div>
	</div>
</template>
