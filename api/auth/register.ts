// api/auth/register.ts
import bcrypt from "bcryptjs";
import { sql } from "../_lib/neon";

export async function POST(request: Request) {
	try {
		const { fullName, email, password } = await request.json();

		if (!fullName || !email || !password) {
			return Response.json(
				{ error: "Todos los campos son obligatorios." },
				{ status: 400 },
			);
		}

		const cleanEmail = email.trim().toLowerCase();

		// 1. Verificar si el correo ya existe
		const existingUser = await sql`
			SELECT id FROM users WHERE email = ${cleanEmail} LIMIT 1;
		`;

		if (existingUser.length > 0) {
			return Response.json(
				{ error: "El correo electrónico ya está registrado." },
				{ status: 400 },
			);
		}

		// 2. Generar Hash e Insertar en la Base de Datos
		const userId = `usr_${Date.now()}`;
		const passwordHash = await bcrypt.hash(password, 10);

		await sql`
			INSERT INTO users (id, email, full_name, password_hash)
			VALUES (${userId}, ${cleanEmail}, ${fullName}, ${passwordHash});
		`;

		await sql`
			INSERT INTO user_settings (user_id)
			VALUES (${userId});
		`;

		return Response.json({
			user: {
				id: userId,
				email: cleanEmail,
				fullName,
			},
		});
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
