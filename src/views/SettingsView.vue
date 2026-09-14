<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { sql } from '../lib/neon'
import { User, Sliders, Sparkles, Check, Save } from 'lucide-vue-next'
import { useAuthStore } from '../stores/useAuthStore'

const authStore = useAuthStore()

const fullName = ref(authStore.user?.fullName || '')
const email = ref(authStore.user?.email || '')
const aiProvider = ref('gemini')
const dailyPromptLimit = ref(20)
const aiTemperature = ref(0.7)
const autoTagging = ref(true)

const saving = ref(false)
const successMessage = ref('')

onMounted(async () => {
  if (!authStore.user?.id) return
  
  try {
    const rows = await sql`
      SELECT ai_provider, daily_prompt_limit, ai_temperature, auto_tagging 
      FROM user_settings 
      WHERE user_id = ${authStore.user.id};
    `
    if (rows.length > 0) {
      const settings = rows[0]
      aiProvider.value = settings.ai_provider || 'gemini'
      dailyPromptLimit.value = settings.daily_prompt_limit || 20
      aiTemperature.value = Number(settings.ai_temperature) || 0.7
      autoTagging.value = settings.auto_tagging ?? true
    }
  } catch (err) {
    console.error('Error cargando configuración:', err)
  }
})

const handleSaveSettings = async () => {
  if (!authStore.user?.id) return
  saving.value = true
  successMessage.value = ''

  try {
    // Actualizar nombre de usuario en Neon
    await sql`
      UPDATE users 
      SET full_name = ${fullName.value}, updated_at = NOW()
      WHERE id = ${authStore.user.id};
    `

    // Actualizar preferencias de IA y App en Neon
    await sql`
      INSERT INTO user_settings (user_id, ai_provider, daily_prompt_limit, ai_temperature, auto_tagging, updated_at)
      VALUES (${authStore.user.id}, ${aiProvider.value}, ${dailyPromptLimit.value}, ${aiTemperature.value}, ${autoTagging.value}, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        ai_provider = EXCLUDED.ai_provider,
        daily_prompt_limit = EXCLUDED.daily_prompt_limit,
        ai_temperature = EXCLUDED.ai_temperature,
        auto_tagging = EXCLUDED.auto_tagging,
        updated_at = NOW();
    `

    // Actualizar AuthStore local
    authStore.setUser({
      ...authStore.user,
      fullName: fullName.value
    })

    successMessage.value = 'Configuración guardada correctamente.'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (err) {
    console.error('Error al guardar ajustes:', err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-8 pb-12">
    <div>
      <h1 class="text-2xl font-serif font-bold text-[#3d3b37]">Configuración</h1>
      <p class="text-xs text-[#8c867a]">Administra la información de tu cuenta y los parámetros de la Inteligencia Artificial.</p>
    </div>

    <!-- Mensaje de Éxito -->
    <div v-if="successMessage" class="flex items-center gap-2 p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs rounded-xl">
      <Check class="w-4 h-4 text-emerald-600" /> {{ successMessage }}
    </div>

    <form @submit.prevent="handleSaveSettings" class="space-y-6">
      
      <!-- Sección Perfil de Usuario -->
      <div class="bg-[#f2eee3] border border-[#d8d3c5] rounded-2xl p-6 space-y-4">
        <div class="flex items-center gap-2 border-b border-[#d8d3c5] pb-3">
          <User class="w-4 h-4 text-[#8c867a]" />
          <h2 class="font-medium text-sm text-[#3d3b37]">Perfil de usuario</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium text-[#3d3b37]">Nombre completo</label>
            <input 
              v-model="fullName"
              type="text" 
              required
              class="w-full bg-[#f7f4ea] border border-[#d8d3c5] rounded-lg px-3 py-2 text-xs text-[#3d3b37] focus:outline-none focus:border-[#3d3b37]"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-[#3d3b37]">Correo electrónico</label>
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
      <div class="bg-[#f2eee3] border border-[#d8d3c5] rounded-2xl p-6 space-y-4">
        <div class="flex items-center gap-2 border-b border-[#d8d3c5] pb-3">
          <Sparkles class="w-4 h-4 text-[#e06c53]" />
          <h2 class="font-medium text-sm text-[#3d3b37]">Configuración de Inteligencia Artificial</h2>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-medium text-[#3d3b37]">Proveedor de IA</label>
              <select 
                v-model="aiProvider"
                class="w-full bg-[#f7f4ea] border border-[#d8d3c5] rounded-lg px-3 py-2 text-xs text-[#3d3b37] focus:outline-none focus:border-[#3d3b37]"
              >
                <option value="gemini">Google Gemini 1.5 Flash</option>
                <option value="openai">OpenAI GPT-4o Mini</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-medium text-[#3d3b37]">Límite diario de peticiones</label>
              <input 
                v-model.number="dailyPromptLimit"
                type="number" 
                min="1"
                max="100"
                class="w-full bg-[#f7f4ea] border border-[#d8d3c5] rounded-lg px-3 py-2 text-xs text-[#3d3b37] focus:outline-none focus:border-[#3d3b37]"
              />
            </div>
          </div>

          <!-- Slider de Temperatura -->
          <div class="space-y-2 pt-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-medium text-[#3d3b37]">Creatividad / Temperatura: {{ aiTemperature }}</span>
              <span class="text-[#8c867a]">{{ aiTemperature < 0.5 ? 'Preciso' : 'Creativo' }}</span>
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

          <!-- Toggle de Auto-etiquetado -->
          <div class="flex items-center justify-between pt-2">
            <div>
              <p class="text-xs font-medium text-[#3d3b37]">Etiquetado automático</p>
              <p class="text-[11px] text-[#8c867a]">Generar etiquetas relevantes con IA al guardar una nota</p>
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
          <Save class="w-4 h-4" /> {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </div>

    </form>
  </div>
</template>