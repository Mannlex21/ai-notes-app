<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Search, Sparkles, Loader2, X } from "lucide-vue-next";
import { useNotesStore } from "../../stores/useNotesStore";
import { useAisStore } from "../../stores/useAiStore";

const route = useRoute();
const router = useRouter();
const notesStore = useNotesStore();
const aiStore = useAisStore();

const searchQuery = ref("");
const isAiMode = ref(false);

let debounceTimer: ReturnType<typeof setTimeout>;

// Redirigir a las notas si el usuario interactúa con la búsqueda fuera de la página principal
const ensureNotesRoute = () => {
	if (route.path !== "/") {
		router.push("/");
	}
};

// Ejecutar búsqueda según el modo activo
const executeSearch = () => {
	ensureNotesRoute();
	clearTimeout(debounceTimer);

	if (!searchQuery.value.trim()) {
		clearSearch();
		return;
	}

	if (isAiMode.value) {
		// Modo IA: Búsqueda Semántica en Neon pgvector
		notesStore.searchQuery = ""; // Limpiar filtro manual
		aiStore.searchNotesSemantics(searchQuery.value);
	} else {
		// Modo Manual: Actualizar el query en el store para el filtro computado
		notesStore.searchQuery = searchQuery.value;
	}
};

// Búsqueda mientras escribe (Debounce)
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

// Limpiar la búsqueda y restaurar TODAS las notas
const clearSearch = () => {
	clearTimeout(debounceTimer);
	searchQuery.value = "";
	notesStore.searchQuery = "";
	notesStore.fetchNotes();
};

// Alternar entre modo Manual e IA
const toggleAiMode = () => {
	ensureNotesRoute();
	isAiMode.value = !isAiMode.value;
	clearSearch();
};
</script>

<template>
	<div class="relative flex items-center w-full max-w-md">
		<!-- Icono Búsqueda -->
		<Search
			class="w-4 h-4 text-[#8c867a] absolute left-3 pointer-events-none"
		/>

		<!-- Input Principal -->
		<input
			v-model="searchQuery"
			@focus="ensureNotesRoute"
			@click="ensureNotesRoute"
			@input="handleInput"
			@keydown.enter.prevent="executeSearch"
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

		<!-- Controles -->
		<div class="absolute right-2 flex items-center gap-1">
			<Loader2
				v-if="notesStore.loading"
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
