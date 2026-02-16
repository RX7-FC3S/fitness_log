<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { MessageSquare, Edit3, Trash2, CheckCircle, Plus } from 'lucide-vue-next';
import type { FitnessSet, Exercise, UpdateFitnessSetPayload } from '@/types/fitness';
import { useTraining } from '@/composables/useTraining';

const route = useRoute();
const appStore = useAppStore();
const {
    dayData,
    sortedExercises,
    loadData,
    addSet,
    finishTraining,
    deleteSet,
    updateSet,
    targetDate
} = useTraining();

const formValues = ref({
    exerciseId: "",
    setType: appStore.setTypes[0]?.value || "正式组",
    unitId: appStore.units[0]?.id || 1,
    weight: "",
    reps: ""
});

// Dialog states
const showHintDialog = ref(false);
const showRemarkDialog = ref(false);
const showEditSetDialog = ref(false);
const showDeleteSetDialog = ref(false);

const activeSet = ref<FitnessSet | null>(null);
const activeExercise = ref<Exercise | null>(null);
const editForm = ref({
    setType: '',
    weight: 0,
    unitId: 1,
    reps: 0,
    remark: ''
});
const isLastSetWarning = ref(false);
const addingSet = ref(false);
const savingRemark = ref(false);
const savingEdit = ref(false);
const deletingSet = ref(false);
const finishing = ref(false);

const handleAddSet = async () => {
    if (!formValues.value.exerciseId || formValues.value.weight === "" || !formValues.value.reps) {
        showHintDialog.value = true;
        return;
    }

    addingSet.value = true;
    try {
        await addSet({
            exercise_id: formValues.value.exerciseId,
            set_type: formValues.value.setType || "正式组",
            weight: formValues.value.weight,
            reps: formValues.value.reps,
            unit_id: String(formValues.value.unitId)
        });

        // Scroll to bottom
        setTimeout(() => {
            const scrollArea = document.getElementById("sets-list-container");
            if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
        }, 100);
    } finally {
        addingSet.value = false;
    }
};

const handleRemark = (set: FitnessSet) => {
    activeSet.value = set;
    editForm.value.remark = set.remark || '';
    showRemarkDialog.value = true;
};

const saveRemark = async () => {
    if (!activeSet.value) return;
    savingRemark.value = true;
    try {
        await updateSet(activeSet.value.id, { remark: editForm.value.remark });
        showRemarkDialog.value = false;
    } finally {
        savingRemark.value = false;
    }
};

const handleEditSet = (exercise: Exercise, set: FitnessSet) => {
    activeExercise.value = exercise;
    activeSet.value = set;
    editForm.value = {
        setType: String(set.setType),
        weight: set.weight,
        unitId: (typeof set.unit === 'object' ? set.unit.id : Number(set.unitId)),
        reps: set.reps,
        remark: set.remark || ''
    };
    showEditSetDialog.value = true;
};

const saveEditSet = async () => {
    if (!activeSet.value) return;
    savingEdit.value = true;
    try {
        await updateSet(activeSet.value.id, {
            set_type: editForm.value.setType,
            weight: editForm.value.weight,
            unit_id: editForm.value.unitId,
            reps: editForm.value.reps,
        });
        showEditSetDialog.value = false;
    } finally {
        savingEdit.value = false;
    }
};

const handleDeleteSet = (setId: number) => {
    activeSet.value = { id: setId } as FitnessSet;
    let allSetsCount = 0;
    if (dayData.value) {
        dayData.value.exercises.forEach((group) => (allSetsCount += group.sets.length));
    }
    isLastSetWarning.value = allSetsCount === 1;
    showDeleteSetDialog.value = true;
};

const confirmDelete = async () => {
    if (!activeSet.value) return;
    deletingSet.value = true;
    try {
        await deleteSet(activeSet.value.id, isLastSetWarning.value);
        showDeleteSetDialog.value = false;
    } finally {
        deletingSet.value = false;
    }
};

const handleFinishTraining = async () => {
    finishing.value = true;
    try {
        await finishTraining();
    } finally {
        finishing.value = false;
    }
};

const getSetTypeBadge = (setType: string) => {
    const typeLabel = appStore.setTypes.find(t => t.value === setType)?.label || setType;
    let typeClass = 'badge-working';
    if (setType.includes('热身')) typeClass = 'badge-warmup';
    if (setType.includes('失败')) typeClass = 'badge-failure';
    if (setType.includes('递减')) typeClass = 'badge-drop';
    return { label: typeLabel, class: typeClass };
};

