import { defineStore } from 'pinia';
import api, { apiInstance } from '@/api';
import type { Exercise, Unit, SetTypeOption } from '@/types/fitness';

export const useAppStore = defineStore('app', {
  state: () => ({
    exercises: [] as Exercise[],
    units: [] as Unit[],
    setTypes: [] as SetTypeOption[],
    muscleGroups: [] as string[],
    timezone: '',
    primaryMuscles: null as string[] | null,
    pageTitle: '',
    isFooterVisible: true,
    initialized: false,
    footerActions: [] as any[],
    toast: {
      message: '',
      visible: false
    },
    loading: {
      active: false,
      message: '加载中...',
      onCancel: null as (() => void) | null
    }
  }),
  actions: {
    showLoading(message = '加载中...', onCancel?: () => void) {
      this.loading.active = true;
      this.loading.message = message;
      this.loading.onCancel = onCancel || null;
    },
    hideLoading() {
      this.loading.active = false;
    },
    showToast(message: string) {
      this.toast.message = message;
      this.toast.visible = true;
      setTimeout(() => {
        this.toast.visible = false;
      }, 2000);
    },
    setPageTitle(title: string) {
      this.pageTitle = title;
    },
    setFooterVisible(visible: boolean) {
      this.isFooterVisible = visible;
    },
    setPageFooter(actions: any[]) {
      this.footerActions = actions;
    },
    clearPageFooter() {
      this.footerActions = [];
    },
    async init() {
      if (this.initialized) return;
      try {
        const initData = await api.getInitData();
        if (initData.timezone) {
          this.timezone = initData.timezone;
          apiInstance.defaults.headers.common['X-Timezone'] = this.timezone;
        }

        // Robust mapping for translations to ensure Chinese UI
        const muscleMap: Record<string, string> = {
          'chest': '胸', 'CHEST': '胸',
          'back': '背', 'BACK': '背',
          'shoulder': '肩', 'SHOULDER': '肩', 'shoulders': '肩',
          'arm': '臂', 'ARM': '臂', 'arms': '臂',
          'leg': '腿', 'LEG': '腿', 'legs': '腿',
          'abs': '腹', 'ABS': '腹', 'abdomen': '腹',
          'glutes': '臀', 'GLUTES': '臀',
          'cardio': '有氧'
        };
        const setTypeMap: Record<string, string> = {
          'WARMUP': '热身组', '热身组': '热身组',
          'WORKING': '正式组', '正式组': '正式组',
          'FAILURE': '失败组', '失败组': '失败组',
          'DROP': '递减组', '递减组': '递减组'
        };

        this.exercises = initData.exercises.map(ex => ({
          ...ex,
          targetMuscle: muscleMap[ex.target_muscle] || ex.target_muscle
        }));
        this.units = initData.units;
        this.setTypes = initData.set_types.map(st => ({
          value: st.value,
          label: setTypeMap[st.value] || st.label
        }));
        this.muscleGroups = initData.muscle_groups.map(m => muscleMap[m] || m);
        this.initialized = true;
      } catch (error) {
        console.error('Failed to initialize app state', error);
      }
    },
    setPrimaryMuscles(muscles: string[] | null) {
      this.primaryMuscles = muscles;
    }
  },
});
