<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { sql } from '../lib/neon'
import { useAuthStore } from '../stores/useAuthStore'
import bcrypt from 'bcryptjs'

const router = useRouter()
const authStore = useAuthStore()

const fullName = ref('')
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)



const handleRegister = async () => {
  if (!email.value || !password.value || !fullName.value) return
  
  loading.value = true
  errorMsg.value = ''

  try {
    const userId = `usr_${Date.now()}`
    
    // Generar Hash de la contraseña (10 rondas de sal)
    const passwordHash = await bcrypt.hash(password.value, 10)

    await sql`
      INSERT INTO users (id, email, full_name, password_hash)
      VALUES (${userId}, ${email.value.trim().toLowerCase()}, ${fullName.value}, ${passwordHash});
    `

    await sql`
      INSERT INTO user_settings (user_id)
      VALUES (${userId});
    `

    authStore.setUser({
      id: userId,
      email: email.value,
      fullName: fullName.value
    })

    router.push('/notes')
  } catch (err: any) {
    console.error('Error al registrar usuario:', err)
    errorMsg.value = 'Ocurrió un error al crear la cuenta.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f7f4ea] flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-[#f2eee3] border border-[#d8d3c5] rounded-2xl p-8 shadow-sm space-y-6">
      
      <div class="text-center space-y-2">
        <div class="w-10 h-10 rounded-xl bg-[#3d3b37] text-[#f7f4ea] font-serif font-bold text-xl flex items-center justify-center mx-auto">
          N
        </div>
        <h2 class="text-2xl font-serif font-bold text-[#3d3b37]">Crear una cuenta</h2>
        <p class="text-xs text-[#8c867a]">Empieza a organizar tus notas hoy mismo</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div v-if="errorMsg" class="p-3 bg-red-100 border border-red-300 text-red-700 text-xs rounded-lg">
          {{ errorMsg }}
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium text-[#3d3b37]">Nombre completo</label>
          <input 
            v-model="fullName"
            type="text" 
            required 
            placeholder="Manuel Murillo"
            class="w-full bg-[#f7f4ea] border border-[#d8d3c5] rounded-lg px-3 py-2 text-sm text-[#3d3b37] placeholder-[#8c867a] focus:outline-none focus:border-[#3d3b37]"
          />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium text-[#3d3b37]">Correo electrónico</label>
          <input 
            v-model="email"
            type="email" 
            required 
            placeholder="tu@email.com"
            class="w-full bg-[#f7f4ea] border border-[#d8d3c5] rounded-lg px-3 py-2 text-sm text-[#3d3b37] placeholder-[#8c867a] focus:outline-none focus:border-[#3d3b37]"
          />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-medium text-[#3d3b37]">Contraseña</label>
          <input 
            v-model="password"
            type="password" 
            required 
            placeholder="••••••••"
            class="w-full bg-[#f7f4ea] border border-[#d8d3c5] rounded-lg px-3 py-2 text-sm text-[#3d3b37] placeholder-[#8c867a] focus:outline-none focus:border-[#3d3b37]"
          />
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-[#3d3b37] text-[#f7f4ea] text-sm font-medium py-2.5 rounded-lg hover:bg-[#2a2926] transition-colors shadow-sm disabled:opacity-50"
        >
          {{ loading ? 'Creando cuenta...' : 'Registrarse' }}
        </button>
      </form>

      <div class="text-center text-xs text-[#8c867a]">
        ¿Ya tienes cuenta? 
        <RouterLink to="/login" class="text-[#3d3b37] font-semibold underline">Inicia sesión</RouterLink>
      </div>

    </div>
  </div>
</template>