const setPageFooter = () => {
    appStore.setPageFooter([
        dayData.value?.id ? { key: 'finish', label: '结束训练', variant: 'secondary', class: 'flex-1', icon: CheckCircle, onClick: handleFinishTraining, loading: finishing } : null,
        { key: 'add', label: '添加此组', variant: 'primary', class: dayData.value?.id ? 'flex-2' : 'flex-1', icon: Plus, onClick: handleAddSet, loading: addingSet }
    ].filter(Boolean));
};

onMounted(async () => {
    appStore.setPageTitle('');
    appStore.setFooterVisible(true);
    
    // Check for date query param
    const dateParam = route.query.date as string;
    if (dateParam) {
        targetDate.value = dateParam;
    }

    await loadData(route.params.id as string);
    setPageFooter();
    if (appStore.setTypes.length > 0 && appStore.setTypes[0]) {
        formValues.value.setType = appStore.setTypes[0].value;
    }
});

watch(() => route.params.id, async (newId) => {
    await loadData(newId as string);
    setPageFooter();
});

watch(() => dayData.value?.id, () => {
    setPageFooter();
});

onUnmounted(() => {
    appStore.clearPageFooter();
});
</script>

<template>
    <div class="training-page">
        <FCard variant="header" class="header-card">
            <div class="form-grid-2">
                <FSelect v-model="formValues.exerciseId"
                    :options="sortedExercises.map((ex: Exercise) => ({ value: ex.id, label: ex.name }))"
                    placeholder="选择动作..." />
                <FSelect v-model="formValues.setType" :options="appStore.setTypes" />
            </div>
            <div class="form-grid-3">
                <FSelect v-model="formValues.unitId"
                    :options="appStore.units.map(u => ({ value: u.id, label: u.name }))" />
                <input type="number" class="form-input" placeholder="重量" step="0.5" v-model="formValues.weight">
                <input type="number" class="form-input" placeholder="次数" v-model="formValues.reps">
            </div>
        </FCard>

        <div class="scroll-area" id="sets-list-container">
            <div v-for="group in dayData?.exercises" :key="group.exercise.id" class="exercise-group">
                <h4 class="group-title f-title">
                    {{ group.exercise.name }}
                </h4>
                <FCard v-for="set in group.sets" :key="set.id" class="set-card" padding="0.75rem 1rem"
                    margin="0 0 0.5rem 0" border-radius="1rem">
                    <div class="set-card-content">
                        <div class="set-info-row">
                            <span class="set-details">
                                {{ set.weight }} <span>{{ typeof set.unit === 'object' ? set.unit.name : set.unit
                                    }}</span>
                                <span class="multiply-sign">×</span>
                                {{ set.reps }} <span>次</span>
                            </span>
                            <span :class="['set-type-badge', getSetTypeBadge(String(set.setType)).class]">{{
                                getSetTypeBadge(String(set.setType)).label }}</span>
                        </div>
                        <div v-if="set.remark" class="set-remark">{{
                            set.remark }}</div>
                    </div>
                    <div class="set-actions">
                        <FButton variant="ghost" size="icon" @click="handleRemark(set)">
                            <MessageSquare :size="18" />
                        </FButton>
                        <FButton variant="ghost" size="icon" @click="handleEditSet(group.exercise, set)">
                            <Edit3 :size="18" />
                        </FButton>
                        <FButton variant="danger" size="icon" @click="handleDeleteSet(set.id)">
                            <Trash2 :size="18" />
                        </FButton>
                    </div>
                </FCard>
            </div>
            <div v-if="!dayData || !dayData.exercises.length" class="empty-state">还没有记录，开始训练吧！</div>
        </div>

        <!-- Hint Dialog -->
        <FDialog :show="showHintDialog" @close="showHintDialog = false">
            <div class="dialog-content">
                <div class="dialog-title f-title">提示</div>
                <div class="dialog-message">请选择动作并填写重量和次数</div>
                <FButton variant="primary" class="full-width" @click="showHintDialog = false">确认</FButton>
            </div>
        </FDialog>

        <!-- Remark Dialog -->
        <FDialog :show="showRemarkDialog" @close="showRemarkDialog = false">
            <div class="dialog-title f-title is-primary">添加/修改备注</div>
            <div class="form-group">
                <textarea class="form-input remark-textarea" v-model="editForm.remark"
                    placeholder="输入备注内容..."></textarea>
            </div>
            <div class="dialog-actions">
                <FButton variant="secondary" class="flex-1" :disabled="savingRemark" @click="showRemarkDialog = false">
                    取消</FButton>
                <FButton variant="primary" class="flex-1" :loading="savingRemark" @click="saveRemark">保存</FButton>
            </div>
        </FDialog>

        <!-- Edit Set Dialog -->
        <FDialog :show="showEditSetDialog" @close="showEditSetDialog = false">
            <div v-if="activeExercise" class="dialog-title f-title is-primary">编辑：{{ activeExercise.name }}</div>
            <div class="form-group">
                <label class="form-label">组类型</label>
                <FSelect v-model="editForm.setType" :options="appStore.setTypes" />
            </div>
            <div class="form-group">
                <label class="form-label">重量</label>
                <input type="number" class="form-input" v-model="editForm.weight" step="0.5">
            </div>
            <div class="form-group">
                <label class="form-label">单位</label>
                <FSelect v-model="editForm.unitId"
                    :options="appStore.units.map(u => ({ value: u.id, label: u.name }))" />
            </div>
            <div class="form-group">
                <label class="form-label">次数 (Reps)</label>
                <input type="number" class="form-input" v-model="editForm.reps">
            </div>
            <div class="dialog-actions">
                <FButton variant="secondary" class="flex-1" :disabled="savingEdit" @click="showEditSetDialog = false">取消
                </FButton>
                <FButton variant="primary" class="flex-1" :loading="savingEdit" @click="saveEditSet">保存</FButton>
            </div>
        </FDialog>

        <!-- Delete Set Dialog -->
        <FDialog :show="showDeleteSetDialog" @close="showDeleteSetDialog = false">
            <div v-if="isLastSetWarning" class="dialog-content">
                <div class="dialog-title f-title is-danger">最后一组</div>
                <div class="dialog-message">这是今天最后一组，删除后将清除今日记录并返回首页，确定吗？</div>
                <div class="dialog-actions-vertical">
                    <FButton variant="secondary" class="flex-1" :disabled="deletingSet"
                        @click="showDeleteSetDialog = false">取消</FButton>
                    <FButton variant="danger" class="flex-1" :loading="deletingSet" @click="confirmDelete">确定删除
                    </FButton>
                </div>
            </div>
            <div v-else class="dialog-content">
                <div class="dialog-title f-title">确认删除</div>
                <div class="dialog-message">确定要删除此组训练记录吗？</div>
                <div class="dialog-actions">
                    <FButton variant="secondary" class="flex-1" :disabled="deletingSet"
                        @click="showDeleteSetDialog = false">取消</FButton>
                    <FButton variant="danger" class="flex-1" :loading="deletingSet" @click="confirmDelete">确定删除
                    </FButton>
                </div>
            </div>
        </FDialog>
    </div>
