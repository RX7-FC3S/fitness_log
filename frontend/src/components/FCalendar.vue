<template>
    <div class="calendar-container">
        <div class="calendar-header">
            <FButton variant="ghost" size="icon" @click="prevMonth">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m15 18-6-6 6-6" />
                </svg>
            </FButton>
            <span class="month-label">{{ currentMonthLabel }}</span>
            <FButton variant="ghost" size="icon" @click="nextMonth">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m9 18 6-6-6-6" />
                </svg>
            </FButton>
        </div>
        <div class="calendar-grid">
            <div v-for="day in weekDays" :key="day" class="calendar-day-label">{{ day }}</div>

            <!-- Empty cells for padding -->
            <div v-for="n in startOffset" :key="'empty-' + n" class="calendar-day empty"></div>

            <!-- Actual days -->
            <div v-for="day in daysInMonth" :key="day" :class="['calendar-day', {
                'active': isToday(day),
                'has-record': hasRecord(day)
            }]" @click="handleDayClick(day)">
                {{ day }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import FButton from './FButton.vue';

const props = defineProps({
    fitnessDays: {
        type: Object, // { [day: number]: string | null }
        default: () => ({})
    },
    initialDate: {
        type: String, // 'YYYY-MM-DD'
        default: () => dayjs().format('YYYY-MM-DD')
    }
});

const emit = defineEmits(['month-change', 'day-click']);

const currentDate = ref(dayjs(props.initialDate));
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

const currentMonthLabel = computed(() => currentDate.value.format('YYYY年MM月'));

const daysInMonth = computed(() => currentDate.value.daysInMonth());

const startOffset = computed(() => {
    const firstDayOfMonth = currentDate.value.startOf('month');
    return firstDayOfMonth.day();
});

const isToday = (day: number) => {
    const today = dayjs();
    return today.isSame(currentDate.value, 'month') && today.date() === day;
};

const hasRecord = (day: number) => {
    return !!props.fitnessDays[day];
};

const prevMonth = () => {
    currentDate.value = currentDate.value.subtract(1, 'month');
    emit('month-change', {
        year: currentDate.value.year(),
        month: currentDate.value.month() + 1
    });
};

const nextMonth = () => {
    currentDate.value = currentDate.value.add(1, 'month');
    emit('month-change', {
        year: currentDate.value.year(),
        month: currentDate.value.month() + 1
    });
};

const handleDayClick = (day: number) => {
    const dateStr = currentDate.value.date(day).format('YYYY-MM-DD');
    const recordId = props.fitnessDays[day] || null;
    emit('day-click', { date: dateStr, id: recordId });
};
</script>

<style scoped>
.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.month-label {
    font-weight: 600;
    font-size: var(--fs-lg, 1.125rem);
    color: var(--text-primary, #1e293b);
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    margin-top: 1rem;
}

.calendar-day-label {
    text-align: center;
    font-size: var(--fs-xs, 0.75rem);
    color: var(--text-secondary, #64748b);
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.calendar-day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.75rem;
    font-size: var(--fs-base, 1rem);
    cursor: pointer;
    background: var(--bg-main, #f8fafc);
    border: 1px solid transparent;
    transition: all 0.2s ease;
    color: var(--text-primary, #1e293b);
    box-sizing: border-box;
}

.calendar-day:hover {
    border-color: var(--primary, #6366f1);
    background: white;
}

.calendar-day.active {
    background: var(--primary, #6366f1);
    color: white;
    font-weight: 700;
}

.calendar-day.has-record {
    border-bottom: 3px solid var(--secondary, #ec4899);
}

.calendar-day.empty {
    opacity: 0;
    pointer-events: none;
    background: transparent;
}
</style>
