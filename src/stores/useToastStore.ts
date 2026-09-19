import { ref } from "vue";
import { defineStore } from "pinia";

export type ToastType = "success" | "warning" | "error" | "info";
export type ToastPosition =
	| "top-right"
	| "top-left"
	| "bottom-right"
	| "bottom-left"
	| "top-center"
	| "bottom-center";

export interface Toast {
	id: string;
	message: string;
	description?: string;
	type: ToastType;
	duration?: number;
	position?: ToastPosition;
}

export const useToastStore = defineStore("toast", () => {
	const toasts = ref<Toast[]>([]);

	const add = (
		message: string,
		description?: string,
		type: ToastType = "info",
		duration = 4000,
		position: ToastPosition = "top-right",
	) => {
		const id = Math.random().toString(36).substring(2, 9);
		const newToast: Toast = {
			id,
			message,
			description,
			type,
			duration,
			position,
		};

		toasts.value.push(newToast);
	};

	const remove = (id: string) => {
		toasts.value = toasts.value.filter((t) => t.id !== id);
	};

	// Métodos auxiliares
	const success = (
		msg: string,
		description?: string,
		duration?: number,
		position?: ToastPosition,
	) => add(msg, description, "success", duration, position);

	const warning = (
		msg: string,
		description?: string,
		duration?: number,
		position?: ToastPosition,
	) => add(msg, description, "warning", duration, position);

	const error = (
		msg: string,
		description?: string,
		duration?: number,
		position?: ToastPosition,
	) => add(msg, description, "error", duration, position);

	const info = (
		msg: string,
		description?: string,
		duration?: number,
		position?: ToastPosition,
	) => add(msg, description, "info", duration, position);

	return {
		toasts,
		add,
		remove,
		success,
		warning,
		error,
		info,
	};
});
