<script setup lang="ts">
import { ref, computed } from "vue";
import { X, Globe, Check, Search } from "lucide-vue-next";
import ISO6391 from "iso-639-1";

defineProps<{
	isOpen: boolean;
	isLoading?: boolean;
}>();

const emit = defineEmits(["close", "translate"]);

const searchQuery = ref("");
const selectedLanguage = ref("English");

// Generar la lista completa de idiomas desde el paquete iso-639-1
const allLanguages = ISO6391.getAllNames().map((name) => {
	const code = ISO6391.getCode(name);
	const nativeName = ISO6391.getNativeName(code);
	return {
		code,
		name, // Nombre en inglés (ej: Spanish)
		nativeName, // Nombre nativo (ej: Español)
	};
});

// Filtrar idiomas según la búsqueda del usuario
const filteredLanguages = computed(() => {
	if (!searchQuery.value.trim()) return allLanguages;
	const q = searchQuery.value.toLowerCase();
	return allLanguages.filter(
		(l) =>
			l.name.toLowerCase().includes(q) ||
			l.nativeName.toLowerCase().includes(q) ||
			l.code.toLowerCase().includes(q),
	);
});

const handleConfirm = () => {
	emit("translate", selectedLanguage.value);
};
</script>

<template>
	<div
		v-if="isOpen"
		class="fixed inset-0 z-50 bg-[#2a2926]/20 backdrop-blur-sm flex items-center justify-center p-4"
	>
		<div
			class="bg-[#f7f4ea] border border-[#d8d3c5] rounded-xl p-5 shadow-2xl w-full max-w-sm space-y-4"
		>
			<!-- Header -->
			<div
				class="flex items-center justify-between border-b border-[#d8d3c5] pb-3"
			>
				<div
					class="flex items-center gap-2 text-[#3d3b37] font-medium text-sm"
				>
					<Globe class="w-4 h-4 text-[#e06c53]" />
					<span>Seleccionar idioma</span>
				</div>
				<button
					@click="emit('close')"
					class="p-1 text-[#8c867a] hover:text-[#3d3b37] hover:bg-[#e8e3d5] rounded-md transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Buscador de idiomas -->
			<div class="relative">
				<Search
					class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c867a]"
				/>
				<input
					v-model="searchQuery"
					type="text"
					placeholder="Buscar idioma..."
					class="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#d8d3c5] rounded-lg text-[#3d3b37] focus:outline-none focus:border-[#e06c53]"
				/>
			</div>

			<!-- Lista de idiomas filtrada -->
			<div class="space-y-1 max-h-52 overflow-y-auto pr-1">
				<button
					v-for="lang in filteredLanguages"
					:key="lang.code"
					@click="selectedLanguage = lang.name"
					class="w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors"
					:class="[
						selectedLanguage === lang.name
							? 'bg-[#e8e3d5] text-[#3d3b37]'
							: 'text-[#8c867a] hover:bg-[#e8e3d5]/50 hover:text-[#3d3b37]',
					]"
				>
					<div class="flex items-center gap-2">
						<span class="font-semibold capitalize text-[#3d3b37]">{{
							lang.nativeName
						}}</span>
						<span class="text-[10px] text-[#8c867a]"
							>({{ lang.name }})</span
						>
					</div>
					<Check
						v-if="selectedLanguage === lang.name"
						class="w-3.5 h-3.5 text-[#e06c53]"
					/>
				</button>

				<div
					v-if="filteredLanguages.length === 0"
					class="text-center py-4 text-xs text-[#8c867a]"
				>
					No se encontraron idiomas.
				</div>
			</div>

			<!-- Footer -->
			<div
				class="flex items-center justify-end gap-2 pt-2 border-t border-[#d8d3c5]"
			>
				<button
					@click="emit('close')"
					class="px-3 py-1.5 text-xs text-[#8c867a] hover:text-[#3d3b37] transition-colors"
				>
					Cancelar
				</button>
				<button
					@click="handleConfirm"
					:disabled="isLoading"
					class="px-4 py-1.5 bg-[#3d3b37] text-[#f7f4ea] text-xs font-medium rounded-lg hover:bg-[#2a2926] transition-colors disabled:opacity-50"
				>
					{{ isLoading ? "Traduciendo..." : "Traducir" }}
				</button>
			</div>
		</div>
	</div>
</template>
