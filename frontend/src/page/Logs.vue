<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import api from '@/api';
import dayjs from 'dayjs';
import { Search } from 'lucide-vue-next';
import type { FitnessLogDay, FitnessSet, GetLogsParams } from '@/types/fitness';

const appStore = useAppStore();
const router = useRouter();

const logs = ref<FitnessLogDay[]>([]);
const filters = ref<GetLogsParams>({
    from_date: dayjs().subtract(3, 'month').format('YYYY-MM-DD'),
    to_date: dayjs().format('YYYY-MM-DD'),
    exercise_name: ''
});
const loadingLogs = ref(false);

const loadLogs = async () => {
    logs.value = await api.getLogs(filters.value);
};

const getGroupedSets = (sets: FitnessSet[]) => {
    if (!sets || sets.length === 0) return [];

    const grouped: Record<string, FitnessSet[]> = {};

    sets.forEach(set => {
        const exName = typeof set.exercise === 'object' ? set.exercise.name : String(set.exercise || '未知动作');
        if (!grouped[exName]) grouped[exName] = [];
        grouped[exName].push(set);
    });

    const sortedGroups = Object.entries(grouped).sort(([, setsA], [, setsB]) => {
        const timeA = new Date(setsA[0]?.createdAt || 0).getTime();
        const timeB = new Date(setsB[0]?.createdAt || 0).getTime();
        return timeA - timeB;
    });

    return sortedGroups.map(([name, groupSets]) => ({
        name,
        sets: [...groupSets].sort((a, b) =>
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        )
    }));
};

const getSetTypeBadge = (setType: string) => {
    const typeLabel = appStore.setTypes.find(t => t.value === setType)?.label || setType;
    let typeClass = 'badge-working';
    if (setType.includes('热身')) typeClass = 'badge-warmup';
    if (setType.includes('失败')) typeClass = 'badge-failure';
    if (setType.includes('递减')) typeClass = 'badge-drop';

    return { label: typeLabel, class: typeClass };
};

const refresh = async () => {
    loadingLogs.value = true;
    try {
        await loadLogs();
    } finally {
        loadingLogs.value = false;
    }
};

const getUniqueExerciseCount = (sets: FitnessSet[]) => {
    if (!sets) return 0;
    return new Set(sets.map(s => typeof s.exercise === 'object' ? s.exercise.name : String(s.exercise))).size;
};

onMounted(async () => {
    appStore.setPageTitle('训练日志');
    appStore.setFooterVisible(true);
    appStore.setPageFooter([
        { key: 'refresh', label: '筛选历史记录', variant: 'primary', class: 'flex-1', icon: Search, onClick: refresh, loading: loadingLogs }
    ]);
    await loadLogs();
    appStore.hideLoading();
});

onUnmounted(() => {
    appStore.clearPageFooter();
});
</script>

<template>
    <div class="logs-page">
        <FCard variant="header" class="header-card">
            <div class="form-group">
                <input type="text" class="form-input" placeholder="搜索动作..." v-model="filters.exercise_name">
            </div>
            <div class="filter-grid">
                <div class="form-group no-mb">
                    <label class="form-label">开始日期</label>
                    <input type="date" class="form-input" v-model="filters.from_date">
                </div>
                <div class="form-group no-mb">
                    <label class="form-label">结束日期</label>
                    <input type="date" class="form-input" v-model="filters.to_date">
                </div>
            </div>
        </FCard>

        <div class="scroll-area" id="logs-list">
            <div v-for="day in logs" :key="day.date" class="log-day-section">
                <div class="day-header">
                    <h3 class="day-date f-title">{{ day.date }}</h3>
                    <span class="day-stats">
                        {{ getUniqueExerciseCount(day.sets) }} 动作 | {{ (day.sets || []).length }} 组
                    </span>
                </div>

                <FCard v-for="group in getGroupedSets(day.sets || [])" :key="group.name" padding="0" margin="0 0 1rem 0"
                    border-radius="0.75rem" no-shadow class="exercise-log-card">
                    <div class="exercise-name-header">
                        {{ group.name }}
                    </div>
                    <div class="sets-list">
                        <div v-for="(set, index) in group.sets" :key="index" class="set-row">
                            <div class="set-main-info">
                                <span class="set-index">{{ index + 1 }}</span>
                                <span class="set-data">
                                    {{ set.weight }}<span class="unit-text">{{ typeof set.unit === 'object' ?
                                        set.unit.name : set.unit }}</span>
                                    <span class="multiply-sign">×</span>
                                    {{ set.reps }}<span class="unit-text">次</span>
                                </span>
                                <span
                                    :class="['set-type-badge', getSetTypeBadge(String(set.setType)).class, 'small-badge']">
                                    {{ getSetTypeBadge(String(set.setType)).label }}
                                </span>
                            </div>
                            <div v-if="set.remark" class="set-remark">
                                {{ set.remark }}
                            </div>
                        </div>
                    </div>
                </FCard>
            </div>
            <div v-if="logs.length === 0" class="empty-state">没有找到相关记录</div>
        </div>
    </div>
</template>

<style scoped>
.logs-page {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
}

.header-card {
    z-index: 99;
}

.filter-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.no-mb {
    margin-bottom: 0 !important;
}

.log-day-section {
    margin-bottom: 2rem;
}

.day-header {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    margin: 1.5rem 0.25rem 0.75rem;
}

.day-date {
    margin: 0;
}

.day-stats {
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.exercise-log-card {
    overflow: hidden;
    background: #fff;
}

.exercise-name-header {
    background: var(--bg-main);
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border);
}

.sets-list {
    padding: 0.25rem 0;
}

.set-row {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.set-row:last-child {
    border-bottom: none;
}

.set-main-info {
    display: flex;
    align-items: center;
    font-size: 0.95rem;
}

.set-index {
    width: 1.5rem;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
}

.set-data {
    flex: 1;
    font-weight: 700;
    color: var(--text-primary);
}

.unit-text {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-secondary);
    margin-left: 1px;
}

.multiply-sign {
    font-weight: 400;
    color: var(--border);
    margin: 0 0.25rem;
}

.small-badge {
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
    transform: scale(0.9);
    transform-origin: right center;
}

.set-remark {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
    padding-left: 1.5rem;
    line-height: 1.4;
}

.empty-state {
    text-align: center;
    color: var(--text-secondary);
    margin-top: 3rem;
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
</style>
