import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sqlInstance: NeonQueryFunction<false, false> | null = null;

function getSqlInstance() {
	if (!sqlInstance) {
		const dbUrl = process.env.NEON_DATABASE_URL;
		if (!dbUrl) {
			throw new Error(
				"NEON_DATABASE_URL no está configurada en las variables de entorno.",
			);
		}
		sqlInstance = neon(dbUrl);
	}
	return sqlInstance;
}

export const sql: NeonQueryFunction<false, false> = ((
	...args: [any, ...any[]]
) => {
	const instance = getSqlInstance();
	return (instance as any)(...args);
}) as unknown as NeonQueryFunction<false, false>;
