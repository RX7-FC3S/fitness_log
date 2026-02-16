<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import api from '@/api';
import dayjs from 'dayjs';
import { Settings, PlusCircle, List } from 'lucide-vue-next';

import type { Dayjs } from 'dayjs';

const router = useRouter();
const appStore = useAppStore();

const monthStats = ref('-');
const currentDate = ref<Dayjs>(dayjs());
const fitnessDays = ref<Record<number, number>>({});
const todayTrainingId = ref<number | null>(null);
const showMuscleDialog = ref(false);
const selectedMuscles = ref<string[]>([]);

const loadMonthlyFitnessData = async (year: number, month: number) => {
    try {
        const res = await api.getFitnessDaysByMonth(year, month);
        fitnessDays.value = res.training_days;
        monthStats.value = Object.keys(res.training_days).length.toString();

        // Capture today's training ID if we just loaded the current month
        const today = dayjs();
        if (year === today.year() && month === (today.month() + 1)) {
            todayTrainingId.value = res.training_days[today.date()] || null;
        }
    } catch (err) {
        console.error("Failed to load monthly fitness data", err);
    }
};

const onMonthChange = async (e: { year: number, month: number }) => {
    appStore.showLoading('加载中...');

    const { year, month } = e;
    currentDate.value = dayjs(`${year}-${month}-01`);

    // Clear old data to prevent UI ghosting
    fitnessDays.value = {};
    monthStats.value = '-';

    await loadMonthlyFitnessData(year, month);
    appStore.hideLoading();
};

const onDayClick = (e: { date: string, id: number | null }) => {
    const { date, id } = e;

    // Check if future date
    if (dayjs(date).isAfter(dayjs(), 'day')) {
        appStore.showToast('时辰未到');
        return;
    }

    if (id) {
        router.push(`/training/${id}`);
    } else {
        // No record for this day (present or past)
        showMuscleDialog.value = true;
    }
};

const handleMuscleToggle = (muscle: string) => {
    const index = selectedMuscles.value.indexOf(muscle);
    if (index > -1) {
        selectedMuscles.value.splice(index, 1);
    } else {
        selectedMuscles.value.push(muscle);
    }
};

const startTraining = () => {
    appStore.setPrimaryMuscles(selectedMuscles.value.length ? selectedMuscles.value : null);
    showMuscleDialog.value = false;
    router.push('/training');
};

const closeMuscleDialog = () => {
    showMuscleDialog.value = false;
};

const handleStartTraining = () => {
    if (todayTrainingId.value) {
        router.push(`/training/${todayTrainingId.value}`);
    } else {
        showMuscleDialog.value = true;
    }
};

const setPageFooter = () => {
    appStore.setPageFooter([
        { key: 'exercises', label: '训练动作', variant: 'secondary', class: 'flex-1', icon: Settings, onClick: () => router.push('/exercises') },
        { key: 'start', label: '开始训练', variant: 'primary', class: 'flex-1', icon: PlusCircle, onClick: handleStartTraining },
        { key: 'logs', label: '训练日志', variant: 'secondary', class: 'flex-1', icon: List, onClick: () => router.push('/logs') }
    ]);
};

onMounted(async () => {
    appStore.setPageTitle('');
    appStore.setFooterVisible(true);
    await loadMonthlyFitnessData(currentDate.value.year(), currentDate.value.month() + 1);
    appStore.hideLoading();
    setPageFooter();
});

onUnmounted(() => {
    appStore.clearPageFooter();
});
</script>

<template>
    <div class="home-page">
        <FCard>
            <FCalendar :fitness-days="fitnessDays" :initial-date="currentDate.format('YYYY-MM-DD')"
                @month-change="onMonthChange" @day-click="onDayClick" />
        </FCard>

        <FCard class="quick-stats">
            <h3 class="stats-title">本月训练</h3>
            <div class="stats-value" id="month-stats">
                {{ monthStats }} <span class="stats-unit">天</span>
            </div>
        </FCard>

        <!-- Start Training Dialog -->
        <FDialog :show="showMuscleDialog" @close="closeMuscleDialog">
            <div class="dialog-title f-title is-primary">今天练哪里？</div>
            <div class="form-group">
                <div class="muscle-toggle-group">
                    <FButton v-for="m in appStore.muscleGroups" :key="m" variant="secondary" class="muscle-toggle"
                        :class="{ 'is-selected': selectedMuscles.includes(m) }" @click="handleMuscleToggle(m)">
                        {{ m }}
                    </FButton>
                </div>
            </div>
            <div class="dialog-actions">
                <FButton variant="secondary" class="flex-1" @click="closeMuscleDialog">稍后</FButton>
                <FButton variant="primary" class="flex-1" @click="startTraining">开始训练</FButton>
            </div>
        </FDialog>
    </div>
</template>

<style scoped>
.home-page {
    padding: 0.75rem;
}

.quick-stats {
    margin-top: 1rem;
}

.stats-title {
    margin-bottom: 0.5rem;
    font-size: 1rem;
}

.stats-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--secondary);
}

.stats-unit {
    font-size: 1rem;
    color: var(--text-secondary);
}

.muscle-toggle-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.muscle-toggle {
    flex: 1;
    min-width: 4.5rem;
}

.muscle-toggle.is-selected {
    background: rgba(99, 102, 241, 0.12);
    border-color: rgba(99, 102, 241, 0.35);
    color: var(--primary);
}

/* Dialog Styles */
.dialog-title.is-primary {
    color: var(--primary);
    margin-bottom: 1.25rem;
}

.dialog-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

.flex-1 {
    flex: 1;
}

.flex-1-5 {
    flex: 1.5;
}
</style>
