import { ref } from "vue";
import { defineStore } from "pinia";
import { useAuthStore } from "./useAuthStore";
import { useUserConfigStore } from "./useUserConfigStore";
import type { Note } from "../types";
import { useNotesStore } from "./useNotesStore";

export const useAiStore = defineStore("ai", () => {
	const notes = ref<Note[]>([]);
	const searchQuery = ref("");
	const archivedNotes = ref<Note[]>([]);
	const loading = ref(false);
	const aiLoading = ref(false);
	const error = ref<string | null>(null);

	const authStore = useAuthStore();
	const configStore = useUserConfigStore();
	const noteStore = useNotesStore();

	const getUserId = () => authStore.user?.id;

	// Helper para validar y consumir un prompt antes de llamar a la API
	const checkAndConsumePrompt = async (): Promise<boolean> => {
		if (configStore.isLimitReached) {
			error.value = "Has alcanzado tu límite diario de peticiones de IA.";
			return false;
		}
		return await configStore.incrementPromptUsage();
	};

	// Helper centralizado para peticiones a las API Routes (/api)
	const callAiApi = async (action: string, payload: Record<string, any>) => {
		const res = await fetch(`/api/ai/${action}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			const errData = await res.json().catch(() => ({}));
			throw new Error(
				errData.error || `Error en la llamada a /api/ai/${action}`,
			);
		}

		return await res.json();
	};

	// ----------------------------------------------------
	// FUNCIONALIDADES DE IA (BAJO DEMANDA)
	// ----------------------------------------------------

	// FEAT 1: Autocategorización y Etiquetas
	const suggestTagsForText = async (
		text: string,
	): Promise<{ tags: string[]; color?: string }> => {
		if (!text.trim()) return { tags: [] };
		if (configStore.isLimitReached) {
			error.value = "Límite diario alcanzado";
			throw new Error("Límite diario de peticiones de IA alcanzado");
		}

		aiLoading.value = true;
		error.value = null;

		try {
			const canProceed = await checkAndConsumePrompt();
			if (!canProceed)
				throw new Error("No fue posible consumir la petición de IA");

			const data = await callAiApi("suggest-tags", {
				text,
				temperature: configStore.aiTemperature,
			});

			return {
				tags: data.tags || [],
				color: data.color || "#f7f4ea",
			};
		} catch (err: any) {
			console.error("Error al generar etiquetas sugeridas:", err);
			error.value =
				err?.message || "Error al generar etiquetas sugeridas";
			throw err;
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 2: Generación / Expansión de Texto
	const expandText = async (promptText: string): Promise<string> => {
		if (!promptText.trim()) return "";
		if (configStore.isLimitReached) {
			error.value = "Límite diario alcanzado";
			throw new Error("Límite diario de peticiones de IA alcanzado");
		}

		aiLoading.value = true;
		error.value = null;

		try {
			const canProceed = await checkAndConsumePrompt();
			if (!canProceed)
				throw new Error("No fue posible consumir la petición de IA");

			const data = await callAiApi("expand-text", {
				promptText,
				temperature: configStore.aiTemperature,
			});

			return data.expandedText || promptText;
		} catch (err: any) {
			console.error("Error al expandir borrador:", err);
			error.value = err?.message || "Error al expandir borrador";
			throw err;
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 3: Mejora de Estilo y Gramática
	const refineStyleOptions = async (
		currentText: string,
		tone: "formal" | "conciso" | "casual",
	): Promise<string[]> => {
		if (!currentText.trim()) return [];
		if (configStore.isLimitReached) {
			error.value = "Límite diario alcanzado";
			throw new Error("Límite diario de peticiones de IA alcanzado");
		}

		aiLoading.value = true;
		error.value = null;

		try {
			const canProceed = await checkAndConsumePrompt();
			if (!canProceed)
				throw new Error("No fue posible consumir la petición de IA");

			const data = await callAiApi("refine-style", {
				currentText,
				tone,
				temperature: configStore.aiTemperature,
			});

			return data.options || [currentText];
		} catch (err: any) {
			console.error("Error al generar opciones de estilo:", err);
			error.value = err?.message || "Error al generar opciones de estilo";
			throw err;
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 4: Smart Search / RAG (Búsqueda Semántica)
	const searchNotesSemantics = async (query: string) => {
		if (!query.trim()) return await noteStore.fetchNotes();

		loading.value = true;
		error.value = null;

		try {
			const filteredRows = await callAiApi("search-semantic", {
				query,
				userId: getUserId(),
			});

			if (Array.isArray(filteredRows) && filteredRows.length > 0) {
				noteStore.notes = filteredRows
					.map((n: any) => ({
						...n,
						tags: n.tags || [],
						color: n.color || "#f7f4ea",
					}))
					.filter((n) => !n.is_archived);
			} else {
				noteStore.notes = [];
			}
		} catch (err: any) {
			console.error("Error en búsqueda semántica:", err);
			error.value = err?.message || "Error en búsqueda semántica";
			await noteStore.fetchNotes();
			throw err;
		} finally {
			loading.value = false;
		}
	};

	// FEAT 5: Resumir Puntos Clave
	const summarizeDraft = async (currentText: string): Promise<string> => {
		if (!currentText.trim()) return "";
		if (configStore.isLimitReached) {
			error.value = "Límite diario alcanzado";
			throw new Error("Límite diario de peticiones de IA alcanzado");
		}

		aiLoading.value = true;
		error.value = null;

		try {
			const canProceed = await checkAndConsumePrompt();
			if (!canProceed)
				throw new Error("No fue posible consumir la petición de IA");

			const data = await callAiApi("summarize", {
				currentText,
				temperature: configStore.aiTemperature,
			});

			return data.summary || currentText;
		} catch (err: any) {
			console.error("Error al resumir borrador:", err);
			error.value = err?.message || "Error al resumir borrador";
			throw err;
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 6: Extraer Tareas para Checklist
	const extractActionItems = async (text: string): Promise<string[]> => {
		if (!text.trim()) return [];
		if (configStore.isLimitReached) {
			error.value = "Límite diario alcanzado";
			throw new Error("Límite diario de peticiones de IA alcanzado");
		}

		aiLoading.value = true;
		error.value = null;

		try {
			const canProceed = await checkAndConsumePrompt();
			if (!canProceed)
				throw new Error("No fue posible consumir la petición de IA");

			const data = await callAiApi("extract-tasks", {
				text,
				temperature: configStore.aiTemperature,
			});

			return data.tasks || [];
		} catch (err: any) {
			console.error("Error al extraer tareas con IA:", err);
			error.value = err?.message || "Error al extraer tareas con IA";
			throw err;
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 7: Traductor Integrado
	const translateText = async (
		text: string,
		targetLanguage?: string,
	): Promise<string> => {
		if (!text.trim()) return "";
		if (configStore.isLimitReached) {
			error.value = "Límite diario alcanzado";
			throw new Error("Límite diario de peticiones de IA alcanzado");
		}

		aiLoading.value = true;
		error.value = null;

		try {
			const canProceed = await checkAndConsumePrompt();
			if (!canProceed)
				throw new Error("No fue posible consumir la petición de IA");

			const data = await callAiApi("translate", {
				text,
				targetLanguage,
				temperature: configStore.aiTemperature,
			});

			return data.translation || text;
		} catch (err: any) {
			console.error("Error al traducir texto con IA:", err);
			error.value = err?.message || "Error al traducir texto con IA";
			throw err;
		} finally {
			aiLoading.value = false;
		}
	};

	// FEAT 8: Auto-Título Inteligente
	const generateTitle = async (content: string): Promise<string> => {
		if (!content.trim()) return "";
		if (configStore.isLimitReached) {
			error.value = "Límite diario alcanzado";
			throw new Error("Límite diario de peticiones de IA alcanzado");
		}

		aiLoading.value = true;
		error.value = null;

		try {
			const canProceed = await checkAndConsumePrompt();
			if (!canProceed)
				throw new Error("No fue posible consumir la petición de IA");

			const data = await callAiApi("generate-title", {
				content,
				temperature: configStore.aiTemperature,
			});

			return data.title || "";
		} catch (err: any) {
			console.error("Error al generar título con IA:", err);
			error.value = err?.message || "Error al generar título con IA";
			throw err;
		} finally {
			aiLoading.value = false;
		}
	};

	return {
		notes,
		archivedNotes,
		loading,
		aiLoading,
		error,
		suggestTagsForText,
		expandText,
		refineStyleOptions,
		searchNotesSemantics,
		summarizeDraft,
		extractActionItems,
		translateText,
		generateTitle,
		searchQuery,
	};
});
