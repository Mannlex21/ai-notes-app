import { POST as expandText } from "./expand-text.js";
import { POST as extractTasks } from "./extract-tasks.js";
import { POST as generateTitle } from "./generate-title.js";
import { POST as refineStyle } from "./refine-style.js";
import { POST as searchSemantic } from "./search-semantic.js";
import { POST as suggestTags } from "./suggest-tags.js";
import { POST as summarize } from "./summarize.js";
import { POST as translate } from "./translate.js";

export const handlers: Record<string, (request: Request) => Promise<Response>> =
	{
		"expand-text": expandText,
		"extract-tasks": extractTasks,
		"generate-title": generateTitle,
		"refine-style": refineStyle,
		"search-semantic": searchSemantic,
		"suggest-tags": suggestTags,
		summarize,
		translate,
	};
