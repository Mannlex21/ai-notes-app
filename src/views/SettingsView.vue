<!-- SettingsView.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
	User,
	Sparkles,
	Check,
	Save,
	Lock,
	AlertTriangle,
	Zap,
} from "lucide-vue-next";
import { useAuthStore } from "../stores/useAuthStore";
import { useUserConfigStore } from "../stores/useUserConfigStore";

const authStore = useAuthStore();
const configStore = useUserConfigStore();

const fullName = ref(authStore.user?.fullName || "");
const email = ref(authStore.user?.email || "");
const aiTemperature = ref(0.7);
const autoTagging = ref(true);

const saving = ref(false);
const successMessage = ref("");

onMounted(async () => {
	await configStore.fetchUserConfig();
	aiTemperature.value = configStore.aiTemperature;
	autoTagging.value = configStore.autoTagging;
});

const handleSaveSettings = async () => {
	if (!authStore.user?.id) return;
	saving.value = true;
	successMessage.value = "";

	try {
		// Actualizar nombre completo en la API
		const res = await fetch("/api/settings/user", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				userId: authStore.user.id,
				fullName: fullName.value,
			}),
		});

		if (!res.ok) throw new Error("Error al actualizar perfil");

		// Actualizar nombre en AuthStore local
		authStore.setUser({
			...authStore.user,
			fullName: fullName.value,
		});

		// Guardar opciones modificables de IA
		await configStore.saveAiSettings(
			aiTemperature.value,
			autoTagging.value,
		);

		successMessage.value = "Configuración guardada correctamente.";
		setTimeout(() => {
			successMessage.value = "";
		}, 3000);
	} catch (err) {
		console.error("Error al guardar ajustes:", err);
	} finally {
		saving.value = false;
	}
};
</script>

