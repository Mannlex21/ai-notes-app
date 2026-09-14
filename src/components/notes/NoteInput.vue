<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { Plus, CheckSquare, X } from 'lucide-vue-next'
import { useNotesStore } from '../../stores/useNotesStore'
import AiMenuDropdown from '../modals/AiMenuDropdown.vue'
import AiVariantsModal from '../modals/AiVariantsModal.vue'

const store = useNotesStore()
const emit = defineEmits(['save-note'])

const isOpenModal = ref(false)
const title = ref('')
const content = ref('')
const isChecklist = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const showStyleModal = ref(false)
const styleVariants = ref<string[]>([])

const checklistItems = ref<{ text: string; done: boolean }[]>([
  { text: '', done: false }
])

const adjustTextareaHeight = () => {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
    }
  })
}

watch(content, adjustTextareaHeight)

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (showStyleModal.value) {
      showStyleModal.value = false
    } else if (isOpenModal.value) {
      resetForm()
    }
  }
}

window.addEventListener('keydown', handleKeyDown)
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

const openModal = () => {
  isOpenModal.value = true
  adjustTextareaHeight()
}

const addChecklistItem = () => {
  checklistItems.value.push({ text: '', done: false })
}

const removeChecklistItem = (index: number) => {
  checklistItems.value.splice(index, 1)
  if (checklistItems.value.length === 0) addChecklistItem()
}

const resetForm = () => {
  title.value = ''
  content.value = ''
  isChecklist.value = false
  showStyleModal.value = false
  checklistItems.value = [{ text: '', done: false }]
  isOpenModal.value = false
}

const handleSave = () => {
  const hasTitle = title.value.trim().length > 0
  const hasContent = content.value.trim().length > 0
  const validChecklist = checklistItems.value.filter(i => i.text.trim().length > 0)

  if (!hasTitle && !hasContent && validChecklist.length === 0) {
    resetForm()
    return
  }

  let finalContent = content.value.trim()
  if (isChecklist.value) {
    finalContent = validChecklist.map(item => `[${item.done ? 'x' : ' '}] ${item.text}`).join('\n')
  }

  emit('save-note', {
    title: title.value.trim(),
    content: finalContent,
    color: '#f2eee3'
  })

  resetForm()
}

// NoteInput.vue
const handleExpandText = async () => {
  if (!content.value.trim()) return

  const expanded = await store.expandText(content.value)

  if (expanded) {
    // Si la IA devuelve el texto completo que incluye lo original, se asigna directo;
    // si devuelve solo la continuación, se concatena:
    if (expanded.toLowerCase().startsWith(content.value.trim().toLowerCase())) {
      content.value = expanded
    } else {
      // Concatenar el borrador generado al contenido existente
      const needsSpace = !content.value.endsWith(' ') && !expanded.startsWith(' ') && !expanded.startsWith(',')
      content.value = `${content.value}${needsSpace ? ' ' : ''}${expanded}`
    }

    adjustTextareaHeight()
  }
}

const handleRefineStyle = async (tone: 'formal' | 'conciso' | 'casual') => {
  if (!content.value.trim()) return
  const options = await store.refineStyleOptions(content.value, tone)
  if (options && options.length > 0) {
    styleVariants.value = options
    showStyleModal.value = true
  }
}

const selectVariant = (selectedText: string) => {
  content.value = selectedText
  showStyleModal.value = false
  adjustTextareaHeight()
}
</script>

<template>
  <div class="max-w-2xl mx-auto mb-8">
    <!-- Trigger Modal -->
    <div 
      class="bg-[#f2eee3] border border-[#d8d3c5] rounded-xl p-4 shadow-sm hover:border-[#8c867a] cursor-pointer transition-all duration-200"
      @click="openModal"
    >
      <div class="flex items-center justify-between">
        <span class="text-[#8c867a] text-sm font-medium">Crear una nota...</span>
        <button 
          @click.stop="isChecklist = true; openModal()" 
          class="p-1.5 hover:text-[#3d3b37] hover:bg-[#e8e3d5] rounded-md transition-colors text-[#8c867a]" 
          title="Lista de verificación"
        >
          <CheckSquare class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Modal Principal -->
    <div 
      v-if="isOpenModal" 
      class="fixed inset-0 z-40 bg-[#2a2926]/15 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="bg-[#f2eee3] border border-[#d8d3c5] rounded-xl p-5 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col justify-between overflow-hidden">
        
        <!-- Header con Botón de Cerrar -->
        <div class="shrink-0 pb-3 border-b border-[#d8d3c5] flex items-center justify-between gap-3">
          <input 
            v-model="title"
            type="text" 
            placeholder="Título" 
            class="w-full bg-transparent text-xl font-bold text-[#3d3b37] placeholder-[#8c867a] focus:outline-none"
            autofocus
          />
          <button 
            @click="resetForm" 
            class="p-1 rounded-md text-[#8c867a] hover:text-[#3d3b37] hover:bg-[#e8e3d5] transition-colors"
            title="Cerrar sin guardar"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto my-3 pr-1">
          <textarea 
            v-if="!isChecklist"
            ref="textareaRef"
            v-model="content"
            placeholder="Escribe una nota..." 
            rows="3"
            @input="adjustTextareaHeight"
            class="w-full bg-transparent text-[#3d3b37] placeholder-[#8c867a] resize-none focus:outline-none text-sm leading-relaxed overflow-hidden min-h-[120px]"
          ></textarea>

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
              <button @click="removeChecklistItem(index)" class="text-[#8c867a] hover:text-[#e06c53] p-1">
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
            <button 
              @click="addChecklistItem"
              class="flex items-center gap-1.5 text-xs text-[#8c867a] hover:text-[#3d3b37] font-medium pt-1"
            >
              <Plus class="w-3.5 h-3.5" /> Agregar elemento
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="shrink-0 pt-3 border-t border-[#d8d3c5] flex items-center justify-between">
          <div class="flex items-center gap-1 text-[#8c867a]">
            <button 
              @click="isChecklist = !isChecklist"
              :class="['p-1.5 rounded-md hover:bg-[#e8e3d5] transition-colors', isChecklist ? 'text-[#e06c53]' : '']"
              title="Cambiar formato de lista"
            >
              <CheckSquare class="w-4 h-4" />
            </button>

            <AiMenuDropdown 
              v-if="!isChecklist"
              :is-loading="store.aiLoading"
              :disabled="!content.trim()"
              @expand="handleExpandText"
              @refine="handleRefineStyle"
            />
          </div>

          <div class="flex items-center gap-2">
            <button 
              @click="resetForm"
              class="px-3 py-1.5 text-xs text-[#8c867a] hover:text-[#3d3b37] transition-colors"
            >
              Cancelar
            </button>
            <button 
              @click="handleSave"
              class="px-4 py-1.5 bg-[#3d3b37] text-[#f7f4ea] text-xs font-medium rounded-lg hover:bg-[#2a2926] transition-colors shadow-sm"
            >
              Guardar
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal de Variantes -->
    <AiVariantsModal 
      :is-open="showStyleModal"
      :variants="styleVariants"
      @close="showStyleModal = false"
      @select="selectVariant"
    />
  </div>
</template>