<script setup lang="ts">
import { FileText, Archive, Settings } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

defineProps<{
  isOpen: boolean
}>()

const route = useRoute()

const navItems = [
  { name: 'Notas', path: '/', icon: FileText },
  { name: 'Archivadas', path: '/archive', icon: Archive },
  { name: 'Ajustes', path: '/settings', icon: Settings }
]
</script>

<template>
  <aside 
    :class="[
      'bg-[#f7f4ea] border-r border-[#d8d3c5] flex flex-col transition-all duration-300 z-20',
      isOpen ? 'w-64' : 'w-16'
    ]"
  >
    <nav class="p-2 space-y-1 mt-2">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          route.path === item.path 
            ? 'bg-[#f2eee3] text-[#3d3b37] border border-[#d8d3c5] font-semibold' 
            : 'text-[#8c867a] hover:text-[#3d3b37] hover:bg-[#f2eee3]/60'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5 shrink-0" />
        <span v-if="isOpen" class="truncate">{{ item.name }}</span>
      </router-link>
    </nav>
  </aside>
</template>