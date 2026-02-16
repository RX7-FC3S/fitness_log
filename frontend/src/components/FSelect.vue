<template>
    <div class="custom-select-wrapper" :class="{ open: isOpen }" ref="wrapperRef">
        <div class="custom-select-trigger" :class="{ 'is-placeholder': isPlaceholder }" @click="toggleOpen">
            {{ displayLabel }}
        </div>
        <div class="custom-options">
            <div v-for="option in options" :key="option.value" class="custom-option"
                :class="{ selected: modelValue === option.value }" @click="handleSelect(option.value, option.label)">
                {{ option.label }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: ''
    },
    options: {
        type: Array as () => Array<{ value: string | number; label: string }>,
        default: () => []
    },
    placeholder: {
        type: String,
        default: '选择...'
    }
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);

const displayLabel = computed(() => {
    const selected = props.options.find(opt => opt.value === props.modelValue);
    return selected ? selected.label : props.placeholder;
});

const isPlaceholder = computed(() => {
    return !props.options.some(opt => opt.value === props.modelValue);
});

const toggleOpen = (e: Event) => {
    e.stopPropagation();
    isOpen.value = !isOpen.value;

    if (isOpen.value) {
        // Close other selects (legacy compatibility or if we have multiple FSelects)
        document.querySelectorAll('.custom-select-wrapper').forEach(w => {
            if (w !== wrapperRef.value) w.classList.remove('open');
        });
    }
};

const handleSelect = (value: string | number, label: string) => {
    emit('update:modelValue', value);
    emit('change', value);
    isOpen.value = false;
};

const handleClickOutside = (e: Event) => {
    if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
        isOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Scoped styles adapted from forms.css for components */

.custom-select-wrapper {
    position: relative;
    user-select: none;
    width: 100%;
    font-family: inherit;
}

.custom-select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    padding: 0 0.8rem;
    font-size: var(--fs-base, 1rem);
    font-weight: 500;
    color: var(--text-primary, #1e1b4b);
    background: #ffffff;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    box-sizing: border-box;
}

.custom-select-trigger.is-placeholder {
    color: var(--text-secondary, #64748b);
}

.custom-select-trigger:after {
    content: "";
    width: 1rem;
    height: 1rem;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    transition: transform 0.2s;
}

.custom-select-wrapper.open .custom-select-trigger {
    border-color: var(--primary, #6366f1);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.custom-select-wrapper.open .custom-select-trigger:after {
    transform: rotate(180deg);
}

.custom-options {
    position: absolute;
    display: block;
    top: calc(100% + 5px);
    left: 0;
    right: 0;
    background: #ffffff;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px -10px rgba(0, 0, 0, 0.2);
    z-index: 200;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(-5px);
    transition: all 0.2s ease;
    max-height: 200px;
    overflow-y: auto;
}

.custom-select-wrapper.open .custom-options {
    opacity: 1;
    visibility: visible;
    pointer-events: all;
    transform: translateY(0);
}

.custom-option {
    position: relative;
    display: block;
    padding: 0.75rem 1rem;
    font-size: var(--fs-base, 1rem);
    font-weight: 500;
    color: var(--text-primary, #1e1b4b);
    cursor: pointer;
    transition: background 0.2s;
    text-align: left;
}

.custom-option:hover {
    background: var(--bg-main, #f8fafc);
}

.custom-option.selected {
    color: var(--primary, #6366f1);
    background: rgba(99, 102, 241, 0.05);
}
</style>
