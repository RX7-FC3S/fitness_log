import api from './api.js';
import HomePage from './pages/home.js';
import TrainingPage from './pages/training.js';
import LogsPage from './pages/logs.js';
import ExercisesPage from './pages/exercises.js';

const router = new Navigo("/", { hash: true });
const mainContent = document.getElementById('main-content');
const headerVar = document.getElementById('header-var');
const footer = document.getElementById('app-footer');

function isValidTimeZone(tz) {
    if (!tz) return false;
    try {
        Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
        return true;
    } catch (err) {
        return false;
    }
}

function resolveTimeZone() {
    let tz;
    try {
        if (dayjs.tz && typeof dayjs.tz.guess === 'function') {
            tz = dayjs.tz.guess();
        }
    } catch (err) {
        tz = undefined;
    }

    if (!isValidTimeZone(tz)) {
        try {
            tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (err) {
            tz = undefined;
        }
    }

    if (!isValidTimeZone(tz)) {
        tz = 'UTC';
    }

    return tz;
}

const state = {
    exercises: [],
    units: [],
    setTypes: [],
    muscleGroups: [],
    today: dayjs().format('YYYY-MM-DD'),
    timezone: resolveTimeZone(),
    pendingPrimaryMuscles: null,
};

async function init() {
    try {
        if (state.timezone) {
            axios.defaults.headers.common['X-Timezone'] = state.timezone;
        }
        const initData = await api.getInitData();
        if (initData.timezone && initData.timezone !== state.timezone) {
            state.timezone = initData.timezone;
            axios.defaults.headers.common['X-Timezone'] = state.timezone;
        }
        state.exercises = initData.exercises;
        state.units = initData.units;
        state.setTypes = initData.set_types;
        state.muscleGroups = initData.muscle_groups;
        // state.today = initData.today; // Sync with server if needed

        // Logo click navigation
        document.getElementById('app-logo').onclick = () => router.navigate('/');

        setupRouter();
    } catch (error) {
        console.error("Initialization failed:", error);
    }
}

function setupRouter() {
    router
        .on("/", () => {
            renderPage(HomePage);
        })
        .on("/training", () => {
            renderPage(TrainingPage);
        })
        .on("/training/:id", (params) => {
            renderPage(TrainingPage, params.data.id);
        })
        .on("/logs", () => {
            renderPage(LogsPage);
        })
        .on("/exercises", () => {
            renderPage(ExercisesPage);
        })
        .resolve();
}

async function renderPage(PageClass, ...args) {
    try {
        const page = new PageClass(state, { router, headerVar, footer });
        const content = await page.render(...args);
        
        mainContent.innerHTML = '';
        mainContent.appendChild(content);
        
        // Initialize custom selects
        initCustomSelects();
        
        if (page.afterRender) {
            page.afterRender();
        }

        // Refresh lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    } catch (error) {
        console.error("Error rendering page:", error);
    }
}

function initCustomSelects() {
    const selects = document.querySelectorAll('select:not(.custom-select-hidden)');
    selects.forEach(select => {
        if (select.closest('.custom-select-wrapper')) return;

        select.classList.add('custom-select-hidden');
        select.style.display = 'none';

        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);

        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        const selectedOption = select.selectedIndex >= 0 ? select.options[select.selectedIndex] : null;
        trigger.textContent = selectedOption ? selectedOption.textContent : (select.getAttribute('placeholder') || '选择...');
        
        if (!selectedOption || selectedOption.value === "") {
            trigger.classList.add('is-placeholder');
        }
        
        wrapper.appendChild(trigger);

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-options';
        Array.from(select.options).forEach((option, index) => {
            const opt = document.createElement('div');
            opt.className = `custom-option ${index === select.selectedIndex ? 'selected' : ''}`;
            opt.textContent = option.textContent;
            opt.dataset.value = option.value;
            opt.onclick = () => {
                select.selectedIndex = index;
                select.dispatchEvent(new Event('change'));
                trigger.textContent = option.textContent;
                
                if (option.value === "") {
                    trigger.classList.add('is-placeholder');
                } else {
                    trigger.classList.remove('is-placeholder');
                }
                
                wrapper.classList.remove('open');
                Array.from(optionsContainer.children).forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            };
            optionsContainer.appendChild(opt);
        });
        wrapper.appendChild(optionsContainer);

        trigger.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select-wrapper').forEach(w => {
                if (w !== wrapper) w.classList.remove('open');
            });
            wrapper.classList.toggle('open');
        };
    });

    document.onclick = () => {
        document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
    };
}

window.initCustomSelects = initCustomSelects;

// Global UI Helpers
window.showModal = (contentHtml, onConfirm, onCancel, options = {}) => {
    const modal = document.getElementById('modal-container');
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = contentHtml;
    modal.classList.remove('hidden');

    // Init custom selects in modal
    initCustomSelects();

    const close = () => {
        if (!modalContent.querySelector('.loading')) {
            modal.classList.add('hidden');
        }
    };
    
    const confirmBtn = modalContent.querySelector('.confirm-btn');
    const cancelBtn = modalContent.querySelector('.cancel-btn');
    
    if (confirmBtn) confirmBtn.onclick = async () => { 
        if (onConfirm) {
            const loadingMode = options.loading ?? 'action';
            if (loadingMode === 'action') {
                await window.withActionLoading(confirmBtn, async () => {
                    await onConfirm();
                    modal.classList.add('hidden'); // Close only after success
                });
            } else {
                await onConfirm();
                modal.classList.add('hidden');
            }
        } else {
            close();
        }
    };
    if (cancelBtn) cancelBtn.onclick = () => { if (onCancel) onCancel(); close(); };
    
    modal.querySelector('.modal-overlay').onclick = close;
};

window.withActionLoading = async (btn, callback) => {
    if (!btn || btn.classList.contains('loading')) return;
    btn.classList.add('loading');
    try {
        await callback();
    } catch (err) {
        console.error("Action failed", err);
    } finally {
        if (btn) {
            btn.classList.remove('loading');
        }
    }
};

window.withBtnLoading = window.withActionLoading;

// Helper function to navigate with button loading state
window.navigateWithLoading = (btn, path) => {
    if (!btn || btn.classList.contains('loading')) return;
    btn.classList.add('loading');

    let cleared = false;
    const clear = () => {
        if (cleared) return;
        cleared = true;
        btn.classList.remove('loading');
        window.removeEventListener('hashchange', onHashChange);
    };

    const onHashChange = () => clear();
    window.addEventListener('hashchange', onHashChange, { once: true });

    // Fallback to clear even if route handler fails
    setTimeout(clear, 3000);

    router.navigate(path);
};

init();
