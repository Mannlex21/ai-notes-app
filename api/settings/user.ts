import { sql } from "../_lib/neon.js";

interface UpdateUserSettingsPayload {
	userId?: string;
	fullName?: string;
	aiTemperature?: number;
	autoTagging?: boolean;
	defaultView?: "grid" | "list";
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");

		if (!userId) {
			return Response.json(
				{ error: "Se requiere el ID de usuario." },
				{ status: 400 },
			);
		}

		const rows = await sql`
			SELECT default_view, ai_provider, daily_prompt_limit, ai_temperature, auto_tagging, prompts_used_today, last_prompt_date
			FROM user_settings
			WHERE user_id = ${userId}
			LIMIT 1;
		`;

		if (rows.length === 0) {
			// Si no existe la configuración, la creamos por defecto
			await sql`
				INSERT INTO user_settings (user_id, default_view, ai_provider, daily_prompt_limit, prompts_used_today, last_prompt_date)
				VALUES (${userId}, 'grid', 'gemini', 20, 0, CURRENT_DATE)
				ON CONFLICT (user_id) DO NOTHING;
			`;

			return Response.json({
				config: {
					default_view: "grid",
					ai_provider: "gemini",
					daily_prompt_limit: 20,
					ai_temperature: 0.7,
					auto_tagging: true,
					prompts_used_today: 0,
					last_prompt_date: new Date().toISOString().split("T")[0],
				},
			});
		}

		const config = rows[0];

		// Verificar si es necesario resetear el contador diario
		const todayStr = new Date().toISOString().split("T")[0];
		const lastDateStr = config.last_prompt_date
			? new Date(config.last_prompt_date).toISOString().split("T")[0]
			: null;

		if (lastDateStr && lastDateStr !== todayStr) {
			config.prompts_used_today = 0;
			await sql`
				UPDATE user_settings 
				SET prompts_used_today = 0, last_prompt_date = CURRENT_DATE, updated_at = NOW()
				WHERE user_id = ${userId};
			`;
		}

		return Response.json({ config });
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}

export async function PUT(request: Request) {
	try {
		const body = (await request.json()) as UpdateUserSettingsPayload;
		const { userId, fullName, aiTemperature, autoTagging, defaultView } =
			body;

		if (!userId) {
			return Response.json(
				{ error: "Se requiere el ID de usuario." },
				{ status: 400 },
			);
		}

		// Actualizar nombre en la tabla users si se proporciona
		if (fullName !== undefined) {
			await sql`
				UPDATE users 
				SET full_name = ${fullName}, updated_at = NOW()
				WHERE id = ${userId};
			`;
		}

		// Actualizar preferencias en user_settings
		if (
			aiTemperature !== undefined ||
			autoTagging !== undefined ||
			defaultView !== undefined
		) {
			await sql`
				INSERT INTO user_settings (user_id, ai_temperature, auto_tagging, default_view, updated_at)
				VALUES (
					${userId}, 
					${aiTemperature ?? 0.7}, 
					${autoTagging ?? true}, 
					${defaultView ?? "grid"}, 
					NOW()
				)
				ON CONFLICT (user_id) 
				DO UPDATE SET 
					ai_temperature = COALESCE(EXCLUDED.ai_temperature, user_settings.ai_temperature),
					auto_tagging = COALESCE(EXCLUDED.auto_tagging, user_settings.auto_tagging),
					default_view = COALESCE(EXCLUDED.default_view, user_settings.default_view),
					updated_at = NOW();
			`;
		}

		return Response.json({ success: true });
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
