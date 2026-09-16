<!-- App.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import Navbar from "./components/layout/Navbar.vue";
import Sidebar from "./components/layout/Sidebar.vue";
import { useRoute } from "vue-router";

const route = useRoute();
// Cambiado a false por defecto para móvil
const isSidebarOpen = ref(false);

const toggleSidebar = () => {
	isSidebarOpen.value = !isSidebarOpen.value;
};

const isPublicPage = computed(() => !!route.meta.hideLayout);
</script>

<template>
	<div v-if="isPublicPage">
		<RouterView />
	</div>

	<div
		v-else
		class="min-h-screen bg-[#f7f4ea] text-[#3d3b37] flex flex-col font-sans"
	>
		<Navbar
			:is-sidebar-open="isSidebarOpen"
			@toggle-sidebar="toggleSidebar"
		/>
		<div class="flex flex-1 relative overflow-hidden">
			<Sidebar :is-open="isSidebarOpen" @close="isSidebarOpen = false" />
			<main
				class="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full overflow-y-auto"
			>
				<RouterView />
			</main>
		</div>
	</div>
</template>
