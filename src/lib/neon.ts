import { neon } from "@neondatabase/serverless";

const dbUrl = import.meta.env.NEON_DATABASE_URL;

if (!dbUrl) {
	console.warn("NEON_DATABASE_URL no está configurada");
}

export const sql = neon(dbUrl);
