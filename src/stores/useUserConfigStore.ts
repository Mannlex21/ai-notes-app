// stores/useUserConfigStore.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { sql } from "../lib/neon";
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

	// Prompts restantes asegurando conversión numérica estricta
	const remainingPrompts = computed(() => {
		const limit = Number(dailyPromptLimit.value) || 0;
		const used = Number(promptsUsedToday.value) || 0;
		const remaining = limit - used;
		return remaining > 0 ? remaining : 0;
	});

	// Verificar si se alcanzó el límite diario
	const isLimitReached = computed(() => {
		const limit = Number(dailyPromptLimit.value) || 0;
		const used = Number(promptsUsedToday.value) || 0;
		return used >= limit;
	});

	// Cargar configuración de usuario
	const fetchUserConfig = async () => {
		const userId = getUserId();
		if (!userId) return;

		loading.value = true;
		error.value = null;

		try {
			const rows = await sql`
      SELECT default_view, ai_provider, daily_prompt_limit, ai_temperature, auto_tagging, prompts_used_today, last_prompt_date
      FROM user_settings
      WHERE user_id = ${userId}
      LIMIT 1;
    `;

			if (rows.length > 0) {
				const config = rows[0];
				if (config.default_view)
					currentView.value = config.default_view as ViewMode;
				if (config.ai_provider) aiProvider.value = config.ai_provider;
				if (config.daily_prompt_limit !== undefined)
					dailyPromptLimit.value = Number(config.daily_prompt_limit);
				if (config.ai_temperature !== undefined)
					aiTemperature.value = Number(config.ai_temperature);
				if (config.auto_tagging !== undefined)
					autoTagging.value = Boolean(config.auto_tagging);

				// Resetear contador si el último prompt fue en un día anterior
				const todayStr = new Date().toISOString().split("T")[0];
				const lastDateStr = config.last_prompt_date
					? new Date(config.last_prompt_date)
							.toISOString()
							.split("T")[0]
					: null;

				if (lastDateStr && lastDateStr !== todayStr) {
					promptsUsedToday.value = 0;
					await sql`
          UPDATE user_settings 
          SET prompts_used_today = 0, last_prompt_date = CURRENT_DATE, updated_at = NOW()
          WHERE user_id = ${userId};
        `;
				} else {
					promptsUsedToday.value = Number(
						config.prompts_used_today || 0,
					);
				}
			} else {
				// Si el usuario no tiene registro en user_settings, lo creamos
				await sql`
        INSERT INTO user_settings (user_id, default_view, ai_provider, daily_prompt_limit, prompts_used_today, last_prompt_date)
        VALUES (${userId}, 'grid', 'gemini', 20, 0, CURRENT_DATE)
        ON CONFLICT (user_id) DO NOTHING;
      `;
			}
		} catch (err) {
			console.error("Error al obtener la configuración:", err);
			error.value = "No se pudo cargar la configuración de usuario.";
		} finally {
			loading.value = false;
		}
	};

	// Incrementar contador de uso de IA
	const incrementPromptUsage = async (): Promise<boolean> => {
		const userId = getUserId();
		if (!userId) return false;

		if (isLimitReached.value) {
			return false;
		}

		try {
			promptsUsedToday.value = Number(promptsUsedToday.value) + 1;

			await sql`
      INSERT INTO user_settings (user_id, prompts_used_today, last_prompt_date, updated_at)
      VALUES (${userId}, 1, CURRENT_DATE, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        prompts_used_today = user_settings.prompts_used_today + 1,
        last_prompt_date = CURRENT_DATE,
        updated_at = NOW();
    `;
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
	// En stores/useUserConfigStore.ts

	// Guardar los ajustes modificables por el usuario (temperatura y auto-tagging)
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

			await sql`
      INSERT INTO user_settings (user_id, ai_temperature, auto_tagging, updated_at)
      VALUES (
        ${userId}, 
        ${aiTemperature.value}, 
        ${autoTagging.value}, 
        NOW()
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        ai_temperature = EXCLUDED.ai_temperature,
        auto_tagging = EXCLUDED.auto_tagging,
        updated_at = NOW();
    `;

			return true;
		} catch (err) {
			console.error("Error al guardar la configuración de IA:", err);
			error.value = "No se pudieron guardar las preferencias.";
			return false;
		} finally {
			loading.value = false;
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
	};
});
