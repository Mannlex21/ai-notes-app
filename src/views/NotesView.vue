<script setup lang="ts">
import { onMounted, ref } from 'vue'
import NoteInput from '../components/notes/NoteInput.vue'
import NoteCard from '../components/notes/NoteCard.vue'
import { useNotesStore } from '../stores/useNotesStore'

const store = useNotesStore()
const draggedIndex = ref<number | null>(null)

onMounted(() => {
  store.fetchNotes()
})

const handleDragStart = (index: number) => {
  draggedIndex.value = index
}

const handleDropNote = (targetIndex: number) => {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) return
  
  const movedNote = store.notes.splice(draggedIndex.value, 1)[0]
  store.notes.splice(targetIndex, 0, movedNote)
  draggedIndex.value = null
}
</script>

<template>
  <div class="space-y-8">
    <!-- Creador de notas -->
    <NoteInput @save-note="store.addNote" />

    <!-- Estado de Carga -->
    <div v-if="store.loading" class="text-center py-12">
      <span class="text-sm font-mono text-[#8c867a]">Cargando notas de Neon...</span>
    </div>

    <template v-else>
      <!-- Sección de Notas Fijadas -->
      <div v-if="store.notes.some(n => n.is_pinned)" class="space-y-3">
        <h2 class="font-mono text-xs text-[#8c867a] uppercase tracking-wider">Fijadas</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NoteCard 
            v-for="(note, index) in store.notes.filter(n => n.is_pinned)" 
            :key="note.id" 
            :note="note"
            :index="index"
            @drag-start="handleDragStart"
            @drop-note="handleDropNote"
            @toggle-pin="store.togglePin"
            @archive="store.toggleArchiveNote"
            @delete="store.deleteNote"
          />
        </div>
      </div>

      <!-- Sección de Otras Notas -->
      <div v-if="store.notes.some(n => !n.is_pinned)" class="space-y-3">
        <h2 v-if="store.notes.some(n => n.is_pinned)" class="font-mono text-xs text-[#8c867a] uppercase tracking-wider">Otras</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NoteCard 
            v-for="(note, index) in store.notes.filter(n => !n.is_pinned)" 
            :key="note.id" 
            :note="note"
            :index="index"
            @drag-start="handleDragStart"
            @drop-note="handleDropNote"
            @toggle-pin="store.togglePin"
            @archive="store.toggleArchiveNote"
            @delete="store.deleteNote"
          />
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-if="store.notes.length === 0" class="text-center py-16">
        <p class="text-sm text-[#8c867a]">No tienes notas activas aún.</p>
      </div>
    </template>
  </div>
</template>