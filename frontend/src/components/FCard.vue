<template>
    <div :class="['card', variantClass, { 'has-hover': hover }]" :style="style">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
    variant: {
        type: String,
        default: 'default',
        validator: (val: string) => ['default', 'header'].includes(val)
    },
    padding: {
        type: String,
        default: ''
    },
    margin: {
        type: String,
        default: ''
    },
    borderRadius: {
        type: String,
        default: ''
    },
    hover: {
        type: Boolean,
        default: false
    },
    noShadow: {
        type: Boolean,
        default: false
    }
});

const variantClass = computed(() => {
    return props.variant === 'header' ? 'page-header' : '';
});

const style = computed(() => {
    const s: Record<string, string> = {};
    if (props.padding) s.padding = props.padding;
    if (props.margin) s.margin = props.margin;
    if (props.borderRadius) s.borderRadius = props.borderRadius;
    if (props.noShadow) s.boxShadow = 'none';
    return s;
});
</script>

<style scoped>
.card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 1.25rem;
    padding: 1.25rem;
    margin-bottom: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    transition: all 0.2s ease;
    box-sizing: border-box;
}

.card.has-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.page-header {
    background: var(--bg-card);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    border: none;
    border-radius: 0;
    margin-bottom: 0;
    padding: 0.75rem;
}
</style>
