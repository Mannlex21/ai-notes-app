// src/types/index.ts

export interface User {
	id: string;
	email: string;
	full_name?: string;
	avatar_url?: string;
	created_at: string;
}

export interface UserSettings {
	user_id: string;
	theme: "dark" | "light";
	default_view: "grid" | "list";
	ai_provider: "gemini" | "openai";
	daily_prompt_limit: number;
	ai_temperature: number;
	auto_tagging: boolean;
}

export interface Note {
	id: string;
	user_id: string;
	title: string;
	content: string;
	summary?: string;
	tags: string[];
	color: string;
	is_pinned: boolean;
	is_archived: boolean;
	created_at: string;
	updated_at: string;
}

export interface AIUsageLog {
	id: string;
	user_id: string;
	action_type: "summarize" | "generate" | "auto_tag" | "expand";
	prompt_tokens?: number;
	created_at: string;
}
