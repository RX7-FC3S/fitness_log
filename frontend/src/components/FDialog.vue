<template>
    <div v-if="show" class="dialog-container">
        <div class="dialog-overlay" @click="handleOverlayClick"></div>
        <div class="dialog-body">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    persistent: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close', 'update:show']);

const handleOverlayClick = () => {
    if (!props.persistent) {
        emit('close');
        emit('update:show', false);
    }
};
</script>

<style scoped>
.dialog-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
}

.dialog-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
}

.dialog-body {
    position: relative;
    background: white;
    width: 90%;
    max-width: 450px;
    border-radius: 1.5rem;
    border: 1px solid var(--border, #e2e8f0);
    padding: 1.5rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
}

.dialog-body> :deep(*) {
    max-width: 100%;
}
</style>
