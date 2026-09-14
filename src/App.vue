<script setup lang="ts">
import { computed, ref } from 'vue'
import Navbar from './components/layout/Navbar.vue'
import Sidebar from './components/layout/Sidebar.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const isSidebarOpen = ref(true)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}
// Ocultar layout si la ruta tiene la propiedad meta.hideLayout
const isPublicPage = computed(() => !!route.meta.hideLayout)
</script>

<template>
  <!-- Si es una página pública (Landing, Login, Register), renderiza solo el contenido -->
  <div v-if="isPublicPage">
    <RouterView />
  </div>

  <!-- Layout de la Aplicación (Dashboard / Notas) -->
  <div v-else class="min-h-screen bg-[#f7f4ea] text-[#3d3b37] flex flex-col font-sans">
   <Navbar @toggle-sidebar="toggleSidebar" />
    <div class="flex flex-1">
       <Sidebar :is-open="isSidebarOpen" />
      <main class="flex-1 p-6 max-w-7xl mx-auto w-full">
        <RouterView />
      </main>
    </div>
  </div>
</template>