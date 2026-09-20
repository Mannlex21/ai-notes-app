import { sql } from "../_lib/neon";
import { getEmbedding } from "../_lib/gemini";
import type { CreateNotePayload, Note } from "../../src/types";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");
		const query = searchParams.get("q");

		if (!userId) {
			return Response.json(
				{ error: "userId es requerido" },
				{ status: 400 },
			);
		}

		let rows;

		if (query && query.trim()) {
			const searchTerm = `%${query.trim()}%`;
			rows = await sql`
				SELECT id, user_id, title, content, summary, tags, color, is_pinned, is_archived, created_at, updated_at
				FROM notes
				WHERE user_id = ${userId}
				  AND is_archived = false
				  AND (
					title ILIKE ${searchTerm}
					OR content ILIKE ${searchTerm}
					OR EXISTS (
						SELECT 1 FROM unnest(tags) tag 
						WHERE tag ILIKE ${searchTerm}
					)
				  )
				ORDER BY is_pinned DESC, created_at DESC;
			`;
		} else {
			rows = await sql`
				SELECT id, user_id, title, content, summary, tags, color, is_pinned, is_archived, created_at, updated_at
				FROM notes
				WHERE user_id = ${userId}
				ORDER BY is_pinned DESC, created_at DESC;
			`;
		}

		const formattedNotes = rows.map(
			(n: Record<string, any>): Note => ({
				id: n.id,
				user_id: n.user_id,
				title: n.title || "",
				content: n.content || "",
				summary: n.summary,
				tags: n.tags || [],
				color: n.color || "#f7f4ea",
				is_pinned: Boolean(n.is_pinned),
				is_archived: Boolean(n.is_archived),
				created_at: n.created_at,
				updated_at: n.updated_at,
			}),
		);

		return Response.json({ notes: formattedNotes });
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as CreateNotePayload & {
			is_pinned?: boolean;
		};
		const { userId, title, content, tags, color, is_pinned } = body;

		if (!userId) {
			return Response.json(
				{ error: "userId es requerido" },
				{ status: 400 },
			);
		}

		const fullText = `${title || ""} ${content || ""}`.trim();
		let vectorString = null;

		if (fullText) {
			try {
				const vector = await getEmbedding(fullText);
				vectorString = JSON.stringify(vector);
			} catch (err) {
				console.error("Error al generar vector para nota:", err);
			}
		}

		const noteColor = color || "#f2eee3";
		const finalTags = tags || [];

		let rows;
		if (vectorString) {
			rows = await sql`
				INSERT INTO notes (user_id, title, content, tags, color, is_pinned, embedding)
				VALUES (
					${userId}, 
					${title || ""}, 
					${content || ""}, 
					${finalTags}, 
					${noteColor}, 
					${is_pinned || false},
					${vectorString}::vector
				)
				RETURNING id, created_at, updated_at;
			`;
		} else {
			rows = await sql`
				INSERT INTO notes (user_id, title, content, tags, color, is_pinned)
				VALUES (
					${userId}, 
					${title || ""}, 
					${content || ""}, 
					${finalTags}, 
					${noteColor}, 
					${is_pinned || false}
				)
				RETURNING id, created_at, updated_at;
			`;
		}

		const inserted = rows[0];

		return Response.json({
			note: {
				id: inserted.id,
				user_id: userId,
				title: title || "",
				content: content || "",
				tags: finalTags,
				color: noteColor,
				is_pinned: is_pinned || false,
				is_archived: false,
				created_at: inserted.created_at,
				updated_at: inserted.updated_at,
			},
		});
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
