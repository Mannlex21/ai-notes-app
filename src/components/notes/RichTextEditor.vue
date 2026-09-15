<!-- components/ui/RichTextEditor.vue -->
<script setup lang="ts">
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import { watch, onBeforeUnmount } from "vue";
import {
	Bold,
	Italic,
	Strikethrough,
	List,
	ListOrdered,
	Heading1,
	Heading2,
	Quote,
	Undo,
	Redo,
} from "lucide-vue-next";

const props = withDefaults(
	defineProps<{
		modelValue: string;
		showToolbar?: boolean;
	}>(),
	{
		showToolbar: false,
	},
);

const emit = defineEmits(["update:modelValue"]);

const editor = useEditor({
	content: props.modelValue,
	extensions: [StarterKit],
	editorProps: {
		attributes: {
			class: "focus:outline-none min-h-[140px] text-sm leading-relaxed text-[#3d3b37] prose prose-sm max-w-none py-2",
		},
	},
	onUpdate: () => {
		if (editor.value) {
			emit("update:modelValue", editor.value.getHTML());
		}
	},
});

watch(
	() => props.modelValue,
	(newValue) => {
		const isSame = editor.value?.getHTML() === newValue;
		if (!isSame && editor.value) {
			editor.value.commands.setContent(newValue, { emitUpdate: false });
		}
	},
);

onBeforeUnmount(() => {
	editor.value?.destroy();
});
</script>

<template>
	<div class="w-full flex flex-col gap-1">
		<!-- Toolbar condicional -->
		<div
			v-if="editor && showToolbar"
			class="flex flex-wrap items-center gap-0.5 pb-2 border-b border-[#d8d3c5]/60 text-[#8c867a] animate-fade-in"
		>
			<button
				type="button"
				@click="editor.chain().focus().toggleBold().run()"
				:class="[
					'p-1.5 rounded-md hover:bg-[#e8e3d5] hover:text-[#3d3b37] transition-colors',
					{ 'bg-[#e8e3d5] text-[#3d3b37]': editor.isActive('bold') },
				]"
				title="Negrita"
			>
				<Bold class="w-3.5 h-3.5" />
			</button>

			<button
				type="button"
				@click="editor.chain().focus().toggleItalic().run()"
				:class="[
					'p-1.5 rounded-md hover:bg-[#e8e3d5] hover:text-[#3d3b37] transition-colors',
					{
						'bg-[#e8e3d5] text-[#3d3b37]':
							editor.isActive('italic'),
					},
				]"
				title="Cursiva"
			>
				<Italic class="w-3.5 h-3.5" />
			</button>

			<button
				type="button"
				@click="editor.chain().focus().toggleStrike().run()"
				:class="[
					'p-1.5 rounded-md hover:bg-[#e8e3d5] hover:text-[#3d3b37] transition-colors',
					{
						'bg-[#e8e3d5] text-[#3d3b37]':
							editor.isActive('strike'),
					},
				]"
				title="Tachado"
			>
				<Strikethrough class="w-3.5 h-3.5" />
			</button>

			<div class="h-4 w-[1px] bg-[#d8d3c5] mx-1"></div>

			<button
				type="button"
				@click="
					editor.chain().focus().toggleHeading({ level: 1 }).run()
				"
				:class="[
					'p-1.5 rounded-md hover:bg-[#e8e3d5] hover:text-[#3d3b37] transition-colors',
					{
						'bg-[#e8e3d5] text-[#3d3b37]': editor.isActive(
							'heading',
							{ level: 1 },
						),
					},
				]"
				title="Título grande"
			>
				<Heading1 class="w-3.5 h-3.5" />
			</button>

			<button
				type="button"
				@click="
					editor.chain().focus().toggleHeading({ level: 2 }).run()
				"
				:class="[
					'p-1.5 rounded-md hover:bg-[#e8e3d5] hover:text-[#3d3b37] transition-colors',
					{
						'bg-[#e8e3d5] text-[#3d3b37]': editor.isActive(
							'heading',
							{ level: 2 },
						),
					},
				]"
				title="Título mediano"
			>
				<Heading2 class="w-3.5 h-3.5" />
			</button>

			<div class="h-4 w-[1px] bg-[#d8d3c5] mx-1"></div>

			<button
				type="button"
				@click="editor.chain().focus().toggleBulletList().run()"
				:class="[
					'p-1.5 rounded-md hover:bg-[#e8e3d5] hover:text-[#3d3b37] transition-colors',
					{
						'bg-[#e8e3d5] text-[#3d3b37]':
							editor.isActive('bulletList'),
					},
				]"
				title="Lista de viñetas"
			>
				<List class="w-3.5 h-3.5" />
			</button>

			<button
				type="button"
				@click="editor.chain().focus().toggleOrderedList().run()"
				:class="[
					'p-1.5 rounded-md hover:bg-[#e8e3d5] hover:text-[#3d3b37] transition-colors',
					{
						'bg-[#e8e3d5] text-[#3d3b37]':
							editor.isActive('orderedList'),
					},
				]"
				title="Lista numerada"
			>
				<ListOrdered class="w-3.5 h-3.5" />
			</button>

			<button
				type="button"
				@click="editor.chain().focus().toggleBlockquote().run()"
				:class="[
					'p-1.5 rounded-md hover:bg-[#e8e3d5] hover:text-[#3d3b37] transition-colors',
					{
						'bg-[#e8e3d5] text-[#3d3b37]':
							editor.isActive('blockquote'),
					},
				]"
				title="Cita"
			>
				<Quote class="w-3.5 h-3.5" />
			</button>

			<div class="h-4 w-[1px] bg-[#d8d3c5] mx-1"></div>

			<button
				type="button"
				@click="editor.chain().focus().undo().run()"
				:disabled="!editor.can().undo()"
				class="p-1.5 rounded-md hover:bg-[#e8e3d5] hover:text-[#3d3b37] transition-colors disabled:opacity-40"
				title="Deshacer"
			>
				<Undo class="w-3.5 h-3.5" />
			</button>

			<button
				type="button"
				@click="editor.chain().focus().redo().run()"
				:disabled="!editor.can().redo()"
				class="p-1.5 rounded-md hover:bg-[#e8e3d5] hover:text-[#3d3b37] transition-colors disabled:opacity-40"
				title="Rehacer"
			>
				<Redo class="w-3.5 h-3.5" />
			</button>
		</div>

		<EditorContent :editor="editor" />
	</div>
