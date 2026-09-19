<!-- components/modals/NoteModal.vue -->
<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted, computed } from "vue";
import {
	Plus,
	CheckSquare,
	X,
	Type,
	Languages,
	Wand2,
	Trash2,
	Undo2,
	Redo2,
	Palette,
	Sparkles,
} from "lucide-vue-next";
import { useNotesStore } from "../../stores/useNotesStore";
import { useAiStore } from "../../stores/useAiStore.ts";
import { useToastStore } from "../../stores/useToastStore";
import AiMenuDropdown from "../modals/AiMenuDropdown.vue";
import AiVariantsModal from "../modals/AiVariantsModal.vue";
import TagManagerModal from "../modals/TagManagerModal.vue";
import TranslationModal from "../modals/TranslationModal.vue";
import RichTextEditor from "../notes/RichTextEditor.vue";
import type { Note } from "../../types";
import { getErrorMessage } from "../../utils/getErrorMessage.ts";

const NOTE_COLORS = [
	{ name: "Papel Crema", hex: "#f2eee3" },
	{ name: "Amarillo Calido", hex: "#fef3c7" },
	{ name: "Verde Menta", hex: "#d1fae5" },
	{ name: "Azul Brisa", hex: "#e0f2fe" },
	{ name: "Lavanda Suave", hex: "#ede9fe" },
	{ name: "Rosa Pastel", hex: "#fce7f3" },
	{ name: "Naranja Melocotón", hex: "#ffedd5" },
];

const props = defineProps<{
	isOpen: boolean;
	initialNote?: Note | null;
}>();

const emit = defineEmits<{
	(e: "close"): void;
	(
		e: "save",
		payload: {
			id?: string;
			title: string;
			content: string;
			tags: string[];
			color: string;
		},
	): void;
}>();

const notesStore = useNotesStore();
const aiStore = useAiStore();
const toast = useToastStore();

const title = ref("");
const content = ref("");
const isChecklist = ref(false);
const showToolbar = ref(false);
const showColorPicker = ref(false);
const rawHtmlBackup = ref("");
const isAiBusy = computed(() => aiStore.aiLoading || notesStore.isLoading);

const tags = ref<string[]>([]);
const createdAt = ref<string | Date | null>(null);
const updatedAt = ref<string | Date | null>(null);
const noteColor = ref("#f2eee3");
const showTagModal = ref(false);
const showStyleModal = ref(false);
const showTranslateModal = ref(false);
const styleVariants = ref<string[]>([]);

const checklistItems = ref<{ text: string; done: boolean }[]>([
	{ text: "", done: false },
]);

// --- HISTORIAL DE DESHACER / REHACER ---
interface HistoryState {
	content: string;
	isChecklist: boolean;
	checklistItems: { text: string; done: boolean }[];
	color: string;
}

const history = ref<HistoryState[]>([]);
const historyIndex = ref(-1);
const isHistoryAction = ref(false);

const saveHistoryState = () => {
	if (isHistoryAction.value) return;

	const newState: HistoryState = {
		content: content.value,
		isChecklist: isChecklist.value,
		checklistItems: JSON.parse(JSON.stringify(checklistItems.value)),
		color: noteColor.value,
	};

	if (historyIndex.value >= 0) {
		const currentState = history.value[historyIndex.value];
		if (
			currentState.content === newState.content &&
			currentState.isChecklist === newState.isChecklist &&
			currentState.color === newState.color &&
			JSON.stringify(currentState.checklistItems) ===
				JSON.stringify(newState.checklistItems)
		) {
			return;
		}
	}

	if (historyIndex.value < history.value.length - 1) {
		history.value = history.value.slice(0, historyIndex.value + 1);
	}

	history.value.push(newState);

	if (history.value.length > 30) {
		history.value.shift();
	} else {
		historyIndex.value++;
	}
};

const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < history.value.length - 1);

const handleUndo = () => {
	if (!canUndo.value) return;
	isHistoryAction.value = true;
	historyIndex.value--;

	const state = history.value[historyIndex.value];
	content.value = state.content;
	isChecklist.value = state.isChecklist;
	checklistItems.value = JSON.parse(JSON.stringify(state.checklistItems));
	noteColor.value = state.color || "#f2eee3";

	nextTick(() => {
		isHistoryAction.value = false;
	});
};