<template>
	<div class="max-w-3xl mx-auto space-y-8 pb-12">
		<div>
			<h1 class="text-2xl font-serif font-bold text-[#3d3b37]">
				Configuración
			</h1>
			<p class="text-xs text-[#8c867a]">
				Administra la información de tu cuenta y los parámetros de la
				Inteligencia Artificial.
			</p>
		</div>

		<!-- Mensaje de Éxito -->
		<div
			v-if="successMessage"
			class="flex items-center gap-2 p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs rounded-xl"
		>
			<Check class="w-4 h-4 text-emerald-600" /> {{ successMessage }}
		</div>

		<!-- Alerta de Límite Alcanzado -->
		<div
			v-if="configStore.isLimitReached"
			class="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-2xl"
		>
			<AlertTriangle class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
			<div>
				<p class="font-semibold">
					Has alcanzado tu límite diario de peticiones
				</p>
				<p class="text-amber-800 text-[11px] mt-0.5">
					Has consumido tus
					{{ configStore.dailyPromptLimit }} peticiones asignadas por
					hoy. Las funciones de asistencia por IA se reanudarán
					mañana.
				</p>
			</div>
		</div>

		<form @submit.prevent="handleSaveSettings" class="space-y-6">
			<!-- Sección Perfil de Usuario -->
			<div
				class="bg-[#f2eee3] border border-[#d8d3c5] rounded-2xl p-6 space-y-4"
			>
				<div
					class="flex items-center gap-2 border-b border-[#d8d3c5] pb-3"
				>
					<User class="w-4 h-4 text-[#8c867a]" />
					<h2 class="font-medium text-sm text-[#3d3b37]">
						Perfil de usuario
					</h2>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1">
						<label class="text-xs font-medium text-[#3d3b37]"
							>Nombre completo</label
						>
						<input
							v-model="fullName"
							type="text"
							required
							class="w-full bg-[#f7f4ea] border border-[#d8d3c5] rounded-lg px-3 py-2 text-xs text-[#3d3b37] focus:outline-none focus:border-[#3d3b37]"
						/>
					</div>

					<div class="space-y-1">
						<label class="text-xs font-medium text-[#3d3b37]"
							>Correo electrónico</label
						>
						<input
							v-model="email"
							type="email"
							disabled
							class="w-full bg-[#e8e3d5] border border-[#d8d3c5] rounded-lg px-3 py-2 text-xs text-[#8c867a] cursor-not-allowed"
						/>
					</div>
				</div>
			</div>

			<!-- Sección Parámetros de IA -->
			<div
				class="bg-[#f2eee3] border border-[#d8d3c5] rounded-2xl p-6 space-y-4"
			>
				<div
					class="flex items-center justify-between border-b border-[#d8d3c5] pb-3"
				>
					<div class="flex items-center gap-2">
						<Sparkles class="w-4 h-4 text-[#e06c53]" />
						<h2 class="font-medium text-sm text-[#3d3b37]">
							Configuración de Inteligencia Artificial
						</h2>
					</div>

					<!-- Contador de Prompts Faltantes -->
					<div
						class="flex items-center gap-1.5 px-3 py-1 bg-[#f7f4ea] border border-[#d8d3c5] rounded-full text-xs text-[#3d3b37]"
					>
						<Zap
							class="w-3.5 h-3.5 text-amber-500 fill-amber-500"
						/>
						<span
							><strong>{{ configStore.remainingPrompts }}</strong>
							/ {{ configStore.dailyPromptLimit }} peticiones
							restantes hoy</span
						>
					</div>
				</div>

				<div class="space-y-4">
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<!-- Proveedor de IA (Deshabilitado pero visible) -->
						<div class="space-y-1">
							<div class="flex items-center justify-between">
								<label
									class="text-xs font-medium text-[#3d3b37]"
									>Proveedor de IA</label
								>
								<Lock class="w-3 h-3 text-[#8c867a]" />
							</div>
							<select
								:value="configStore.aiProvider || 'gemini'"
								disabled
								class="w-full bg-[#e8e3d5] border border-[#d8d3c5] rounded-lg px-3 py-2 text-xs text-[#3d3b37] font-medium opacity-100 cursor-not-allowed"
							>
								<option value="gemini">
									<!-- {{ GEMINI_MODEL }} -->
								</option>
							</select>
						</div>

						<!-- Límite Diario de Peticiones (Deshabilitado pero visible) -->
						<div class="space-y-1">
							<div class="flex items-center justify-between">
								<label
									class="text-xs font-medium text-[#3d3b37]"
									>Límite diario de peticiones</label
								>
								<Lock class="w-3 h-3 text-[#8c867a]" />
							</div>
							<input
								:value="configStore.dailyPromptLimit || 20"
								type="number"
								disabled
								class="w-full bg-[#e8e3d5] border border-[#d8d3c5] rounded-lg px-3 py-2 text-xs text-[#3d3b37] font-medium opacity-100 cursor-not-allowed"
							/>
						</div>
					</div>

					<!-- Slider de Temperatura (Habilitado) -->
					<div class="space-y-2 pt-2">
						<div class="flex justify-between items-center text-xs">
							<span class="font-medium text-[#3d3b37]"
								>Creatividad / Temperatura:
								{{ aiTemperature }}</span
							>
							<span class="text-[#8c867a]">{{
								aiTemperature < 0.5 ? "Preciso" : "Creativo"
							}}</span>
						</div>
						<input
							v-model.number="aiTemperature"
							type="range"
							min="0.0"
							max="1.0"
							step="0.1"
							class="w-full accent-[#3d3b37] cursor-pointer"
						/>
					</div>

					<!-- Toggle de Auto-etiquetado (Habilitado) -->
					<div class="flex items-center justify-between pt-2">
						<div>
							<p class="text-xs font-medium text-[#3d3b37]">
								Etiquetado automático
							</p>
							<p class="text-[11px] text-[#8c867a]">
								Generar etiquetas relevantes con IA al guardar
								una nota
							</p>
						</div>
						<input
							v-model="autoTagging"
							type="checkbox"
							class="w-4 h-4 accent-[#3d3b37] rounded cursor-pointer"
						/>
					</div>
				</div>
			</div>

			<!-- Botón de Guardado -->
			<div class="flex justify-end">
				<button
					type="submit"
					:disabled="saving"
					class="flex items-center gap-2 px-5 py-2.5 bg-[#3d3b37] text-[#f7f4ea] text-xs font-medium rounded-xl hover:bg-[#2a2926] transition-colors shadow-sm disabled:opacity-50"
				>
					<Save class="w-4 h-4" />
					{{ saving ? "Guardando..." : "Guardar Cambios" }}
				</button>
			</div>
		</form>
	</div>
</template>
