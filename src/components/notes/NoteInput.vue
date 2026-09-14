<script setup lang="ts">
import { ref } from 'vue'
import { Plus, CheckSquare, Image as ImageIcon, Sparkles, X } from 'lucide-vue-next'
import { enhanceNoteDraft } from '../../lib/gemini'

const emit = defineEmits(['save-note'])

const isExpanded = ref(false)
const title = ref('')
const content = ref('')
const isAiLoading = ref(false)
const isChecklist = ref(false)
const checklistItems = ref<{ text: string; done: boolean }[]>([
  { text: '', done: false }
])

const expand = () => {
  isExpanded.value = true
}

const addChecklistItem = () => {
  checklistItems.value.push({ text: '', done: false })
}

const removeChecklistItem = (index: number) => {
  checklistItems.value.splice(index, 1)
  if (checklistItems.value.length === 0) {
    addChecklistItem()
  }
}

const resetForm = () => {
  title.value = ''
  content.value = ''
  isChecklist.value = false
  checklistItems.value = [{ text: '', done: false }]
  isExpanded.value = false
}

const handleSave = () => {
  const hasTitle = title.value.trim().length > 0
  const hasContent = content.value.trim().length > 0
  const validChecklist = checklistItems.value.filter(i => i.text.trim().length > 0)

  if (!hasTitle && !hasContent && validChecklist.length === 0) {
    resetForm()
    return
  }

  // Formatear fecha corta
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase()

  const newNote = {
    id: Date.now().toString(),
    title: title.value.trim(),
    content: isChecklist.value ? undefined : content.value.trim(),
    isChecklist: isChecklist.value,
    checklistItems: isChecklist.value 
      ? validChecklist.map((item, index) => ({ id: `${Date.now()}-${index}`, text: item.text, done: item.done })) 
      : undefined,
    date: dateStr,
    pinned: false
  }

  emit('save-note', newNote)
  resetForm()
}
const handleAiAssist = async () => {
  if (!title.value && !content.value) return

  isAiLoading.value = true
  try {
    const result = await enhanceNoteDraft(title.value, content.value)
    if (result.title) title.value = result.title
    if (result.content) content.value = result.content
  } finally {
    isAiLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto mb-8">
    <div 
      class="bg-[#f2eee3] border border-[#d8d3c5] rounded-xl p-4 shadow-sm transition-all duration-200"
      @click="expand"
    >
      <!-- Modo contraído -->
      <div v-if="!isExpanded" class="flex items-center justify-between cursor-text">
        <span class="text-[#8c867a] text-sm font-medium">Crear una nota...</span>
        <div class="flex items-center gap-2 text-[#8c867a]">
          <button @click.stop="isChecklist = true; expand()" class="p-1.5 hover:text-[#3d3b37] hover:bg-[#e8e3d5] rounded-md transition-colors" title="Lista de verificación">
            <CheckSquare class="w-4 h-4" />
          </button>
          <button @click.stop class="p-1.5 hover:text-[#3d3b37] hover:bg-[#e8e3d5] rounded-md transition-colors" title="Agregar imagen">
            <ImageIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Modo expandido -->
      <div v-else class="space-y-4" @click.stop>
        <input 
          v-model="title"
          type="text" 
          placeholder="Título" 
          class="w-full bg-transparent text-lg font-semibold text-[#3d3b37] placeholder-[#8c867a] border-b border-[#d8d3c5] pb-2 focus:outline-none focus:border-[#3d3b37]"
          autofocus
        />

        <!-- Contenido Texto -->
        <textarea 
          v-if="!isChecklist"
          v-model="content"
          placeholder="Escribe una nota..." 
          rows="3"
          class="w-full bg-transparent text-[#3d3b37] placeholder-[#8c867a] border-b border-[#d8d3c5] pb-2 resize-none focus:outline-none focus:border-[#3d3b37] text-sm leading-relaxed"
        ></textarea>

        <!-- Contenido Checklist -->
        <div v-else class="space-y-2 py-1">
          <div 
            v-for="(item, index) in checklistItems" 
            :key="index"
            class="flex items-center gap-2 border-b border-[#d8d3c5] pb-1.5"
          >
            <input 
              type="checkbox" 
              v-model="item.done"
              class="rounded border-[#d8d3c5] text-[#3d3b37] focus:ring-0"
            />
            <input 
              type="text" 
              v-model="item.text"
              placeholder="Elemento de lista"
              @keydown.enter.prevent="addChecklistItem"
              class="flex-1 bg-transparent text-sm text-[#3d3b37] placeholder-[#8c867a] focus:outline-none"
            />
            <button @click.stop="removeChecklistItem(index)" class="text-[#8c867a] hover:text-[#e06c53] p-1">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <button 
            @click.stop="addChecklistItem"
            class="flex items-center gap-1.5 text-xs text-[#8c867a] hover:text-[#3d3b37] font-medium pt-1"
          >
            <Plus class="w-3.5 h-3.5" /> Agregar elemento
          </button>
        </div>

        <!-- Barra inferior -->
        <div class="flex items-center justify-between pt-2">
          <div class="flex items-center gap-1 text-[#8c867a]">
            <button 
              @click.stop="isChecklist = !isChecklist"
              :class="['p-1.5 rounded-md hover:bg-[#e8e3d5] transition-colors', isChecklist ? 'text-[#e06c53]' : '']"
              title="Cambiar formato de lista"
            >
              <CheckSquare class="w-4 h-4" />
            </button>
            <button 
    @click.stop="handleAiAssist" 
    :disabled="isAiLoading"
    class="p-1.5 hover:bg-[#e8e3d5] rounded-md transition-colors flex items-center gap-1 text-xs text-[#e06c53] font-medium"
    title="Asistente IA para mejorar esta nota"
  >
    <Sparkles :class="['w-4 h-4', isAiLoading ? 'animate-spin' : '']" />
    <span v-if="isAiLoading" class="text-[10px] text-[#8c867a]">Generando...</span>
  </button>
          </div>

          <div class="flex items-center gap-2">
            <button 
              @click.stop="resetForm"
              class="px-3 py-1.5 text-xs text-[#8c867a] hover:text-[#3d3b37] transition-colors"
            >
              Cancelar
            </button>
            <button 
              @click.stop="handleSave"
              class="px-4 py-1.5 bg-[#3d3b37] text-[#f7f4ea] text-xs font-medium rounded-lg hover:bg-[#2a2926] transition-colors shadow-sm"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>