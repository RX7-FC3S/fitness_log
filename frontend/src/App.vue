<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { X, Loader2 } from 'lucide-vue-next';

const appStore = useAppStore();
const router = useRouter();

onMounted(async () => {
    await appStore.init();
});

const navigateHome = () => {
    router.push('/');
};

const handleCancelLoading = () => {
    if (appStore.loading.onCancel) {
        appStore.loading.onCancel();
    }
    appStore.hideLoading();
};
</script>

<template>
    <header class="app-header">
        <h1 class="logo" @click="navigateHome">Fitness Log</h1>
        <span class="app-header-title f-title" v-html="appStore.pageTitle"></span>
    </header>

    <main class="app-main">
        <router-view v-if="appStore.initialized" />
    </main>

    <footer v-show="appStore.isFooterVisible && appStore.footerActions.length" class="app-footer" id="app-footer">
        <FButton v-for="(a, i) in appStore.footerActions" :key="a.key ?? i" :variant="a.variant || 'primary'"
            :class="a.class" :loading="a.loading" :disabled="a.loading" @click="a.onClick">
            <component v-if="a.icon" :is="a.icon" :size="18" />
            <span v-if="a.label">{{ a.label }}</span>
        </FButton>
    </footer>

    <!-- Global Loading (Toast-like UI) -->
    <Transition name="fade">
        <div v-if="appStore.loading.active" class="app-loading-marker">
            <div class="spinner-container">
                <Loader2 class="spinner-icon" />
            </div>
            <span class="loading-text">{{ appStore.loading.message }}</span>
            <div v-if="appStore.loading.onCancel" class="cancel-btn" @click="handleCancelLoading">
                <X :size="16" />
            </div>
        </div>
    </Transition>

    <!-- Global Toast -->
    <Transition name="fade">
        <div v-show="appStore.toast.visible" class="app-toast">
            {{ appStore.toast.message }}
        </div>
    </Transition>
</template>

<style>
/* App Root Styling moved from app-container to body or #app equivalent in modern setups */
#app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
}

.app-header {
    height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.25rem;
    padding-top: env(safe-area-inset-top);
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 2px solid var(--border);
    flex-shrink: 0;
    z-index: 100;
}

.logo {
    font-size: var(--fs-2xl);
    font-weight: 800;
    letter-spacing: -1px;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    cursor: pointer;
}

.app-header-title {
    color: var(--text-secondary);
    text-transform: capitalize;
}

.app-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--bg-main);
    position: relative;
    overflow: auto;
}

.app-footer {
    display: flex;
    align-items: center;
    width: 100%;
    height: var(--footer-height);
    padding: 0 var(--page-padding);
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--glass-bg);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
    z-index: 50;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.05);
    gap: var(--page-padding);
    box-sizing: border-box;
}

/* Ensure buttons in footer are balanced */
.app-footer .f-btn {
    font-size: var(--fs-xs);
    gap: 0.25rem;
    min-width: 0;
    flex: 1;
}

/* Ensure icons don't shrink away or disappear */
.app-footer .f-btn svg {
    width: var(--icon-size);
    height: var(--icon-size);
    flex-shrink: 0;
    display: block;
}

/* Global Footer Flex Utilities */
.flex-1 {
    flex: 1;
}

.flex-1-5 {
    flex: 1.5;
}

.flex-2 {
    flex: 2;
}

.scroll-area {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: var(--page-padding);
    scrollbar-gutter: stable;
}

/* Base Form Styling */
.form-group {
    margin-bottom: 0.75rem;
}

.form-label {
    display: block;
    font-size: var(--fs-sm);
    color: var(--text-secondary);
    margin-bottom: 0.3rem;
    font-weight: 600;
}

.form-input {
    width: 100%;
    height: 40px;
    background: white;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 0 0.8rem;
    color: var(--text-primary);
    font-family: inherit;
    font-size: var(--fs-base);
    outline: none;
    transition: all 0.2s;
    box-sizing: border-box;
}

.form-input::placeholder {
    color: var(--text-secondary);
    opacity: 1;
}

.form-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.app-toast {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.95);
    color: var(--text-primary);
    padding: 0.8rem 1.6rem;
    border-radius: 1rem;
    font-size: var(--fs-base);
    font-weight: 600;
    z-index: 2000;
    pointer-events: none;
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.app-loading-marker {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.95);
    color: var(--text-primary);
    padding: 0.6rem 0.8rem 0.6rem 1rem;
    border-radius: 1rem;
    font-size: var(--fs-base);
    font-weight: 600;
    z-index: 2100;
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
}

.spinner-container {
    display: flex;
    align-items: center;
    justify-content: center;
}

.spinner-icon {
    width: 20px;
    height: 20px;
    color: var(--primary);
    animation: spin 1s linear infinite;
}

.loading-text {
    white-space: nowrap;
    line-height: 1;
}

.cancel-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    color: var(--text-secondary);
    transition: background 0.2s;
}

.cancel-btn:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--danger);
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
