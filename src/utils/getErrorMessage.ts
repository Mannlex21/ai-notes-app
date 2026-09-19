export function getErrorMessage(
	err: unknown,
	defaultMessage = "Ocurrió un error inesperado",
): string {
	if (!err) return defaultMessage;

	let message = "";

	if (err instanceof Error) {
		message = err.message;
	} else if (typeof err === "string") {
		message = err;
	} else if (typeof err === "object" && err !== null && "message" in err) {
		message = String((err as any).message);
	}

	if (!message) return defaultMessage;

	// Si el mensaje es una cadena JSON, intentamos extraer la propiedad error.message
	if (message.trim().startsWith("{")) {
		try {
			const parsed = JSON.parse(message);
			if (parsed?.error?.message) {
				return parsed.error.message;
			}
			if (parsed?.message) {
				return parsed.message;
			}
		} catch {
			// Si falla el parseo, mantenemos la cadena original
		}
	}

	return message;
}
