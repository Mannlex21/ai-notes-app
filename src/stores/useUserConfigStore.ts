// stores/useUserConfigStore.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useAuthStore } from "./useAuthStore";

export type ViewMode = "grid" | "list";

export const useUserConfigStore = defineStore("userConfig", () => {
	const currentView = ref<ViewMode>("grid");
	const aiProvider = ref("gemini");
	const dailyPromptLimit = ref<number>(20);
	const aiTemperature = ref<number>(0.7);
	const autoTagging = ref<boolean>(true);
	const promptsUsedToday = ref<number>(0);

	const loading = ref(false);
	const error = ref<string | null>(null);

	const authStore = useAuthStore();
	const getUserId = () => authStore.user?.id;

	const remainingPrompts = computed(() => {
		const limit = Number(dailyPromptLimit.value) || 0;
		const used = Number(promptsUsedToday.value) || 0;
		const remaining = limit - used;
		return remaining > 0 ? remaining : 0;
	});

	const isLimitReached = computed(() => {
		const limit = Number(dailyPromptLimit.value) || 0;
		const used = Number(promptsUsedToday.value) || 0;
		return used >= limit;
	});

	const fetchUserConfig = async () => {
		const userId = getUserId();
		if (!userId) return;

		loading.value = true;
		error.value = null;

		try {
			const res = await fetch(`/api/settings/user?userId=${userId}`);
			const data = await res.json();

			if (!res.ok) throw new Error(data.error);

			const config = data.config;
			if (config.default_view)
				currentView.value = config.default_view as ViewMode;
			if (config.ai_provider) aiProvider.value = config.ai_provider;
			if (config.daily_prompt_limit !== undefined)
				dailyPromptLimit.value = Number(config.daily_prompt_limit);
			if (config.ai_temperature !== undefined)
				aiTemperature.value = Number(config.ai_temperature);
			if (config.auto_tagging !== undefined)
				autoTagging.value = Boolean(config.auto_tagging);
			promptsUsedToday.value = Number(config.prompts_used_today || 0);
		} catch (err: any) {
			console.error("Error al obtener la configuración:", err);
			error.value = "No se pudo cargar la configuración de usuario.";
		} finally {
			loading.value = false;
		}
	};

	const incrementPromptUsage = async (): Promise<boolean> => {
		const userId = getUserId();
		if (!userId || isLimitReached.value) return false;

		try {
			promptsUsedToday.value = Number(promptsUsedToday.value) + 1;

			const res = await fetch("/api/settings/increment-prompt", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId }),
			});

			if (!res.ok) throw new Error("Error en servidor");
			return true;
		} catch (err) {
			console.error("Error incrementando uso de prompts:", err);
			promptsUsedToday.value = Math.max(
				0,
				Number(promptsUsedToday.value) - 1,
			);
			return false;
		}
	};

	const saveAiSettings = async (
		temperature: number,
		autoTag: boolean,
	): Promise<boolean> => {
		const userId = getUserId();
		if (!userId) return false;

		loading.value = true;
		error.value = null;
		try {
			aiTemperature.value = Number(temperature);
			autoTagging.value = Boolean(autoTag);

			const res = await fetch("/api/settings/user", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId,
					aiTemperature: aiTemperature.value,
					autoTagging: autoTagging.value,
				}),
			});

			if (!res.ok) throw new Error("Error guardando ajustes de IA");
			return true;
		} catch (err: any) {
			console.error("Error al guardar la configuración de IA:", err);
			error.value = "No se pudieron guardar las preferencias.";
			return false;
		} finally {
			loading.value = false;
		}
	};

	const toggleView = async () => {
		const userId = getUserId();
		if (!userId) return;

		const nextView: ViewMode =
			currentView.value === "grid" ? "list" : "grid";
		const previousView = currentView.value;

		currentView.value = nextView;

		try {
			const res = await fetch("/api/settings/user", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId,
					defaultView: nextView,
				}),
			});

			if (!res.ok) throw new Error("Error al guardar vista");
		} catch (err) {
			console.error("Error al actualizar la vista:", err);
			currentView.value = previousView;
			error.value = "No se pudo guardar la preferencia de vista.";
		}
	};

	return {
		currentView,
		aiProvider,
		dailyPromptLimit,
		aiTemperature,
		autoTagging,
		promptsUsedToday,
		remainingPrompts,
		isLimitReached,
		loading,
		error,
		fetchUserConfig,
		incrementPromptUsage,
		saveAiSettings,
		toggleView,
	};
});
