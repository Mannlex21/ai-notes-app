<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { sql } from '../lib/neon'
import { useAuthStore } from '../stores/useAuthStore'
import bcrypt from 'bcryptjs'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)



const handleLogin = async () => {
  if (!email.value || !password.value) return
  
  loading.value = true
  errorMsg.value = ''

  try {
    // 1. Obtener el usuario por email
    const rows = await sql`
      SELECT id, email, full_name, password_hash 
      FROM users 
      WHERE email = ${email.value.trim().toLowerCase()} 
      LIMIT 1;
    `

    if (rows.length === 0) {
      errorMsg.value = 'Credenciales inválidas.'
      return
    }

    const userData = rows[0]

    // 2. Verificar la contraseña con bcrypt
    const isPasswordValid = await bcrypt.compare(password.value, userData.password_hash || '')

    if (!isPasswordValid) {
      errorMsg.value = 'Credenciales inválidas.'
      return
    }

    // 3. Iniciar sesión exitosamente
    authStore.setUser({
      id: userData.id,
      email: userData.email,
      fullName: userData.full_name || 'Usuario'
    })

    router.push('/notes')
  } catch (err) {
    console.error('Error durante el inicio de sesión:', err)
    errorMsg.value = 'Error al conectar con el servidor.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f7f4ea] flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-[#f2eee3] border border-[#d8d3c5] rounded-2xl p-8 shadow-sm space-y-6">
      
      <div class="text-center space-y-2">
        <div class="w-10 h-10 rounded-xl bg-[#3d3b37] text-[#f7f4ea] font-serif font-bold text-xl flex items-center justify-center mx-auto shadow-sm">
          N
        </div>
        <h2 class="text-2xl font-serif font-bold text-[#3d3b37]">Bienvenido de nuevo</h2>
        <p class="text-xs text-[#8c867a]">Ingresa tus credenciales para acceder a tus notas</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- Mensaje de error -->
        <div v-if="errorMsg" class="p-3 bg-red-100 border border-red-300 text-red-700 text-xs rounded-lg">
          {{ errorMsg }}
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
          {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
        </button>
      </form>

      <div class="text-center text-xs text-[#8c867a]">
        ¿No tienes una cuenta? 
        <RouterLink to="/register" class="text-[#3d3b37] font-semibold underline">Regístrate</RouterLink>
      </div>

    </div>
  </div>
</template>