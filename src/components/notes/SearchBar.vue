<!-- components/layout/SearchBar.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Search, Sparkles, Loader2, X } from "lucide-vue-next";
import { useNotesStore } from "../../stores/useNotesStore";
import { useAiStore } from "../../stores/useAiStore";
import { useToastStore } from "../../stores/useToastStore";
import { getErrorMessage } from "../../utils/getErrorMessage";

const route = useRoute();
const router = useRouter();
const notesStore = useNotesStore();
const aiStore = useAiStore();
const toast = useToastStore();

const searchQuery = ref("");
const isAiMode = ref(false);

let debounceTimer: ReturnType<typeof setTimeout>;

const ensureNotesRoute = () => {
	if (route.path !== "/") {
		router.push("/");
	}
};

const executeSearch = async () => {
	ensureNotesRoute();
	clearTimeout(debounceTimer);

	if (!searchQuery.value.trim()) {
		clearSearch();
		return;
	}

	if (isAiMode.value) {
		notesStore.searchQuery = "";
		try {
			await aiStore.searchNotesSemantics(searchQuery.value);
		} catch (err) {
			toast.error(
				"Error en la búsqueda semántica",
				getErrorMessage(
					err,
					"No se pudo conectar con el servicio de IA. Intenta nuevamente.",
				),
			);
		}
	} else {
		notesStore.searchQuery = searchQuery.value;
		await notesStore.searchNotes(searchQuery.value);
	}
};

const handleInput = () => {
	ensureNotesRoute();
	clearTimeout(debounceTimer);

	if (!searchQuery.value.trim()) {
		clearSearch();
		return;
	}

	debounceTimer = setTimeout(() => {
		executeSearch();
	}, 350);
};

const clearSearch = () => {
	clearTimeout(debounceTimer);
	searchQuery.value = "";
	notesStore.searchQuery = "";
	notesStore.fetchNotes();
};

const toggleAiMode = () => {
	ensureNotesRoute();
	isAiMode.value = !isAiMode.value;
	clearSearch();
};
</script>

<template>
	<div class="relative flex items-center w-full max-w-md">
		<Search
			class="w-4 h-4 text-[#8c867a] absolute left-3 pointer-events-none"
		/>

		<input
			v-model="searchQuery"
			@focus="ensureNotesRoute"
			@click="ensureNotesRoute"
			@input="handleInput"
			@keydown.enter.prevent="executeSearch"
			@keydown.esc="clearSearch"
			type="text"
			:placeholder="
				isAiMode ? 'Búsqueda semántica con IA...' : 'Buscar notas...'
			"
			class="w-full bg-[#f7f4ea] border rounded-lg pl-9 pr-16 py-1.5 text-xs text-[#3d3b37] placeholder-[#8c867a] focus:outline-none transition-all"
			:class="[
				isAiMode
					? 'border-[#e06c53] ring-1 ring-[#e06c53]/30 bg-white'
					: 'border-[#d8d3c5] focus:border-[#3d3b37]',
			]"
		/>

		<div class="absolute right-2 flex items-center gap-1">
			<Loader2
				v-if="notesStore.loading || aiStore.aiLoading"
				class="w-3.5 h-3.5 text-[#e06c53] animate-spin"
			/>

			<button
				v-else-if="searchQuery"
				@click="clearSearch"
				type="button"
				class="p-0.5 text-[#8c867a] hover:text-[#3d3b37] transition-colors"
				title="Limpiar búsqueda"
			>
				<X class="w-3.5 h-3.5" />
			</button>

			<button
				@click="toggleAiMode"
				type="button"
				class="p-1 rounded-md transition-all flex items-center justify-center"
				:class="[
					isAiMode
						? 'bg-[#e06c53] text-white shadow-xs'
						: 'text-[#8c867a] hover:bg-[#e8e3d5] hover:text-[#3d3b37]',
				]"
				:title="isAiMode ? 'Modo IA activo' : 'Activar búsqueda con IA'"
			>
				<Sparkles class="w-3.5 h-3.5" />
			</button>
		</div>
	</div>
</template>
