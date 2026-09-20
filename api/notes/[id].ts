// api/notes/[id].ts
import { sql } from "../_lib/neon.js";
import { getEmbedding } from "../_lib/gemini.js";
import type { UpdateNotePayload } from "../../src/types/index.js";

export async function PUT(
	request: Request,
	context: { params: Promise<{ id: string }> | { id: string } },
) {
	try {
		// 1. Obtener ID soportando params asíncronos o fallback vía URL
		const resolvedParams = await context?.params;
		const url = new URL(request.url);
		const id = resolvedParams?.id || url.pathname.split("/").pop();

		if (!id) {
			return Response.json(
				{ error: "El ID de la nota es requerido" },
				{ status: 400 },
			);
		}

		const body = (await request.json()) as UpdateNotePayload;
		const { userId, title, content, tags, color, is_pinned, is_archived } =
			body;

		if (!userId) {
			return Response.json(
				{ error: "userId es requerido" },
				{ status: 400 },
			);
		}

		// Caso 1: Cambio parcial (Toggle Pin / Toggle Archive)
		if (is_pinned !== undefined || is_archived !== undefined) {
			if (is_pinned !== undefined && is_archived !== undefined) {
				await sql`
					UPDATE notes 
					SET is_pinned = ${is_pinned}, is_archived = ${is_archived}, updated_at = NOW()
					WHERE id = ${id} AND user_id = ${userId};
				`;
			} else if (is_pinned !== undefined) {
				await sql`
					UPDATE notes 
					SET is_pinned = ${is_pinned}, updated_at = NOW()
					WHERE id = ${id} AND user_id = ${userId};
				`;
			} else if (is_archived !== undefined) {
				await sql`
					UPDATE notes 
					SET is_archived = ${is_archived}, updated_at = NOW()
					WHERE id = ${id} AND user_id = ${userId};
				`;
			}
			return Response.json({ success: true });
		}

		// Caso 2: Edición de contenido
		const fullText = `${title || ""} ${content || ""}`.trim();
		let vectorString = null;

		if (fullText) {
			try {
				const vector = await getEmbedding(fullText);
				vectorString = JSON.stringify(vector);
			} catch (err) {
				console.error("Error al recalcular vector:", err);
			}
		}

		const noteColor = color || "#f2eee3";

		if (vectorString) {
			await sql`
				UPDATE notes
				SET title = ${title || ""}, 
					content = ${content || ""}, 
					tags = ${tags || []},
					color = ${noteColor}, 
					embedding = ${vectorString}::vector,
					updated_at = NOW()
				WHERE id = ${id} AND user_id = ${userId};
			`;
		} else {
			await sql`
				UPDATE notes
				SET title = ${title || ""}, 
					content = ${content || ""}, 
					tags = ${tags || []},
					color = ${noteColor}, 
					updated_at = NOW()
				WHERE id = ${id} AND user_id = ${userId};
			`;
		}

		return Response.json({ success: true });
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}

export async function DELETE(
	request: Request,
	context: { params: Promise<{ id: string }> | { id: string } },
) {
	try {
		const resolvedParams = await context?.params;
		const url = new URL(request.url);
		const id = resolvedParams?.id || url.pathname.split("/").pop();

		const userId = url.searchParams.get("userId");

		if (!id || !userId) {
			return Response.json(
				{ error: "id y userId son requeridos" },
				{ status: 400 },
			);
		}

		await sql`DELETE FROM notes WHERE id = ${id} AND user_id = ${userId};`;

		return Response.json({ success: true });
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