const handleRedo = () => {
	if (!canRedo.value) return;
	isHistoryAction.value = true;
	historyIndex.value++;

	const state = history.value[historyIndex.value];
	content.value = state.content;
	isChecklist.value = state.isChecklist;
	checklistItems.value = JSON.parse(JSON.stringify(state.checklistItems));
	noteColor.value = state.color || "#f2eee3";

	nextTick(() => {
		isHistoryAction.value = false;
	});
};

watch(content, () => saveHistoryState());
watch(checklistItems, () => saveHistoryState(), { deep: true });

watch(
	() => props.isOpen,
	(open) => {
		if (open) {
			isHistoryAction.value = true;
			history.value = [];
			historyIndex.value = -1;

			if (props.initialNote) {
				title.value = props.initialNote.title || "";
				const rawContent = props.initialNote.content || "";
				tags.value = [...(props.initialNote.tags || [])];
				noteColor.value = props.initialNote.color || "#f2eee3";
				createdAt.value = props.initialNote.created_at || null;
				updatedAt.value = props.initialNote.updated_at || null;

				const cleanText = rawContent
					.replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
					.replace(/<br\s*[\/]?>/gi, "\n")
					.replace(/<[^>]+>/g, "")
					.replace(/&nbsp;/g, " ")
					.replace(/&amp;/g, "&")
					.replace(/&lt;/g, "<")
					.replace(/&gt;/g, ">");

				const lines = cleanText
					.split(/\r?\n/)
					.map((line) => line.trim())
					.filter((line) => line.length > 0);

				const hasChecklistFormat = lines.some((line) =>
					/^(\[[ x]\]|[-•*])/i.test(line),
				);

				if (hasChecklistFormat) {
					isChecklist.value = true;
					checklistItems.value = lines.map((line) => ({
						text: line.replace(/^(\[[ x]\]|[-•*])\s*/i, ""),
						done: /^\[x\]/i.test(line),
					}));
					content.value = "";
				} else {
					isChecklist.value = false;
					content.value = rawContent;
					checklistItems.value = [{ text: "", done: false }];
				}
			} else {
				resetForm();
			}

			nextTick(() => {
				isHistoryAction.value = false;
				saveHistoryState();
			});
		}
	},
	{ immediate: true },
);

watch(isChecklist, (newVal) => {
	if (newVal) {
		if (content.value.trim()) {
			rawHtmlBackup.value = content.value;

			const plainText = content.value
				.replace(/<\/p>/gi, "\n")
				.replace(/<br\s*[\/]?>/gi, "\n")
				.replace(/<\/div>/gi, "\n")
				.replace(/<[^>]+>/g, "");

			const lines = plainText
				.split(/\r?\n/)
				.map((line) => line.trim())
				.filter((line) => line.length > 0);

			if (lines.length > 0) {
				checklistItems.value = lines.map((text) => ({
					text: text.replace(/^\[[ x]\]\s*/i, ""),
					done: /^\[x\]/i.test(text),
				}));
			} else {
				checklistItems.value = [{ text: "", done: false }];
			}

			content.value = "";
		}
	} else {
		const validItems = checklistItems.value.filter(
			(item) => item.text.trim().length > 0,
		);

		const currentListText = validItems.map((i) => i.text.trim()).join("\n");
		const backupLines = rawHtmlBackup.value
			.replace(/<[^>]+>/g, "\n")
			.split(/\r?\n/)
			.map((l) => l.trim())
			.filter((l) => l.length > 0)
			.join("\n");

		const hasModifiedItems = currentListText !== backupLines;

		if (!hasModifiedItems && rawHtmlBackup.value) {
			content.value = rawHtmlBackup.value;
		} else if (validItems.length > 0) {
			content.value = validItems
				.map((item) => `<p>${item.text.trim()}</p>`)
				.join("");
		}

		checklistItems.value = [{ text: "", done: false }];
		rawHtmlBackup.value = "";
	}

	saveHistoryState();
});

