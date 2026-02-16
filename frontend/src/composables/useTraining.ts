import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import { useAppStore } from '@/stores/app';
import type { FitnessDay, FitnessSet, Exercise, CreateFitnessSetPayload, UpdateFitnessSetPayload } from '@/types/fitness';

export function useTraining() {
    const router = useRouter();
    const appStore = useAppStore();

    const dayData = ref<FitnessDay | null>(null);
    const targetDate = ref<string | null>(null);

    const resolvePrimaryMuscles = (): string[] => {
        if (dayData.value?.primaryMuscles?.length) {
            return day_data_muscles_mapper(dayData.value.primaryMuscles);
        }
        return appStore.primaryMuscles || [];
    };

    // Helper to ensure compatibility if data is mixed
    const day_data_muscles_mapper = (muscles: any[]): string[] => {
        return muscles.map(m => typeof m === 'object' ? m.name : String(m));
    };

    const updateHeader = () => {
        const muscles = resolvePrimaryMuscles();
        let title = "";

        // Use date from data if it has an ID, otherwise prioritize targetDate
        const displayDate = dayData.value?.id ? dayData.value.date : (targetDate.value || dayData.value?.date);

        if (muscles.length) {
            title = muscles.join(" + ");
        }

        if (displayDate) {
            title = `${displayDate}${title ? ' - ' + title : ''}`;
        }

        appStore.setPageTitle(title);
    };

    const loadData = async (dayId?: string | number) => {
        try {
            const data = dayId
                ? await api.getFitnessDay(dayId)
                : await api.getTodayFitnessDay(targetDate.value || undefined);

            dayData.value = data;
            updateHeader();
        } catch (error) {
            console.error("Failed to load training data", error);
        } finally {
            appStore.hideLoading();
        }
    };

    const sortedExercises = computed(() => {
        const muscles = resolvePrimaryMuscles();
        if (!muscles.length) return appStore.exercises;

        return [...appStore.exercises].sort((a, b) => {
            const aPrimary = muscles.includes(a.targetMuscle);
            const bPrimary = muscles.includes(b.targetMuscle);
            if (aPrimary === bPrimary) return a.name.localeCompare(b.name);
            return aPrimary ? -1 : 1;
        });
    });

    const addSet = async (setData: {
        exercise_id: string | number;
        set_type: string;
        weight: string | number;
        reps: string | number;
        unit_id: string | number;
    }) => {
        const payload: CreateFitnessSetPayload = {
            fitness_day_id: dayData.value?.id || undefined,
            exercise_id: Number(setData.exercise_id),
            set_type: setData.set_type,
            weight: Number(setData.weight),
            reps: Number(setData.reps),
            unit_id: Number(setData.unit_id),
            remark: "",
            date: targetDate.value || undefined,
            primary_muscles: resolvePrimaryMuscles(),
        };

        const res = await api.createFitnessSet(payload);

        if (!dayData.value?.id && res.fitnessDayId) {
            router.replace(`/training/${res.fitnessDayId}`);
        } else {
            await loadData(dayData.value?.id || res.fitnessDayId);
        }
        return res;
    };

    const updateSet = async (setId: number, payload: UpdateFitnessSetPayload) => {
        await api.updateFitnessSet(setId, payload);
        await loadData(dayData.value?.id);
    };

    const deleteSet = async (setId: number, isLast: boolean) => {
        await api.deleteFitnessSet(setId);
        if (isLast) {
            router.replace("/");
        } else {
            await loadData(dayData.value?.id);
        }
    };

    const finishTraining = async () => {
        if (!dayData.value?.id) {
            appStore.showToast("训练记录未创建");
            return;
        }
        await api.finishFitnessDay(dayData.value.id);
        router.replace("/");
    };

    return {
        dayData,
        sortedExercises,
        loadData,
        addSet,
        finishTraining,
        deleteSet,
        updateSet,
        resolvePrimaryMuscles,
        targetDate,
    };
}
