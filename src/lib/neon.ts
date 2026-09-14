import { neon } from "@neondatabase/serverless";

const dbUrl = import.meta.env.VITE_NEON_DATABASE_URL;

if (!dbUrl) {
	console.warn("VITE_NEON_DATABASE_URL no está configurada");
}

export const sql = neon(dbUrl);
