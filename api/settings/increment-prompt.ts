// api/settings/increment-prompt.ts
import { sql } from "../_lib/neon";

export async function POST(request: Request) {
	try {
		const { userId } = await request.json();

		if (!userId) {
			return Response.json(
				{ error: "Se requiere el ID de usuario." },
				{ status: 400 },
			);
		}

		await sql`
			INSERT INTO user_settings (user_id, prompts_used_today, last_prompt_date, updated_at)
			VALUES (${userId}, 1, CURRENT_DATE, NOW())
			ON CONFLICT (user_id) 
			DO UPDATE SET 
				prompts_used_today = user_settings.prompts_used_today + 1,
				last_prompt_date = CURRENT_DATE,
				updated_at = NOW();
		`;

		return Response.json({ success: true });
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