</template>

<!-- En RichTextEditor.vue -->
<style scoped>
:deep(.tiptap),
:deep(.ProseMirror) {
	outline: none;
}

/* Listas desordenadas (viñetas) */
:deep(.tiptap ul),
:deep(.ProseMirror ul) {
	list-style-type: disc !important;
	padding-left: 1.5rem !important;
	margin-top: 0.5rem !important;
	margin-bottom: 0.5rem !important;
}

/* Listas ordenadas (números) */
:deep(.tiptap ol),
:deep(.ProseMirror ol) {
	list-style-type: decimal !important;
	padding-left: 1.5rem !important;
	margin-top: 0.5rem !important;
	margin-bottom: 0.5rem !important;
}

/* Elementos de lista */
:deep(.tiptap li),
:deep(.ProseMirror li) {
	display: list-item !important;
	margin-bottom: 0.25rem !important;
}

/* Párrafos */
:deep(.tiptap p),
:deep(.ProseMirror p) {
	margin-bottom: 0.5rem;
}

/* Encabezados */
:deep(.tiptap h1),
:deep(.ProseMirror h1) {
	font-size: 1.25rem;
	font-weight: 700;
	color: #2a2926;
	margin-top: 0.75rem;
	margin-bottom: 0.25rem;
}

:deep(.tiptap h2),
:deep(.ProseMirror h2) {
	font-size: 1.1rem;
	font-weight: 600;
	color: #2a2926;
	margin-top: 0.75rem;
	margin-bottom: 0.25rem;
}

/* Citas */
:deep(.tiptap blockquote),
:deep(.ProseMirror blockquote) {
	border-left: 3px solid #e06c53;
	padding-left: 0.75rem;
	font-style: italic;
	color: #59554d;
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
}

/* Negritas */
:deep(.tiptap strong),
:deep(.ProseMirror strong) {
	font-weight: 600;
	color: #2a2926;
}
</style>