const handleKeyDown = (event: KeyboardEvent) => {
	if (!props.isOpen) return;

	const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
	const modifier = isMac ? event.metaKey : event.ctrlKey;

	if (modifier && event.key.toLowerCase() === "z") {
		if (event.shiftKey) {
			event.preventDefault();
			handleRedo();
		} else {
			event.preventDefault();
			handleUndo();
		}
	} else if (modifier && event.key.toLowerCase() === "y" && !isMac) {
		event.preventDefault();
		handleRedo();
	} else if (event.key === "Escape") {
		if (showTagModal.value) showTagModal.value = false;
		else if (showStyleModal.value) showStyleModal.value = false;
		else if (showTranslateModal.value) showTranslateModal.value = false;
		else if (showColorPicker.value) showColorPicker.value = false;
		else handleClose();
	}
};

window.addEventListener("keydown", handleKeyDown);
onUnmounted(() => {
	window.removeEventListener("keydown", handleKeyDown);
});

const handleClose = () => {
	resetForm();
	emit("close");
};

const focusLastInput = () => {
	nextTick(() => {
		const inputs = document.querySelectorAll<HTMLInputElement>(
			".checklist-item-input",
		);
		const lastInput = inputs[inputs.length - 1];
		if (lastInput) lastInput.focus();
	});
};

const addChecklistItem = (currentIndex?: number) => {
	if (currentIndex !== undefined) {
		const currentItem = checklistItems.value[currentIndex];
		if (!currentItem || !currentItem.text.trim()) return;
	}

	const lastItem = checklistItems.value[checklistItems.value.length - 1];
	if (lastItem && !lastItem.text.trim()) {
		focusLastInput();
		return;
	}

	checklistItems.value.push({ text: "", done: false });
	focusLastInput();
};

const removeChecklistItem = (index: number) => {
	checklistItems.value.splice(index, 1);
	if (checklistItems.value.length === 0) addChecklistItem();
};

const handleAddTag = (tag: string) => {
	if (!tags.value.includes(tag)) {
		tags.value.push(tag);
	}
};

const handleRemoveTag = (tagToRemove: string) => {
	tags.value = tags.value.filter((t) => t !== tagToRemove);
};

const selectColor = (hex: string) => {
	noteColor.value = hex;
	showColorPicker.value = false;
	saveHistoryState();
};

const resetForm = () => {
	title.value = "";
	content.value = "";
	tags.value = [];
	noteColor.value = "#f2eee3";
	isChecklist.value = false;
	showColorPicker.value = false;
	showStyleModal.value = false;
	showTagModal.value = false;
	showTranslateModal.value = false;
	checklistItems.value = [{ text: "", done: false }];
	rawHtmlBackup.value = "";

	history.value = [];
	historyIndex.value = -1;
};

const handleSave = () => {
	const hasTitle = title.value.trim().length > 0;
	const hasContent = content.value.trim().length > 0;
	const validChecklist = checklistItems.value.filter(
		(i) => i.text.trim().length > 0,
	);

	if (!hasTitle && !hasContent && validChecklist.length === 0) {
		toast.warning("No se guardó la nota porque estaba vacía");
		handleClose();
		return;
	}

	let finalContent = content.value.trim();
	if (isChecklist.value) {
		finalContent = validChecklist
			.map((item) => `[${item.done ? "x" : " "}] ${item.text}`)
			.join("\n");
	}

	emit("save", {
		id: props.initialNote?.id,
		title: title.value.trim(),
		content: finalContent,
		tags: [...tags.value],
		color: noteColor.value,
	});

	if (props.initialNote?.id) {
		toast.success("Nota actualizada exitosamente");
	} else {
		toast.success("Nota creada exitosamente");
	}

	handleClose();
};

const selectVariant = (selectedText: string) => {
	content.value = selectedText;
	showStyleModal.value = false;
	saveHistoryState();
	toast.success("Variación seleccionada aplicada");
};

const parseHtmlOrTextToLines = (rawText: string): string[] => {
	const parsed = rawText
		.replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
		.replace(/<br\s*[\/]?>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">");

	return parsed
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
};

