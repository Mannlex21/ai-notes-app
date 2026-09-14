<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Sparkles, ArrowRight } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-[#f7f4ea] text-[#3d3b37] flex flex-col justify-between p-6 sm:p-12">
    <!-- Header -->
    <header class="max-w-6xl w-full mx-auto flex items-center justify-between py-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-[#3d3b37] flex items-center justify-center text-[#f7f4ea] font-serif font-bold text-lg">
          N
        </div>
        <span class="font-serif font-semibold text-lg tracking-tight">PaperNotes AI</span>
      </div>

      <div class="flex items-center gap-3">
        <RouterLink 
          to="/login" 
          class="px-4 py-2 text-sm font-medium text-[#8c867a] hover:text-[#3d3b37] transition-colors"
        >
          Iniciar sesión
        </RouterLink>
        <RouterLink 
          to="/register" 
          class="px-4 py-2 bg-[#3d3b37] text-[#f7f4ea] text-sm font-medium rounded-lg hover:bg-[#2a2926] transition-colors shadow-sm"
        >
          Empezar gratis
        </RouterLink>
      </div>
    </header>

    <!-- Hero Section -->
    <main class="max-w-4xl w-full mx-auto text-center my-16 space-y-6">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d8d3c5] bg-[#f2eee3] text-xs font-mono text-[#8c867a]">
        <Sparkles class="w-3.5 h-3.5 text-[#e06c53]" /> Potenciado con Inteligencia Artificial & Neon DB
      </div>

      <h1 class="text-4xl sm:text-6xl font-serif font-bold leading-tight tracking-tight text-[#3d3b37]">
        Tus ideas con la calidez del papel y la potencia de la IA.
      </h1>

      <p class="text-base sm:text-lg text-[#8c867a] max-w-2xl mx-auto leading-relaxed">
        Organiza tus notas, listas de tareas y pensamientos en un espacio limpio, rápido y persístelo de forma segura en la nube.
      </p>

      <div class="pt-4 flex items-center justify-center gap-4">
        <RouterLink 
          to="/register" 
          class="flex items-center gap-2 px-6 py-3 bg-[#3d3b37] text-[#f7f4ea] font-medium rounded-xl hover:bg-[#2a2926] transition-all shadow-md hover:shadow-lg"
        >
          Crear mi cuenta <ArrowRight class="w-4 h-4" />
        </RouterLink>
      </div>

      <!-- Preview Card Decorativa -->
      <div class="pt-12 max-w-xl mx-auto">
        <div class="bg-[#f2eee3] border border-[#d8d3c5] rounded-2xl p-6 shadow-md text-left space-y-3 relative overflow-hidden">
          <div class="flex items-center justify-between border-b border-[#d8d3c5] pb-3">
            <span class="font-semibold text-[#3d3b37]">Resumen de reunión</span>
            <span class="text-xs font-mono text-[#8c867a]">HOY</span>
          </div>
          <p class="text-sm text-[#3d3b37] leading-relaxed">
            - Diseñar la arquitectura del proyecto usando Vue 3 + Pinia.<br>
            - Conectar base de datos Neon PostgreSQL con soporte vectorial.<br>
            - Implementar asistente de IA para resúmenes automáticos.
          </p>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="max-w-6xl w-full mx-auto border-t border-[#d8d3c5] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8c867a] gap-4">
      <p>© 2026 PaperNotes AI. Todos los derechos reservados.</p>
      <div class="flex gap-4">
        <a href="#" class="hover:text-[#3d3b37]">Privacidad</a>
        <a href="#" class="hover:text-[#3d3b37]">Términos</a>
      </div>
    </footer>
  </div>
</template>