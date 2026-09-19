<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useToastStore, type Toast } from "../../stores/useToastStore";
import {
	CheckCircle2,
	AlertTriangle,
	AlertCircle,
	Info,
	X,
	ChevronDown,
	ChevronUp,
} from "lucide-vue-next";

const props = defineProps<{
	toast: Toast;
}>();

const toastStore = useToastStore();
const isExpanded = ref(false);

// Control de temporizador y hover
let timer: ReturnType<typeof setTimeout> | null = null;
let startTime = 0;
let remainingTime = props.toast.duration ?? 4000;

const startTimer = () => {
	if (remainingTime <= 0) return;
	startTime = Date.now();
	timer = setTimeout(() => {
		toastStore.remove(props.toast.id);
	}, remainingTime);
};

const pauseTimer = () => {
	if (timer) {
		clearTimeout(timer);
		timer = null;
		remainingTime -= Date.now() - startTime;
	}
};

const resumeTimer = () => {
	if (remainingTime > 0) {
		startTimer();
	}
};

onMounted(() => {
	startTimer();
});

onUnmounted(() => {
	if (timer) clearTimeout(timer);
});

const getIcon = (type: string) => {
	switch (type) {
		case "success":
			return CheckCircle2;
		case "warning":
			return AlertTriangle;
		case "error":
			return AlertCircle;
		default:
			return Info;
	}
};

const getTypeClasses = (type: string) => {
	switch (type) {
		case "success":
			return "border-[#10b981]/30 bg-[#ecfdf5] text-[#065f46]";
		case "warning":
			return "border-[#f59e0b]/30 bg-[#fffbeb] text-[#92400e]";
		case "error":
			return "border-[#e06c53]/40 bg-[#fdf2f2] text-[#991b1b]";
		case "info":
		default:
			return "border-[#3b82f6]/30 bg-[#eff6ff] text-[#1e40af]";
	}
};

const getIconColor = (type: string) => {
	switch (type) {
		case "success":
			return "text-[#10b981]";
		case "warning":
			return "text-[#f59e0b]";
		case "error":
			return "text-[#e06c53]";
		default:
			return "text-[#3b82f6]";
	}
};
</script>

<template>
	<div
		@mouseenter="pauseTimer"
		@mouseleave="resumeTimer"
		class="pointer-events-auto flex flex-col gap-2 p-3.5 rounded-xl border shadow-lg transition-all duration-300 font-sans text-sm w-full max-h-80 overflow-hidden"
		:class="getTypeClasses(toast.type)"
	>
		<!-- Header del Toast -->
		<div class="flex items-start justify-between gap-3 min-w-0">
			<div class="flex items-start gap-2.5 min-w-0 flex-1">
				<component
					:is="getIcon(toast.type)"
					class="w-5 h-5 shrink-0 mt-0.5"
					:class="getIconColor(toast.type)"
				/>
				<div class="flex flex-col min-w-0 flex-1">
					<p class="font-semibold leading-snug break-words">
						{{ toast.message }}
					</p>
				</div>
			</div>

			<div class="flex items-center gap-1 shrink-0">
				<!-- Botón para expandir/colapsar descripción si existe -->
				<button
					v-if="toast.description"
					@click="isExpanded = !isExpanded"
					class="p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/5 transition-all"
					:title="isExpanded ? 'Contraer' : 'Expandir'"
				>
					<component
						:is="isExpanded ? ChevronUp : ChevronDown"
						class="w-4 h-4"
					/>
				</button>

				<!-- Botón para cerrar -->
				<button
					@click="toastStore.remove(toast.id)"
					class="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 transition-opacity"
				>
					<X class="w-4 h-4" />
				</button>
			</div>
		</div>

		<!-- Descripción colapsable con scroll -->
		<div
			v-if="toast.description && isExpanded"
			class="pl-7 pr-1 pt-1 border-t border-black/5 text-xs opacity-90 overflow-y-auto max-h-40 leading-relaxed custom-scrollbar whitespace-pre-line"
		>
			{{ toast.description }}
		</div>
	</div>
</template>

<style scoped>
.custom-scrollbar {
	scrollbar-width: thin;
	scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}
.custom-scrollbar::-webkit-scrollbar {
	width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
	background-color: rgba(0, 0, 0, 0.2);
	border-radius: 4px;
}
</style>
