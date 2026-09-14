<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { Sparkles, AlignLeft } from 'lucide-vue-next'

defineProps<{
  isLoading: boolean
  disabled: boolean
}>()

const emit = defineEmits(['expand', 'refine'])

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

watch(isOpen, (val) => {
  if (val) window.addEventListener('click', handleClickOutside)
  else window.removeEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

const handleAction = (action: () => void) => {
  action()
  isOpen.value = false
}
</script>

<template>
  <div ref="menuRef" class="relative">
    <button 
      @click.stop="isOpen = !isOpen"
      :disabled="disabled || isLoading"
      class="p-1.5 hover:bg-[#e8e3d5] rounded-md transition-colors flex items-center gap-1 text-xs text-[#e06c53] font-medium disabled:opacity-50"
    >
      <Sparkles :class="['w-4 h-4', isLoading ? 'animate-spin' : '']" />
      <span>IA Assist</span>
    </button>

    <div 
      v-if="isOpen" 
      class="absolute left-0 bottom-full mb-2 w-48 bg-[#f7f4ea] border border-[#d8d3c5] rounded-lg shadow-xl py-1 z-50 text-xs text-[#3d3b37]"
    >
      <button 
        @click.stop="handleAction(() => emit('expand'))" 
        class="w-full text-left px-3 py-2 hover:bg-[#e8e3d5] flex items-center gap-2"
      >
        <Sparkles class="w-3.5 h-3.5 text-[#e06c53]" /> Continuar borrador
      </button>
      <div class="border-t border-[#d8d3c5]/60 my-1"></div>
      <div class="px-3 py-1 text-[10px] font-mono text-[#8c867a] uppercase">Sugerir Variantes</div>
      <button 
        @click.stop="handleAction(() => emit('refine', 'formal'))" 
        class="w-full text-left px-3 py-1.5 hover:bg-[#e8e3d5] flex items-center gap-2"
      >
        💼 Formal
      </button>
      <button 
        @click.stop="handleAction(() => emit('refine', 'conciso'))" 
        class="w-full text-left px-3 py-1.5 hover:bg-[#e8e3d5] flex items-center gap-2"
      >
        <AlignLeft class="w-3.5 h-3.5 text-[#8c867a]" /> Conciso
      </button>
      <button 
        @click.stop="handleAction(() => emit('refine', 'casual'))" 
        class="w-full text-left px-3 py-1.5 hover:bg-[#e8e3d5] flex items-center gap-2"
      >
        💬 Casual
      </button>
    </div>
  </div>
</template>