const handleGlobalPaste = (event: ClipboardEvent) => {
	const pastedData =
		event.clipboardData?.getData("text/html") ||
		event.clipboardData?.getData("text/plain");
	if (!pastedData) return;

	const containsHtmlTags = /<[a-z][\s\S]*>/i.test(pastedData);
	const lines = parseHtmlOrTextToLines(pastedData);
	const hasListSyntax = lines.some((line) => /^\[[ x]\]/i.test(line));

	if (containsHtmlTags || hasListSyntax) {
		event.preventDefault();

		if (hasListSyntax) {
			isChecklist.value = true;
			checklistItems.value = lines.map((line) => ({
				text: line.replace(/^\[[ x]\]\s*/i, ""),
				done: /^\[x\]/i.test(line),
			}));
			content.value = "";
		} else {
			if (isChecklist.value) {
				checklistItems.value = lines.map((text) => ({
					text,
					done: false,
				}));
			} else {
				content.value = lines.map((line) => `<p>${line}</p>`).join("");
			}
		}
	}
};

const formattedDate = computed(() => {
	if (!updatedAt.value) return "";
	const date = new Date(updatedAt.value);

	return new Intl.DateTimeFormat("es-ES", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
});

const formattedCreatedAt = computed(() => {
	if (!createdAt.value) return "";
	const date = new Date(createdAt.value);

	return new Intl.DateTimeFormat("es-ES", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
});

const handleAutoTagAi = async () => {
	if (!content.value.trim()) {
		toast.warning("Agrega contenido a la nota para sugerir etiquetas");
		return;
	}
	try {
		const result = await aiStore.suggestTagsForText(content.value);
		if (result.tags && result.tags.length > 0) {
			const combined = new Set([...tags.value, ...result.tags]);
			tags.value = Array.from(combined);
			if (result.color) {
				noteColor.value = result.color;
				saveHistoryState();
			}
			toast.success("Categorías sugeridas aplicadas con éxito");
		} else {
			toast.info("No se hallaron categorías adicionales");
		}
	} catch (err) {
		toast.error(
			"Error en la búsqueda semántica",
			getErrorMessage(
				err,
				"Ocurrió un fallo al analizar el contenido con IA para extraer etiquetas.",
			),
		);
	}
};

const handleExpandText = async () => {
	if (!content.value.trim()) {
		toast.warning("El texto está vacío para ser expandido");
		return;
	}
	try {
		const expanded = await aiStore.expandText(content.value);
		if (expanded) {
			if (
				expanded
					.toLowerCase()
					.startsWith(content.value.trim().toLowerCase())
			) {
				content.value = expanded;
			} else {
				const needsSpace =
					!content.value.endsWith(" ") &&
					!expanded.startsWith(" ") &&
					!expanded.startsWith(",");
				content.value = `${content.value}${needsSpace ? " " : ""}${expanded}`;
			}
			saveHistoryState();
			toast.success("Texto expandido con IA");
		}
	} catch (err) {
		toast.error(
			"Error en la búsqueda semántica",
			getErrorMessage(
				err,
				"No fue posible generar una expansión del borrador en este momento.",
			),
		);
	}
};

const handleRefineStyle = async (tone: "formal" | "conciso" | "casual") => {
	if (!content.value.trim()) {
		toast.warning("Escribe algo de texto antes de reescribir");
		return;
	}
	try {
		const options = await aiStore.refineStyleOptions(content.value, tone);
		if (options && options.length > 0) {
			styleVariants.value = options;
			showStyleModal.value = true;
		} else {
			toast.info("No se generaron variaciones para esta opción");
		}
	} catch (err) {
		toast.error(
			"Error en la búsqueda semántica",
			getErrorMessage(
				err,
				`Hubo un problema al intentar generar variaciones en tono ${tone}.`,
			),
		);
	}
};

const handleSummarize = async () => {
	if (!content.value.trim()) {
		toast.warning("No hay contenido suficiente para resumir");
		return;
	}
	try {
		const summaryResult = await aiStore.summarizeDraft(content.value);
		if (summaryResult) {
			styleVariants.value = [summaryResult];
			showStyleModal.value = true;
		}
	} catch (err) {
		toast.error(
			"Error en la búsqueda semántica",
			getErrorMessage(
				err,
				"No se pudo procesar el resumen del contenido introducido.",
			),
		);
	}
};

const handleExtractTasks = async () => {
	if (!content.value.trim()) {
		toast.warning("No se encontró texto para extraer tareas");
		return;
	}
	try {
		const extractedTasks = await aiStore.extractActionItems(content.value);
		if (extractedTasks.length > 0) {
			checklistItems.value = extractedTasks.map((taskText) => ({
				text: taskText,
				done: false,
			}));
			isChecklist.value = true;
			toast.success(
				`Se extrajeron ${extractedTasks.length} tareas pendientes`,
			);
		} else {
			toast.info("No se identificaron tareas concretas en el texto");
		}
	} catch (err) {
		toast.error(
			"Error en la búsqueda semántica",
			getErrorMessage(
				err,
				"Ocurrió un error al identificar ítems de acción con el asistente de IA.",
			),
		);
	}
};

const handleTranslateLanguage = async (targetLanguage: string) => {
	if (!content.value.trim()) {
		toast.warning("El texto está vacío para traducir");
		return;
	}
	try {
		const translated = await aiStore.translateText(
			content.value,
			targetLanguage,
		);
		if (translated) {
			content.value = translated;
			saveHistoryState();
			toast.success(`Nota traducida a ${targetLanguage}`);
		}
	} catch (err) {
		toast.error(
			"Error en la búsqueda semántica",
			getErrorMessage(
				err,
				`No fue posible traducir el texto al idioma ${targetLanguage}.`,
			),
		);
	}
	showTranslateModal.value = false;
};

const handleAutoTitle = async () => {
	if (!content.value.trim()) {
		toast.warning("Escribe algo en la nota para generar un título");
		return;
	}
	try {
		const generatedTitle = await aiStore.generateTitle(content.value);
		if (generatedTitle) {
			title.value = generatedTitle;
			toast.success("Título generado automáticamente");
		}
	} catch (err) {
		toast.error(
			"Error en la búsqueda semántica",
			getErrorMessage(
				err,
				"No se pudo generar una sugerencia de título a partir del contenido de la nota.",
			),
		);
	}
};
</script>

<template>
	<div
		v-if="isOpen"
		class="fixed inset-0 z-40 bg-[#2a2926]/15 backdrop-blur-sm flex items-center justify-center p-4"
	>
		<div
			class="border border-[#d8d3c5] rounded-xl p-5 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col justify-between overflow-hidden transition-colors duration-300 relative"
			:style="{ backgroundColor: noteColor }"
		>
			<!-- Header -->
			<div
				class="shrink-0 pb-3 border-b border-[#2a2926]/10 flex items-center justify-between gap-3"
			>
				<div class="flex items-center gap-2 mb-2 w-full">
					<button
						@click="handleAutoTitle"
						:disabled="
							isAiBusy ||
							!content ||
							content.replace(/<[^>]*>/g, '').trim().length === 0
						"
						type="button"
						class="p-1 rounded-md hover:bg-[#2a2926]/10 text-[#e06c53] transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center justify-center shrink-0"
						title="Generar título inteligente con IA"
					>
						<Wand2
							:class="[
								'w-5 h-5 text-[#e06c53] stroke-[2.25]',
								isAiBusy ? 'animate-spin' : '',
							]"
						/>
					</button>

					<input
						v-model="title"
						type="text"
						placeholder="Título"
						class="w-full bg-transparent text-lg font-bold text-[#3d3b37] placeholder-[#8c867a] focus:outline-none"
					/>
				</div>
				<button
					@click="handleClose"
					class="p-1 rounded-md text-[#8c867a] hover:text-[#3d3b37] hover:bg-[#2a2926]/10 transition-colors"
					title="Cerrar sin guardar"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Body -->
			<div
				class="flex-1 overflow-y-auto my-3 pr-1"
				@paste="handleGlobalPaste"
			>
				<RichTextEditor
					v-if="!isChecklist"
					v-model="content"
					:show-toolbar="showToolbar"
				/>

				<div v-else class="space-y-2 py-1">
					<div
						v-for="(item, index) in checklistItems"
						:key="index"
						class="group flex items-center gap-2 my-1.5"
					>
						<input
							type="checkbox"
							v-model="item.done"
							class="rounded border-[#d8d3c5] text-[#e06c53] focus:ring-0 cursor-pointer"
						/>
						<input
							type="text"
							v-model="item.text"
							@keydown.enter.prevent="addChecklistItem(index)"
							placeholder="Escribe una tarea..."
							class="checklist-item-input w-full bg-transparent text-sm text-[#3d3b37] placeholder-[#8c867a] focus:outline-none"
							:class="{
								'line-through text-[#8c867a]': item.done,
							}"
						/>
						<button
							type="button"
							@click="removeChecklistItem(index)"
							class="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-[#8c867a] hover:text-[#e06c53] hover:bg-[#2a2926]/10 rounded-md transition-all shrink-0"
							title="Eliminar elemento"
						>
							<Trash2 class="w-3.5 h-3.5" />
						</button>
					</div>
					<button
						type="button"
						@click="addChecklistItem()"
						class="flex items-center gap-1.5 text-xs text-[#8c867a] hover:text-[#3d3b37] font-medium pt-1"
					>
						<Plus class="w-3.5 h-3.5" /> Agregar elemento
					</button>
				</div>
			</div>

			<!-- Chips de Categorías -->
			<div
				class="pt-2 pb-2 border-t border-[#2a2926]/10 flex items-center justify-between gap-2 w-full"
			>
				<div class="flex flex-wrap items-center gap-1.5">
					<button
						@click="handleAutoTagAi"
						:disabled="isAiBusy || !content.trim()"
						class="p-1 px-2 text-xs text-[#e06c53] hover:bg-[#2a2926]/10 rounded-md transition-colors flex items-center gap-1 font-medium disabled:opacity-40 disabled:hover:bg-transparent"
						title="Auto-categorizar con IA"
					>
						<Sparkles
							:class="[
								'w-3.5 h-3.5 text-[#e06c53]',
								isAiBusy ? 'animate-spin' : '',
							]"
						/>
					</button>

					<span
						v-for="tag in tags"
						:key="tag"
						class="text-[11px] px-2 py-0.5 rounded-full bg-[#2a2926]/10 text-[#3d3b37] border border-[#2a2926]/15 font-medium flex items-center gap-1"
					>
						#{{ tag }}
						<button
							@click="handleRemoveTag(tag)"
							class="text-[#8c867a] hover:text-[#e06c53]"
						>
							<X class="w-3 h-3" />
						</button>
					</span>

					<button
						@click="showTagModal = true"
						class="p-1 text-xs text-[#8c867a] hover:text-[#e06c53] hover:bg-[#2a2926]/10 rounded-md transition-colors flex items-center gap-1 font-medium"
						title="Gestionar categorías"
					>
						<Plus class="w-3.5 h-3.5" />
						<span v-if="tags.length === 0" class="text-[11px]"
							>Categoría</span
						>
					</button>
				</div>

				<div
					v-if="initialNote && formattedDate"
					class="text-right text-[11px] text-[#8c867a] pr-1 pt-0.5 flex items-center justify-end cursor-help transition-colors hover:text-[#3d3b37]"
					:title="
						formattedCreatedAt
							? `Creado el ${formattedCreatedAt}`
							: undefined
					"
				>
					Editado el {{ formattedDate }}
				</div>
			</div>

			<!-- Footer -->
			<div
				class="pt-3 border-t border-[#2a2926]/10 flex items-center justify-between gap-2 overflow-hidden"
			>
				<div class="relative flex-1 min-w-0">
					<div
						class="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 pr-4 [mask-image:linear-gradient(to_right,black_85%,transparent_100%)]"
					>
						<button
							@click="isChecklist = !isChecklist"
							:class="[
								'p-1.5 rounded-md hover:bg-[#2a2926]/10 transition-colors shrink-0',
								isChecklist
									? 'text-[#e06c53] bg-[#2a2926]/10'
									: '',
							]"
							title="Cambiar formato de lista"
						>
							<CheckSquare class="w-4 h-4" />
						</button>

						<button
							v-if="!isChecklist"
							@click="showToolbar = !showToolbar"
							:class="[
								'p-1.5 rounded-md hover:bg-[#2a2926]/10 transition-colors shrink-0',
								showToolbar
									? 'text-[#e06c53] bg-[#2a2926]/10'
									: '',
							]"
							title="Herramientas de formato"
						>
							<Type class="w-4 h-4" />
						</button>

						<div class="relative shrink-0">
							<button
								type="button"
								@click="showColorPicker = !showColorPicker"
								:class="[
									'p-1.5 rounded-md hover:bg-[#2a2926]/10 transition-colors',
									showColorPicker
										? 'text-[#e06c53] bg-[#2a2926]/10'
										: '',
								]"
								title="Cambiar color de la nota"
							>
								<Palette class="w-4 h-4" />
							</button>

							<div
								v-if="showColorPicker"
								class="absolute bottom-full left-0 mb-2 p-2 bg-[#f2eee3] border border-[#d8d3c5] rounded-xl shadow-lg flex items-center gap-1.5 z-50"
							>
								<button
									v-for="color in NOTE_COLORS"
									:key="color.hex"
									type="button"
									@click="selectColor(color.hex)"
									class="w-6 h-6 rounded-full border border-[#2a2926]/20 transition-transform hover:scale-110 flex items-center justify-center shrink-0"
									:style="{ backgroundColor: color.hex }"
									:title="color.name"
								>
									<span
										v-if="noteColor === color.hex"
										class="w-2 h-2 rounded-full bg-[#3d3b37]"
									></span>
								</button>
							</div>
						</div>

						<button
							v-if="!isChecklist"
							@click="showTranslateModal = true"
							:disabled="!content.trim() || isAiBusy"
							class="p-1.5 rounded-md hover:bg-[#2a2926]/10 text-[#8c867a] hover:text-[#3d3b37] transition-colors disabled:opacity-40 flex items-center gap-1 shrink-0"
							title="Traducir nota"
						>
							<Languages class="w-4 h-4" />
						</button>

						<AiMenuDropdown
							v-if="!isChecklist"
							:is-loading="isAiBusy"
							:disabled="!content.trim()"
							class="shrink-0"
							@expand="handleExpandText"
							@summarize="handleSummarize"
							@refine="handleRefineStyle"
							@extract-tasks="handleExtractTasks"
						/>

						<div
							class="h-4 w-[1px] bg-[#2a2926]/10 mx-0.5 shrink-0"
						></div>

						<button
							type="button"
							@click="handleUndo"
							:disabled="!canUndo"
							class="p-1.5 rounded-md hover:bg-[#2a2926]/10 text-[#8c867a] hover:text-[#3d3b37] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed shrink-0"
							title="Deshacer (Ctrl + Z)"
						>
							<Undo2 class="w-4 h-4" />
						</button>

						<button
							type="button"
							@click="handleRedo"
							:disabled="!canRedo"
							class="p-1.5 rounded-md hover:bg-[#2a2926]/10 text-[#8c867a] hover:text-[#3d3b37] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed shrink-0"
							title="Rehacer (Ctrl + Y)"
						>
							<Redo2 class="w-4 h-4" />
						</button>
					</div>
				</div>

				<div class="flex items-center gap-2 shrink-0 pl-1">
					<button
						@click="handleClose"
						class="px-3 py-1.5 text-xs text-[#8c867a] hover:text-[#3d3b37] transition-colors"
					>
						Cancelar
					</button>
					<button
						@click="handleSave"
						class="px-4 py-1.5 bg-[#3d3b37] text-[#f7f4ea] text-xs font-medium rounded-lg hover:bg-[#2a2926] transition-colors shadow-sm"
					>
						Guardar
					</button>
				</div>
			</div>
		</div>

		<!-- Sub-modales -->
		<TagManagerModal
			:is-open="showTagModal"
			:tags="tags"
			:is-loading-ai="isAiBusy"
			@close="showTagModal = false"
			@add-tag="handleAddTag"
			@remove-tag="handleRemoveTag"
		/>

		<AiVariantsModal
			:is-open="showStyleModal"
			:variants="styleVariants"
			@close="showStyleModal = false"
			@select="selectVariant"
		/>

		<TranslationModal
			:is-open="showTranslateModal"
			:is-loading="isAiBusy"
			@close="showTranslateModal = false"
			@translate="handleTranslateLanguage"
		/>
	</div>
</template>
