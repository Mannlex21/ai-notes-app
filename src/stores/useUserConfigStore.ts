// stores/useUserConfigStore.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { sql } from "../lib/neon";
import { useAuthStore } from "./useAuthStore";

export type ViewMode = "grid" | "list";

export interface UserSettings {
	user_id: string;
	theme?: string;
	default_view: ViewMode;
	ai_provider?: string;
	daily_prompt_limit?: number;
	ai_temperature?: number;
	auto_tagging?: boolean;
	created_at?: string;
	updated_at?: string;
}

export const useUserConfigStore = defineStore("userConfig", () => {
	const currentView = ref<ViewMode>("grid");
	const loading = ref(false);
	const error = ref<string | null>(null);

	const authStore = useAuthStore();
	const getUserId = () => authStore.user?.id;

	// Cargar configuración desde user_settings
	const fetchUserConfig = async () => {
		const userId = getUserId();
		if (!userId) return;

		loading.value = true;
		error.value = null;

		try {
			const rows = await sql`
				SELECT user_id, theme, default_view, ai_provider, daily_prompt_limit, ai_temperature, auto_tagging
				FROM user_settings
				WHERE user_id = ${userId}
				LIMIT 1;
			`;

			if (rows.length > 0 && rows[0].default_view) {
				currentView.value = rows[0].default_view as ViewMode;
			}
		} catch (err) {
			console.error("Error al obtener la configuración:", err);
			error.value = "No se pudo cargar la configuración de usuario.";
		} finally {
			loading.value = false;
		}
	};

	// Alternar vista y hacer UPSERT en user_settings
	const toggleView = async () => {
		const userId = getUserId();
		if (!userId) return;

		const nextView: ViewMode =
			currentView.value === "grid" ? "list" : "grid";
		const previousView = currentView.value;

		// Actualización optimista en la UI
		currentView.value = nextView;

		try {
			await sql`
				INSERT INTO user_settings (user_id, default_view, updated_at)
				VALUES (${userId}, ${nextView}, NOW())
				ON CONFLICT (user_id) 
				DO UPDATE SET 
					default_view = ${nextView},
					updated_at = NOW();
			`;
		} catch (err) {
			console.error("Error al actualizar la vista en Neon:", err);
			currentView.value = previousView; // Revertir si falla
			error.value = "No se pudo guardar la preferencia de vista.";
		}
	};

	return {
		currentView,
		loading,
		error,
		fetchUserConfig,
		toggleView,
	};
});
