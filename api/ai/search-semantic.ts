// api/ai/search-semantic.ts
import { ai, EMBEDDING_MODEL } from "../_lib/gemini";
import { sql } from "../_lib/neon";

interface SearchSemanticPayload {
	query?: string;
	userId?: string;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as SearchSemanticPayload;
		const { query = "", userId } = body;

		if (!userId) {
			return Response.json(
				{ error: "userId es requerido" },
				{ status: 400 },
			);
		}

		// Generar vector embedding de la consulta
		const res = await ai.models.embedContent({
			model: EMBEDDING_MODEL,
			contents: query,
			config: {
				outputDimensionality: 768,
			},
		});

		const values = res.embeddings?.[0]?.values;
		if (!values) {
			return Response.json([]);
		}

		const queryVector = `[${values.join(",")}]`;

		// Consultar la base de datos Neon usando pgvector
		const rows = await sql`
			SELECT id, user_id, title, content, summary, tags, color, is_pinned, is_archived, created_at, updated_at,
					1 - (embedding <=> ${queryVector}::vector) AS similarity
			FROM notes
			WHERE user_id = ${userId}
				AND embedding IS NOT NULL
				AND 1 - (embedding <=> ${queryVector}::vector) >= 0.50
			ORDER BY similarity DESC
			LIMIT 5;
		`;

		if (rows.length === 0) {
			return Response.json([]);
		}

		const topScore = Number(rows[0].similarity);
		const MARGIN = 0.1;
		const filteredRows = rows.filter(
			(n: Record<string, any>) =>
				Number(n.similarity) >= topScore - MARGIN,
		);

		return Response.json(filteredRows);
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
