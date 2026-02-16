<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import api from '@/api';
import { Plus, Edit3, Trash2 } from 'lucide-vue-next';
import type { Exercise } from '@/types/fitness';

const appStore = useAppStore();
const router = useRouter();
const allExercises = ref<Exercise[]>([]);
const showDialog = ref(false);
const showDeleteConfirm = ref(false);
const editingExercise = ref<Exercise | null>(null);
const exerciseForm = ref({
    name: '',
    target_muscle: ''
});
const saving = ref(false);
const deleting = ref(false);

const loadExercises = async () => {
    const data = await api.listExercises();
    appStore.exercises = data;
    allExercises.value = data;
};

const groupedExercises = computed(() => {
    const groups: Record<string, Exercise[]> = {};
    allExercises.value.forEach(ex => {
        const muscle = ex.targetMuscle || '其他';
        if (!groups[muscle]) groups[muscle] = [];
        groups[muscle].push(ex);
    });
    return Object.entries(groups).map(([muscle, items]) => ({
        muscle,
        items: items.sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.muscle.localeCompare(b.muscle));
});

const handleAddExercise = () => {
    editingExercise.value = null;
    exerciseForm.value = { name: '', target_muscle: appStore.muscleGroups[0] || '' };
    showDialog.value = true;
};

const handleEditExercise = (ex: Exercise) => {
    editingExercise.value = ex;
    exerciseForm.value = { name: ex.name, target_muscle: String(ex.targetMuscle) };
    showDialog.value = true;
};

const saveExercise = async () => {
    if (!exerciseForm.value.name || !exerciseForm.value.target_muscle) return;

    saving.value = true;
    try {
        if (editingExercise.value) {
            await api.updateExercise(editingExercise.value.id, exerciseForm.value);
        } else {
            await api.createExercise(exerciseForm.value);
        }
        showDialog.value = false;
        await loadExercises();
    } finally {
        saving.value = false;
    }
};

const confirmDelete = (ex: Exercise) => {
    editingExercise.value = ex;
    showDeleteConfirm.value = true;
};

const deleteExercise = async () => {
    if (!editingExercise.value) return;
    deleting.value = true;
    try {
        await api.deleteExercise(editingExercise.value.id);
        showDeleteConfirm.value = false;
        await loadExercises();
    } finally {
        deleting.value = false;
    }
};

onMounted(async () => {
    appStore.setPageTitle('训练动作');
    appStore.setFooterVisible(true);
    appStore.setPageFooter([
        { key: 'add', label: '新增训练动作', variant: 'primary', class: 'flex-1', icon: Plus, onClick: handleAddExercise }
    ]);
    await loadExercises();
    appStore.hideLoading();
});

onUnmounted(() => {
    appStore.clearPageFooter();
});
</script>

<template>
    <div class="exercises-page">
        <div class="scroll-area">
            <div v-for="group in groupedExercises" :key="group.muscle" class="muscle-group-section">
                <div class="muscle-group-header f-title">{{ group.muscle }}</div>
                <FCard v-for="ex in group.items" :key="ex.id" margin="0 0 0.75rem 0" padding="0.75rem 1rem"
                    border-radius="1rem" class="exercise-card">
                    <div class="exercise-info">
                        <div class="exercise-name">{{ ex.name }}</div>
                    </div>
                    <div class="exercise-actions">
                        <FButton variant="ghost" size="icon" @click="handleEditExercise(ex)">
                            <Edit3 :size="18" />
                        </FButton>
                        <FButton variant="danger" size="icon" @click="confirmDelete(ex)">
                            <Trash2 :size="18" />
                        </FButton>
                    </div>
                </FCard>
            </div>
        </div>

        <!-- Add/Edit Dialog -->
        <FDialog :show="showDialog" @close="showDialog = false">
            <div class="dialog-title f-title is-primary">{{ editingExercise ? '编辑动作' : '新增动作' }}</div>
            <div class="form-group">
                <label class="form-label">动作名称</label>
                <input type="text" class="form-input" v-model="exerciseForm.name" placeholder="例如：卧推">
            </div>
            <div class="form-group">
                <label class="form-label">目标肌肉</label>
                <FSelect v-model="exerciseForm.target_muscle"
                    :options="appStore.muscleGroups.map(m => ({ value: m, label: m }))" />
            </div>
            <div class="dialog-actions">
                <FButton variant="secondary" class="flex-1" :disabled="saving" @click="showDialog = false">取消</FButton>
                <FButton variant="primary" class="flex-1" :loading="saving" @click="saveExercise">保存</FButton>
            </div>
        </FDialog>

        <!-- Delete Confirm -->
        <FDialog :show="showDeleteConfirm" @close="showDeleteConfirm = false">
            <div class="dialog-title f-title is-danger">确认删除</div>
            <div class="dialog-message">确定要删除操作“{{ editingExercise?.name }}”吗？此操作不可撤销。</div>
            <div class="dialog-actions">
                <FButton variant="secondary" class="flex-1" :disabled="deleting" @click="showDeleteConfirm = false">取消
                </FButton>
                <FButton variant="danger" class="flex-1" :loading="deleting" @click="deleteExercise">确定删除</FButton>
            </div>
        </FDialog>
    </div>
</template>

<style scoped>
.exercises-page {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
}

.muscle-group-section {
    margin-bottom: 2rem;
}

.muscle-group-header {
    margin: 1.5rem 0.5rem 0.75rem;
    color: var(--secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.exercise-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.exercise-name {
    font-size: var(--fs-lg);
    font-weight: 700;
    color: var(--text-primary);
}

.exercise-actions {
    display: flex;
    gap: 0.5rem;
}

.dialog-title {
    margin-bottom: 1.25rem;
}

.dialog-title.is-primary {
    color: var(--primary);
}

.dialog-title.is-danger {
    color: var(--danger);
}

.dialog-message {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
}

.dialog-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

.flex-1 {
    flex: 1;
}
</style>
