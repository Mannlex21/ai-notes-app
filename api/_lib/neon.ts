import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.NEON_DATABASE_URL;

if (!dbUrl) {
	throw new Error(
		"NEON_DATABASE_URL no está configurada en las variables de entorno.",
	);
}

export const sql = neon(dbUrl);
