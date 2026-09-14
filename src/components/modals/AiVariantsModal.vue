<script setup lang="ts">
import { Sparkles, X, Check } from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
  variants: string[]
}>()

const emit = defineEmits(['close', 'select'])
</script>

<template>
  <div 
    v-if="isOpen" 
    class="fixed inset-0 z-50 bg-[#2a2926]/15 backdrop-blur-sm flex items-center justify-center p-4"
  >
    <div class="bg-[#f7f4ea] border border-[#d8d3c5] rounded-xl p-5 shadow-2xl max-w-lg w-full space-y-4">
      <div class="flex items-center justify-between border-b border-[#d8d3c5] pb-3">
        <div class="flex items-center gap-2 text-[#3d3b37] font-semibold text-sm">
          <Sparkles class="w-4 h-4 text-[#e06c53]" /> Selecciona la opción que prefieras
        </div>
        <button 
          @click="emit('close')" 
          class="p-1 rounded-md text-[#8c867a] hover:text-[#3d3b37] hover:bg-[#e8e3d5] transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
        <div 
          v-for="(variant, idx) in variants" 
          :key="idx"
          @click="emit('select', variant)"
          class="group p-3 border border-[#d8d3c5] rounded-lg bg-[#f2eee3] hover:bg-[#ffffff] hover:border-[#e06c53] cursor-pointer transition-all duration-150 flex items-start justify-between gap-3 shadow-xs"
        >
          <p class="text-xs text-[#3d3b37] leading-relaxed flex-1">{{ variant }}</p>
          <span class="opacity-0 group-hover:opacity-100 text-[#e06c53] transition-opacity">
            <Check class="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>