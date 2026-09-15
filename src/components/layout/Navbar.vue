<!-- components/Navbar.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { Settings, LogOut, LayoutGrid, List } from "lucide-vue-next";
import { useAuthStore } from "../../stores/useAuthStore";
import { useUserConfigStore } from "../../stores/useUserConfigStore";
import SearchBar from "../notes/SearchBar.vue";

const router = useRouter();
const authStore = useAuthStore();
const configStore = useUserConfigStore();

const isMenuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

// Obtener iniciales del usuario
const userInitials = computed(() => {
	if (!authStore.user?.fullName) return "U";
	const names = authStore.user.fullName.trim().split(" ");
	if (names.length >= 2) {
		return `${names[0][0]}${names[1][0]}`.toUpperCase();
	}
	return authStore.user.fullName.substring(0, 2).toUpperCase();
});

const toggleMenu = () => {
	isMenuOpen.value = !isMenuOpen.value;
};

const handleLogout = () => {
	isMenuOpen.value = false;
	authStore.logout();
	router.push("/");
};

const goToSettings = () => {
	isMenuOpen.value = false;
	router.push("/settings");
};

// Clic fuera para cerrar el menú desplegable
const handleClickOutside = (event: MouseEvent) => {
	if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
		isMenuOpen.value = false;
	}
};

onMounted(() => {
	document.addEventListener("click", handleClickOutside);
	configStore.fetchUserConfig();
});

onUnmounted(() => {
	document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
	<header
		class="h-14 border-b border-[#d8d3c5] bg-[#f2eee3] px-4 flex items-center justify-between sticky top-0 z-30"
	>
		<!-- Logotipo / Branding -->
		<div class="flex items-center gap-2">
			<div
				class="w-8 h-8 rounded-lg bg-[#3d3b37] text-[#f7f4ea] flex items-center justify-center font-serif font-bold text-base shadow-sm"
			>
				N
			</div>
			<span
				class="font-serif font-semibold text-base text-[#3d3b37] hidden sm:inline"
				>PaperNotes</span
			>
		</div>

		<!-- Componente de Búsqueda Integrado -->
		<div class="flex-1 max-w-md mx-4 flex justify-center">
			<SearchBar />
		</div>

		<!-- Acciones del Navbar (Toggle de Vista + Menú Usuario) -->
		<div class="flex items-center gap-2">
			<!-- Botón de Alternar Vista (Grid / Lista) -->
			<button
				@click="configStore.toggleView"
				type="button"
				class="p-2 rounded-lg text-[#8c867a] hover:text-[#3d3b37] hover:bg-[#e8e3d5] transition-colors flex items-center justify-center"
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

			<!-- Menú de Usuario -->
			<div class="relative" ref="menuRef">
				<button
					@click="toggleMenu"
					class="w-9 h-9 rounded-full bg-[#3d3b37] text-[#f7f4ea] font-medium text-xs flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none ring-2 ring-transparent focus:ring-[#3d3b37]/20"
				>
					{{ userInitials }}
				</button>

				<!-- Dropdown -->
				<Transition
					enter-active-class="transition duration-150 ease-out"
					enter-from-class="transform scale-95 opacity-0"
					enter-to-class="transform scale-100 opacity-100"
					leave-active-class="transition duration-100 ease-in"
					leave-from-class="transform scale-100 opacity-100"
					leave-to-class="transform scale-95 opacity-0"
				>
					<div
						v-if="isMenuOpen"
						class="absolute right-0 mt-2 w-56 bg-[#f2eee3] border border-[#d8d3c5] rounded-xl shadow-lg py-1.5 text-xs text-[#3d3b37] z-50 divide-y divide-[#d8d3c5]"
					>
						<!-- Info de Cuenta -->
						<div class="px-3.5 py-2 space-y-0.5">
							<p class="font-semibold truncate text-[#3d3b37]">
								{{ authStore.user?.fullName }}
							</p>
							<p class="text-[11px] text-[#8c867a] truncate">
								{{ authStore.user?.email }}
							</p>
						</div>

						<!-- Opciones -->
						<div class="py-1">
							<button
								@click="goToSettings"
								class="w-full text-left px-3.5 py-2 flex items-center gap-2 hover:bg-[#e8e3d5] transition-colors"
							>
								<Settings class="w-4 h-4 text-[#8c867a]" />
								Configuración
							</button>
						</div>

						<!-- Cerrar Sesión -->
						<div class="py-1">
							<button
								@click="handleLogout"
								class="w-full text-left px-3.5 py-2 flex items-center gap-2 text-red-700 hover:bg-red-50 transition-colors font-medium"
							>
								<LogOut class="w-4 h-4 text-red-600" /> Cerrar
								sesión
							</button>
						</div>
					</div>
				</Transition>
			</div>
		</div>
	</header>
</template>
