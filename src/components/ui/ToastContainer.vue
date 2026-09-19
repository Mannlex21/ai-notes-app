<!-- components/ui/ToastContainer.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { useToastStore, type ToastPosition } from "../../stores/useToastStore";
import ToastItem from "./ToastItem.vue";

const toastStore = useToastStore();

const POSITIONS: ToastPosition[] = [
	"top-right",
	"top-left",
	"bottom-right",
	"bottom-left",
	"top-center",
	"bottom-center",
];

const toastsByPosition = computed(() => {
	const grouped: Record<ToastPosition, typeof toastStore.toasts> = {
		"top-right": [],
		"top-left": [],
		"bottom-right": [],
		"bottom-left": [],
		"top-center": [],
		"bottom-center": [],
	};

	toastStore.toasts.forEach((toast) => {
		const pos = toast.position || "top-right";
		grouped[pos].push(toast);
	});

	return grouped;
});

const getPositionClasses = (position: ToastPosition) => {
	switch (position) {
		case "top-left":
			return "top-5 left-5 items-start";
		case "bottom-right":
			return "bottom-5 right-5 items-end";
		case "bottom-left":
			return "bottom-5 left-5 items-start";
		case "top-center":
			return "top-5 left-1/2 -translate-x-1/2 items-center";
		case "bottom-center":
			return "bottom-5 left-1/2 -translate-x-1/2 items-center";
		case "top-right":
		default:
			return "top-5 right-5 items-end";
	}
};
</script>

<template>
	<template v-for="pos in POSITIONS" :key="pos">
		<div
			v-if="toastsByPosition[pos].length"
			class="fixed z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
			:class="getPositionClasses(pos)"
		>
			<TransitionGroup name="toast">
				<ToastItem
					v-for="toast in toastsByPosition[pos]"
					:key="toast.id"
					:toast="toast"
				/>
			</TransitionGroup>
		</div>
	</template>
</template>

<style scoped>
.toast-enter-from {
	opacity: 0;
	transform: translateY(1rem) scale(0.95);
}
.toast-leave-to {
	opacity: 0;
	transform: translateY(-0.5rem) scale(0.95);
}
.toast-enter-active,
.toast-leave-active {
	transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
