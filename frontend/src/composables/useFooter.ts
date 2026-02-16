import { onMounted, onUnmounted } from 'vue';
import { useAppStore } from '@/stores/app';

/**
 * Lightweight composable for controlling the global app footer.
 * Data-driven approach for dynamic footer content.
 */
export function useFooter() {
    const store = useAppStore();

    return {
        setPageFooter: (actions: any[]) => store.setPageFooter(actions),
        clearPageFooter: () => store.clearPageFooter(),
        setVisible: (visible: boolean) => store.setFooterVisible(visible)
    };
}

/**
 * Helper for pages: set footer on mounted and clear on unmounted automatically.
 */
export function usePageFooter(getActions: any[] | (() => any[])) {
    const store = useAppStore();

    const update = () => {
        const actions = typeof getActions === 'function' ? (getActions as () => any[])() : getActions;
        store.setPageFooter(actions || []);
    };

    onMounted(() => {
        update();
    });

    onUnmounted(() => {
        store.clearPageFooter();
    });

    return { update };
}
