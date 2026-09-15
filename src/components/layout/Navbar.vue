<!-- components/layout/Navbar.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Settings, LogOut, LayoutGrid, List, Menu, X } from "lucide-vue-next";
import { useAuthStore } from "../../stores/useAuthStore";
import { useUserConfigStore } from "../../stores/useUserConfigStore";
import SearchBar from "../notes/SearchBar.vue";

defineProps<{
	isSidebarOpen?: boolean;
}>();

const emit = defineEmits(["toggle-sidebar"]);

const router = useRouter();
const authStore = useAuthStore();
const configStore = useUserConfigStore();

const isUserMenuOpen = ref(false);

const userInitials = computed(() => {
	if (!authStore.user?.fullName) return "U";
	const names = authStore.user.fullName.trim().split(" ");
	if (names.length >= 2) {
		return `${names[0][0]}${names[1][0]}`.toUpperCase();
	}
	return authStore.user.fullName.substring(0, 2).toUpperCase();
});

const toggleUserMenu = () => {
	isUserMenuOpen.value = !isUserMenuOpen.value;
};

const handleLogout = () => {
	isUserMenuOpen.value = false;
	authStore.logout();
	router.push("/");
};

const goToSettings = () => {
	isUserMenuOpen.value = false;
	router.push("/settings");
};

onMounted(() => {
	configStore.fetchUserConfig();
});
</script>

<template>
	<header
		class="h-14 border-b border-[#d8d3c5] bg-[#f2eee3] px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30"
	>
		<!-- Izquierda: Menú Hamburguesa + Logo -->
		<div class="flex items-center gap-2">
			<button
				@click="emit('toggle-sidebar')"
				type="button"
				class="p-1.5 rounded-lg text-[#8c867a] hover:text-[#3d3b37] hover:bg-[#e8e3d5] transition-colors focus:outline-none"
				title="Abrir menú de navegación"
			>
				<Menu class="w-5 h-5" />
			</button>

			<div class="flex items-center gap-2">
				<div
					class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#3d3b37] text-[#f7f4ea] flex items-center justify-center font-serif font-bold text-sm sm:text-base shadow-sm"
				>
					N
				</div>
				<span
					class="font-serif font-semibold text-sm sm:text-base text-[#3d3b37]"
				>
					Notes.AI
				</span>
			</div>
		</div>

		<!-- Búsqueda en Pantallas Medianas/Grandes -->
		<div class="hidden sm:flex flex-1 max-w-md mx-4 justify-center">
			<SearchBar />
		</div>

		<!-- Acciones del Navbar -->
		<div class="flex items-center gap-1 sm:gap-2">
			<!-- Toggle de Vista en Escritorio -->
			<button
				@click="configStore.toggleView"
				type="button"
				class="hidden sm:flex p-2 rounded-lg text-[#8c867a] hover:text-[#3d3b37] hover:bg-[#e8e3d5] transition-colors items-center justify-center"
				:title="
					configStore.currentView === 'grid'
						? 'Cambiar a vista de lista'
						: 'Cambiar a vista cuadrícula'
				"
			>
				<List
					v-if="configStore.currentView === 'grid'"
					class="w-5 h-5"
				/>
				<LayoutGrid v-else class="w-5 h-5" />
			</button>

			<!-- Avatar de Usuario -->
			<button
				@click="toggleUserMenu"
				class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#3d3b37] text-[#f7f4ea] font-medium text-xs flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none ring-2 ring-transparent focus:ring-[#3d3b37]/20"
				title="Perfil de usuario"
			>
				{{ userInitials }}
			</button>
		</div>
	</header>

	<!-- Sidebar Contextual de Perfil (Lado Derecho) -->
	<Teleport to="body">
		<Transition
			enter-active-class="transition-opacity ease-linear duration-200"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition-opacity ease-linear duration-200"
			leave-from-class="opacity-100"
			leave-to-class="opacity-0"
		>
			<div
				v-if="isUserMenuOpen"
				@click="isUserMenuOpen = false"
				class="fixed inset-0 bg-[#2a2926]/20 backdrop-blur-sm z-40"
			></div>
		</Transition>

		<Transition
			enter-active-class="transition-transform ease-out duration-300"
			enter-from-class="translate-x-full"
			enter-to-class="translate-x-0"
			leave-active-class="transition-transform ease-in duration-200"
			leave-from-class="translate-x-0"
			leave-to-class="translate-x-full"
		>
			<aside
				v-if="isUserMenuOpen"
				class="fixed top-0 right-0 h-full w-72 bg-[#f7f4ea] border-l border-[#d8d3c5] z-50 shadow-2xl flex flex-col justify-between p-4"
			>
				<div>
					<div
						class="flex items-center justify-between pb-4 border-b border-[#d8d3c5]"
					>
						<span
							class="text-xs font-semibold uppercase tracking-wider text-[#8c867a]"
						>
							Perfil de usuario
						</span>
						<button
							@click="isUserMenuOpen = false"
							class="p-1 text-[#8c867a] hover:text-[#3d3b37] hover:bg-[#e8e3d5] rounded-md transition-colors"
						>
							<X class="w-5 h-5" />
						</button>
					</div>

					<div class="py-5 flex items-center gap-3">
						<div
							class="w-12 h-12 rounded-full bg-[#3d3b37] text-[#f7f4ea] font-medium text-sm flex items-center justify-center shrink-0 shadow-sm"
						>
							{{ userInitials }}
						</div>
						<div class="overflow-hidden">
							<p
								class="font-semibold text-sm text-[#3d3b37] truncate"
							>
								{{ authStore.user?.fullName }}
							</p>
							<p class="text-xs text-[#8c867a] truncate">
								{{ authStore.user?.email }}
							</p>
						</div>
					</div>

					<nav class="space-y-1 pt-2">
						<button
							@click="goToSettings"
							class="w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-medium text-[#3d3b37] hover:bg-[#e8e3d5] transition-colors flex items-center gap-3"
						>
							<Settings class="w-4 h-4 text-[#8c867a]" />
							Configuración
						</button>
					</nav>
				</div>

				<div class="pt-4 border-t border-[#d8d3c5]">
					<button
						@click="handleLogout"
						class="w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100/80 transition-colors flex items-center gap-3"
					>
						<LogOut class="w-4 h-4 text-red-600" />
						Cerrar sesión
					</button>
				</div>
			</aside>
		</Transition>
	</Teleport>
</template>
