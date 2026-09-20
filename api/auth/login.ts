// api/auth/login.ts
import bcrypt from "bcryptjs";
import { sql } from "../_lib/neon.js";
import type { AuthLoginPayload } from "../../src/types/index.js";

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as AuthLoginPayload;
		const { email, password } = body;

		if (!email || !password) {
			return Response.json(
				{ error: "Correo y contraseña son requeridos." },
				{ status: 400 },
			);
		}

		// 1. Obtener usuario de Neon
		const rows = await sql`
			SELECT id, email, full_name, password_hash 
			FROM users 
			WHERE email = ${email.trim().toLowerCase()} 
			LIMIT 1;
		`;

		if (rows.length === 0) {
			return Response.json(
				{ error: "Credenciales inválidas." },
				{ status: 401 },
			);
		}

		const userData = rows[0];

		// 2. Verificar contraseña con bcrypt
		const isPasswordValid = await bcrypt.compare(
			password,
			userData.password_hash || "",
		);

		if (!isPasswordValid) {
			return Response.json(
				{ error: "Credenciales inválidas." },
				{ status: 401 },
			);
		}

		// 3. Responder con la información del usuario
		return Response.json({
			user: {
				id: userData.id,
				email: userData.email,
				fullName: userData.full_name || "Usuario",
			},
		});
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