</template>

<style scoped>
.training-page {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
}

.header-card {
    z-index: 99;
}

.form-grid-2 {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.form-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
}

.group-title {
    margin: 1.5rem 0.5rem 0.75rem;
    color: var(--secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.set-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.set-card-content {
    flex: 1;
    overflow: hidden;
}

.set-info-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.set-details {
    font-size: var(--fs-lg);
    font-weight: 700;
    color: var(--primary);
    line-height: 1.4;
    display: flex;
    align-items: baseline;
    gap: 0.15rem;
}

.set-details span {
    font-size: var(--fs-lg);
    color: var(--text-secondary);
    font-weight: 600;
    margin-right: 0.1rem;
}

.multiply-sign {
    color: var(--text-secondary);
    font-weight: 400;
    margin: 0 0.25rem;
}

.set-remark {
    font-size: var(--fs-sm);
    color: var(--text-secondary);
    margin-top: 0.25rem;
}

.set-actions {
    display: flex;
    gap: 0.5rem;
}

.set-type-badge {
    padding: 0.2rem 0.5rem;
    border-radius: 0.4rem;
    font-size: var(--fs-xs);
    font-weight: 700;
    text-transform: uppercase;
}

.badge-warmup {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
}

.badge-working {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
}

.badge-drop {
    background: rgba(139, 92, 246, 0.1);
    color: #8b5cf6;
}

.badge-failure {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.empty-state {
    text-align: center;
    color: var(--text-secondary);
    margin-top: 2rem;
}

/* Dialog Styles */
.dialog-content {
    text-align: center;
    padding: 1rem 0;
}

.dialog-title {
    margin-bottom: 1rem;
}

.dialog-title.is-primary {
    color: var(--primary);
    margin-bottom: 1.25rem;
}

.dialog-title.is-danger {
    color: var(--danger);
}

.dialog-message {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
}

.remark-textarea {
    height: 100px;
    padding: 0.75rem;
    resize: none;
}

.dialog-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

.dialog-actions-vertical {
    display: flex;
    gap: 1rem;
}

.flex-1 {
    flex: 1;
}

.flex-2 {
    flex: 2;
}

.full-width {
    width: 100%;
}
</style>
