<template>
    <button :class="['f-btn', `is-${variant}`, `is-${size}`, { 'is-loading': loading }]" :disabled="disabled || loading"
        type="button">
        <span class="f-btn-content">
            <slot></slot>
        </span>
    </button>
</template>

<script setup lang="ts">
defineProps({
    variant: {
        type: String as () => 'primary' | 'secondary' | 'danger' | 'ghost',
        default: 'primary'
    },
    size: {
        type: String as () => 'md' | 'sm' | 'icon',
        default: 'md'
    },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
});
</script>

<style scoped>
.f-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
    font-family: inherit;
    white-space: nowrap;
    box-sizing: border-box;
    outline: none;
    position: relative;
    overflow: hidden;
}

.f-btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    height: 100%;
}

/* Sizes */
.is-md {
    padding: 0.75rem 1.25rem;
    font-size: 1rem;
}

.is-sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.875rem;
    border-radius: 0.5rem;
}

.is-icon {
    width: 38px;
    height: 38px;
    padding: 0 !important;
    border-radius: 0.6rem;
    flex-shrink: 0;
}

/* Variants */
.is-primary {
    background: var(--primary);
    color: white;
}

.is-primary:hover {
    background: var(--primary-hover);
}

.is-secondary {
    background: white;
    border-color: var(--border);
    color: var(--text-primary);
}

.is-secondary:hover {
    background: var(--bg-main);
    border-color: var(--border);
}

.is-danger {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
}

.is-danger:hover {
    background: var(--danger);
    color: white;
}

.is-ghost {
    background: rgba(0, 0, 0, 0.02);
    border-color: rgba(0, 0, 0, 0.05);
    color: var(--text-secondary);
}

.is-ghost:hover {
    background: rgba(0, 0, 0, 0.05);
    border-color: transparent;
    color: var(--primary);
}

/* States */
.f-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
}

.is-loading .f-btn-content {
    visibility: hidden;
}

.is-loading::after {
    content: "";
    position: absolute;
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    left: 50%;
    top: 50%;
    margin-left: -0.625rem;
    margin-top: -0.625rem;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.f-btn-content :deep(svg) {
    width: 1.2rem;
    height: 1.2rem;
    flex-shrink: 0;
}
</style>
