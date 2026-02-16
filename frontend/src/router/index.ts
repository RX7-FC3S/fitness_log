import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '@/page/Home.vue';
import { useAppStore } from '@/stores/app';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/training',
      name: 'training',
      component: () => import('@/page/Training.vue'),
    },
    {
      path: '/training/:id',
      name: 'training-detail',
      component: () => import('@/page/Training.vue'),
    },
    {
      path: '/exercises',
      name: 'exercises',
      component: () => import('@/page/Exercises.vue'),
    },
    {
      path: '/logs',
      name: 'logs',
      component: () => import('@/page/Logs.vue'),
    },
  ],
});

let loadingTimer: any = null;

router.beforeEach((to, from, next) => {
  const appStore = useAppStore();

  // Start loading immediately on click
  appStore.showLoading('加载中...');

  next();
});

router.afterEach(() => {
  // We do NOT hide loading here anymore. 
  // Each page component will call hideLoading when its data is ready (onMounted).
});

router.onError(() => {
  const appStore = useAppStore();
  appStore.hideLoading();
});

export default router;
