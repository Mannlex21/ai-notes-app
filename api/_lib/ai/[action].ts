import { handlers } from "../ai/index.js";

export async function POST(request: Request) {
	const action =
		new URL(request.url).pathname.split("/").filter(Boolean).pop() ?? "";
	const handler = handlers[action];
	if (!handler) {
		return Response.json(
			{ error: "Acción no encontrada" },
			{ status: 404 },
		);
	}
	return handler(request);
}
