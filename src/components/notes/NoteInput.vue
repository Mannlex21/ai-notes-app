<!-- NoteInput.vue -->
<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from "vue";
import {
	Plus,
	CheckSquare,
	X,
	Type,
	Languages,
	LanguagesIcon,
	Wand2,
} from "lucide-vue-next";
import { useNotesStore } from "../../stores/useNotesStore";
import AiMenuDropdown from "../modals/AiMenuDropdown.vue";
import AiVariantsModal from "../modals/AiVariantsModal.vue";
import TagManagerModal from "../modals/TagManagerModal.vue";
import RichTextEditor from "../notes/RichTextEditor.vue";
import TranslationModal from "../modals/TranslationModal.vue";
import { Trash2 } from "lucide-vue-next";

const store = useNotesStore();
const emit = defineEmits(["save-note"]);

const isOpenModal = ref(false);
const title = ref("");
const content = ref("");
const isChecklist = ref(false);
const showToolbar = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// Estado para etiquetas y modal de categorías
const tags = ref<string[]>([]);
const noteColor = ref("#f2eee3");
const showTagModal = ref(false);
const showStyleModal = ref(false);
const showTranslateModal = ref(false);
const styleVariants = ref<string[]>([]);

const checklistItems = ref<{ text: string; done: boolean }[]>([
	{ text: "", done: false },
]);

const adjustTextareaHeight = () => {
	nextTick(() => {
		if (textareaRef.value) {
			textareaRef.value.style.height = "auto";
			textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
		}
	});
};

watch(content, adjustTextareaHeight);
watch(isChecklist, (val) => {
	if (val && content.value.trim()) {
		processMultilineToChecklist(content.value);
		content.value = ""; // Limpiar el área de texto plano
	}
});

const handleKeyDown = (event: KeyboardEvent) => {
	if (event.key === "Escape") {
		if (showTagModal.value) {
			showTagModal.value = false;
		} else if (showStyleModal.value) {
			showStyleModal.value = false;
		} else if (isOpenModal.value) {
			resetForm();
		}
	}
};

window.addEventListener("keydown", handleKeyDown);
onUnmounted(() => {
	window.removeEventListener("keydown", handleKeyDown);
});

const openModal = () => {
	isOpenModal.value = true;
	adjustTextareaHeight();
};

// Helper para enfocar el último input disponible
const focusLastInput = () => {
	nextTick(() => {
		const inputs = document.querySelectorAll<HTMLInputElement>(
			".checklist-item-input",
		);
		const lastInput = inputs[inputs.length - 1];
		if (lastInput) {
			lastInput.focus();
		}
	});
};

// Agregar una nueva casilla al presionar Enter en un ítem específico
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

// Gestión de etiquetas
const handleAddTag = (tag: string) => {
	if (!tags.value.includes(tag)) {
		tags.value.push(tag);
	}
};

const handleRemoveTag = (tagToRemove: string) => {
	tags.value = tags.value.filter((t) => t !== tagToRemove);
};

// Auto-categorizar Borrador activo con IA
const handleAutoTagAi = async () => {
	if (!content.value.trim()) return;

	const result = await store.suggestTagsForText(content.value);
	if (result.tags && result.tags.length > 0) {
		const combined = new Set([...tags.value, ...result.tags]);
		tags.value = Array.from(combined);
		if (result.color) {
			noteColor.value = result.color;
		}
	}
};

const resetForm = () => {
	title.value = "";
	content.value = "";
	tags.value = [];
	noteColor.value = "#f2eee3";
	isChecklist.value = false;
	showStyleModal.value = false;
	showTagModal.value = false;
	checklistItems.value = [{ text: "", done: false }];
	isOpenModal.value = false;
};

const handleSave = () => {
	const hasTitle = title.value.trim().length > 0;
	const hasContent = content.value.trim().length > 0;
	const validChecklist = checklistItems.value.filter(
		(i) => i.text.trim().length > 0,
	);

	if (!hasTitle && !hasContent && validChecklist.length === 0) {
		resetForm();
		return;
	}

	let finalContent = content.value.trim();
	if (isChecklist.value) {
		finalContent = validChecklist
			.map((item) => `[${item.done ? "x" : " "}] ${item.text}`)
			.join("\n");
	}

	emit("save-note", {
		title: title.value.trim(),
		content: finalContent,
		tags: [...tags.value],
		color: noteColor.value,
	});

	resetForm();
};

const handleExpandText = async () => {
	if (!content.value.trim()) return;

	const expanded = await store.expandText(content.value);

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

		adjustTextareaHeight();
	}
};

