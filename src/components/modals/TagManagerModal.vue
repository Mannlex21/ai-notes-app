<!-- components/modals/TagManagerModal.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { X, Plus, Tag, Check } from "lucide-vue-next";

defineProps<{
	isOpen: boolean;
	tags: string[];
}>();

const emit = defineEmits(["close", "add-tag", "remove-tag"]);

const newTagInput = ref("");

const handleAdd = () => {
	if (!newTagInput.value.trim()) return;
	const formattedTag = newTagInput.value
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "-");
	emit("add-tag", formattedTag);
	newTagInput.value = "";
};
</script>

<template>
	<div
		v-if="isOpen"
		class="fixed inset-0 z-50 bg-[#2a2926]/15 backdrop-blur-sm flex items-center justify-center p-4"
	>
		<div
			class="bg-[#f7f4ea] border border-[#d8d3c5] rounded-xl p-5 shadow-2xl max-w-sm w-full space-y-4"
		>
			<!-- Encabezado -->
			<div
				class="flex items-center justify-between border-b border-[#d8d3c5] pb-3"
			>
				<div
					class="flex items-center gap-2 text-[#3d3b37] font-semibold text-sm"
				>
					<Tag class="w-4 h-4 text-[#e06c53]" /> Gestionar Categorías
				</div>
				<button
					@click="emit('close')"
					class="p-1 rounded-md text-[#8c867a] hover:text-[#3d3b37] hover:bg-[#e8e3d5] transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Agregar manual -->
			<div class="flex gap-2">
				<input
					v-model="newTagInput"
					@keyup.enter="handleAdd"
					type="text"
					placeholder="Nueva categoría..."
					class="flex-1 bg-[#ffffff] border border-[#d8d3c5] rounded-lg px-3 py-1.5 text-xs text-[#3d3b37] focus:outline-none focus:border-[#e06c53]"
				/>
				<button
					@click="handleAdd"
					:disabled="!newTagInput.trim()"
					class="p-1.5 bg-[#3d3b37] text-[#f7f4ea] rounded-lg hover:bg-[#2a2926] disabled:opacity-40 transition-colors"
				>
					<Plus class="w-4 h-4" />
				</button>
			</div>

			<!-- Lista de Chips -->
			<div class="space-y-1.5">
				<span class="text-[10px] font-mono text-[#8c867a] uppercase"
					>Categorías activas</span
				>
				<div
					class="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-[#f2eee3] border border-[#d8d3c5] rounded-lg max-h-36 overflow-y-auto"
				>
					<span
						v-for="tag in tags"
						:key="tag"
						class="text-xs px-2.5 py-1 rounded-full bg-[#ffffff] text-[#3d3b37] border border-[#d8d3c5] flex items-center gap-1.5 font-medium"
					>
						#{{ tag }}
						<button
							@click="emit('remove-tag', tag)"
							class="text-[#8c867a] hover:text-[#e06c53] transition-colors"
						>
							<X class="w-3 h-3" />
						</button>
					</span>
					<span
						v-if="tags.length === 0"
						class="text-xs text-[#8c867a] italic self-center"
					>
						Sin categorías asignadas.
					</span>
				</div>
			</div>

			<!-- Footer Modal -->
			<div class="pt-2 border-t border-[#d8d3c5] flex justify-end">
				<button
					@click="emit('close')"
					class="px-4 py-1.5 bg-[#3d3b37] text-[#f7f4ea] text-xs font-medium rounded-lg hover:bg-[#2a2926] transition-colors flex items-center gap-1"
				>
					<Check class="w-3.5 h-3.5" /> Listo
				</button>
			</div>
		</div>
	</div>
</template>
