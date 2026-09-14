<script setup lang="ts">
import { Pin, Archive, Trash2, GripVertical } from 'lucide-vue-next'
import type { Note } from '../../types'

const props = defineProps<{
  note: Note
  index: number
}>()

const emit = defineEmits([
  'toggle-pin', 
  'archive', 
  'delete', 
  'drag-start', 
  'drag-over', 
  'drop-note'
])

const onDragStart = (e: DragEvent) => {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', props.index.toString())
  }
  emit('drag-start', props.index)
}

const formatDate = (isoString: string) => {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'short', 
    year: '2-digit' 
  })
}
</script>

<template>
  <div 
    draggable="true"
    @dragstart="onDragStart"
    @dragover.prevent="emit('drag-over', $event)"
    @drop.prevent="emit('drop-note', index)"
    :style="{ backgroundColor: note.color || '#f2eee3' }"
    class="group relative border border-[#d8d3c5] rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-grab active:cursor-grabbing"
  >
    <!-- Botón de Agarre (Drag Handle) y Pin -->
    <div class="absolute top-3 right-3 flex items-center gap-1">
      <div class="opacity-0 group-hover:opacity-100 text-[#8c867a] p-1 cursor-grab">
        <GripVertical class="w-3.5 h-3.5" />
      </div>

      <button 
        @click.stop="emit('toggle-pin', note.id)"
        :class="[
          'p-1.5 rounded-md transition-opacity duration-150',
          note.is_pinned ? 'text-[#e06c53] opacity-100' : 'text-[#8c867a] opacity-0 group-hover:opacity-100 hover:text-[#3d3b37] hover:bg-[#e8e3d5]'
        ]"
        :title="note.is_pinned ? 'Desfijar nota' : 'Fijar nota'"
      >
        <Pin class="w-4 h-4" :class="{ 'fill-current': note.is_pinned }" />
      </button>
    </div>

    <div>
      <!-- Título y Fecha -->
      <div class="pr-12 mb-2">
        <h3 v-if="note.title" class="font-semibold text-[#3d3b37] text-base leading-snug">
          {{ note.title }}
        </h3>
        <span class="text-[10px] font-mono text-[#8c867a] uppercase tracking-wider block mt-0.5">
          {{ formatDate(note.created_at) }}
        </span>
      </div>

      <!-- Contenido -->
      <p 
        v-if="note.content" 
        class="text-sm text-[#3d3b37] leading-relaxed whitespace-pre-wrap paper-line pb-1"
      >
        {{ note.content }}
      </p>

      <!-- Tags si la nota los incluye -->
      <div v-if="note.tags && note.tags.length" class="mt-3 flex flex-wrap gap-1">
        <span 
          v-for="tag in note.tags" 
          :key="tag"
          class="text-[10px] bg-black/5 text-[#57534e] px-1.5 py-0.5 rounded font-mono"
        >
          #{{ tag }}
        </span>
      </div>
    </div>

    <!-- Barra de acciones inferior -->
    <div class="flex items-center justify-between pt-3 mt-3 border-t border-[#d8d3c5]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      <div class="flex items-center gap-1 text-[#8c867a]">
        <button 
          @click.stop="emit('archive', note.id)" 
          class="p-1 hover:text-[#3d3b37] hover:bg-[#e8e3d5] rounded transition-colors"
          title="Archivar"
        >
          <Archive class="w-3.5 h-3.5" />
        </button>
        <button 
          @click.stop="emit('delete', note.id)" 
          class="p-1 hover:text-[#e06c53] hover:bg-[#e8e3d5] rounded transition-colors"
          title="Eliminar"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>