const handleRefineStyle = async (tone: "formal" | "conciso" | "casual") => {
	if (!content.value.trim()) return;
	const options = await store.refineStyleOptions(content.value, tone);
	if (options && options.length > 0) {
		styleVariants.value = options;
		showStyleModal.value = true;
	}
};

const selectVariant = (selectedText: string) => {
	content.value = selectedText;
	showStyleModal.value = false;
	adjustTextareaHeight();
};

const handleSummarize = async () => {
	if (!content.value.trim()) return;

	const summaryResult = await store.summarizeDraft(content.value);

	if (summaryResult) {
		styleVariants.value = [summaryResult];
		showStyleModal.value = true;
	}
};

const handleExtractTasks = async () => {
	if (!content.value.trim()) return;

	const extractedTasks = await store.extractActionItems(content.value);

	if (extractedTasks.length > 0) {
		checklistItems.value = extractedTasks.map((taskText) => ({
			text: taskText,
			done: false,
		}));
		isChecklist.value = true;
	}
};

const handleTranslateLanguage = async (targetLanguage: string) => {
	if (!content.value.trim()) return;

	const translated = await store.translateText(content.value, targetLanguage);
	if (translated) {
		content.value = translated;
		adjustTextareaHeight();
	}
	showTranslateModal.value = false;
};

const handleAutoTitle = async () => {
	if (!content.value.trim()) return;

	const generatedTitle = await store.generateTitle(content.value);
	if (generatedTitle) {
		title.value = generatedTitle;
	}
};

// Función helper para procesar texto multilínea a checklist
const processMultilineToChecklist = (rawText: string) => {
	const lines = rawText
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (lines.length > 0) {
		const newItems = lines.map((text) => ({ text, done: false }));
		checklistItems.value = [...checklistItems.value, ...newItems];
	}
};

// Manejo de pegado multilínea
const handlePasteToChecklist = (event: ClipboardEvent) => {
	const pastedText = event.clipboardData?.getData("text");

	if (pastedText && pastedText.includes("\n")) {
		event.preventDefault();

		const lines = pastedText
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		if (lines.length === 0) return;

		const newItems = lines.map((text) => ({ text, done: false }));
		const existingItems = checklistItems.value.filter(
			(item) => item.text.trim().length > 0,
		);

		checklistItems.value = [
			...existingItems,
			...newItems,
			{ text: "", done: false },
		];

		focusLastInput();
	}
};
</script>

