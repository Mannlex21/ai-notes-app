<!-- components/layout/Sidebar.vue -->
<script setup lang="ts">
import { FileText, Archive, Settings } from "lucide-vue-next";
import { useRoute } from "vue-router";
import SearchBar from "../notes/SearchBar.vue";

defineProps<{
	isOpen: boolean;
}>();

const emit = defineEmits(["close"]);

const route = useRoute();

const navItems = [
	{ name: "Notas", path: "/", icon: FileText },
	{ name: "Archivadas", path: "/archive", icon: Archive },
	{ name: "Ajustes", path: "/settings", icon: Settings },
];
</script>

<template>
	<!-- Backdrop Únicamente para Móviles -->
	<Transition
		enter-active-class="transition-opacity ease-linear duration-200"
		enter-from-class="opacity-0"
		enter-to-class="opacity-100"
		leave-active-class="transition-opacity ease-linear duration-200"
		leave-from-class="opacity-100"
		leave-to-class="opacity-0"
	>
		<div
			v-if="isOpen"
			@click="emit('close')"
			class="fixed inset-0 bg-[#2a2926]/20 backdrop-blur-sm z-40 sm:hidden"
		></div>
	</Transition>

	<!-- Sidebar Principal -->
	<aside
		:class="[
			'bg-[#f7f4ea] border-r border-[#d8d3c5] flex flex-col transition-all duration-300',
			'fixed sm:static inset-y-0 left-0 z-50 sm:z-20',
			isOpen
				? 'w-64 translate-x-0 shadow-2xl sm:shadow-none'
				: '-translate-x-full sm:translate-x-0 sm:w-16',
		]"
	>
		<!-- Sección de Búsqueda (Solo Visible en Móviles) -->
		<div class="sm:hidden p-3 border-b border-[#d8d3c5] bg-[#f2eee3]/50">
			<SearchBar />
		</div>

		<!-- Lista de Navegación -->
		<nav class="p-2 space-y-1 mt-2">
			<router-link
				v-for="item in navItems"
				:key="item.path"
				:to="item.path"
				@click="emit('close')"
				:class="[
					'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
					route.path === item.path
						? 'bg-[#f2eee3] text-[#3d3b37] border border-[#d8d3c5] font-semibold'
						: 'text-[#8c867a] hover:text-[#3d3b37] hover:bg-[#f2eee3]/60',
				]"
			>
				<component :is="item.icon" class="w-5 h-5 shrink-0" />
				<span
					:class="[
						'truncate transition-opacity duration-200',
						isOpen ? 'inline' : 'hidden sm:hidden',
					]"
				>
					{{ item.name }}
				</span>
			</router-link>
		</nav>
	</aside>
</template>
