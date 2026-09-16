<!-- components/modals/AiMenuDropdown.vue -->
<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from "vue";
import { Sparkles, AlignLeft, ListOrdered, ListCheck } from "lucide-vue-next";

defineProps<{
	isLoading: boolean;
	disabled: boolean;
}>();

const emit = defineEmits(["expand", "refine", "summarize", "extract-tasks"]);

const isOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const dropdownStyle = ref({ top: "0px", left: "0px" });

const updatePosition = () => {
	if (!triggerRef.value) return;
	const rect = triggerRef.value.getBoundingClientRect();

	// Si la pantalla es pequeña (< 640px), centramos el menú o lo posicionamos relativo a la pantalla
	const menuWidth = 208; // 52 * 4 = 208px (w-52)
	let left = rect.left;

	// Evitar que el menú se salga por el borde derecho en pantallas móviles
	if (left + menuWidth > window.innerWidth - 16) {
		left = window.innerWidth - menuWidth - 16;
	}

	dropdownStyle.value = {
		top: `${rect.top - 8}px`, // Se posiciona justo arriba del botón
		left: `${Math.max(16, left)}px`,
	};
};

const handleClickOutside = (event: MouseEvent) => {
	const target = event.target as Node;
	const dropdownEl = document.getElementById("ai-menu-dropdown-content");

	if (
		triggerRef.value &&
		!triggerRef.value.contains(target) &&
		dropdownEl &&
		!dropdownEl.contains(target)
	) {
		isOpen.value = false;
	}
};

const toggleMenu = () => {
	if (isOpen.value) {
		isOpen.value = false;
	} else {
		updatePosition();
		isOpen.value = true;
	}
};

watch(isOpen, (val) => {
	if (val) {
		nextTick(() => updatePosition());
		window.addEventListener("click", handleClickOutside);
		window.addEventListener("resize", updatePosition);
		window.addEventListener("scroll", updatePosition, true);
	} else {
		window.removeEventListener("click", handleClickOutside);
		window.removeEventListener("resize", updatePosition);
		window.removeEventListener("scroll", updatePosition, true);
	}
});

onUnmounted(() => {
	window.removeEventListener("click", handleClickOutside);
	window.removeEventListener("resize", updatePosition);
	window.removeEventListener("scroll", updatePosition, true);
});

const handleAction = (action: () => void) => {
	action();
	isOpen.value = false;
};
</script>

<template>
	<div class="inline-block">
		<button
			ref="triggerRef"
			@click.stop="toggleMenu"
			:disabled="disabled || isLoading"
			class="p-1.5 hover:bg-[#e8e3d5] rounded-md transition-colors flex items-center gap-1 text-xs text-[#e06c53] font-medium disabled:opacity-50 shrink-0"
		>
			<Sparkles :class="['w-4 h-4', isLoading ? 'animate-spin' : '']" />
			<span>IA Assist</span>
		</button>

		<!-- Teleport envía el menú al body para ignorar el overflow/mask-image del footer -->
		<Teleport to="body">
			<div
				v-if="isOpen"
				id="ai-menu-dropdown-content"
				:style="dropdownStyle"
				class="fixed -translate-y-full w-52 bg-[#f7f4ea] border border-[#d8d3c5] rounded-lg shadow-2xl py-1 z-[9999] text-xs text-[#3d3b37]"
			>
				<button
					@click.stop="handleAction(() => emit('extract-tasks'))"
					class="w-full text-left px-3 py-2 hover:bg-[#e8e3d5] flex items-center gap-2"
				>
					<ListCheck class="w-3.5 h-3.5 text-[#e06c53]" /> Extraer
					tareas (Checklist)
				</button>

				<div class="border-t border-[#d8d3c5]/60 my-1"></div>

				<button
					@click.stop="handleAction(() => emit('expand'))"
					class="w-full text-left px-3 py-2 hover:bg-[#e8e3d5] flex items-center gap-2"
				>
					<Sparkles class="w-3.5 h-3.5 text-[#e06c53]" /> Continuar
					borrador
				</button>

				<button
					@click.stop="handleAction(() => emit('summarize'))"
					class="w-full text-left px-3 py-2 hover:bg-[#e8e3d5] flex items-center gap-2 text-[#3d3b37]"
				>
					<ListOrdered class="w-3.5 h-3.5 text-[#e06c53]" /> Resumir
					puntos clave
				</button>

				<div class="border-t border-[#d8d3c5]/60 my-1"></div>
				<div
					class="px-3 py-1 text-[10px] font-mono text-[#8c867a] uppercase"
				>
					Sugerir Variantes
				</div>

				<button
					@click.stop="handleAction(() => emit('refine', 'formal'))"
					class="w-full text-left px-3 py-1.5 hover:bg-[#e8e3d5] flex items-center gap-2"
				>
					💼 Formal
				</button>
				<button
					@click.stop="handleAction(() => emit('refine', 'conciso'))"
					class="w-full text-left px-3 py-1.5 hover:bg-[#e8e3d5] flex items-center gap-2"
				>
					<AlignLeft class="w-3.5 h-3.5 text-[#8c867a]" /> Conciso
				</button>
				<button
					@click.stop="handleAction(() => emit('refine', 'casual'))"
					class="w-full text-left px-3 py-1.5 hover:bg-[#e8e3d5] flex items-center gap-2"
				>
					💬 Casual
				</button>
			</div>
		</Teleport>
	</div>
</template>