<template>
	<div class="max-w-2xl mx-auto mb-8">
		<!-- Trigger Modal -->
		<div
			class="bg-[#f2eee3] border border-[#d8d3c5] rounded-xl p-4 shadow-sm hover:border-[#8c867a] cursor-pointer transition-all duration-200"
			@click="openModal"
		>
			<div class="flex items-center justify-between">
				<span class="text-[#8c867a] text-sm font-medium"
					>Crear una nota...</span
				>
				<button
					@click.stop="
						isChecklist = true;
						openModal();
					"
					class="p-1.5 hover:text-[#3d3b37] hover:bg-[#e8e3d5] rounded-md transition-colors text-[#8c867a]"
					title="Lista de verificación"
				>
					<CheckSquare class="w-4 h-4" />
				</button>
			</div>
		</div>

		<!-- Modal Principal -->
		<div
			v-if="isOpenModal"
			class="fixed inset-0 z-40 bg-[#2a2926]/15 backdrop-blur-sm flex items-center justify-center p-4"
		>
			<div
				class="border border-[#d8d3c5] rounded-xl p-5 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col justify-between overflow-hidden transition-colors duration-300"
				:style="{ backgroundColor: noteColor }"
			>
				<!-- Header con Botón de Cerrar -->
				<div
					class="shrink-0 pb-3 border-b border-[#d8d3c5] flex items-center justify-between gap-3"
				>
					<div class="flex items-center gap-2 mb-2">
						<!-- Botón Auto-Título a la izquierda (Siempre visible, se activa con texto) -->
						<button
							@click="handleAutoTitle"
							:disabled="
								store.aiLoading ||
								!content ||
								content.replace(/<[^>]*>/g, '').trim()
									.length === 0
							"
							type="button"
							class="p-1 rounded-md hover:bg-[#e8e3d5] text-[#e06c53] transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center justify-center shrink-0"
							title="Generar título inteligente con IA"
						>
							<Wand2
								:class="[
									'w-5 h-5 text-[#e06c53] stroke-[2.25]',
									store.aiLoading ? 'animate-spin' : '',
								]"
							/>
						</button>

						<!-- Input de Título -->
						<input
							v-model="title"
							type="text"
							placeholder="Título"
							class="w-full bg-transparent text-lg font-bold text-[#3d3b37] placeholder-[#8c867a] focus:outline-none"
						/>
					</div>
					<button
						@click="resetForm"
						class="p-1 rounded-md text-[#8c867a] hover:text-[#3d3b37] hover:bg-[#e8e3d5] transition-colors"
						title="Cerrar sin guardar"
					>
						<X class="w-5 h-5" />
					</button>
				</div>

				<!-- Body -->
				<div class="flex-1 overflow-y-auto my-3 pr-1">
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
								@paste="handlePasteToChecklist"
								@keydown.enter.prevent="addChecklistItem(index)"
								placeholder="Escribe una tarea..."
								class="checklist-item-input w-full bg-transparent text-sm text-[#3d3b37] placeholder-[#8c867a] focus:outline-none"
								:class="{
									'line-through text-[#8c867a]': item.done,
								}"
							/>

							<!-- Botón de Borrar (se revela al pasar el cursor o al enfocar) -->
							<button
								type="button"
								@click="removeChecklistItem(index)"
								class="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-[#8c867a] hover:text-[#e06c53] hover:bg-[#e8e3d5] rounded-md transition-all shrink-0"
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

				<!-- Chips de Categorías (Arriba del Footer) -->
				<div
					class="px-1 py-2 flex flex-wrap items-center gap-1.5 border-t border-[#d8d3c5]/60"
				>
					<span
						v-for="tag in tags"
						:key="tag"
						class="text-[11px] px-2 py-0.5 rounded-full bg-[#e8e3d5] text-[#3d3b37] border border-[#d8d3c5] font-medium flex items-center gap-1"
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
						class="p-1 text-xs text-[#8c867a] hover:text-[#e06c53] hover:bg-[#e8e3d5] rounded-md transition-colors flex items-center gap-1 font-medium"
						title="Gestionar categorías"
					>
						<Plus class="w-3.5 h-3.5" />
						<span v-if="tags.length === 0" class="text-[11px]"
							>Categoría</span
						>
					</button>
				</div>

				<!-- Footer -->
				<div
					class="shrink-0 pt-2 border-t border-[#d8d3c5] flex items-center justify-between"
				>
					<div class="flex items-center gap-1 text-[#8c867a]">
						<button
							@click="isChecklist = !isChecklist"
							:class="[
								'p-1.5 rounded-md hover:bg-[#e8e3d5] transition-colors',
								isChecklist ? 'text-[#e06c53]' : '',
							]"
							title="Cambiar formato de lista"
						>
							<CheckSquare class="w-4 h-4" />
						</button>

						<button
							v-if="!isChecklist"
							@click="showToolbar = !showToolbar"
							:class="[
								'p-1.5 rounded-md hover:bg-[#e8e3d5] transition-colors',
								showToolbar
									? 'text-[#e06c53] bg-[#e8e3d5]'
									: '',
							]"
							title="Herramientas de formato"
						>
							<Type class="w-4 h-4" />
						</button>
						<button
							v-if="!isChecklist"
							@click="showTranslateModal = true"
							:disabled="!content.trim() || store.aiLoading"
							class="p-1.5 rounded-md hover:bg-[#e8e3d5] text-[#8c867a] hover:text-[#3d3b37] transition-colors disabled:opacity-40 flex items-center gap-1"
							title="Traducir nota"
						>
							<Languages class="w-4 h-4" />
						</button>

						<AiMenuDropdown
							v-if="!isChecklist"
							:is-loading="store.aiLoading"
							:disabled="!content.trim()"
							@expand="handleExpandText"
							@summarize="handleSummarize"
							@refine="handleRefineStyle"
							@extract-tasks="handleExtractTasks"
						/>
					</div>

					<div class="flex items-center gap-2">
						<button
							@click="resetForm"
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
		</div>

		<!-- Modal de Categorías -->
		<TagManagerModal
			:is-open="showTagModal"
			:tags="tags"
			:is-loading-ai="store.aiLoading"
			@close="showTagModal = false"
			@add-tag="handleAddTag"
			@remove-tag="handleRemoveTag"
			@auto-tag="handleAutoTagAi"
		/>

		<!-- Modal de Variantes -->
		<AiVariantsModal
			:is-open="showStyleModal"
			:variants="styleVariants"
			@close="showStyleModal = false"
			@select="selectVariant"
		/>
		<!-- Modal de Selección de Idioma -->
		<TranslationModal
			:is-open="showTranslateModal"
			:is-loading="store.aiLoading"
			@close="showTranslateModal = false"
			@translate="handleTranslateLanguage"
		/>
	</div>
</template>
